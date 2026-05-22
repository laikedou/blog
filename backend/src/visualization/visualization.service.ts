import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../common/prisma.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { NotificationsGateway } from '../common/notifications.gateway';
import { heuristicSpamCheck, aiSpamCheck } from '../common/spam-checker';
import { VisualizationAiService } from './visualization-ai.service';
import { GrokTtsService } from './grok-tts.service';
import {
  CreateVisualizationDto,
  UpdateVisualizationDto,
  GenerateVisualizationDto,
  RefineVisualizationDto,
  FixErrorDto,
  QueryVisualizationDto,
  TopicSuggestion,
} from './dto/visualization.dto';

@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

  constructor(
    private prisma: PrismaService,
    private ai: VisualizationAiService,
    private cloudflareAi: CloudflareAiService,
    private notifications: NotificationsGateway,
    private grokTts: GrokTtsService,
  ) {}

  async generate(dto: GenerateVisualizationDto, authorId: number) {
    const result = await this.ai.generate(dto.prompt, dto.subject, dto.provider, undefined, dto.language);
    const title = dto.title || dto.prompt.slice(0, 80);

    const visualization = await this.prisma.visualization.create({
      data: {
        title,
        subject: dto.subject,
        prompt: dto.prompt,
        htmlContent: result.code,
        status: 'draft',
        authorId,
      },
    });

    // Save initial version
    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: visualization.id,
        htmlContent: result.code,
        prompt: dto.prompt,
        version: 1,
        changeNote: 'Initial generation',
      },
    });

    return { ...visualization, rawAiResponse: result.raw };
  }

  async createForStream(dto: GenerateVisualizationDto, authorId: number) {
    const title = dto.title || dto.prompt.slice(0, 80);
    return this.prisma.visualization.create({
      data: {
        title,
        subject: dto.subject,
        prompt: dto.prompt,
        htmlContent: '',
        status: 'draft',
        authorId,
      },
    });
  }

  async updateAfterStream(id: number, code: string, raw: string, prompt: string) {
    await this.prisma.visualization.update({
      where: { id },
      data: { htmlContent: code },
    });
    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: id,
        htmlContent: code,
        prompt,
        version: 1,
        changeNote: 'Initial generation',
      },
    });
    return this.prisma.visualization.findUniqueOrThrow({ where: { id } });
  }

  async generateMetadata(id: number, authorId: number, language?: string) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const metadata = await this.ai.generateMetadata(viz.title, viz.subject, undefined, undefined, language);
    const updated = await this.prisma.visualization.update({
      where: { id },
      data: {
        introduction: metadata.introduction,
        detailedExplanation: metadata.detailedExplanation,
        knowledgeSummary: metadata.knowledgeSummary,
      },
    });
    return {
      introduction: updated.introduction,
      detailedExplanation: updated.detailedExplanation,
      knowledgeSummary: updated.knowledgeSummary,
    };
  }

  async getVizForMetadataStream(id: number, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');
    return { title: viz.title, subject: viz.subject };
  }

  async getVizForRefineStream(id: number, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');
    return { htmlContent: viz.htmlContent };
  }

  async saveMetadata(id: number, data: { introduction: string; detailedExplanation: string; knowledgeSummary: string }) {
    await this.prisma.visualization.update({
      where: { id },
      data,
    });
  }

  async updateAfterRefineStream(id: number, code: string, feedback: string) {
    const viz = await this.prisma.visualization.findUnique({ where: { id } });
    if (!viz) throw new NotFoundException('Visualization not found');

    const newVersion = viz.version + 1;

    await this.prisma.visualization.update({
      where: { id },
      data: { htmlContent: code, version: newVersion },
    });

    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: id,
        htmlContent: code,
        prompt: feedback,
        version: newVersion,
        changeNote: feedback.slice(0, 200),
      },
    });

    return { id, version: newVersion, htmlContent: code };
  }

  async refine(dto: RefineVisualizationDto, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id: dto.visualizationId, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const result = await this.ai.refine(viz.htmlContent, dto.feedback, undefined, undefined, dto.language);

    const newVersion = viz.version + 1;

    await this.prisma.visualization.update({
      where: { id: viz.id },
      data: {
        htmlContent: result.code,
        version: newVersion,
      },
    });

    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: viz.id,
        htmlContent: result.code,
        prompt: dto.feedback,
        version: newVersion,
        changeNote: dto.feedback.slice(0, 200),
      },
    });

    return { id: viz.id, version: newVersion, htmlContent: result.code, rawAiResponse: result.raw };
  }

  async fixError(dto: FixErrorDto, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id: dto.visualizationId, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    // Use the dedicated fixError path — minimal prompt, no style/quality guidelines,
    // so the AI only touches what's broken and leaves everything else intact.
    const result = await this.ai.fixError(viz.htmlContent, dto.error, undefined, undefined, dto.language);

    const newVersion = viz.version + 1;

    await this.prisma.visualization.update({
      where: { id: viz.id },
      data: {
        htmlContent: result.code,
        version: newVersion,
      },
    });

    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: viz.id,
        htmlContent: result.code,
        prompt: `Auto-fix: ${dto.error.slice(0, 200)}`,
        version: newVersion,
        changeNote: `Auto-fix: ${dto.error.slice(0, 200)}`,
      },
    });

    return { id: viz.id, version: newVersion, htmlContent: result.code, rawAiResponse: result.raw };
  }

  async create(dto: CreateVisualizationDto, authorId: number) {
    const viz = await this.prisma.visualization.create({
      data: {
        title: dto.title,
        subject: dto.subject,
        description: dto.description || '',
        introduction: dto.introduction || '',
        detailedExplanation: dto.detailedExplanation || '',
        knowledgeSummary: dto.knowledgeSummary || '',
        tags: dto.tags || '',
        htmlContent: dto.htmlContent,
        prompt: dto.prompt || '',
        authorId,
      },
    });

    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: viz.id,
        htmlContent: dto.htmlContent,
        prompt: dto.prompt || '',
        version: 1,
        changeNote: 'Manual creation',
      },
    });

    return viz;
  }

  async findAll(query: QueryVisualizationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.subject) where.subject = query.subject;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.visualization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { author: { select: { id: true, username: true, displayName: true } } },
      }),
      this.prisma.visualization.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublished(query: { page?: number; limit?: number; subject?: string; search?: string }) {
    return this.findAll({ ...query, status: 'published' });
  }

  async findOne(id: number) {
    const viz = await this.prisma.visualization.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        versions: { orderBy: { version: 'desc' }, take: 10 },
      },
    });
    if (!viz) throw new NotFoundException('Visualization not found');
    return viz;
  }

  async forkVisualization(id: number, authorId: number) {
    const source = await this.findOne(id);

    const forked = await this.prisma.visualization.create({
      data: {
        title: `${source.title} (fork)`,
        subject: source.subject,
        description: source.description,
        htmlContent: source.htmlContent,
        introduction: source.introduction,
        detailedExplanation: source.detailedExplanation,
        knowledgeSummary: source.knowledgeSummary,
        authorId,
        status: 'draft',
      },
    });

    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId: forked.id,
        version: 1,
        htmlContent: source.htmlContent,
        changeNote: `Forked from "${source.title}" by ${source.author.displayName}`,
      },
    });

    return forked;
  }

  async update(id: number, dto: UpdateVisualizationDto, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    return this.prisma.visualization.update({
      where: { id },
      data: dto,
    });
  }

  async publish(id: number, status: string, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const data: any = { status };

    // Auto-generate cover image when publishing if none exists
    if (status === 'published' && !viz.featuredImage) {
      const prompt = this.cloudflareAi.buildVisualizationCoverPrompt(viz.title, viz.subject, viz.description);
      const coverUrl = await this.cloudflareAi.generateCover(prompt);
      if (coverUrl) data.featuredImage = coverUrl;
    }

    return this.prisma.visualization.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    await this.prisma.visualization.delete({ where: { id } });
    return { deleted: true };
  }

  async generateCover(id: number, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const prompt = this.cloudflareAi.buildVisualizationCoverPrompt(viz.title, viz.subject, viz.description);
    const coverUrl = await this.cloudflareAi.generateCover(prompt);
    if (!coverUrl) throw new NotFoundException('Cover generation failed — AI service may not be configured');

    await this.prisma.visualization.update({
      where: { id },
      data: { featuredImage: coverUrl },
    });

    return { featuredImage: coverUrl };
  }

  async recordStat(visualizationId: number, action: string, metadata?: Record<string, any>) {
    return this.prisma.visualizationStat.create({
      data: {
        visualizationId,
        action,
        metadata: JSON.stringify(metadata || {}),
      },
    });
  }

  async getStats(visualizationId: number) {
    const viz = await this.prisma.visualization.findUnique({
      where: { id: visualizationId },
      select: { viewCount: true, interactCount: true },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const actionCounts = await this.prisma.visualizationStat.groupBy({
      by: ['action'],
      where: { visualizationId },
      _count: true,
    });

    const dailyStats = await this.prisma.$queryRaw`
      SELECT DATE(createdAt) as date, action, COUNT(*) as count
      FROM VisualizationStat
      WHERE visualizationId = ${visualizationId}
      GROUP BY DATE(createdAt), action
      ORDER BY date ASC
    `;

    return {
      viewCount: viz.viewCount,
      interactCount: viz.interactCount,
      actions: actionCounts.reduce((acc, row) => {
        acc[row.action] = row._count;
        return acc;
      }, {} as Record<string, number>),
      dailyStats,
    };
  }

  async getAggregatedStats() {
    const totalViews = await this.prisma.visualization.aggregate({
      _sum: { viewCount: true },
    });
    const totalInteracts = await this.prisma.visualization.aggregate({
      _sum: { interactCount: true },
    });
    const subjectCounts = await this.prisma.visualization.groupBy({
      by: ['subject'],
      _count: true,
    });
    const statusCounts = await this.prisma.visualization.groupBy({
      by: ['status'],
      _count: true,
    });

    const recentStats = await this.prisma.$queryRaw`
      SELECT DATE(vs.createdAt) as date, COUNT(*) as count
      FROM VisualizationStat vs
      WHERE vs.createdAt >= datetime('now', '-30 days')
      GROUP BY DATE(vs.createdAt)
      ORDER BY date ASC
    `;

    return {
      totalViews: totalViews._sum.viewCount || 0,
      totalInteracts: totalInteracts._sum.interactCount || 0,
      bySubject: subjectCounts,
      byStatus: statusCounts,
      recent30Days: recentStats,
      totalVisualizations: await this.prisma.visualization.count(),
    };
  }

  // ─── Likes ────────────────────────────────────────────────

  async toggleLike(visualizationId: number, userId: number) {
    const viz = await this.prisma.visualization.findUnique({ where: { id: visualizationId } });
    if (!viz) throw new NotFoundException('Visualization not found');

    const existing = await this.prisma.visualizationLike.findUnique({
      where: { visualizationId_userId: { visualizationId, userId } },
    });

    if (existing) {
      await this.prisma.visualizationLike.delete({ where: { id: existing.id } });
      await this.prisma.visualization.update({
        where: { id: visualizationId },
        data: { likesCount: { decrement: 1 } },
      });
      return { liked: false, likesCount: Math.max(0, viz.likesCount - 1) };
    }

    await this.prisma.visualizationLike.create({
      data: { visualizationId, userId },
    });
    await this.prisma.visualization.update({
      where: { id: visualizationId },
      data: { likesCount: { increment: 1 } },
    });
    return { liked: true, likesCount: viz.likesCount + 1 };
  }

  async getLikeStatus(visualizationId: number, userId: number) {
    const viz = await this.prisma.visualization.findUnique({
      where: { id: visualizationId },
      select: { likesCount: true },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const liked = await this.prisma.visualizationLike.findUnique({
      where: { visualizationId_userId: { visualizationId, userId } },
    });

    return { liked: !!liked, likesCount: viz.likesCount };
  }

  // ─── Comments ─────────────────────────────────────────────

  async getComments(visualizationId: number) {
    const viz = await this.prisma.visualization.findUnique({ where: { id: visualizationId } });
    if (!viz) throw new NotFoundException('Visualization not found');

    const comments = await this.prisma.visualizationComment.findMany({
      where: { visualizationId, parentId: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  async createComment(visualizationId: number, userId: number, content: string, parentId?: number) {
    const viz = await this.prisma.visualization.findUnique({ where: { id: visualizationId } });
    if (!viz) throw new NotFoundException('Visualization not found');

    if (parentId) {
      const parent = await this.prisma.visualizationComment.findUnique({ where: { id: parentId } });
      if (!parent || parent.visualizationId !== visualizationId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const author = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });

    const comment = await this.prisma.visualizationComment.create({
      data: { content, visualizationId, authorId: userId, parentId },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
      },
    });

    // Notify parent comment author on reply
    if (parentId) {
      const parent = await this.prisma.visualizationComment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parent && parent.authorId !== userId) {
        this.notifications.notifyCommentReply({
          commentId: comment.id,
          visualizationId,
          replyAuthor: author?.displayName || 'Someone',
          parentAuthorId: parent.authorId,
          snippet: content.substring(0, 100),
        });
      }
    }

    // Async spam check
    this.runVizCommentSpamCheck(comment.id, content);

    return comment;
  }

  private async runVizCommentSpamCheck(commentId: number, content: string) {
    try {
      const heuristic = heuristicSpamCheck(content);
      if (heuristic.isSpam) {
        await this.prisma.visualizationComment.update({ where: { id: commentId }, data: { status: 'spam' } });
        return;
      }
      const ai = await aiSpamCheck(content);
      if (ai.isSpam) {
        await this.prisma.visualizationComment.update({ where: { id: commentId }, data: { status: 'pending' } });
      }
    } catch { /* ignore */ }
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.visualizationComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new NotFoundException('Comment not found');

    await this.prisma.visualizationComment.delete({ where: { id: commentId } });
    return { deleted: true };
  }

  // ─── Version Management ──────────────────────────────────

  async getVersions(visualizationId: number) {
    const viz = await this.prisma.visualization.findUnique({
      where: { id: visualizationId },
      select: { version: true },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const versions = await this.prisma.visualizationVersion.findMany({
      where: { visualizationId },
      orderBy: { version: 'desc' },
    });

    return versions.map(v => ({
      id: v.id,
      version: v.version,
      changeNote: v.changeNote,
      prompt: v.prompt,
      createdAt: v.createdAt,
      isCurrent: v.version === viz.version,
    }));
  }

  async getVersionDetail(visualizationId: number, versionId: number) {
    const viz = await this.prisma.visualization.findUnique({
      where: { id: visualizationId },
      select: { version: true },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const version = await this.prisma.visualizationVersion.findFirst({
      where: { id: versionId, visualizationId },
    });
    if (!version) throw new NotFoundException('Version not found');

    return {
      ...version,
      isCurrent: version.version === viz.version,
    };
  }

  async restoreVersion(visualizationId: number, versionId: number, changeNote: string | undefined, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id: visualizationId, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const version = await this.prisma.visualizationVersion.findFirst({
      where: { id: versionId, visualizationId },
    });
    if (!version) throw new NotFoundException('Version not found');

    const newVersion = viz.version + 1;

    await this.prisma.visualization.update({
      where: { id: visualizationId },
      data: {
        htmlContent: version.htmlContent,
        version: newVersion,
      },
    });

    await this.prisma.visualizationVersion.create({
      data: {
        visualizationId,
        htmlContent: version.htmlContent,
        prompt: version.prompt,
        version: newVersion,
        changeNote: changeNote || `Restored from version ${version.version}`,
      },
    });

    return { id: visualizationId, version: newVersion, htmlContent: version.htmlContent };
  }

  async compareVersions(visualizationId: number, fromVersionId: number, toVersionId: number) {
    const [fromVersion, toVersion] = await Promise.all([
      this.prisma.visualizationVersion.findFirst({ where: { id: fromVersionId, visualizationId } }),
      this.prisma.visualizationVersion.findFirst({ where: { id: toVersionId, visualizationId } }),
    ]);

    if (!fromVersion) throw new NotFoundException('Source version not found');
    if (!toVersion) throw new NotFoundException('Target version not found');

    return {
      from: { id: fromVersion.id, version: fromVersion.version, createdAt: fromVersion.createdAt, changeNote: fromVersion.changeNote },
      to: { id: toVersion.id, version: toVersion.version, createdAt: toVersion.createdAt, changeNote: toVersion.changeNote },
      htmlContentFrom: fromVersion.htmlContent,
      htmlContentTo: toVersion.htmlContent,
    };
  }

  // ─── Topic Suggestions ───────────────────────────────────

  private readonly mathTopics: TopicSuggestion[] = [
    { id: 'pythagorean', title: 'Pythagorean Theorem', description: 'Interactive proof of the Pythagorean theorem with adjustable right triangles and area visualizations', subject: 'math', difficulty: 'beginner', tags: ['geometry', 'triangles', 'theorems'] },
    { id: 'trig-unit-circle', title: 'Unit Circle & Trig Functions', description: 'Visualize sine, cosine, and tangent on the unit circle with animated angle rotation', subject: 'math', difficulty: 'intermediate', tags: ['trigonometry', 'unit-circle', 'functions'] },
    { id: 'calculus-integral', title: 'Riemann Sums & Definite Integrals', description: 'Approximate area under a curve using adjustable rectangles — understand the fundamental theorem', subject: 'math', difficulty: 'advanced', tags: ['calculus', 'integration', 'riemann'] },
    { id: 'fractal-tree', title: 'Recursive Fractal Tree', description: 'Generate a beautiful fractal tree using recursion — adjust branching angle, depth, and symmetry', subject: 'math', difficulty: 'intermediate', tags: ['fractals', 'recursion', 'geometry'] },
    { id: 'matrix-transform', title: '2D Matrix Transformations', description: 'Apply rotation, scaling, shear and translation matrices to shapes in real-time', subject: 'math', difficulty: 'advanced', tags: ['linear-algebra', 'matrices', 'transforms'] },
    { id: 'fibonacci-spiral', title: 'Fibonacci Sequence & Golden Spiral', description: 'Explore the Fibonacci sequence, golden ratio, and the beautiful natural spiral it creates', subject: 'math', difficulty: 'beginner', tags: ['sequences', 'golden-ratio', 'patterns'] },
    { id: 'function-plotter', title: 'Interactive Function Grapher', description: 'Plot multiple mathematical functions with adjustable parameters and zoom controls', subject: 'math', difficulty: 'beginner', tags: ['functions', 'graphing', 'algebra'] },
    { id: 'probability-dist', title: 'Probability Distributions', description: 'Visualize normal, binomial, and Poisson distributions with adjustable parameters', subject: 'math', difficulty: 'intermediate', tags: ['statistics', 'probability', 'distributions'] },
    { id: 'mandelbrot-set', title: 'Mandelbrot Set Explorer', description: 'Zoom into the infinite complexity of the Mandelbrot set with customizable color schemes', subject: 'math', difficulty: 'advanced', tags: ['complex-numbers', 'fractals', 'visualization'] },
    { id: 'vector-addition', title: 'Vector Addition & Components', description: 'Add vectors graphically and algebraically with draggable vectors and real-time calculations', subject: 'math', difficulty: 'beginner', tags: ['vectors', 'physics', 'algebra'] },
    { id: 'euler-method', title: 'Euler\'s Method for ODEs', description: 'Approximate solutions to ordinary differential equations using Euler\'s method with step-size control', subject: 'math', difficulty: 'advanced', tags: ['differential-equations', 'numerical', 'calculus'] },
    { id: 'conic-sections', title: 'Conic Sections Explorer', description: 'Interactive visualization of circles, ellipses, parabolas, and hyperbolas with adjustable parameters', subject: 'math', difficulty: 'intermediate', tags: ['conics', 'geometry', 'algebra'] },
  ];

  private readonly physicsTopics: TopicSuggestion[] = [
    { id: 'pendulum', title: 'Simple Harmonic Motion', description: 'Simulate a pendulum with adjustable length, gravity, and damping — measure period and energy', subject: 'physics', difficulty: 'beginner', tags: ['mechanics', 'oscillations', 'energy'] },
    { id: 'projectile', title: 'Projectile Motion Simulator', description: 'Launch projectiles with custom angle, velocity, and mass — trace parabolic trajectories in real-time', subject: 'physics', difficulty: 'beginner', tags: ['kinematics', 'gravity', 'trajectory'] },
    { id: 'double-pendulum', title: 'Double Pendulum Chaos', description: 'Experience deterministic chaos with a double pendulum — highly sensitive to initial conditions', subject: 'physics', difficulty: 'advanced', tags: ['chaos', 'mechanics', 'nonlinear'] },
    { id: 'wave-interference', title: 'Wave Interference Pattern', description: 'Simulate constructive and destructive interference from two point sources with adjustable frequency', subject: 'physics', difficulty: 'intermediate', tags: ['waves', 'interference', 'optics'] },
    { id: 'electric-field', title: 'Electric Field Visualization', description: 'Visualize electric field lines and equipotential surfaces around point charges', subject: 'physics', difficulty: 'intermediate', tags: ['electromagnetism', 'fields', 'charges'] },
    { id: 'gravity-sim', title: 'N-Body Gravitational Simulation', description: 'Simulate gravitational attraction between multiple bodies with real-time orbit visualization', subject: 'physics', difficulty: 'advanced', tags: ['gravity', 'orbits', 'simulation'] },
    { id: 'doppler-effect', title: 'Doppler Effect & Wavefronts', description: 'See how relative motion between source and observer changes observed frequency in real-time', subject: 'physics', difficulty: 'intermediate', tags: ['waves', 'doppler', 'frequency'] },
    { id: 'gas-laws', title: 'Ideal Gas Law Simulator', description: 'Adjust pressure, volume, and temperature of a gas and watch particle behavior change', subject: 'physics', difficulty: 'beginner', tags: ['thermodynamics', 'gases', 'particles'] },
    { id: 'lens-optics', title: 'Lens Optics & Ray Diagrams', description: 'Trace light rays through convex and concave lenses with adjustable focal length', subject: 'physics', difficulty: 'intermediate', tags: ['optics', 'lenses', 'light'] },
    { id: 'standing-waves', title: 'Standing Waves on a String', description: 'Visualize harmonics and standing wave patterns on a string with adjustable tension and frequency', subject: 'physics', difficulty: 'beginner', tags: ['waves', 'harmonics', 'resonance'] },
    { id: 'quantum-well', title: 'Quantum Particle in a Box', description: 'Visualize wavefunctions and probability densities for a quantum particle in an infinite potential well', subject: 'physics', difficulty: 'advanced', tags: ['quantum', 'wavefunctions', 'probability'] },
    { id: 'magnetic-field', title: 'Magnetic Field of a Solenoid', description: 'See the magnetic field lines inside and around a solenoid with adjustable current and turns', subject: 'physics', difficulty: 'intermediate', tags: ['electromagnetism', 'magnetic', 'current'] },
  ];

  private readonly mathFallbackTopics = this.mathTopics;
  private readonly physicsFallbackTopics = this.physicsTopics;

  async suggestTopics(subject?: string, count = 6): Promise<TopicSuggestion[]> {
    let topics: TopicSuggestion[];
    if (subject === 'math') {
      topics = [...this.mathTopics];
    } else if (subject === 'physics') {
      topics = [...this.physicsTopics];
    } else {
      topics = [...this.mathTopics, ...this.physicsTopics];
    }

    // Shuffle with Fisher-Yates
    for (let i = topics.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topics[i], topics[j]] = [topics[j], topics[i]];
    }

    return topics.slice(0, count);
  }

  // ─── Related Visualizations ───────────────────────────────

  async getRelated(visualizationId: number, limit = 6) {
    const viz = await this.prisma.visualization.findUnique({ where: { id: visualizationId } });
    if (!viz) throw new NotFoundException('Visualization not found');

    const related = await this.prisma.visualization.findMany({
      where: {
        id: { not: visualizationId },
        status: 'published',
        subject: viz.subject,
      },
      take: limit,
      orderBy: [
        { likesCount: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        subject: true,
        description: true,
        featuredImage: true,
        viewCount: true,
        likesCount: true,
        version: true,
        createdAt: true,
        author: { select: { id: true, username: true, displayName: true } },
      },
    });

    if (related.length < limit) {
      const existingIds = [visualizationId, ...related.map(r => r.id)];
      const more = await this.prisma.visualization.findMany({
        where: {
          id: { notIn: existingIds },
          status: 'published',
        },
        take: limit - related.length,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          subject: true,
          description: true,
          featuredImage: true,
          viewCount: true,
          likesCount: true,
          version: true,
          createdAt: true,
          author: { select: { id: true, username: true, displayName: true } },
        },
      });
      related.push(...more);
    }

    return related;
  }

  // ─── Difficulty (Feature 4) ────────────────────────────────────

  async generateDifficulty(id: number, levels: string[], authorId: number, language?: string) {
    const viz = await this.findOne(id);
    if (viz.authorId !== authorId) throw new BadRequestException('Only the author can generate difficulty variants');

    const results: Record<string, number> = {};
    const levelDescriptions: Record<string, string> = {
      beginner: 'Create a beginner-friendly version with simplified explanations, basic terminology, and gentle pacing. Focus on intuition and everyday analogies.',
      intermediate: 'Create an intermediate version with standard terminology, balanced depth, and interactive exploration.',
      advanced: 'Create an advanced version with rigorous mathematical notation, deeper theoretical connections, and challenging interactive elements.',
    };

    for (const level of levels) {
      const levelPrompt = `${levelDescriptions[level] || ''}\n\nOriginal topic: ${viz.prompt || viz.title}\nSubject: ${viz.subject}`;
      const result = await this.ai.generate(levelPrompt, viz.subject, undefined, authorId, language);
      const variant = await this.prisma.visualization.create({
        data: {
          title: `${viz.title} (${level.charAt(0).toUpperCase() + level.slice(1)})`,
          subject: viz.subject,
          description: viz.description,
          htmlContent: result.code,
          prompt: levelPrompt,
          status: 'draft',
          authorId,
        },
      });
      await this.prisma.visualizationVersion.create({
        data: { visualizationId: variant.id, htmlContent: result.code, prompt: levelPrompt, version: 1, changeNote: `Difficulty variant: ${level}` },
      });
      results[level] = variant.id;
    }

    await this.prisma.visualization.update({
      where: { id },
      data: { difficultyLevels: JSON.stringify(results), isDifficultyRoot: true },
    });

    return results;
  }

  async getDifficulty(id: number) {
    const viz = await this.findOne(id);
    let levels: Record<string, number> = {};
    try { levels = JSON.parse(viz.difficultyLevels || '{}'); } catch {}

    if (Object.keys(levels).length === 0) return null;

    const ids = Object.values(levels);
    const variants = await this.prisma.visualization.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, htmlContent: true, description: true, introduction: true, detailedExplanation: true, knowledgeSummary: true },
    });

    const result: Record<string, any> = {};
    for (const [level, variantId] of Object.entries(levels)) {
      const v = variants.find((x) => x.id === variantId);
      if (v) result[level] = v;
    }
    return result;
  }

  // ─── Narration (Feature 3) ─────────────────────────────────────

  async generateNarration(id: number, authorId: number, locale?: string) {
    this.logger.debug(`generateNarration start: id=${id}, authorId=${authorId}, locale=${locale || 'en'}`);

    const viz = await this.findOne(id);
    if (viz.authorId !== authorId) throw new BadRequestException('Only the author can generate narration');

    const targetLocale = locale || 'en';
    const { segments, fullText } = await this.ai.generateNarrationScript(
      {
        title: viz.title,
        subject: viz.subject,
        description: viz.description,
        introduction: viz.introduction,
        detailedExplanation: viz.detailedExplanation,
        knowledgeSummary: viz.knowledgeSummary,
      },
      targetLocale,
      undefined,
      authorId,
    );

    this.logger.debug(`generateNarration script generated: segments=${segments.length}, fullTextLength=${fullText.length}`);
    this.logger.debug(`generateNarration first segment: ${segments[0]?.text?.slice(0, 120) ?? 'N/A'}`);

    let audioUrl = '';

    try {
      const audioBuffer = await this.grokTts.synthesize(fullText, targetLocale);

      const narrationsDir = path.join(process.cwd(), 'uploads', 'narrations');
      if (!fs.existsSync(narrationsDir)) {
        fs.mkdirSync(narrationsDir, { recursive: true });
      }
      const fileName = `${id}_${targetLocale}.mp3`;
      const filePath = path.join(narrationsDir, fileName);
      fs.writeFileSync(filePath, audioBuffer);
      audioUrl = `/uploads/narrations/${fileName}`;
      this.logger.log(`Narration audio generated via Grok TTS: ${audioUrl}`);
    } catch (err: any) {
      this.logger.warn(
        `Grok TTS failed for narration ${id}/${targetLocale}: ${err.message}`,
      );
    }

    const existing = await this.prisma.narrationScript.findUnique({
      where: { visualizationId_locale: { visualizationId: id, locale: targetLocale } },
    });

    const segmentsJson = JSON.stringify(segments);

    try {
      if (existing) {
        const result = await this.prisma.narrationScript.update({
          where: { id: existing.id },
          data: {
            segments: segmentsJson,
            fullText,
            audioUrl,
            version: existing.version + 1,
            generatedAt: new Date(),
          },
        });
        this.logger.log(`Narration updated: id=${result.id}, version=${result.version}`);
        return result;
      }

      const result = await this.prisma.narrationScript.create({
        data: {
          visualizationId: id,
          locale: targetLocale,
          title: viz.title,
          segments: segmentsJson,
          fullText,
          audioUrl,
        },
      });
      this.logger.log(`Narration created: id=${result.id}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Failed to save narration: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to save narration');
    }
  }

  async getNarration(id: number, locale?: string) {
    const targetLocale = locale || 'en';
    const script = await this.prisma.narrationScript.findUnique({
      where: { visualizationId_locale: { visualizationId: id, locale: targetLocale } },
    });
    if (!script) return null;
    return {
      ...script,
      segments: JSON.parse(script.segments || '[]'),
    };
  }

  // ─── AI Tutor (Feature 1) ──────────────────────────────────────

  async askTutor(id: number, body: { sessionId: string; interactionType: string; parameterName?: string; parameterValue?: string; question?: string; language?: string }) {
    const viz = await this.findOne(id);

    // Get recent history for context (last 5 interactions in this session)
    const history = await this.prisma.tutorInteraction.findMany({
      where: { visualizationId: id, sessionId: body.sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { parameterName: true, interactionType: true, aiResponse: true },
    });

    const parameterName = body.parameterName || '';
    const parameterValue = body.parameterValue || '';

    const aiResponse = await this.ai.generateTutorResponse(
      {
        title: viz.title,
        subject: viz.subject,
        description: viz.description,
        knowledgeSummary: viz.knowledgeSummary,
      },
      {
        interactionType: body.interactionType,
        parameterName,
        parameterValue,
      },
      history.reverse().map(h => ({
        parameterName: h.parameterName,
        interactionType: h.interactionType,
        aiResponse: h.aiResponse,
      })),
      undefined,
      undefined,
      body.language,
    );

    // Store the interaction
    const interaction = await this.prisma.tutorInteraction.create({
      data: {
        visualizationId: id,
        sessionId: body.sessionId,
        interactionType: body.interactionType,
        parameterName,
        parameterValue,
        aiResponse,
      },
    });

    return { aiResponse, interactionId: interaction.id };
  }

  async getTutorHistory(id: number, sessionId: string) {
    return this.prisma.tutorInteraction.findMany({
      where: { visualizationId: id, sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Article Mode (Feature 5) ─────────────────────────────────

  async generateArticleQuiz(id: number, authorId: number, language?: string) {
    const viz = await this.findOne(id);
    const quiz = await this.ai.generateQuiz(
      viz.prompt || viz.title,
      viz.subject,
      undefined,
      authorId,
      language,
    );
    await this.prisma.visualization.update({
      where: { id },
      data: { quiz: JSON.stringify(quiz), articleMode: true },
    });
    return { quiz };
  }

  async updateArticleConfig(id: number, body: { articleMode?: boolean; quiz?: string }, authorId: number) {
    const viz = await this.findOne(id);
    if (viz.authorId !== authorId) throw new BadRequestException('Only the author can update article config');
    const data: any = {};
    if (body.articleMode !== undefined) data.articleMode = body.articleMode;
    if (body.quiz !== undefined) data.quiz = body.quiz;
    return this.prisma.visualization.update({ where: { id }, data });
  }

  // ─── Batch Operations ────────────────────────────────────────

  async batchUpdateStatus(ids: number[], status: string, authorId: number) {
    await this.prisma.visualization.updateMany({
      where: { id: { in: ids }, authorId },
      data: { status },
    });
    return { updated: ids.length };
  }

  async batchDelete(ids: number[], authorId: number) {
    await this.prisma.visualization.deleteMany({
      where: { id: { in: ids }, authorId },
    });
    return { deleted: ids.length };
  }

  // ─── Visualization Comment Admin ─────────────────────────────

  async listVizComments(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.visualizationComment.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, displayName: true, role: true } },
          visualization: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.visualizationComment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateVizComment(id: number, body: { content?: string; status?: string }) {
    const comment = await this.prisma.visualizationComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.visualizationComment.update({ where: { id }, data: body });
  }

  async deleteVizComment(id: number) {
    const comment = await this.prisma.visualizationComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.prisma.visualizationComment.delete({ where: { id } });
    return { deleted: true };
  }

  async batchUpdateVizCommentStatus(ids: number[], status: string) {
    await this.prisma.visualizationComment.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return { updated: ids.length };
  }
}
