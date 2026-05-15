import { Test, TestingModule } from '@nestjs/testing';
import { CloudflareAiService } from './cloudflare-ai.service';

describe('CloudflareAiService', () => {
  let service: CloudflareAiService;

  beforeEach(async () => {
    // Clear env so we test the fallback behavior
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudflareAiService],
    }).compile();

    service = module.get<CloudflareAiService>(CloudflareAiService);
  });

  describe('when not configured', () => {
    it('should return original URL from transformImage when not configured', async () => {
      const result = await service.transformImage('http://example.com/img.jpg');
      expect(result).toBe('http://example.com/img.jpg');
    });

    it('should return null from generateCover when not configured', async () => {
      const result = await service.generateCover('test prompt');
      expect(result).toBeNull();
    });

    it('should return null from generateBanner when not configured', async () => {
      const result = await service.generateBanner('test prompt');
      expect(result).toBeNull();
    });

    it('should return original html from transformImagesInContent when not configured', async () => {
      const html = '<img src="http://example.com/img.jpg" />';
      const result = await service.transformImagesInContent(html);
      expect(result).toBe(html);
    });
  });

  describe('buildCoverPrompt', () => {
    it('should build a prompt from title and excerpt', () => {
      const result = service.buildCoverPrompt('My Post Title', 'A short excerpt');
      expect(result).toContain('My Post Title');
      expect(result).toContain('A short excerpt');
      expect(result).toContain('Blog featured image');
    });

    it('should handle missing excerpt', () => {
      const result = service.buildCoverPrompt('My Post Title');
      expect(result).toContain('My Post Title');
    });
  });

  describe('buildBannerPrompt', () => {
    it('should build a banner prompt from title and subtitle', () => {
      const result = service.buildBannerPrompt('Banner Title', 'Subtitle text');
      expect(result).toContain('Banner Title');
      expect(result).toContain('Subtitle text');
      expect(result).toContain('Wide blog banner');
    });
  });
});
