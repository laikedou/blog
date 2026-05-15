import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPosts,
      totalPublished,
      totalDrafts,
      totalComments,
      totalUsers,
      totalViews,
      recentViews,
      postsByCategory,
      postsPerDay,
      recentPosts,
    ] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: 'published' } }),
      this.prisma.post.count({ where: { status: 'draft' } }),
      this.prisma.comment.count(),
      this.prisma.user.count(),
      this.prisma.post.aggregate({ _sum: { viewCount: true } }),
      this.prisma.post.aggregate({
        _sum: { viewCount: true },
        where: { updatedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.category.findMany({
        include: { _count: { select: { posts: true } } },
      }),
      this.prisma.post.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.post.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        select: { title: true, viewCount: true, slug: true, createdAt: true, status: true },
      }),
    ]);

    // Posts per day for chart
    const postsTimeline: Record<string, { published: number; draft: number }> = {};
    for (const post of postsPerDay) {
      const day = post.createdAt.toISOString().split('T')[0];
      if (!postsTimeline[day]) postsTimeline[day] = { published: 0, draft: 0 };
      postsTimeline[day][post.status as 'published' | 'draft']++;
    }

    // Category distribution
    const categoryDistribution = postsByCategory.map(c => ({
      name: c.name,
      color: c.color,
      count: c._count.posts,
    }));

    return {
      overview: {
        totalPosts,
        totalPublished,
        totalDrafts,
        totalComments,
        totalUsers,
        totalViews: totalViews._sum.viewCount || 0,
        recent30DaysViews: recentViews._sum.viewCount || 0,
      },
      postsTimeline: Object.entries(postsTimeline).map(([date, counts]) => ({
        date,
        ...counts,
      })),
      categoryDistribution,
      topPosts: recentPosts,
    };
  }

  async getPostStats(postId: number) {
    const [post, comments] = await Promise.all([
      this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, status: true },
      }),
    ]);

    if (!post) return null;

    const commentTimeline: Record<string, number> = {};
    for (const c of comments) {
      const day = c.createdAt.toISOString().split('T')[0];
      commentTimeline[day] = (commentTimeline[day] || 0) + 1;
    }

    return {
      id: post.id,
      title: post.title,
      viewCount: post.viewCount,
      commentCount: post._count.comments,
      commentTimeline: Object.entries(commentTimeline).map(([date, count]) => ({ date, count })),
    };
  }
}
