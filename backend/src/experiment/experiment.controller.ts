import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExperimentService } from './experiment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Experiments')
@Controller('api/experiments')
export class ExperimentController {
  constructor(private service: ExperimentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create an experiment with AI-generated perspectives' })
  async create(@Body() body: { concept: string; subject: string; perspectiveCount?: number; language?: string }, @Req() req: any) {
    return this.service.create(body.concept, body.subject, req.user.id, body.perspectiveCount, body.language);
  }

  @Get()
  @ApiOperation({ summary: 'List all experiments' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experiment with perspectives' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an experiment' })
  async remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
