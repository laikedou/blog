import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as yazl from 'yazl';
import { Response } from 'express';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    mimeType?: string;
    folderId?: number;
    uncategorized?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.originalName = { contains: query.search };
    }

    if (query.mimeType) {
      where.mimeType = { startsWith: query.mimeType };
    }

    if (query.uncategorized === 'true') {
      where.folderId = null;
    } else if (query.folderId !== undefined) {
      where.folderId = query.folderId;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploader: { select: { id: true, username: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.media.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(file: Express.Multer.File, uploaderId: number) {
    return this.prisma.media.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        uploaderId,
      },
    });
  }

  async remove(id: number) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');

    const filePath = path.join(this.uploadDir, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.media.delete({ where: { id } });
    return { message: 'Media deleted' };
  }

  async batchDelete(ids: number[]) {
    const items = await this.prisma.media.findMany({ where: { id: { in: ids } } });

    for (const item of items) {
      const filePath = path.join(this.uploadDir, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.prisma.media.deleteMany({ where: { id: { in: ids } } });
    return { message: `${items.length} files deleted` };
  }

  async batchDownload(ids: number[], res: Response) {
    const items = await this.prisma.media.findMany({
      where: { id: { in: ids } },
    });

    if (items.length === 0) throw new NotFoundException('No files found');
    if (items.length === 1) {
      const filePath = path.join(this.uploadDir, items[0].filename);
      if (!fs.existsSync(filePath)) throw new NotFoundException('File not found on disk');
      res.download(filePath, items[0].originalName);
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="media-${Date.now()}.zip"`);

    const zipfile = new yazl.ZipFile();
    zipfile.outputStream.pipe(res);

    for (const item of items) {
      const filePath = path.join(this.uploadDir, item.filename);
      if (fs.existsSync(filePath)) {
        zipfile.addFile(filePath, item.originalName);
      }
    }

    zipfile.end();
  }

  async batchMove(ids: number[], folderId?: number | null) {
    if (folderId) {
      const folder = await this.prisma.mediaFolder.findUnique({ where: { id: folderId } });
      if (!folder) throw new NotFoundException('Folder not found');
    }

    await this.prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { folderId: folderId ?? null },
    });

    return { message: `${ids.length} files moved` };
  }

  // ─── Folder CRUD ─────────────────────────────────────────

  async findAllFolders() {
    return this.prisma.mediaFolder.findMany({
      include: {
        _count: { select: { media: true } },
        children: { select: { id: true, name: true, _count: { select: { media: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(name: string, parentId?: number) {
    if (parentId) {
      const parent = await this.prisma.mediaFolder.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    return this.prisma.mediaFolder.create({
      data: { name, parentId },
    });
  }

  async updateFolder(id: number, name: string) {
    const folder = await this.prisma.mediaFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');

    return this.prisma.mediaFolder.update({
      where: { id },
      data: { name },
    });
  }

  async deleteFolder(id: number) {
    const folder = await this.prisma.mediaFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');

    // Move files to uncategorized
    await this.prisma.media.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    // Reassign child folders to parent
    await this.prisma.mediaFolder.updateMany({
      where: { parentId: id },
      data: { parentId: folder.parentId },
    });

    await this.prisma.mediaFolder.delete({ where: { id } });
    return { message: 'Folder deleted' };
  }
}
