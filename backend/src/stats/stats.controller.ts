import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.statsService.getDashboard();
  }

  @Get('posts/:id')
  getPostStats(@Param('id', ParseIntPipe) id: number) {
    return this.statsService.getPostStats(id);
  }
}
