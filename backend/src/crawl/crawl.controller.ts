import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrawlService } from './crawl.service';
import { CreateCrawlSourceDto, UpdateCrawlSourceDto } from './dto/crawl.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Crawl')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/crawl')
export class CrawlController {
  constructor(private crawlService: CrawlService) {}

  @Get('sources')
  getSources() {
    return this.crawlService.getSources();
  }

  @Post('sources')
  createSource(@Body() dto: CreateCrawlSourceDto) {
    return this.crawlService.createSource(dto);
  }

  @Put('sources/:id')
  updateSource(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCrawlSourceDto) {
    return this.crawlService.updateSource(id, dto);
  }

  @Delete('sources/:id')
  deleteSource(@Param('id', ParseIntPipe) id: number) {
    return this.crawlService.deleteSource(id);
  }

  @Post('sources/:id/run')
  runSource(@Param('id', ParseIntPipe) id: number) {
    return this.crawlService.crawlSource(id);
  }

  @Get('articles')
  getArticles(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.crawlService.getArticles(page || 1, limit || 10);
  }

  @Get('articles/:id')
  getArticle(@Param('id', ParseIntPipe) id: number) {
    return this.crawlService.getArticle(id);
  }

  @Post('articles/:id/publish')
  publishArticle(@Param('id', ParseIntPipe) id: number) {
    return this.crawlService.publishArticle(id);
  }

  @Delete('articles/:id')
  deleteArticle(@Param('id', ParseIntPipe) id: number) {
    return this.crawlService.deleteArticle(id);
  }
}
