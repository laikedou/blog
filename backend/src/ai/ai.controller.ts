import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
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
  ) {}

  @Post('generate-post')
  generatePost(@Body() dto: GeneratePostDto) {
    return this.aiService.generatePost(dto);
  }

  @Post('enhance-content')
  enhanceContent(@Body() dto: EnhanceContentDto) {
    return this.aiService.enhanceContent(dto);
  }

  @Post('generate-seo')
  generateSeo(@Body() dto: GenerateSeoDto) {
    return this.aiService.generateSeo(dto);
  }

  @Post('suggest-tags')
  suggestTags(@Body() dto: SuggestTagsDto) {
    return this.aiService.suggestTags(dto);
  }

  @Post('image-prompt')
  imagePrompt(@Body() dto: AiImagePromptDto) {
    return this.aiService.generateImagePrompt(dto);
  }

  @Post('analyze-seo')
  analyzeSeo(@Body() body: { title: string; content?: string; seoTitle?: string; seoDescription?: string; targetEngine?: string }) {
    return this.aiService.analyzeSeo(body);
  }

  @Post('chat')
  chat(@Body() body: { messages: { role: string; content: string }[] }) {
    return this.aiService.chat(body.messages);
  }

  @Post('generate-cover')
  async generateCover(@Body() body: { title: string; excerpt?: string }) {
    const prompt = this.cloudflareAi.buildCoverPrompt(body.title, body.excerpt);
    const url = await this.cloudflareAi.generateCover(prompt);
    return { url, prompt };
  }

  @Post('generate-banner')
  async generateBanner(@Body() body: { title: string; subtitle?: string; height?: number }) {
    const prompt = this.cloudflareAi.buildBannerPrompt(body.title, body.subtitle);
    const url = await this.cloudflareAi.generateBanner(prompt, body.height || 400);
    return { url, prompt };
  }

  @Post('transform-image')
  async transformImage(@Body() body: { imageUrl: string; prompt?: string }) {
    const url = await this.cloudflareAi.transformImage(
      body.imageUrl,
      body.prompt || 'professional illustration, clean style, high quality',
    );
    return { url };
  }
}
