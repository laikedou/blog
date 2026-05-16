import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { QueryLogsDto } from './dto/query-logs.dto';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    method: string;
    url: string;
    statusCode: number;
    message: string;
    stack?: string;
    body?: string;
    userId?: number;
  }) {
    return this.prisma.errorLog.create({
      data: {
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        message: data.message.slice(0, 500),
        stack: (data.stack || '').slice(0, 2000),
        body: (data.body || '').slice(0, 1000),
        userId: data.userId,
      },
    });
  }

  async findAll(query: QueryLogsDto) {
    const { page = 1, limit = 20, method, statusCode, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (method) where.method = method;
    if (statusCode) where.statusCode = statusCode;
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { url: { contains: search } },
        { stack: { contains: search } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.errorLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.errorLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalErrors,
      todayErrors,
      last7Days,
      statusCodeDistribution,
      topEndpoints,
      timeline,
    ] = await Promise.all([
      this.prisma.errorLog.count(),
      this.prisma.errorLog.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.errorLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.errorLog.groupBy({
        by: ['statusCode'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.errorLog.groupBy({
        by: ['url', 'method'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.getTimeline(thirtyDaysAgo),
    ]);

    // 5xx vs 4xx breakdown
    let serverErrors = 0;
    let clientErrors = 0;
    for (const item of statusCodeDistribution) {
      if (item.statusCode >= 500) serverErrors += item._count.id;
      else clientErrors += item._count.id;
    }

    return {
      overview: {
        total: totalErrors,
        today: todayErrors,
        last7Days,
        serverErrors,
        clientErrors,
      },
      statusCodeDistribution: statusCodeDistribution.map(s => ({
        statusCode: s.statusCode,
        count: s._count.id,
      })),
      topEndpoints: topEndpoints.map(e => ({
        url: e.url,
        method: e.method,
        count: e._count.id,
      })),
      timeline,
    };
  }

  private async getTimeline(since: Date) {
    const logs = await this.prisma.errorLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, statusCode: true },
      orderBy: { createdAt: 'asc' },
    });

    const timelineMap: Record<string, { date: string; errors: number; serverErrors: number; clientErrors: number }> = {};
    for (const log of logs) {
      const day = log.createdAt.toISOString().split('T')[0];
      if (!timelineMap[day]) {
        timelineMap[day] = { date: day, errors: 0, serverErrors: 0, clientErrors: 0 };
      }
      timelineMap[day].errors++;
      if (log.statusCode >= 500) timelineMap[day].serverErrors++;
      else timelineMap[day].clientErrors++;
    }

    return Object.values(timelineMap);
  }

  async clearAll() {
    await this.prisma.errorLog.deleteMany();
    return { message: 'All logs cleared' };
  }

  async findOne(id: number) {
    const log = await this.prisma.errorLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException(`Error log #${id} not found`);
    return log;
  }
}
