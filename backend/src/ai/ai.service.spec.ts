import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    process.env.DEEPSEEK_API_KEY = '';
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();
    service = module.get<AiService>(AiService);
  });

  describe('generatePost', () => {
    it('should return fallback post when no API key', async () => {
      const result = await service.generatePost({
        topic: 'Artificial Intelligence',
        style: 'professional',
        wordCount: 800,
      });

      expect(result.title).toBe('Artificial Intelligence');
      expect(result.content).toContain('Artificial Intelligence');
      expect(result.excerpt).toBeDefined();
    });
  });

  describe('enhanceContent', () => {
    it('should return enhanced content', async () => {
      const result = await service.enhanceContent({
        content: '<p>This is a test paragraph.</p>',
        mode: 'improve-grammar',
      });

      expect(result.enhancedContent).toBeDefined();
    });
  });

  describe('generateSeo', () => {
    it('should return SEO metadata', async () => {
      const result = await service.generateSeo({
        title: 'Test Post',
        content: '<p>Content here</p>',
      });

      expect(result.seoTitle).toBeDefined();
      expect(result.seoDescription).toBeDefined();
      expect(result.slug).toBeDefined();
    });
  });

  describe('suggestTags', () => {
    it('should return suggested tags', async () => {
      const result = await service.suggestTags({ content: 'Technology post about AI', maxTags: 5 });

      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.category).toBeDefined();
    });
  });

  describe('chat', () => {
    it('should return fallback message when no API key', async () => {
      const result = await service.chat([{ role: 'user', content: 'Hello' }]);

      expect(result.reply).toContain('DEEPSEEK_API_KEY');
    });
  });

  describe('analyzeListingPage', () => {
    it('should return fallback with single page when no API key', async () => {
      const result = await service.analyzeListingPage({
        html: '<html><body><article>Post 1</article><article>Post 2</article></body></html>',
        url: 'https://example.com/blog',
      });

      expect(result).toEqual({
        totalArticles: 0,
        currentPage: 1,
        totalPages: 1,
        paginationPattern: null,
      });
    });
  });

  describe('rewriteArticle', () => {
    it('should return input unchanged when no API key', async () => {
      const input = { title: 'Test Title', content: '<p>Test content</p>', excerpt: 'Test excerpt.', sourceName: 'Test Blog' };
      const result = await service.rewriteArticle(input);

      // sourceName is metadata, not part of the result content
      expect(result.title).toBe(input.title);
      expect(result.content).toBe(input.content);
      expect(result.excerpt).toBe(input.excerpt);
    });
  });
});
