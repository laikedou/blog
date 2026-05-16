import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateSiteConfigDto } from './dto/site-config.dto';

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the singleton SiteConfig row. Creates one if it doesn't exist.
   */
  async getConfig() {
    let config = await this.prisma.siteConfig.findFirst({ orderBy: { id: 'asc' } });
    if (!config) {
      config = await this.prisma.siteConfig.create({ data: {} });
    }
    return config;
  }

  /**
   * Updates the singleton SiteConfig row.
   */
  async updateConfig(dto: UpdateSiteConfigDto) {
    let config = await this.prisma.siteConfig.findFirst({ orderBy: { id: 'asc' } });
    if (!config) {
      config = await this.prisma.siteConfig.create({ data: {} });
    }
    return this.prisma.siteConfig.update({
      where: { id: config.id },
      data: dto,
    });
  }
}
