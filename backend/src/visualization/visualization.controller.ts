import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Res, Logger, ParseIntPipe,
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
  BatchUpdateStatusDto,
  BatchDeleteDto,
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
  @Post('refine-stream')
  @ApiOperation({ summary: 'Refine an existing visualization with AI using SSE streaming' })
  async refineStream(@Body() dto: RefineVisualizationDto, @Req() req: any, @Res() res: Response) {
    const logPrefix = `refine-stream[user=${req.user?.id}][viz=${dto.visualizationId}]`;

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
      if (!res.writableEnded) res.end();
    });

    const providerName = this.ai.getDefaultProvider() || 'unknown';
    let model = 'unknown';
    try { model = this.ai.getProvider(providerName).model; } catch {}
    const streamStartTime = Date.now();

    try {
      const { htmlContent } = await this.service.getVizForRefineStream(dto.visualizationId, req.user.id);

      this.logger.log(`${logPrefix}: starting stream`);

      const stream = await this.ai.refineStream(
        htmlContent,
        dto.feedback,
        undefined,
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
          provider: providerName, model, feature: 'refineVisualizationStream',
          promptTokens: 0, completionTokens: 0, totalTokens: 0,
          durationMs, status: 'error', errorMessage: 'Client disconnected', userId: req.user?.id,
        }).catch(() => {});
        if (!res.writableEnded) res.end();
        return;
      }

      const extractedCode = extractHtmlCode(fullRaw);
      const updated = await this.service.updateAfterRefineStream(dto.visualizationId, extractedCode, dto.feedback);

      const durationMs = Date.now() - streamStartTime;
      await this.aiUsage.log({
        provider: providerName, model, feature: 'refineVisualizationStream',
        promptTokens: 0, completionTokens: 0, totalTokens: 0,
        durationMs, status: 'success', userId: req.user?.id,
      }).catch(() => {});

      res.write(formatSSE('done', {
        id: updated.id,
        htmlContent: updated.htmlContent,
        version: updated.version,
      }));

      this.logger.log(`${logPrefix}: streaming complete`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown streaming error';
      this.logger.error(`${logPrefix}: ${message}`, error instanceof Error ? error.stack : '');

      const durationMs = Date.now() - streamStartTime;
      await this.aiUsage.log({
        provider: providerName, model, feature: 'refineVisualizationStream',
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
      if (!res.writableEnded) res.end();
    }
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
  async generateMetadata(@Param('id') id: string, @Body() body: { language?: string }, @Req() req: any) {
    return this.service.generateMetadata(+id, req.user.id, body.language);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/generate-metadata-stream')
  @ApiOperation({ summary: 'Stream AI metadata generation via SSE' })
  async generateMetadataStream(@Param('id') id: string, @Body() body: { language?: string }, @Req() req: any, @Res() res: Response) {
    const logPrefix = `generate-metadata-stream[user=${req.user?.id}][viz=${id}]`;

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
      if (!res.writableEnded) res.end();
    });

    const providerName = this.ai.getDefaultProvider() || 'unknown';
    let model = 'unknown';
    try { model = this.ai.getProvider(providerName).model; } catch {}
    const streamStartTime = Date.now();

    try {
      const { title, subject } = await this.service.getVizForMetadataStream(+id, req.user.id);
      const language = body.language;

      const langInstruction = language
        ? `\n\nCRITICAL: Generate all content in the language corresponding to locale "${language}".`
        : '';

      const metaPrompt = `For the following ${subject} topic titled "${title}"

Generate three sections for an educational article. Write in a clear, accessible style suitable for learners.

===INTRO===
Write an engaging introduction (2-3 sentences) that hooks the reader and explains why this topic matters.
===DETAILED===
Write a detailed explanation (3-5 paragraphs) covering the mechanism, key relationships, and real-world implications.
===SUMMARY===
Write a concise summary (2-3 bullet points) of the most important takeaways.${langInstruction}

CRITICAL: Use the EXACT markers ===INTRO===, ===DETAILED===, and ===SUMMARY=== to separate sections.`;

      this.logger.log(`${logPrefix}: starting stream`);

      const stream = await this.ai.generateTextStream(metaPrompt, providerName, abortController.signal, language);

      // Accumulate full text for final parse, while emitting field-aware chunks
      let fullText = '';
      let buffer = '';
      let currentField: string | null = null;
      const MARKERS = ['===INTRO===', '===DETAILED===', '===SUMMARY==='];
      const FIELD_MAP: Record<string, string> = {
        '===INTRO===': 'introduction',
        '===DETAILED===': 'detailedExplanation',
        '===SUMMARY===': 'knowledgeSummary',
      };
      const MAX_MARKER_LEN = Math.max(...MARKERS.map(m => m.length));

      for await (const chunk of stream) {
        if (clientDisconnected || abortController.signal.aborted) break;

        fullText += chunk.text;
        buffer += chunk.text;

        // Scan for section markers
        let markerFound = true;
        while (markerFound) {
          markerFound = false;
          for (const marker of MARKERS) {
            const idx = buffer.indexOf(marker);
            if (idx !== -1) {
              // Emit text before the marker as the previous field
              if (currentField && idx > 0) {
                const text = buffer.slice(0, idx).trim();
                if (text) res.write(formatSSE('chunk', { field: currentField, text }));
              }
              currentField = FIELD_MAP[marker];
              buffer = buffer.slice(idx + marker.length);
              markerFound = true;
              break;
            }
          }
        }

        // Emit safe chunks for the current field (keep lookahead for markers)
        if (currentField && buffer.length > MAX_MARKER_LEN) {
          const safeLength = buffer.length - MAX_MARKER_LEN;
          const text = buffer.slice(0, safeLength);
          buffer = buffer.slice(safeLength);
          if (text) res.write(formatSSE('chunk', { field: currentField, text }));
        }
      }

      // Emit remaining buffer as the last field
      if (currentField && buffer.trim()) {
        res.write(formatSSE('chunk', { field: currentField, text: buffer.trim() }));
      }

      if (clientDisconnected || abortController.signal.aborted) {
        this.logger.warn(`${logPrefix}: client disconnected mid-stream`);
        if (!res.writableEnded) res.end();
        return;
      }

      // Parse full accumulated text for structured result
      const metadata = this.ai.parseMetadataResponse(fullText);

      // Persist to DB
      await this.service.saveMetadata(+id, metadata);

      const durationMs = Date.now() - streamStartTime;
      await this.aiUsage.log({
        provider: providerName, model, feature: 'generateMetadataStream',
        promptTokens: 0, completionTokens: 0, totalTokens: 0,
        durationMs, status: 'success', userId: req.user?.id,
      }).catch(() => {});

      res.write(formatSSE('done', metadata));

      this.logger.log(`${logPrefix}: streaming complete`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown streaming error';
      this.logger.error(`${logPrefix}: ${message}`, error instanceof Error ? error.stack : '');

      const durationMs = Date.now() - streamStartTime;
      await this.aiUsage.log({
        provider: providerName, model, feature: 'generateMetadataStream',
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
      if (!res.writableEnded) res.end();
    }
  }

  // ── Difficulty (Feature 4) ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/difficulty/generate')
  @ApiOperation({ summary: 'Generate difficulty variants for a visualization' })
  async generateDifficulty(@Param('id') id: string, @Body() body: { levels: string[]; language?: string }, @Req() req: any) {
    return this.service.generateDifficulty(+id, body.levels, req.user.id, body.language);
  }

  @Public()
  @Get(':id/difficulty')
  @ApiOperation({ summary: 'Get difficulty variants for a visualization' })
  async getDifficulty(@Param('id') id: string) {
    return this.service.getDifficulty(+id);
  }

  // ── Narration (Feature 3) ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/narration/generate')
  @ApiOperation({ summary: 'Generate narration script for a visualization' })
  async generateNarration(@Param('id') id: string, @Body() body: { locale?: string }, @Req() req: any) {
    return this.service.generateNarration(+id, req.user.id, body.locale);
  }

  @Public()
  @Get(':id/narration')
  @ApiOperation({ summary: 'Get narration script for a visualization' })
  async getNarration(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.service.getNarration(+id, locale);
  }

  // ── AI Tutor (Feature 1) ──

  @Public()
  @Post(':id/tutor/ask')
  @ApiOperation({ summary: 'Ask AI tutor for contextual explanation' })
  async askTutor(@Param('id') id: string, @Body() body: any) {
    return this.service.askTutor(+id, body);
  }

  @Public()
  @Get(':id/tutor/history')
  @ApiOperation({ summary: 'Get AI tutor interaction history' })
  async getTutorHistory(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    return this.service.getTutorHistory(+id, sessionId);
  }

  // ── Article Mode (Feature 5) ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/article/generate')
  @ApiOperation({ summary: 'Generate quiz for interactive article mode' })
  async generateArticleQuiz(@Param('id') id: string, @Body() body: { language?: string }, @Req() req: any) {
    return this.service.generateArticleQuiz(+id, req.user.id, body.language);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id/article/config')
  @ApiOperation({ summary: 'Update article mode configuration' })
  async updateArticleConfig(
    @Param('id') id: string,
    @Body() body: { articleMode?: boolean; quiz?: string },
    @Req() req: any,
  ) {
    return this.service.updateArticleConfig(+id, body, req.user.id);
  }

  // ── Batch Operations ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('batch-update-status')
  @ApiOperation({ summary: 'Batch update visualization statuses' })
  async batchUpdateStatus(@Body() dto: BatchUpdateStatusDto, @Req() req: any) {
    return this.service.batchUpdateStatus(dto.ids, dto.status, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete visualizations' })
  async batchDelete(@Body() dto: BatchDeleteDto, @Req() req: any) {
    return this.service.batchDelete(dto.ids, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/fork')
  @ApiOperation({ summary: 'Fork a visualization' })
  async forkVisualization(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.forkVisualization(id, req.user.id);
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

  // ── Visualization Comment Admin ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/viz-comments')
  @ApiOperation({ summary: 'List all visualization comments (admin)' })
  async listVizComments(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('status') status?: string,
  ) {
    return this.service.listVizComments(page, limit, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('admin/viz-comments/:id')
  @ApiOperation({ summary: 'Update a visualization comment (admin)' })
  async updateVizComment(@Param('id', ParseIntPipe) id: number, @Body() body: { content?: string; status?: string }) {
    return this.service.updateVizComment(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/viz-comments/:id')
  @ApiOperation({ summary: 'Delete a visualization comment (admin)' })
  async deleteVizComment(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteVizComment(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/viz-comments/batch-update-status')
  @ApiOperation({ summary: 'Batch update visualization comment statuses' })
  async batchUpdateVizCommentStatus(@Body() dto: BatchUpdateStatusDto) {
    return this.service.batchUpdateVizCommentStatus(dto.ids, dto.status);
  }

  // ── Related ──

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related visualizations' })
  async getRelated(@Param('id') id: string) {
    return this.service.getRelated(+id);
  }
}
