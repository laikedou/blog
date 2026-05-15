import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SeoService } from './seo.service';
import { TrackKeywordDto, RecordKeywordRankingDto, RecordClickDto, UpdateIndexStatusDto } from './dto/seo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('SEO')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/seo')
export class SeoController {
  constructor(private seoService: SeoService) {}

  // ─── Audit ─────────────────────────────────────

  @Post('audit/:postId')
  auditPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.seoService.auditPost(postId);
  }

  @Get('audits/:postId')
  getPostAudits(@Param('postId', ParseIntPipe) postId: number) {
    return this.seoService.getPostAudits(postId);
  }

  @Get('audits')
  getAllAudits(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.seoService.getAllAudits(page || 1, limit || 20);
  }

  // ─── Keywords ───────────────────────────────────

  @Post('keywords')
  addKeyword(@Body() dto: TrackKeywordDto) {
    return this.seoService.addKeyword(dto);
  }

  @Get('keywords')
  listKeywords() {
    return this.seoService.listKeywords();
  }

  @Delete('keywords/:id')
  deleteKeyword(@Param('id', ParseIntPipe) id: number) {
    return this.seoService.deleteKeyword(id);
  }

  @Get('keywords/:id/rankings')
  getKeywordRankings(@Param('id', ParseIntPipe) id: number) {
    return this.seoService.getKeywordRankings(id);
  }

  @Post('keywords/ranking')
  recordRanking(@Body() dto: RecordKeywordRankingDto) {
    return this.seoService.recordRanking(dto);
  }

  // ─── Clicks ─────────────────────────────────────

  @Post('clicks')
  recordClick(@Body() dto: RecordClickDto) {
    return this.seoService.recordClick(dto);
  }

  @Get('clicks')
  getClickStats(@Query('days') days?: number) {
    return this.seoService.getClickStats(days || 30);
  }

  // ─── Index Status ───────────────────────────────

  @Post('index-status')
  updateIndexStatus(@Body() dto: UpdateIndexStatusDto) {
    return this.seoService.updateIndexStatus(dto);
  }

  @Get('index-status')
  getIndexStatus() {
    return this.seoService.getIndexStatus();
  }

  // ─── Dashboard ───────────────────────────────────

  @Get('dashboard')
  getDashboard() {
    return this.seoService.getDashboard();
  }

  // ─── AI Suggestions ─────────────────────────────

  @Get('suggestions/:postId')
  getAiSuggestions(@Param('postId', ParseIntPipe) postId: number) {
    return this.seoService.getAiSuggestions(postId);
  }
}
