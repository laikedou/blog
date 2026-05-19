import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { VisualizationAiService } from '../visualization/visualization-ai.service';

@Injectable()
export class ExperimentService {
  private readonly logger = new Logger(ExperimentService.name);

  constructor(
    private prisma: PrismaService,
    private ai: VisualizationAiService,
  ) {}

  async create(concept: string, subject: string, authorId: number, perspectiveCount = 3, language?: string) {
    // Generate perspectives via AI
    const perspectivePrompt = `Generate ${perspectiveCount} different perspectives to explain the ${subject} concept: "${concept}".
For each perspective, provide:
1. A short name (2-4 words)
2. A subtitle explaining the angle (one sentence)

Format as JSON:
[
  { "name": "...", "subtitle": "..." },
  ...
]`;

    const rawProvider = this.ai.getProvider();
    const raw = await rawProvider.generateText(perspectivePrompt, language);
    let perspectives: { name: string; subtitle: string }[] = [];
    try {
      perspectives = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || '[]');
    } catch {}

    if (perspectives.length === 0) {
      perspectives = Array.from({ length: perspectiveCount }, (_, i) => ({
        name: `Perspective ${i + 1}`,
        subtitle: `Another way to understand ${concept}`,
      }));
    }

    // Create the experiment group
    const group = await this.prisma.experimentGroup.create({
      data: {
        title: `Understanding ${concept}`,
        description: `Explore "${concept}" from ${perspectives.length} different angles`,
        concept,
      },
    });

    // Generate a visualization for each perspective
    for (let i = 0; i < perspectives.length; i++) {
      const p = perspectives[i];
      const prompt = `Explain the ${subject} concept "${concept}" from this perspective: ${p.name} — ${p.subtitle}`;
      const result = await this.ai.generate(prompt, subject, undefined, authorId, language);

      const viz = await this.prisma.visualization.create({
        data: {
          title: `${concept}: ${p.name}`,
          subject,
          description: p.subtitle,
          htmlContent: result.code,
          prompt,
          status: 'draft',
          authorId,
        },
      });

      await this.prisma.visualizationVersion.create({
        data: { visualizationId: viz.id, htmlContent: result.code, prompt, version: 1, changeNote: `Experiment perspective: ${p.name}` },
      });

      await this.prisma.experimentPerspective.create({
        data: { groupId: group.id, visualizationId: viz.id, perspectiveName: p.name, subtitle: p.subtitle, sortOrder: i },
      });
    }

    return this.findOne(group.id);
  }

  async findAll() {
    return this.prisma.experimentGroup.findMany({
      include: {
        perspectives: {
          include: { visualization: { select: { id: true, title: true, featuredImage: true, viewCount: true, likesCount: true, subject: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.experimentGroup.findUnique({
      where: { id },
      include: {
        perspectives: {
          include: { visualization: { select: { id: true, title: true, htmlContent: true, description: true, introduction: true, detailedExplanation: true, knowledgeSummary: true, subject: true, featuredImage: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('Experiment group not found');
    return group;
  }

  async remove(id: number) {
    const group = await this.prisma.experimentGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Experiment group not found');
    await this.prisma.experimentGroup.delete({ where: { id } });
    return { deleted: true };
  }
}
