import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Res, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { formatSSE } from './sse-utils';
import { extractHtmlCode } from './extract-code';
import { VisualizationService } from './visualization.service';
import { VisualizationAiService } from './visualization-ai.service';
import {
  GenerateVisualizationDto,
  RefineVisualizationDto,
  FixErrorDto,
  CreateVisualizationDto,
  UpdateVisualizationDto,
  PublishVisualizationDto,
  QueryVisualizationDto,
  RestoreVersionDto,
  CompareVersionsDto,
  SuggestTopicsDto,
} from './dto/visualization.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { AiUsageService } from '../ai-usage/ai-usage.service';

@ApiTags('Visualizations')
@Controller('api/visualizations')
export class VisualizationController {
  private readonly logger = new Logger(VisualizationController.name);

  constructor(
    private service: VisualizationService,
    private ai: VisualizationAiService,
    private readonly aiUsage: AiUsageService,
  ) {}

  // ── AI Generation ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiOperation({ summary: 'AI-generate a visualization from a prompt' })
  async generate(@Body() dto: GenerateVisualizationDto, @Req() req: any) {
    return this.service.generate(dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate-stream')
  @ApiOperation({ summary: 'AI-generate a visualization with SSE streaming' })
  async generateStream(@Body() dto: GenerateVisualizationDto, @Req() req: any, @Res() res: Response) {
    const logPrefix = `generate-stream[user=${req.user?.id}]`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.status(200);

    const abortController = new AbortController();
    let clientDisconnected = false;

    req.on('close', () => {
      clientDisconnected = true;
      abortController.abort();
      if (!res.writableEnded) {
        res.end();
      }
    });

    const providerName = dto.provider || this.ai.getDefaultProvider() || 'unknown';
    let model = 'unknown';
    try { model = this.ai.getProvider(providerName).model; } catch {}
    const streamStartTime = Date.now();

    try {
      const visualization = await this.service.createForStream(dto, req.user.id);
      this.logger.log(`${logPrefix}: created viz id=${visualization.id}`);

      res.write(formatSSE('init', { id: visualization.id, title: visualization.title }));

      const stream = await this.ai.generateStream(
        dto.prompt,
        dto.subject,
        dto.provider,
        abortController.signal,
        dto.language,
      );

      let fullRaw = '';
      for await (const chunk of stream) {
        if (clientDisconnected || abortController.signal.aborted) break;
        fullRaw += chunk.text;
        res.write(formatSSE('chunk', { text: chunk.text }));
      }

      if (clientDisconnected || abortController.signal.aborted) {
        this.logger.warn(`${logPrefix}: client disconnected mid-stream`);
        const durationMs = Date.now() - streamStartTime;
        await this.aiUsage.log({
          provider: providerName, model, feature: 'generateVisualizationStream',
          promptTokens: 0, completionTokens: 0, totalTokens: 0,
          durationMs, status: 'error', errorMessage: 'Client disconnected', userId: req.user?.id,
        }).catch(() => {});
        if (!res.writableEnded) res.end();
        return;
      }

      const extractedCode = extractHtmlCode(fullRaw);
      const updated = await this.service.updateAfterStream(visualization.id, extractedCode, fullRaw, dto.prompt);

      const durationMs = Date.now() - streamStartTime;
      await this.aiUsage.log({
        provider: providerName, model, feature: 'generateVisualizationStream',
        promptTokens: 0, completionTokens: 0, totalTokens: 0,
        durationMs, status: 'success', userId: req.user?.id,
      }).catch(() => {});

      res.write(formatSSE('done', {
        id: updated.id,
        htmlContent: updated.htmlContent,
        raw: fullRaw,
        title: updated.title,
        status: updated.status,
      }));

      this.logger.log(`${logPrefix}: streaming complete for viz id=${visualization.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown streaming error';
      this.logger.error(`${logPrefix}: ${message}`, error instanceof Error ? error.stack : '');

      const durationMs = Date.now() - streamStartTime;
      await this.aiUsage.log({
        provider: providerName, model, feature: 'generateVisualizationStream',
        promptTokens: 0, completionTokens: 0, totalTokens: 0,
        durationMs, status: 'error', errorMessage: message, userId: req.user?.id,
      }).catch(() => {});

      if (!res.writableEnded) {
        if (!res.headersSent) {
          res.status(500).json({ statusCode: 500, message, timestamp: new Date().toISOString(), path: req.url });
        } else {
          res.write(formatSSE('error', { message }));
          res.end();
        }
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('refine')
  @ApiOperation({ summary: 'Refine an existing visualization with AI' })
  async refine(@Body() dto: RefineVisualizationDto, @Req() req: any) {
    return this.service.refine(dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('fix-error')
  @ApiOperation({ summary: 'Auto-fix a compilation or runtime error in a visualization using AI' })
  async fixError(@Body() dto: FixErrorDto, @Req() req: any) {
    return this.service.fixError(dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('providers')
  @ApiOperation({ summary: 'List available AI providers' })
  getProviders() {
    return {
      providers: this.ai.getAvailableProviders(),
      default: this.ai.getDefaultProvider(),
    };
  }

  // ── Topic Suggestions ──
  // NOTE: must be defined BEFORE @Get(':id') to avoid route collision

  @Public()
  @Get('topics/suggest')
  @ApiOperation({ summary: 'Get topic suggestions for AI visualizations' })
  async suggestTopics(@Query() query: SuggestTopicsDto) {
    return this.service.suggestTopics(query.subject, query.count);
  }

  // ── CRUD ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create visualization manually' })
  async create(@Body() dto: CreateVisualizationDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published visualizations (public)' })
  async findAll(@Query() query: QueryVisualizationDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get('published')
  @ApiOperation({ summary: 'List published visualizations' })
  async findPublished(@Query() query: QueryVisualizationDto) {
    return this.service.findPublished(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get visualization by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update visualization' })
  async update(@Param('id') id: string, @Body() dto: UpdateVisualizationDto, @Req() req: any) {
    return this.service.update(+id, dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish visualization' })
  async publish(@Param('id') id: string, @Body() dto: PublishVisualizationDto, @Req() req: any) {
    return this.service.publish(+id, dto.status, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete visualization' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(+id, req.user.id);
  }

  // ── Version Management ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions of a visualization' })
  async getVersions(@Param('id') id: string) {
    return this.service.getVersions(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get a specific version detail' })
  async getVersionDetail(@Param('id') id: string, @Param('versionId') versionId: string) {
    return this.service.getVersionDetail(+id, +versionId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a previous version' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: RestoreVersionDto,
    @Req() req: any,
  ) {
    return this.service.restoreVersion(+id, +versionId, dto.changeNote, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/versions/compare')
  @ApiOperation({ summary: 'Compare two versions' })
  async compareVersions(@Param('id') id: string, @Body() dto: CompareVersionsDto) {
    return this.service.compareVersions(+id, dto.fromVersionId, dto.toVersionId);
  }

  // ── Cover Image ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/generate-cover')
  @ApiOperation({ summary: 'Generate AI cover image for a visualization' })
  async generateCover(@Param('id') id: string, @Req() req: any) {
    return this.service.generateCover(+id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/generate-metadata')
  @ApiOperation({ summary: 'Generate AI metadata (introduction, explanation, summary) for a visualization' })
  async generateMetadata(@Param('id') id: string, @Req() req: any) {
    return this.service.generateMetadata(+id, req.user.id);
  }

  // ── Stats ──

  @Public()
  @Post(':id/stats')
  @ApiOperation({ summary: 'Record a stat event (view, interact, share)' })
  async recordStat(@Param('id') id: string, @Body() body: { action: string; metadata?: Record<string, any> }) {
    return this.service.recordStat(+id, body.action, body.metadata);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get stats for a visualization' })
  async getStats(@Param('id') id: string) {
    return this.service.getStats(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats/aggregated')
  @ApiOperation({ summary: 'Get aggregated stats across all visualizations' })
  async getAggregatedStats() {
    return this.service.getAggregatedStats();
  }

  // ── Likes ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiOperation({ summary: 'Toggle like on a visualization' })
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.service.toggleLike(+id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/like-status')
  @ApiOperation({ summary: 'Check if current user liked the visualization' })
  async getLikeStatus(@Param('id') id: string, @Req() req: any) {
    return this.service.getLikeStatus(+id, req.user.id);
  }

  // ── Comments ──

  @Public()
  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a visualization' })
  async getComments(@Param('id') id: string) {
    return this.service.getComments(+id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a comment on a visualization' })
  async createComment(@Param('id') id: string, @Body() body: { content: string; parentId?: number }, @Req() req: any) {
    return this.service.createComment(+id, req.user.id, body.content, body.parentId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.service.deleteComment(+commentId, req.user.id);
  }

  // ── Related ──

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related visualizations' })
  async getRelated(@Param('id') id: string) {
    return this.service.getRelated(+id);
  }
}
