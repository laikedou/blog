import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiUsageService } from './ai-usage.service';
import { QueryAiUsageDto } from './dto/query-ai-usage.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('AI Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/ai-usage')
export class AiUsageController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated AI usage logs with filters' })
  findAll(@Query() query: QueryAiUsageDto) {
    return this.aiUsageService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated AI usage stats' })
  getStats() {
    return this.aiUsageService.getStats();
  }
}
