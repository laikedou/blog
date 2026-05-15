import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
