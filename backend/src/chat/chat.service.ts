import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LogMessageDto, SubmitFeedbackDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async logMessage(dto: LogMessageDto) {
    return this.prisma.chatMessage.create({ data: dto });
  }

  async logMessages(sessionId: string, messages: { role: string; content: string }[]) {
    const data = messages.map(m => ({
      sessionId,
      role: m.role,
      content: m.content.substring(0, 2000), // limit content length
    }));
    await this.prisma.chatMessage.createMany({ data });
  }

  async submitFeedback(dto: SubmitFeedbackDto) {
    return this.prisma.feedback.create({ data: dto as any });
  }

  async getFeedback(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markFeedbackRead(id: number) {
    return this.prisma.feedback.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async getStats() {
    const [totalSessions, totalMessages, totalFeedback, recentMessages] = await Promise.all([
      this.prisma.chatMessage.groupBy({
        by: ['sessionId'],
      }).then(groups => groups.length),
      this.prisma.chatMessage.count(),
      this.prisma.feedback.count(),
      this.prisma.chatMessage.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Get frequently asked questions - common user messages
    const userMessages = await this.prisma.chatMessage.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Count message frequency by grouping similar content
    const frequencyMap = new Map<string, number>();
    for (const msg of userMessages) {
      const key = msg.content.toLowerCase().trim().substring(0, 100);
      frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
    }

    const frequentQueries = Array.from(frequencyMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalSessions,
      totalMessages,
      totalFeedback,
      recentMessages,
      frequentQueries,
    };
  }

  async searchPosts(query: string, limit: number = 5) {
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { excerpt: { contains: query } },
        ],
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });

    return posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt?.substring(0, 200) || '',
      category: p.category?.name || '',
      tags: p.tags.map(t => t.tag.name),
      url: `/posts/${p.slug}`,
    }));
  }
}
