import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateTagDto, UpdateTagDto } from './dto/tags.dto';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
    return tags.map(t => ({ ...t, postCount: t._count.posts, _count: undefined }));
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!tag) throw new NotFoundException('Tag not found');
    return { ...tag, postCount: tag._count.posts, _count: undefined };
  }

  async create(dto: CreateTagDto) {
    const slug = dto.slug || slugify(dto.name);
    return this.prisma.tag.create({ data: { name: dto.name, slug } });
  }

  async update(id: number, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    return this.prisma.tag.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.prisma.postTag.deleteMany({ where: { tagId: id } });
    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Tag deleted' };
  }
}
