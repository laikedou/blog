import { Injectable, Logger } from '@nestjs/common';

const VOICE_MAP: Record<string, string> = {
  en: 'Eve',
  'zh-CN': 'Eve',
  'zh-TW': 'Eve',
  ja: 'Eve',
};

@Injectable()
export class GrokTtsService {
  private readonly logger = new Logger(GrokTtsService.name);

  isConfigured(): boolean {
    return !!process.env.GROK_API_KEY;
  }

  async synthesize(text: string, locale: string): Promise<Buffer> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error('GROK_API_KEY is not configured');
    }

    const baseUrl = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
    const voice = VOICE_MAP[locale] || VOICE_MAP['en'];

    this.logger.log(`Grok TTS: ${text.length} chars, voice=${voice}, locale=${locale}`);

    const response = await fetch(`${baseUrl}/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voice,
        output_format: { codec: 'mp3', sample_rate: 44100, bit_rate: 128000 },
        language: 'auto',
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      throw new Error(`Grok TTS failed (HTTP ${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    this.logger.log(`Grok TTS generated ${buffer.length} bytes`);
    return buffer;
  }
}
