import { Test, TestingModule } from '@nestjs/testing';
import { CrawlService } from './crawl.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { NotificationsGateway } from '../common/notifications.gateway';

describe('CrawlService', () => {
  let service: CrawlService;
  let prisma: any;

  const mockDate = new Date('2025-01-01T00:00:00Z');

  const mockPrisma = {
    crawlSource: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({ id: 1 }),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    crawledArticle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tag: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    post: {
      create: jest.fn(),
    },
  };

  const mockAiService = {
    analyzeListingPage: jest.fn().mockResolvedValue({
      totalArticles: 0,
      currentPage: 1,
      totalPages: 1,
      paginationPattern: null,
    }),
    rewriteArticle: jest.fn().mockImplementation((dto) => ({
      title: dto.title,
      content: dto.content,
      excerpt: dto.excerpt,
    })),
    enhanceContent: jest.fn().mockResolvedValue({ enhancedContent: '<p>Enhanced content</p>' }),
    generateSeo: jest.fn().mockResolvedValue({
      seoTitle: 'SEO Title',
      seoDescription: 'SEO description',
      slug: 'test-article',
    }),
    suggestTags: jest.fn().mockResolvedValue({
      tags: ['tech', 'ai'],
      category: 'Technology',
    }),
  };

  const mockCloudflareAi = {
    transformImage: jest.fn().mockResolvedValue('/uploads/transformed-image.jpg'),
    transformImagesInContent: jest.fn().mockResolvedValue('<p>Content with transformed images</p>'),
    buildCoverPrompt: jest.fn().mockReturnValue('Cover prompt'),
    generateCover: jest.fn().mockResolvedValue('/uploads/cover.jpg'),
  };

  const mockNotificationsGateway = {
    notifyCrawlStarted: jest.fn(),
    notifyArticleCrawled: jest.fn(),
    notifyCrawlComplete: jest.fn(),
    notifyLog: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: CloudflareAiService, useValue: mockCloudflareAi },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<CrawlService>(CrawlService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // ---- Sources CRUD ----

  describe('getSources', () => {
    it('should return all sources with article count', async () => {
      mockPrisma.crawlSource.findMany.mockResolvedValue([
        { id: 1, name: 'Tech Blog', url: 'https://example.com', _count: { articles: 3 } },
      ]);

      const result = await service.getSources();

      expect(result).toHaveLength(1);
      expect(mockPrisma.crawlSource.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { articles: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createSource', () => {
    it('should create a crawl source', async () => {
      const dto = { name: 'New Source', url: 'https://example.com', interval: 60 };
      mockPrisma.crawlSource.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.createSource(dto);

      expect(mockPrisma.crawlSource.create).toHaveBeenCalledWith({ data: dto });
      expect(result.id).toBe(1);
    });
  });

  describe('deleteSource', () => {
    it('should delete a source by id', async () => {
      mockPrisma.crawlSource.delete.mockResolvedValue({ id: 1 });
      const result = await service.deleteSource(1);
      expect(result.id).toBe(1);
      expect(mockPrisma.crawlSource.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ---- Articles (paginated) ----

  describe('getArticles (pagination)', () => {
    it('should return paginated articles with default page=1, limit=10', async () => {
      const articles = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `Article ${i + 1}` }));
      mockPrisma.crawledArticle.findMany.mockResolvedValue(articles);
      mockPrisma.crawledArticle.count.mockResolvedValue(25);

      const result = await service.getArticles();

      expect(result).toEqual({
        data: articles,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
      expect(mockPrisma.crawledArticle.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { source: { select: { name: true, url: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrisma.crawledArticle.count).toHaveBeenCalled();
    });

    it('should respect custom page and limit parameters', async () => {
      const articles = [{ id: 11, title: 'Article 11' }];
      mockPrisma.crawledArticle.findMany.mockResolvedValue(articles);
      mockPrisma.crawledArticle.count.mockResolvedValue(25);

      const result = await service.getArticles(3, 5);

      expect(result).toEqual({
        data: articles,
        total: 25,
        page: 3,
        limit: 5,
        totalPages: 5,
      });
      expect(mockPrisma.crawledArticle.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        include: { source: { select: { name: true, url: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty results (totalPages = 0)', async () => {
      mockPrisma.crawledArticle.findMany.mockResolvedValue([]);
      mockPrisma.crawledArticle.count.mockResolvedValue(0);

      const result = await service.getArticles(1, 10);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    });

    it('should handle exact page boundary (total exactly equals limit)', async () => {
      const articles = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      mockPrisma.crawledArticle.findMany.mockResolvedValue(articles);
      mockPrisma.crawledArticle.count.mockResolvedValue(10);

      const result = await service.getArticles(1, 10);

      expect(result).toEqual({ data: articles, total: 10, page: 1, limit: 10, totalPages: 1 });
    });
  });

  describe('getArticle', () => {
    it('should return a single article with source info', async () => {
      const article = { id: 1, title: 'Test', source: { name: 'Src', url: 'https://example.com' } };
      mockPrisma.crawledArticle.findUniqueOrThrow.mockResolvedValue(article);

      const result = await service.getArticle(1);

      expect(result).toEqual(article);
      expect(mockPrisma.crawledArticle.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { source: { select: { name: true, url: true } } },
      });
    });
  });

  describe('deleteArticle', () => {
    it('should delete an article by id', async () => {
      mockPrisma.crawledArticle.delete.mockResolvedValue({ id: 1 });
      const result = await service.deleteArticle(1);
      expect(result.id).toBe(1);
      expect(mockPrisma.crawledArticle.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ---- Crawl Source (upsert behavior - Bug 1 fix) ----

  describe('crawlSource (upsert)', () => {
    const source = { id: 1, name: 'Test Blog', url: 'https://example.com/blog', interval: 60, status: 'active' };
    const articleData = {
      title: 'Test Article',
      content: '<p>Content</p>',
      excerpt: 'Test excerpt',
      author: 'John',
      pubDate: '2025-01-01',
      imageUrl: 'https://example.com/img.jpg',
    };

    beforeEach(() => {
      mockPrisma.crawlSource.findUniqueOrThrow.mockResolvedValue(source);
      mockPrisma.crawlSource.update.mockResolvedValue(source);
      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Test</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls').mockReturnValue([
        'https://example.com/blog/article-1',
        'https://example.com/blog/article-2',
      ]);
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue(articleData);
      jest.spyOn(service as any, 'downloadImage').mockResolvedValue('/uploads/crawl/img.jpg');

      // Default mocks for autoPublishAsDraft dependency chain
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 99, name: 'Category', slug: 'category' } as any);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 99, name: 'Tag', slug: 'tag' } as any);
      mockPrisma.post.create.mockResolvedValue({ id: 100, title: 'Draft', slug: 'draft', status: 'draft' } as any);
    });

    it('should CREATE new articles when they do not exist in the database', async () => {
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });

      const result = await service.crawlSource(1);

      expect(result).toEqual({ discovered: 2, new: 2, skipped: 0, errors: 0, autoPublished: 2 });
      expect(mockPrisma.crawledArticle.create).toHaveBeenCalledTimes(2);
      // autoPublishAsDraft calls update to mark each article as published
      expect(mockPrisma.crawledArticle.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.post.create).toHaveBeenCalledTimes(2);
    });

    it('should UPDATE existing articles instead of skipping them (Bug 1 fix)', async () => {
      // First URL has an existing article; second is new
      mockPrisma.crawledArticle.findUnique
        .mockResolvedValueOnce({ id: 10, sourceUrl: 'https://example.com/blog/article-1' })
        .mockResolvedValueOnce(null);

      mockPrisma.crawledArticle.update.mockResolvedValue({ id: 10 });
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 11 });

      const result = await service.crawlSource(1);

      expect(result).toEqual({ discovered: 2, new: 1, skipped: 1, errors: 0, autoPublished: 2 });

      // Should UPDATE the existing article with fresh crawled data
      // (imageUrl stays as downloaded local path — Cloudflare transform skipped for local files)
      // (content goes through transformImagesInContent)
      expect(mockPrisma.crawledArticle.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          title: 'Test Article',
          content: '<p>Content with transformed images</p>',
          excerpt: 'Test excerpt',
          authorName: 'John',
          publishedDate: new Date('2025-01-01'),
          imageUrl: '/uploads/crawl/img.jpg',
          isProcessed: false,
        },
      });

      // Should CREATE the new article (content goes through Cloudflare AI transforms,
      // but imageUrl stays as downloaded local path since Cloudflare transform is skipped for local files)
      expect(mockPrisma.crawledArticle.create).toHaveBeenCalledWith({
        data: {
          sourceId: 1,
          sourceUrl: 'https://example.com/blog/article-2',
          title: 'Test Article',
          content: '<p>Content with transformed images</p>',
          excerpt: 'Test excerpt',
          authorName: 'John',
          publishedDate: new Date('2025-01-01'),
          imageUrl: '/uploads/crawl/img.jpg',
        },
      });
    });

    it('should set isProcessed=false on update so articles can be re-published', async () => {
      mockPrisma.crawledArticle.findUnique.mockResolvedValue({ id: 10, sourceUrl: 'https://example.com/blog/article-1' });
      mockPrisma.crawledArticle.update.mockResolvedValue({ id: 10 });

      await service.crawlSource(1);

      expect(mockPrisma.crawledArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isProcessed: false }),
        }),
      );
    });

    it('should update lastRunAt on the source after crawling completes', async () => {
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });

      await service.crawlSource(1);

      expect(mockPrisma.crawlSource.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastRunAt: expect.any(Date) },
      });
    });

    it('should count errors when article extraction returns null', async () => {
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue(null);

      const result = await service.crawlSource(1);

      expect(result).toEqual({ discovered: 2, new: 0, skipped: 0, errors: 2, autoPublished: 0 });
    });
  });

  // ---- Multi-Page Crawling ----

  describe('crawlSource (multi-page)', () => {
    const source = { id: 1, name: 'Paginated Blog', url: 'https://example.com/blog', interval: 60, status: 'active' };

    beforeEach(() => {
      mockPrisma.crawlSource.findUniqueOrThrow.mockResolvedValue(source);
      mockPrisma.crawlSource.update.mockResolvedValue(source);
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue({
        title: 'Article', content: '<p>Content</p>', excerpt: 'Excerpt',
        author: 'John', pubDate: '2025-01-01', imageUrl: 'https://example.com/img.jpg',
      });
      jest.spyOn(service as any, 'downloadImage').mockResolvedValue('/uploads/crawl/img.jpg');

      // Auto-publish mocks
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 99, name: 'Category', slug: 'category' } as any);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 99, name: 'Tag', slug: 'tag' } as any);
      mockPrisma.post.create.mockResolvedValue({ id: 100, title: 'Draft', slug: 'draft', status: 'draft' } as any);
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });
    });

    it('should crawl multiple pages when AI detects pagination', async () => {
      mockAiService.analyzeListingPage.mockResolvedValue({
        totalArticles: 30,
        currentPage: 1,
        totalPages: 3,
        paginationPattern: 'https://example.com/blog/page/{page}',
      });

      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Test</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls')
        .mockReturnValueOnce(['https://example.com/article/1', 'https://example.com/article/2']) // page 1
        .mockReturnValueOnce(['https://example.com/article/3', 'https://example.com/article/4']) // page 2
        .mockReturnValueOnce(['https://example.com/article/5']); // page 3

      const result = await service.crawlSource(1);

      expect(result.discovered).toBe(5);
      expect(mockAiService.analyzeListingPage).toHaveBeenCalledTimes(1);
      // fetchPage called once for listing page + once per additional page
      expect(service['fetchPage']).toHaveBeenCalledTimes(3);
    });

    it('should only crawl first page when totalPages is 1', async () => {
      mockAiService.analyzeListingPage.mockResolvedValue({
        totalArticles: 10,
        currentPage: 1,
        totalPages: 1,
        paginationPattern: null,
      });

      const fetchSpy = jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Test</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls').mockReturnValue(['https://example.com/article/1']);

      await service.crawlSource(1);

      // Only the first listing page fetch
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate URLs across pages', async () => {
      mockAiService.analyzeListingPage.mockResolvedValue({
        totalArticles: 20,
        currentPage: 1,
        totalPages: 2,
        paginationPattern: 'https://example.com/blog/page/{page}',
      });

      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Test</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls')
        .mockReturnValueOnce(['https://example.com/article/1', 'https://example.com/article/2']) // page 1
        .mockReturnValueOnce(['https://example.com/article/1', 'https://example.com/article/3']); // page 2 (article 1 is duplicate)

      const result = await service.crawlSource(1);

      // article/1 should only be counted once
      expect(result.discovered).toBe(3);
    });
  });

  // ---- AI Rewrite ----

  describe('crawlSource (AI rewrite)', () => {
    const source = { id: 1, name: 'Test Blog', url: 'https://example.com/blog', interval: 60, status: 'active' };

    beforeEach(() => {
      mockPrisma.crawlSource.findUniqueOrThrow.mockResolvedValue(source);
      mockPrisma.crawlSource.update.mockResolvedValue(source);
      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Test</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls').mockReturnValue(['https://example.com/blog/article-1']);
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue({
        title: 'Original Title', content: '<p>Original content</p>',
        excerpt: 'Original excerpt.', author: 'John', pubDate: '2025-01-01',
        imageUrl: 'https://example.com/img.jpg',
      });
      jest.spyOn(service as any, 'downloadImage').mockResolvedValue('/uploads/crawl/img.jpg');
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });

      // Auto-publish mocks
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 99, name: 'Category', slug: 'category' } as any);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 99, name: 'Tag', slug: 'tag' } as any);
      mockPrisma.post.create.mockResolvedValue({ id: 100, title: 'Draft', slug: 'draft', status: 'draft' } as any);
    });

    it('should pass original content to AI and save rewritten title', async () => {
      mockAiService.rewriteArticle.mockResolvedValue({
        title: 'Rewritten AI Title',
        content: '<p>Rewritten AI content with better quality</p>',
        excerpt: 'Rewritten excerpt by AI.',
      });

      await service.crawlSource(1);

      expect(mockAiService.rewriteArticle).toHaveBeenCalledWith({
        title: 'Original Title',
        content: '<p>Original content</p>',
        excerpt: 'Original excerpt.',
        sourceName: 'Test Blog',
      });

      // Title comes from AI rewrite (not transformed further)
      expect(mockPrisma.crawledArticle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Rewritten AI Title',
          }),
        }),
      );
    });

    it('should preserve original content when AI rewrite returns unchanged', async () => {
      mockAiService.rewriteArticle.mockImplementation((dto) => ({
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
      }));

      await service.crawlSource(1);

      expect(mockPrisma.crawledArticle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Original Title',
          }),
        }),
      );
    });
  });

  // ---- Auto-Publish ----

  describe('crawlSource (auto-publish)', () => {
    const source = { id: 1, name: 'Test Blog', url: 'https://example.com/blog', interval: 60, status: 'active' };

    beforeEach(() => {
      mockPrisma.crawlSource.findUniqueOrThrow.mockResolvedValue(source);
      mockPrisma.crawlSource.update.mockResolvedValue(source);
      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Test</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls').mockReturnValue(['https://example.com/blog/article-1']);
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue({
        title: 'Test', content: '<p>Test</p>', excerpt: 'Test.',
        author: 'John', pubDate: '2025-01-01', imageUrl: 'https://example.com/img.jpg',
      });
      jest.spyOn(service as any, 'downloadImage').mockResolvedValue('/uploads/crawl/img.jpg');
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });
    });

    it('should create draft post for new articles', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 99, name: 'Category', slug: 'category' } as any);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 99, name: 'Tag', slug: 'tag' } as any);
      mockPrisma.post.create.mockResolvedValue({ id: 100, title: 'Draft', slug: 'draft', status: 'draft' } as any);

      await service.crawlSource(1);

      expect(mockAiService.generateSeo).toHaveBeenCalled();
      expect(mockAiService.suggestTags).toHaveBeenCalled();
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'draft',
            aiGenerated: true,
            aiPrompt: expect.stringContaining('Crawled from'),
          }),
        }),
      );
      expect(mockPrisma.crawledArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ isPublished: true, isProcessed: true }),
        }),
      );
    });

    it('should NOT create draft post for already-published articles', async () => {
      mockPrisma.crawledArticle.findUnique.mockResolvedValue({ id: 1, sourceUrl: 'https://example.com/blog/article-1', isPublished: true });
      mockPrisma.crawledArticle.update.mockResolvedValue({ id: 1 });

      await service.crawlSource(1);

      // post.create should NOT be called because the article is already published
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it('should include autoPublished count in results', async () => {
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 99, name: 'Category', slug: 'category' } as any);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 99, name: 'Tag', slug: 'tag' } as any);
      mockPrisma.post.create.mockResolvedValue({ id: 100, title: 'Draft', slug: 'draft', status: 'draft' } as any);

      const result = await service.crawlSource(1);

      expect(result.autoPublished).toBe(1);
    });
  });

  // ---- AI Analysis Fallback ----

  describe('crawlSource (AI analysis fallback)', () => {
    const source = { id: 1, name: 'Test Blog', url: 'https://example.com/blog', interval: 60, status: 'active' };

    beforeEach(() => {
      mockPrisma.crawlSource.findUniqueOrThrow.mockResolvedValue(source);
      mockPrisma.crawlSource.update.mockResolvedValue(source);
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue({
        title: 'Test', content: '<p>Test</p>', excerpt: 'Test.',
        author: 'John', pubDate: '2025-01-01', imageUrl: 'https://example.com/img.jpg',
      });
      jest.spyOn(service as any, 'downloadImage').mockResolvedValue('/uploads/crawl/img.jpg');
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);
      mockPrisma.crawledArticle.create.mockResolvedValue({ id: 1 });
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({ id: 99, name: 'Category', slug: 'category' } as any);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 99, name: 'Tag', slug: 'tag' } as any);
      mockPrisma.post.create.mockResolvedValue({ id: 100, title: 'Draft', slug: 'draft', status: 'draft' } as any);
    });

    it('should fall back to cheerio-based pagination when AI fails', async () => {
      mockAiService.analyzeListingPage.mockRejectedValue(new Error('AI unavailable'));
      const fallbackSpy = jest.spyOn(service as any, 'analyzeListingPageFallback');
      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><div class="pagination"><a rel="next" href="/blog/page/2/">Next</a></div><article><h1>Post</h1></article></body></html>');

      await service.crawlSource(1);

      expect(fallbackSpy).toHaveBeenCalled();
    });

    it('should continue crawling even when AI analysis rejects', async () => {
      mockAiService.analyzeListingPage.mockRejectedValue(new Error('Timeout'));
      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>Post</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls').mockReturnValue(['https://example.com/article/1']);

      const result = await service.crawlSource(1);

      expect(result.discovered).toBe(1);
    });
  });

  // ---- URL Cap ----

  describe('crawlSource (URL cap)', () => {
    const source = { id: 1, name: 'Big Blog', url: 'https://example.com/blog', interval: 60, status: 'active' };

    it('should cap total discovered URLs at MAX_URLS_PER_CRAWL', async () => {
      mockPrisma.crawlSource.findUniqueOrThrow.mockResolvedValue(source);
      mockPrisma.crawlSource.update.mockResolvedValue(source);
      mockAiService.analyzeListingPage.mockResolvedValue({
        totalArticles: 10,
        currentPage: 1,
        totalPages: 1, // single page only - focuses on cap logic
        paginationPattern: null,
      });

      // Single page with URLs exceeding the cap
      const manyUrls = Array.from({ length: 250 }, (_, i) => `https://example.com/article/u-${i}`);
      jest.spyOn(service as any, 'fetchPage').mockResolvedValue('<html><body><article><h1>X</h1></article></body></html>');
      jest.spyOn(service as any, 'discoverArticleUrls').mockReturnValue(manyUrls);
      jest.spyOn(service as any, 'extractArticle').mockResolvedValue(null);
      mockPrisma.crawledArticle.findUnique.mockResolvedValue(null);

      const result = await service.crawlSource(1);

      // Should cap at MAX_URLS_PER_CRAWL (200) even though 250 were on the page
      expect(result.discovered).toBeLessThanOrEqual(200);
    });
  });

  // ---- Scheduling ----

  describe('checkScheduledSources', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should crawl sources that are past their scheduled interval', async () => {
      const pastDue = {
        id: 1,
        name: 'Past Due',
        interval: 60,
        status: 'active',
        lastRunAt: new Date(mockDate.getTime() - 61 * 60_000),
      };
      mockPrisma.crawlSource.findMany.mockResolvedValue([pastDue]);
      jest.spyOn(service, 'crawlSource').mockResolvedValue({ discovered: 1, new: 1, skipped: 0, errors: 0 });

      await service.checkScheduledSources();

      expect(service.crawlSource).toHaveBeenCalledWith(1);
    });

    it('should NOT crawl sources whose interval has not elapsed yet', async () => {
      const notDue = {
        id: 1,
        name: 'Not Due',
        interval: 60,
        status: 'active',
        lastRunAt: new Date(mockDate.getTime() - 30 * 60_000),
      };
      mockPrisma.crawlSource.findMany.mockResolvedValue([notDue]);
      jest.spyOn(service, 'crawlSource').mockResolvedValue({ discovered: 1, new: 1, skipped: 0, errors: 0 });

      await service.checkScheduledSources();

      expect(service.crawlSource).not.toHaveBeenCalled();
    });

    it('should run sources that have never been crawled (lastRunAt = null)', async () => {
      const neverRun = {
        id: 1,
        name: 'Never Run',
        interval: 60,
        status: 'active',
        lastRunAt: null,
      };
      mockPrisma.crawlSource.findMany.mockResolvedValue([neverRun]);
      jest.spyOn(service, 'crawlSource').mockResolvedValue({ discovered: 1, new: 1, skipped: 0, errors: 0 });

      await service.checkScheduledSources();

      expect(service.crawlSource).toHaveBeenCalledWith(1);
    });

    it('should only query sources with status=active', async () => {
      mockPrisma.crawlSource.findMany.mockResolvedValue([]);

      await service.checkScheduledSources();

      expect(mockPrisma.crawlSource.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });

    it('should handle multiple sources with mixed schedules correctly', async () => {
      const sources = [
        { id: 1, name: 'Due', interval: 30, status: 'active', lastRunAt: new Date(mockDate.getTime() - 31 * 60_000) },
        { id: 2, name: 'Not Due', interval: 60, status: 'active', lastRunAt: new Date(mockDate.getTime() - 30 * 60_000) },
        { id: 3, name: 'Due Too', interval: 120, status: 'active', lastRunAt: new Date(mockDate.getTime() - 121 * 60_000) },
      ];
      mockPrisma.crawlSource.findMany.mockResolvedValue(sources);
      jest.spyOn(service, 'crawlSource').mockResolvedValue({ discovered: 0, new: 0, skipped: 0, errors: 0 });

      await service.checkScheduledSources();

      expect(service.crawlSource).toHaveBeenCalledTimes(2);
      expect(service.crawlSource).toHaveBeenCalledWith(1);
      expect(service.crawlSource).toHaveBeenCalledWith(3);
      expect(service.crawlSource).not.toHaveBeenCalledWith(2);
    });
  });

  // ---- Utility ----

  describe('isChinese', () => {
    it('should return true for text with >15% CJK characters', () => {
      const chineseText = '这是一篇中文文章这是一篇中文文章这 Mostly English padding here.';
      expect((service as any).isChinese(chineseText)).toBe(true);
    });

    it('should return false for pure English text', () => {
      expect((service as any).isChinese('This is English')).toBe(false);
    });

    it('should return false for text with <15% CJK characters', () => {
      const mixed = 'This is mostly English with only a few 中文 characters.';
      expect((service as any).isChinese(mixed)).toBe(false);
    });
  });

  describe('removeCopyright', () => {
    it('should remove copyright notice lines', () => {
      const text = 'Article content.\n© 2024 All rights reserved.\nMore content.';
      const result = (service as any).removeCopyright(text);
      expect(result).not.toContain('All rights reserved');
      expect(result).toContain('Article content');
      expect(result).toContain('More content');
    });

    it('should keep content without copyright patterns unchanged', () => {
      const content = 'This is a normal article without any copyright notice.';
      expect((service as any).removeCopyright(content)).toBe(content);
    });
  });
});
