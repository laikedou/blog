import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
    return categories.map(c => ({ ...c, postCount: c._count.posts, _count: undefined }));
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    return { ...category, postCount: category._count.posts, _count: undefined };
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || slugify(dto.name);
    return this.prisma.category.create({ data: { ...dto, slug } });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    // Set posts in this category to uncategorized
    await this.prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
