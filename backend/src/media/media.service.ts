import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        skip,
        take: limit,
        include: { uploader: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count(),
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

    const filePath = path.join(process.cwd(), 'uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.media.delete({ where: { id } });
    return { message: 'Media deleted' };
  }
}
