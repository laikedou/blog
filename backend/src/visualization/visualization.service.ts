import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { VisualizationAiService } from './visualization-ai.service';
import {
  CreateVisualizationDto,
  UpdateVisualizationDto,
  GenerateVisualizationDto,
  RefineVisualizationDto,
  FixErrorDto,
  QueryVisualizationDto,
} from './dto/visualization.dto';

@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

  constructor(
    private prisma: PrismaService,
    private ai: VisualizationAiService,
    private cloudflareAi: CloudflareAiService,
  ) {}

  async generate(dto: GenerateVisualizationDto, authorId: number) {
    const result = await this.ai.generate(dto.prompt, dto.subject, dto.provider);
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

  async generateMetadata(id: number, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const metadata = await this.ai.generateMetadata(viz.prompt, viz.subject);
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

  async refine(dto: RefineVisualizationDto, authorId: number) {
    const viz = await this.prisma.visualization.findFirst({
      where: { id: dto.visualizationId, authorId },
    });
    if (!viz) throw new NotFoundException('Visualization not found');

    const result = await this.ai.refine(viz.htmlContent, dto.feedback);

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
    const result = await this.ai.fixError(viz.htmlContent, dto.error);

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

    const [data, total] = await Promise.all([
      this.prisma.visualization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
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

    const comment = await this.prisma.visualizationComment.create({
      data: { content, visualizationId, authorId: userId, parentId },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    return comment;
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.visualizationComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new NotFoundException('Comment not found');

    await this.prisma.visualizationComment.delete({ where: { id: commentId } });
    return { deleted: true };
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
}
