import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../common/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: PrismaService;

  const mockPrisma = {
    post: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    comment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboard', () => {
    it('should return dashboard stats', async () => {
      mockPrisma.post.count.mockResolvedValueOnce(100);
      mockPrisma.post.count.mockResolvedValueOnce(80);
      mockPrisma.post.count.mockResolvedValueOnce(20);
      mockPrisma.comment.count.mockResolvedValue(50);
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.post.aggregate.mockResolvedValueOnce({ _sum: { viewCount: 5000 } });
      mockPrisma.post.aggregate.mockResolvedValueOnce({ _sum: { viewCount: 300 } });
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 1, name: 'AI', color: '#6366f1', _count: { posts: 5 } },
        { id: 2, name: 'Web3', color: '#22c55e', _count: { posts: 3 } },
      ]);
      mockPrisma.post.findMany.mockResolvedValueOnce([
        { createdAt: new Date('2026-05-01'), status: 'published' },
        { createdAt: new Date('2026-05-01'), status: 'draft' },
        { createdAt: new Date('2026-05-02'), status: 'published' },
      ]);
      mockPrisma.post.findMany.mockResolvedValueOnce([
        { title: 'Top Post', viewCount: 500, slug: 'top-post', createdAt: new Date(), status: 'published' },
      ]);

      const result = await service.getDashboard();

      expect(result.overview.totalPosts).toBe(100);
      expect(result.overview.totalPublished).toBe(80);
      expect(result.overview.totalDrafts).toBe(20);
      expect(result.overview.totalComments).toBe(50);
      expect(result.overview.totalUsers).toBe(10);
      expect(result.overview.totalViews).toBe(5000);
      expect(result.overview.recent30DaysViews).toBe(300);
      expect(result.categoryDistribution).toHaveLength(2);
      expect(result.postsTimeline).toHaveLength(2);
      expect(result.topPosts).toHaveLength(1);
    });
  });

  describe('getPostStats', () => {
    it('should return post stats with comment timeline', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 1,
        title: 'Test Post',
        viewCount: 100,
        _count: { comments: 5 },
      });
      mockPrisma.comment.findMany.mockResolvedValue([
        { createdAt: new Date('2026-05-01'), status: 'approved' },
        { createdAt: new Date('2026-05-01'), status: 'approved' },
        { createdAt: new Date('2026-05-02'), status: 'pending' },
      ]);

      const result = await service.getPostStats(1);

      expect(result.id).toBe(1);
      expect(result.viewCount).toBe(100);
      expect(result.commentCount).toBe(5);
      expect(result.commentTimeline).toHaveLength(2);
    });

    it('should return null when post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      const result = await service.getPostStats(999);
      expect(result).toBeNull();
    });
  });
});
