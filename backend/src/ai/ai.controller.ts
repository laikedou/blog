import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { GrokImageService } from '../common/grok-image.service';
import { GeneratePostDto, EnhanceContentDto, GenerateSeoDto, SuggestTagsDto, AiImagePromptDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private cloudflareAi: CloudflareAiService,
    private grokImage: GrokImageService,
  ) {}

  @Post('generate-post')
  generatePost(@Body() dto: GeneratePostDto, @Req() req: any) {
    return this.aiService.generatePost(dto, req.user?.id);
  }

  @Post('enhance-content')
  enhanceContent(@Body() dto: EnhanceContentDto, @Req() req: any) {
    return this.aiService.enhanceContent(dto, req.user?.id);
  }

  @Post('generate-seo')
  generateSeo(@Body() dto: GenerateSeoDto, @Req() req: any) {
    return this.aiService.generateSeo(dto, req.user?.id);
  }

  @Post('suggest-tags')
  suggestTags(@Body() dto: SuggestTagsDto, @Req() req: any) {
    return this.aiService.suggestTags(dto, req.user?.id);
  }

  @Post('image-prompt')
  imagePrompt(@Body() dto: AiImagePromptDto, @Req() req: any) {
    return this.aiService.generateImagePrompt(dto, req.user?.id);
  }

  @Post('analyze-seo')
  analyzeSeo(@Body() body: { title: string; content?: string; seoTitle?: string; seoDescription?: string; targetEngine?: string }, @Req() req: any) {
    return this.aiService.analyzeSeo(body, req.user?.id);
  }

  @Post('chat')
  chat(@Body() body: { messages: { role: string; content: string }[] }, @Req() req: any) {
    return this.aiService.chat(body.messages, req.user?.id);
  }

  @Post('generate-cover')
  async generateCover(@Body() body: { title: string; excerpt?: string; provider?: string }) {
    const provider = body.provider || 'grok';

    if (provider === 'grok') {
      const prompt = this.grokImage.buildCoverPrompt(body.title, body.excerpt);
      const url = await this.grokImage.generateCover(prompt);
      if (url) return { url, prompt, provider: 'grok' };
      // Fallback to Cloudflare if Grok fails
    }

    const prompt = this.cloudflareAi.buildCoverPrompt(body.title, body.excerpt);
    const url = await this.cloudflareAi.generateCover(prompt);
    return { url, prompt, provider: url ? 'cloudflare' : null };
  }

  @Post('generate-banner')
  async generateBanner(@Body() body: { title: string; subtitle?: string; height?: number; provider?: string }) {
    const provider = body.provider || 'grok';

    if (provider === 'grok') {
      const prompt = this.grokImage.buildBannerPrompt(body.title, body.subtitle);
      const url = await this.grokImage.generateBanner(prompt, body.height || 400);
      if (url) return { url, prompt, provider: 'grok' };
      // Fallback to Cloudflare
    }

    const prompt = this.cloudflareAi.buildBannerPrompt(body.title, body.subtitle);
    const url = await this.cloudflareAi.generateBanner(prompt, body.height || 400);
    return { url, prompt, provider: url ? 'cloudflare' : null };
  }

  @Post('transform-image')
  async transformImage(@Body() body: { imageUrl: string; prompt?: string }) {
    const url = await this.cloudflareAi.transformImage(
      body.imageUrl,
      body.prompt || 'professional illustration, clean style, high quality',
    );
    return { url };
  }

  @Post('generate-logo')
  async generateLogo(@Body() body: { brandName: string; tagline?: string }) {
    const { brandName, tagline } = body;

    // Try Grok first
    let url = await this.grokImage.generateLogo(brandName, tagline);
    if (url) return { url, format: 'png', provider: 'grok' };

    // Fallback to Cloudflare
    const prompt = `Flat minimal logo for "${brandName} ${tagline}". Clean vector design, simple geometric shapes, transparent background, no background, centered, high contrast, modern minimalist style, no text, no watermark`;
    url = await this.cloudflareAi.generateCover(prompt, 1024, 1024);
    if (url) return { url, format: 'png', provider: 'cloudflare' };

    return { url: null, format: 'png', provider: null };
  }

  @Post('generate-legal-policy')
  async generateLegalPolicy(@Body() body: { type: 'privacy' | 'terms'; siteName: string; siteUrl: string; siteEmail: string }, @Req() req: any) {
    const content = await this.aiService.generateLegalPolicy(body, req.user?.id);
    return { content };
  }

  @Post('generate-favicon')
  async generateFavicon(@Body() body: { brandName: string }, @Req() req: any) {
    const svgSystemPrompt = `You are an SVG designer. Generate a minimal, modern SVG favicon for a brand.

Rules:
- Output ONLY valid SVG code, no explanations, no markdown formatting
- Use <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
- Keep it extremely simple — one or two geometric shapes, no text
- Use solid colors only, no gradients
- The design should be recognizable at 32x32 pixels
- Max 4 elements
- Dark background (#1a1a2e or similar) with an accent color for the mark
- Return ONLY the raw SVG code, starting with <svg and ending with </svg>`;

    let svgContent = await this.aiService.generateSvg(svgSystemPrompt, body.brandName, req.user?.id);
    if (svgContent) {
      // Strip markdown code fences if present
      svgContent = svgContent.replace(/```svg\s*/g, '').replace(/```\s*/g, '').trim();
    }
    if (!svgContent || !svgContent.includes('<svg')) {
      return { url: null, format: 'svg', provider: null };
    }

    const url = this.grokImage.saveSvg(svgContent);
    return { url, format: 'svg', provider: 'ai' };
  }
}
