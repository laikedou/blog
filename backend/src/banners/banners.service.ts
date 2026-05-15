import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banners.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: number) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async update(id: number, dto: UpdateBannerDto) {
    await this.findOne(id);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.banner.delete({ where: { id } });
  }
}
