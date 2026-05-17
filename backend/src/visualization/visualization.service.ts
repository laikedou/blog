import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
  TopicSuggestion,
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
}
