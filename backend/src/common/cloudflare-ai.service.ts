import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

const IMG2IMG_MODEL = '@cf/runwayml/stable-diffusion-v1-5-img2img';
const TXT2IMG_MODEL = '@cf/bytedance/stable-diffusion-xl-lightning';

@Injectable()
export class CloudflareAiService {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;
  }

  private isConfigured(): boolean {
    return !!this.accountId && !!this.apiToken;
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  private generateFilename(prefix: string, ext: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  }

  private saveImage(buffer: Buffer, subDir: string): string {
    const dir = path.join(process.cwd(), 'uploads', subDir);
    this.ensureDir(dir);
    const filename = this.generateFilename(subDir, '.png');
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${subDir}/${filename}`;
  }

  /**
   * Transform an image using Cloudflare img2img model.
   * Downloads the source image, sends it to Cloudflare AI, saves the result locally.
   */
  async transformImage(
    imageUrl: string,
    prompt: string = 'professional illustration, clean style, high quality, modern',
    strength: number = 0.6,
  ): Promise<string> {
    if (!this.isConfigured()) return imageUrl;

    try {
      // Download original image
      const res = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return imageUrl;

      const imageBuffer = Buffer.from(await res.arrayBuffer());
      const imageB64 = imageBuffer.toString('base64');

      // Call Cloudflare img2img
      const cfRes = await fetch(`${this.baseUrl}/${IMG2IMG_MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_b64: imageB64,
          strength,
        }),
        signal: AbortSignal.timeout(60_000), // img2img can take a while
      });

      if (!cfRes.ok) {
        const errText = await cfRes.text();
        console.error(`Cloudflare img2img error (${cfRes.status}):`, errText);
        return imageUrl;
      }

      // Response is a binary PNG
      const arrayBuffer = await cfRes.arrayBuffer();
      const resultBuffer = Buffer.from(arrayBuffer);
      return this.saveImage(resultBuffer, 'ai-images');
    } catch (err) {
      console.error('Cloudflare transformImage failed:', err.message);
      return imageUrl;
    }
  }

  /**
   * Generate a brand new cover/featured image from a text prompt.
   * Uses Cloudflare text-to-image (Stable Diffusion XL).
   */
  async generateCover(
    prompt: string,
    width: number = 1024,
    height: number = 768,
  ): Promise<string | null> {
    if (!this.isConfigured()) return null;

    try {
      const cfRes = await fetch(`${this.baseUrl}/${TXT2IMG_MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          width,
          height,
          num_steps: 20,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!cfRes.ok) {
        const errText = await cfRes.text();
        console.error(`Cloudflare txt2img error (${cfRes.status}):`, errText);
        return null;
      }

      const arrayBuffer = await cfRes.arrayBuffer();
      const resultBuffer = Buffer.from(arrayBuffer);
      return this.saveImage(resultBuffer, 'covers');
    } catch (err) {
      console.error('Cloudflare generateCover failed:', err.message);
      return null;
    }
  }

  /**
   * Extract all image URLs from HTML content and transform each one.
   * Returns the HTML with updated image src attributes.
   */
  async transformImagesInContent(
    html: string,
    basePrompt?: string,
  ): Promise<string> {
    if (!this.isConfigured() || !html) return html;

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const imgTags: { full: string; src: string }[] = [];
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(html)) !== null) {
      imgTags.push({ full: match[0], src: match[1] });
    }

    if (imgTags.length === 0) return html;

    let result = html;
    for (const img of imgTags) {
      // Skip local images, SVGs, and data URIs
      if (img.src.startsWith('/') || img.src.startsWith('data:') || img.src.includes('.svg')) continue;

      const prompt = basePrompt
        ? `${basePrompt}, artistic reinterpretation`
        : 'professional illustration, clean style, high quality, modern digital art';

      const newUrl = await this.transformImage(img.src, prompt, 0.55);
      if (newUrl !== img.src) {
        result = result.replace(img.full, img.full.replace(img.src, newUrl));
      }
    }

    return result;
  }

  /**
   * Build a cover image prompt from post title and excerpt/content.
   */
  buildCoverPrompt(title: string, excerpt: string = ''): string {
    const keywords = [title, excerpt]
      .filter(Boolean)
      .join(', ')
      .replace(/<[^>]*>/g, '')
      .substring(0, 300);

    return `Blog featured image: ${keywords}. Modern professional illustration, clean composition, elegant style, suitable for a technology blog header, 16:9 aspect ratio, vibrant yet sophisticated colors, no text, no watermark`;
  }

  /**
   * Generate a banner image at 1920px width with custom height.
   * Uses Cloudflare text-to-image (Stable Diffusion XL).
   */
  async generateBanner(
    prompt: string,
    height: number = 400,
  ): Promise<string | null> {
    if (!this.isConfigured()) return null;

    return this.generateCover(prompt, 1920, height);
  }

  /**
   * Build a banner image prompt from title and subtitle.
   */
  buildBannerPrompt(title: string, subtitle: string = ''): string {
    const text = [title, subtitle].filter(Boolean).join(', ').substring(0, 300);
    return `Wide blog banner: ${text}. Panoramic landscape, wide-angle 1920px banner, professional technology blog header, modern design, atmospheric lighting, cinematic composition, no text, no watermark`;
  }
}
