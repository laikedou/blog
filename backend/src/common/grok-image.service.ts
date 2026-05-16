import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class GrokImageService {
  private readonly logger = new Logger(GrokImageService.name);
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.GROK_API_KEY || '';
    this.baseUrl = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
    this.model = process.env.GROK_IMAGE_MODEL || 'grok-4-3';
    this.timeout = parseInt(process.env.GROK_TIMEOUT_MS || '120000', 10);
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  private generateFilename(prefix: string, ext: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  }

  private saveTextFile(content: string, subDir: string, ext: string): string {
    const dir = path.join(process.cwd(), 'uploads', subDir);
    this.ensureDir(dir);
    const filename = this.generateFilename(subDir, ext);
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return `/uploads/${subDir}/${filename}`;
  }

  private saveImage(buffer: Buffer, subDir: string): string {
    const dir = path.join(process.cwd(), 'uploads', subDir);
    this.ensureDir(dir);
    const filename = this.generateFilename(subDir, '.png');
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${subDir}/${filename}`;
  }

  buildBannerPrompt(title: string, subtitle: string = ''): string {
    const text = [title, subtitle].filter(Boolean).join(', ').substring(0, 300);
    return `Wide blog banner: ${text}. Panoramic landscape, wide-angle 1920px banner, professional technology blog header, modern design, atmospheric lighting, cinematic composition, no text, no watermark`;
  }

  buildCoverPrompt(title: string, excerpt: string = ''): string {
    const keywords = [title, excerpt]
      .filter(Boolean)
      .join(', ')
      .replace(/<[^>]*>/g, '')
      .substring(0, 300);
    return `Blog featured image: ${keywords}. Modern professional illustration, clean composition, elegant style, suitable for a technology blog header, 16:9 aspect ratio, vibrant yet sophisticated colors, no text, no watermark`;
  }

  /**
   * Generate an image via xAI API.
   * Uses OpenAI-compatible /v1/images/generations endpoint.
   * Falls back to chat completions if the dedicated endpoint returns 404.
   */
  async generateImage(
    prompt: string,
    options?: { width?: number; height?: number },
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      this.logger.warn('Grok API key not configured');
      return null;
    }

    const width = options?.width || 1024;
    const height = options?.height || 768;

    // Try OpenAI-compatible images/generations endpoint
    const result = await this.tryImagesEndpoint(prompt, width, height);
    if (result) return result;

    // Fallback: fetch image URL from chat completions
    return this.tryChatEndpoint(prompt, width, height);
  }

  private async tryImagesEndpoint(
    prompt: string,
    width: number,
    height: number,
  ): Promise<string | null> {
    try {
      // Map dimensions to an OpenAI-compatible size string
      const size = this.closestSize(width, height);

      const res = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          n: 1,
          size,
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!res.ok) {
        if (res.status === 404) {
          this.logger.warn('Grok images/generations endpoint not found, trying chat fallback');
          return null; // trigger fallback
        }
        const errText = await res.text();
        this.logger.error(`Grok images error (${res.status}): ${errText}`);
        return null;
      }

      const data = await res.json();
      const b64Json = data?.data?.[0]?.b64_json;
      if (!b64Json) {
        this.logger.warn('No b64_json in Grok images response');
        return null;
      }

      const buffer = Buffer.from(b64Json, 'base64');
      return this.saveImage(buffer, 'covers');
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        this.logger.error('Grok images/generations request timed out');
      } else {
        this.logger.error(`Grok images/generations failed: ${err.message}`);
      }
      return null;
    }
  }

  private async tryChatEndpoint(
    prompt: string,
    width: number,
    height: number,
  ): Promise<string | null> {
    try {
      // Use chat completions: ask the model to generate an image URL
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `You are an image generation assistant. Generate a high-quality image for the user's request.

Output format — return ONLY a markdown image tag on one line:
![generated](data:image/png;base64,BASE64_DATA)

The image must be exactly ${width}x${height} pixels and match the user's description. Do NOT include any other text, explanation, or markdown.`,
            },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Grok chat error (${res.status}): ${errText}`);
        return null;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';

      // Try to extract base64 data URL
      const match = content.match(/!\[generated\]\(data:image\/png;base64,([^)]+)\)/);
      if (match?.[1]) {
        const buffer = Buffer.from(match[1], 'base64');
        return this.saveImage(buffer, 'covers');
      }

      // Try to extract a regular URL
      const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
      if (urlMatch?.[1]) {
        return this.downloadAndSave(urlMatch[1]);
      }

      this.logger.warn('No image found in Grok chat response');
      return null;
    } catch (err: any) {
      this.logger.error(`Grok chat image generation failed: ${err.message}`);
      return null;
    }
  }

  private async downloadAndSave(imageUrl: string): Promise<string | null> {
    try {
      const res = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      return this.saveImage(buffer, 'covers');
    } catch {
      return null;
    }
  }

  /**
   * Map arbitrary dimensions to the closest supported size string.
   */
  private closestSize(width: number, height: number): string {
    const options = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    const ratio = width / height;
    let best = '1024x1024';
    let bestDiff = Infinity;
    for (const opt of options) {
      const [w, h] = opt.split('x').map(Number);
      const optRatio = w / h;
      const diff = Math.abs(ratio - optRatio) + Math.abs(width - w) * 0.001;
      if (diff < bestDiff) { bestDiff = diff; best = opt; }
    }
    return best;
  }

  async generateBanner(prompt: string, height: number = 400): Promise<string | null> {
    return this.generateImage(prompt, { width: 1920, height });
  }

  async generateCover(prompt: string): Promise<string | null> {
    return this.generateImage(prompt, { width: 1024, height: 768 });
  }

  buildLogoPrompt(brandName: string, tagline: string = ''): string {
    const text = [brandName, tagline].filter(Boolean).join(', ').substring(0, 300);
    return `Minimal tech brand logo for "${text}". Clean flat vector design, simple geometric shapes, professional corporate logo, transparent background, no background fill, alpha channel, centered composition, high contrast, bold simple shapes, modern minimalist style, no text characters or letters, no watermark, square aspect ratio`;
  }

  async generateLogo(brandName: string, tagline: string = ''): Promise<string | null> {
    const prompt = this.buildLogoPrompt(brandName, tagline);
    return this.generateImage(prompt, { width: 1024, height: 1024 });
  }

  saveSvg(svgContent: string, subDir: string = 'favicons'): string {
    return this.saveTextFile(svgContent, subDir, '.svg');
  }
}
