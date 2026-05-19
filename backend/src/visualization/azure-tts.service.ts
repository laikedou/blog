import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AzureTtsService {
  private readonly logger = new Logger(AzureTtsService.name);

  private readonly voiceMap: Record<string, string> = {
    en: 'en-US-AriaNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
    'zh-TW': 'zh-TW-HsiaoChenNeural',
    ja: 'ja-JP-NanamiNeural',
  };

  getVoiceName(locale: string): string {
    return this.voiceMap[locale] || this.voiceMap['en'];
  }

  isConfigured(): boolean {
    return !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
  }

  async synthesize(text: string, locale: string): Promise<Buffer> {
    const key = process.env.AZURE_SPEECH_KEY!;
    const region = process.env.AZURE_SPEECH_REGION!;
    const voiceName = this.getVoiceName(locale);

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">
  <voice name="${voiceName}">
    ${this.escapeXml(text)}
  </voice>
</speak>`;

    const response = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: ssml,
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      throw new Error(`Azure TTS failed (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
