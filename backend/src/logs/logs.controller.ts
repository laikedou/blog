import { Controller, Get, Param, ParseIntPipe, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/logs')
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get()
  findAll(@Query() query: QueryLogsDto) {
    return this.logsService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.logsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.logsService.findOne(id);
  }

  @Delete()
  clearAll() {
    return this.logsService.clearAll();
  }
}
