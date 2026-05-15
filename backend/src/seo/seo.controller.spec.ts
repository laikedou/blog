import { Test, TestingModule } from '@nestjs/testing';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

describe('SeoController', () => {
  let controller: SeoController;
  let service: SeoService;

  const mockSeoService = {
    auditPost: jest.fn(),
    getPostAudits: jest.fn(),
    getAllAudits: jest.fn(),
    addKeyword: jest.fn(),
    listKeywords: jest.fn(),
    deleteKeyword: jest.fn(),
    getKeywordRankings: jest.fn(),
    recordRanking: jest.fn(),
    recordClick: jest.fn(),
    getClickStats: jest.fn(),
    updateIndexStatus: jest.fn(),
    getIndexStatus: jest.fn(),
    getDashboard: jest.fn(),
    getAiSuggestions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeoController],
      providers: [
        { provide: SeoService, useValue: mockSeoService },
      ],
    }).compile();

    controller = module.get<SeoController>(SeoController);
    service = module.get<SeoService>(SeoService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('auditPost', () => {
    it('should audit a post', async () => {
      const result = { score: 85, checks: {}, suggestions: [], wordCount: 500 };
      mockSeoService.auditPost.mockResolvedValue(result);

      expect(await controller.auditPost(1)).toBe(result);
      expect(mockSeoService.auditPost).toHaveBeenCalledWith(1);
    });
  });

  describe('getPostAudits', () => {
    it('should return audits for a post', async () => {
      const result = [{ id: 1, score: 85 }];
      mockSeoService.getPostAudits.mockResolvedValue(result);

      expect(await controller.getPostAudits(1)).toBe(result);
      expect(mockSeoService.getPostAudits).toHaveBeenCalledWith(1);
    });
  });

  describe('getAllAudits', () => {
    it('should return paginated audits', async () => {
      const result = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockSeoService.getAllAudits.mockResolvedValue(result);

      expect(await controller.getAllAudits(1, 10)).toBe(result);
      expect(mockSeoService.getAllAudits).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('addKeyword', () => {
    it('should add a keyword', async () => {
      const dto = { keyword: 'AI', source: 'manual', volume: 100, difficulty: 30 };
      const result = { id: 1, ...dto };
      mockSeoService.addKeyword.mockResolvedValue(result);

      expect(await controller.addKeyword(dto)).toBe(result);
      expect(mockSeoService.addKeyword).toHaveBeenCalledWith(dto);
    });
  });

  describe('listKeywords', () => {
    it('should return keywords', async () => {
      const result = [{ id: 1, keyword: 'AI' }];
      mockSeoService.listKeywords.mockResolvedValue(result);

      expect(await controller.listKeywords()).toBe(result);
    });
  });

  describe('deleteKeyword', () => {
    it('should delete a keyword', async () => {
      const result = { message: 'Keyword deleted' };
      mockSeoService.deleteKeyword.mockResolvedValue(result);

      expect(await controller.deleteKeyword(1)).toBe(result);
      expect(mockSeoService.deleteKeyword).toHaveBeenCalledWith(1);
    });
  });

  describe('getKeywordRankings', () => {
    it('should return rankings for a keyword', async () => {
      const result = [{ position: 3, checkedAt: new Date() }];
      mockSeoService.getKeywordRankings.mockResolvedValue(result);

      expect(await controller.getKeywordRankings(1)).toBe(result);
      expect(mockSeoService.getKeywordRankings).toHaveBeenCalledWith(1);
    });
  });

  describe('recordRanking', () => {
    it('should record a keyword ranking', async () => {
      const dto = { keywordId: 1, position: 3, page: '/posts/test', source: 'google' };
      const result = { id: 1, ...dto };
      mockSeoService.recordRanking.mockResolvedValue(result);

      expect(await controller.recordRanking(dto)).toBe(result);
      expect(mockSeoService.recordRanking).toHaveBeenCalledWith(dto);
    });
  });

  describe('recordClick', () => {
    it('should record a click event', async () => {
      const dto = { pageUrl: '/posts/test', source: 'google', clicks: 10, impressions: 100 };
      const result = { id: 1, ...dto };
      mockSeoService.recordClick.mockResolvedValue(result);

      expect(await controller.recordClick(dto)).toBe(result);
      expect(mockSeoService.recordClick).toHaveBeenCalledWith(dto);
    });
  });

  describe('getClickStats', () => {
    it('should return click stats', async () => {
      const result = { total: { clicks: 100, impressions: 1000 }, bySource: {}, byDay: [] };
      mockSeoService.getClickStats.mockResolvedValue(result);

      expect(await controller.getClickStats(30)).toBe(result);
      expect(mockSeoService.getClickStats).toHaveBeenCalledWith(30);
    });
  });

  describe('getDashboard', () => {
    it('should return SEO dashboard', async () => {
      const result = { overview: { avgScore: 70 }, recentAudits: [] };
      mockSeoService.getDashboard.mockResolvedValue(result);

      expect(await controller.getDashboard()).toBe(result);
    });
  });

  describe('updateIndexStatus', () => {
    it('should update index status', async () => {
      const dto = { pageUrl: '/posts/test', googleIndexed: true, baiduIndexed: false };
      const result = { id: 1, ...dto };
      mockSeoService.updateIndexStatus.mockResolvedValue(result);

      expect(await controller.updateIndexStatus(dto)).toBe(result);
      expect(mockSeoService.updateIndexStatus).toHaveBeenCalledWith(dto);
    });
  });

  describe('getIndexStatus', () => {
    it('should return index statuses', async () => {
      const result = [{ pageUrl: '/posts/test', googleIndexed: true }];
      mockSeoService.getIndexStatus.mockResolvedValue(result);

      expect(await controller.getIndexStatus()).toBe(result);
    });
  });

  describe('getAiSuggestions', () => {
    it('should return AI suggestions', async () => {
      const result = { score: 85, suggestions: [], metrics: {} };
      mockSeoService.getAiSuggestions.mockResolvedValue(result);

      expect(await controller.getAiSuggestions(1)).toBe(result);
      expect(mockSeoService.getAiSuggestions).toHaveBeenCalledWith(1);
    });
  });
});
