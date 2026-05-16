import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { GrokImageService } from '../common/grok-image.service';

describe('AiController', () => {
  let controller: AiController;
  let aiService: AiService;
  let cloudflareAi: CloudflareAiService;

  const mockAiService = {
    generatePost: jest.fn(),
    enhanceContent: jest.fn(),
    generateSeo: jest.fn(),
    suggestTags: jest.fn(),
    generateImagePrompt: jest.fn(),
    chat: jest.fn(),
  };

  const mockCloudflareAi = {
    buildCoverPrompt: jest.fn(),
    generateCover: jest.fn(),
    buildBannerPrompt: jest.fn(),
    generateBanner: jest.fn(),
    transformImage: jest.fn(),
  };

  const mockGrokImage = {
    buildCoverPrompt: jest.fn(),
    generateCover: jest.fn(),
    buildBannerPrompt: jest.fn(),
    generateBanner: jest.fn(),
    generateLogo: jest.fn(),
    saveSvg: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: CloudflareAiService, useValue: mockCloudflareAi },
        { provide: GrokImageService, useValue: mockGrokImage },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    aiService = module.get<AiService>(AiService);
    cloudflareAi = module.get<CloudflareAiService>(CloudflareAiService);
  });

  const mockReq = { user: { id: 1 } };

  afterEach(() => jest.clearAllMocks());

  describe('generatePost', () => {
    it('should call aiService.generatePost', async () => {
      const dto = { topic: 'AI', style: 'professional', wordCount: 500 };
      mockAiService.generatePost.mockResolvedValue({ title: 'AI', content: '<p>Content</p>' });
      const result = await controller.generatePost(dto, mockReq);
      expect(mockAiService.generatePost).toHaveBeenCalledWith(dto, 1);
      expect(result.title).toBe('AI');
    });
  });

  describe('enhanceContent', () => {
    it('should call aiService.enhanceContent', async () => {
      const dto = { content: '<p>Test</p>', mode: 'improve-grammar' };
      mockAiService.enhanceContent.mockResolvedValue({ enhancedContent: '<p>Enhanced</p>' });
      const result = await controller.enhanceContent(dto, mockReq);
      expect(mockAiService.enhanceContent).toHaveBeenCalledWith(dto, 1);
      expect(result.enhancedContent).toBe('<p>Enhanced</p>');
    });
  });

  describe('generateSeo', () => {
    it('should call aiService.generateSeo', async () => {
      const dto = { title: 'Test', content: '<p>Content</p>' };
      mockAiService.generateSeo.mockResolvedValue({ seoTitle: 'SEO Title', seoDescription: 'Desc' });
      const result = await controller.generateSeo(dto, mockReq);
      expect(mockAiService.generateSeo).toHaveBeenCalledWith(dto, 1);
      expect(result.seoTitle).toBe('SEO Title');
    });
  });

  describe('suggestTags', () => {
    it('should call aiService.suggestTags', async () => {
      const dto = { content: 'AI post', maxTags: 5 };
      mockAiService.suggestTags.mockResolvedValue({ tags: ['AI', 'ML'], category: 'Technology' });
      const result = await controller.suggestTags(dto, mockReq);
      expect(mockAiService.suggestTags).toHaveBeenCalledWith(dto, 1);
      expect(result.tags).toContain('AI');
    });
  });

  describe('chat', () => {
    it('should call aiService.chat', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      mockAiService.chat.mockResolvedValue({ reply: 'Hi there' });
      const result = await controller.chat({ messages }, mockReq);
      expect(mockAiService.chat).toHaveBeenCalledWith(messages, 1);
      expect(result.reply).toBe('Hi there');
    });
  });

  describe('generateCover', () => {
    it('should call cloudflareAi to generate a cover', async () => {
      mockCloudflareAi.buildCoverPrompt.mockReturnValue('Cover prompt for title');
      mockCloudflareAi.generateCover.mockResolvedValue('/uploads/cover.png');

      const result = await controller.generateCover({ title: 'Test', excerpt: 'Excerpt' });

      expect(mockCloudflareAi.buildCoverPrompt).toHaveBeenCalledWith('Test', 'Excerpt');
      expect(mockCloudflareAi.generateCover).toHaveBeenCalledWith('Cover prompt for title');
      expect(result.url).toBe('/uploads/cover.png');
    });
  });

  describe('generateBanner', () => {
    it('should call cloudflareAi to generate a banner', async () => {
      mockCloudflareAi.buildBannerPrompt.mockReturnValue('Banner prompt');
      mockCloudflareAi.generateBanner.mockResolvedValue('/uploads/banner.png');

      const result = await controller.generateBanner({ title: 'Banner', subtitle: 'Sub', height: 400 });

      expect(mockCloudflareAi.buildBannerPrompt).toHaveBeenCalledWith('Banner', 'Sub');
      expect(mockCloudflareAi.generateBanner).toHaveBeenCalledWith('Banner prompt', 400);
      expect(result.url).toBe('/uploads/banner.png');
    });
  });

  describe('transformImage', () => {
    it('should call cloudflareAi.transformImage', async () => {
      mockCloudflareAi.transformImage.mockResolvedValue('/uploads/transformed.png');

      const result = await controller.transformImage({ imageUrl: '/img.jpg', prompt: 'enhance' });

      expect(mockCloudflareAi.transformImage).toHaveBeenCalledWith('/img.jpg', 'enhance');
      expect(result.url).toBe('/uploads/transformed.png');
    });

    it('should use default prompt when not provided', async () => {
      mockCloudflareAi.transformImage.mockResolvedValue('/uploads/transformed.png');

      await controller.transformImage({ imageUrl: '/img.jpg' });

      expect(mockCloudflareAi.transformImage).toHaveBeenCalledWith(
        '/img.jpg',
        'professional illustration, clean style, high quality',
      );
    });
  });
});
