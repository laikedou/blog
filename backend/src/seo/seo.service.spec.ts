import { Test, TestingModule } from '@nestjs/testing';
import { SeoService } from './seo.service';
import { PrismaService } from '../common/prisma.service';

describe('SeoService', () => {
  let service: SeoService;
  let prisma: PrismaService;

  const mockPrisma = {
    seoAudit: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    seoKeyword: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    seoKeywordRanking: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    seoClick: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    seoIndexStatus: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SeoService>(SeoService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('auditPost', () => {
    it('should calculate SEO score for a post', async () => {
      const mockPost = {
        id: 1,
        title: 'The Future of Artificial Intelligence in 2025',
        slug: 'future-of-ai-2025',
        content: '<p>Artificial intelligence is transforming every industry. AI technology continues to evolve rapidly.</p>'.repeat(20),
        excerpt: 'A comprehensive look at how artificial intelligence is shaping the future of technology.',
        featuredImage: 'https://example.com/image.jpg',
        seoTitle: 'Future of AI 2025 | A Complete Guide',
        seoDescription: 'Explore how artificial intelligence is transforming industries in 2025. A complete guide to AI trends.',
        status: 'published',
        tags: [{ id: 1, name: 'AI' }, { id: 2, name: 'Technology' }],
        category: { id: 1, name: 'AI', slug: 'ai' },
        viewCount: 100,
        publishedAt: new Date(),
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.seoAudit.create.mockResolvedValue({ id: 1, ...mockPost });

      const result = await service.auditPost(1);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.checks).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(mockPrisma.seoAudit.create).toHaveBeenCalled();
    });

    it('should throw error when post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.auditPost(999)).rejects.toThrow('Post not found');
    });
  });

  describe('getAllAudits', () => {
    it('should return paginated audits', async () => {
      mockPrisma.seoAudit.findMany.mockResolvedValue([
        { id: 1, score: 85, title: 'Post 1', createdAt: new Date() },
        { id: 2, score: 72, title: 'Post 2', createdAt: new Date() },
      ]);
      mockPrisma.seoAudit.count.mockResolvedValue(2);

      const result = await service.getAllAudits(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('addKeyword', () => {
    it('should create a keyword', async () => {
      const dto = { keyword: 'artificial intelligence', source: 'manual', volume: 100, difficulty: 30 };
      mockPrisma.seoKeyword.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.addKeyword(dto);

      expect(result.keyword).toBe('artificial intelligence');
      expect(result.volume).toBe(100);
      expect(mockPrisma.seoKeyword.create).toHaveBeenCalledWith({
        data: { keyword: 'artificial intelligence', source: 'manual', volume: 100, difficulty: 30 },
      });
    });
  });

  describe('listKeywords', () => {
    it('should return all keywords with rankings', async () => {
      const mockKeywords = [
        { id: 1, keyword: 'AI', source: 'manual', volume: 100, rankings: [{ position: 3, checkedAt: new Date() }] },
        { id: 2, keyword: 'Web3', source: 'manual', volume: 50, rankings: [] },
      ];
      mockPrisma.seoKeyword.findMany.mockResolvedValue(mockKeywords);

      const result = await service.listKeywords();

      expect(result).toHaveLength(2);
      expect(result[0].keyword).toBe('AI');
      expect(mockPrisma.seoKeyword.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { rankings: { orderBy: { checkedAt: 'desc' }, take: 5 } },
      });
    });
  });

  describe('deleteKeyword', () => {
    it('should delete a keyword', async () => {
      mockPrisma.seoKeyword.delete.mockResolvedValue({ id: 1 });

      const result = await service.deleteKeyword(1);

      expect(result.message).toBe('Keyword deleted');
      expect(mockPrisma.seoKeyword.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('recordClick', () => {
    it('should record a click event', async () => {
      const dto = { pageUrl: '/posts/test', source: 'google', clicks: 10, impressions: 100, ctr: 0.1, avgPosition: 3.5 };
      mockPrisma.seoClick.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.recordClick(dto);

      expect(result.id).toBe(1);
      expect(mockPrisma.seoClick.create).toHaveBeenCalledWith({
        data: { postId: null, pageUrl: '/posts/test', source: 'google', clicks: 10, impressions: 100, ctr: 0.1, avgPosition: 3.5 },
      });
    });
  });

  describe('getDashboard', () => {
    it('should return aggregated dashboard data', async () => {
      mockPrisma.seoAudit.findMany.mockResolvedValue([
        { id: 1, score: 80, title: 'Post 1', pageUrl: '/post1', createdAt: new Date() },
        { id: 2, score: 60, title: 'Post 2', pageUrl: '/post2', createdAt: new Date() },
      ]);
      mockPrisma.seoAudit.count.mockResolvedValue(2);
      mockPrisma.seoKeyword.count.mockResolvedValue(5);
      mockPrisma.seoIndexStatus.findMany.mockResolvedValue([
        { googleIndexed: true, baiduIndexed: false },
        { googleIndexed: true, baiduIndexed: true },
      ]);
      mockPrisma.seoClick.findMany.mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.overview.avgScore).toBe(70);
      expect(result.overview.keywordCount).toBe(5);
      expect(result.overview.googleIndexed).toBe(2);
      expect(result.overview.baiduIndexed).toBe(1);
      expect(result.overview.totalAudits).toBe(2);
      expect(result.recentAudits).toHaveLength(2);
    });
  });

  describe('calculateReadability', () => {
    it('should return 0 for empty or short text', () => {
      const result = (service as any).calculateReadability('');
      expect(result).toBe(0);
    });

    it('should calculate a positive readability score', () => {
      const text = 'This is a simple sentence. Here is another one. The text is easy to read.';
      const result = (service as any).calculateReadability(text);
      expect(result).toBeGreaterThan(0);
    });
  });
});
