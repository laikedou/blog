import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { QueryAiUsageDto } from './dto/query-ai-usage.dto';

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: {
    provider: string;
    model: string;
    feature: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    status: string;
    errorMessage?: string;
    userId?: number;
  }) {
    try {
      return await this.prisma.aiUsageLog.create({ data });
    } catch (e) {
      this.logger.error('Failed to log AI usage', e instanceof Error ? e.message : e);
    }
  }

  async findAll(query: QueryAiUsageDto) {
    const { page = 1, limit = 20, provider, model, feature, status, startDate, endDate } = query;
    const where: any = {};
    if (provider) where.provider = provider;
    if (model) where.model = { contains: model };
    if (feature) where.feature = { contains: feature };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.aiUsageLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.aiUsageLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [aggregate, todayCount, todayTokens, providerBreakdown] = await Promise.all([
      this.prisma.aiUsageLog.aggregate({
        _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
        _count: { id: true },
      }),
      this.prisma.aiUsageLog.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.aiUsageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { totalTokens: true },
      }),
      this.prisma.aiUsageLog.groupBy({
        by: ['provider'],
        _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return {
      summary: {
        totalCalls: aggregate._count.id,
        totalTokens: aggregate._sum.totalTokens ?? 0,
        totalPromptTokens: aggregate._sum.promptTokens ?? 0,
        totalCompletionTokens: aggregate._sum.completionTokens ?? 0,
        todayCalls: todayCount,
        todayTokens: todayTokens._sum.totalTokens ?? 0,
      },
      byProvider: providerBreakdown.map((p) => ({
        provider: p.provider,
        calls: p._count.id,
        promptTokens: p._sum.promptTokens ?? 0,
        completionTokens: p._sum.completionTokens ?? 0,
        totalTokens: p._sum.totalTokens ?? 0,
      })),
    };
  }
}
