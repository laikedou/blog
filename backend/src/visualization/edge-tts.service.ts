import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

@Injectable()
export class EdgeTtsService {
  private readonly logger = new Logger(EdgeTtsService.name);

  private readonly voiceMap: Record<string, string> = {
    en: 'en-US-AriaNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
    'zh-TW': 'zh-TW-HsiaoChenNeural',
    ja: 'ja-JP-NanamiNeural',
  };

  isConfigured(): boolean {
    return true;
  }

  /**
   * Synthesize text to MP3 audio using Microsoft Edge's free TTS engine.
   * Uses Python's edge-tts package as the primary mechanism.
   */
  async synthesize(text: string, locale: string): Promise<Buffer> {
    const voice = this.voiceMap[locale] || this.voiceMap['en'];

    this.logger.log(
      `Synthesizing ${text.length} chars with voice ${voice} (locale: ${locale})`,
    );

    // Try Python edge-tts first (most reliable free approach)
    try {
      return await this.synthesizeViaPython(text, voice);
    } catch (pyErr: any) {
      this.logger.warn(`Python edge-tts unavailable: ${pyErr.message}`);

      // Fall back to direct WebSocket approach
      try {
        return await this.synthesizeViaWebSocket(text, voice);
      } catch (wsErr: any) {
        this.logger.warn(`WebSocket Edge TTS also failed: ${wsErr.message}`);
        throw new Error(
          `Edge TTS unavailable. Install Python edge-tts: pip install edge-tts. Details: ${pyErr.message}`,
        );
      }
    }
  }

  private async synthesizeViaPython(
    text: string,
    voice: string,
  ): Promise<Buffer> {
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(
      tmpDir,
      `edge_tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`,
    );

    try {
      // Try python3 first, then python
      const pythonCmd = await this.findPython();
      if (!pythonCmd) {
        throw new Error(
          'Python 3 is not installed. Install Python 3 and edge-tts: pip install edge-tts',
        );
      }

      // Write text to temp file to avoid shell escaping issues
      const tmpTextFile = tmpFile + '.txt';
      fs.writeFileSync(tmpTextFile, text, 'utf-8');

      await execFileAsync(
        pythonCmd,
        [
          '-m',
          'edge_tts',
          '--voice',
          voice,
          '--file',
          tmpTextFile,
          '--write-media',
          tmpFile,
        ],
        {
          timeout: 120000,
          maxBuffer: 1024 * 1024,
        },
      );

      fs.unlinkSync(tmpTextFile);

      if (!fs.existsSync(tmpFile)) {
        throw new Error('edge-tts did not produce an output file');
      }

      const buffer = fs.readFileSync(tmpFile);
      this.logger.log(
        `Python edge-tts generated ${buffer.length} bytes of audio`,
      );
      return buffer;
    } finally {
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {}
    }
  }

  private async findPython(): Promise<string | null> {
    for (const cmd of ['python3', 'python']) {
      try {
        await execFileAsync(cmd, ['--version'], { timeout: 5000 });
        return cmd;
      } catch {}
    }
    return null;
  }

  private async synthesizeViaWebSocket(
    text: string,
    voice: string,
  ): Promise<Buffer> {
    // Dynamic import to avoid requiring ws in environments that don't need it
    const WebSocket = require('ws');
    const { randomUUID } = require('crypto');

    const ssml = this.buildSsml(text, voice);
    const requestId = randomUUID();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(
        'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1',
        {
          headers: {
            Pragma: 'no-cache',
            'Cache-Control': 'no-cache',
            Origin:
              'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
          },
          perMessageDeflate: false,
        },
      );

      const audioChunks: Buffer[] = [];
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Edge TTS WebSocket timed out after 60s'));
      }, 60000);

      ws.on('open', () => {
        const config = JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: false,
                  wordBoundaryEnabled: true,
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        });

        const configMsg =
          `X-RequestId:${requestId}\r\n` +
          `Content-Type:application/json; charset=utf-8\r\n` +
          `Path:speech.config\r\n\r\n` +
          config;

        ws.send(configMsg);

        const ssmlMsg =
          `X-RequestId:${requestId}\r\n` +
          `Content-Type:application/ssml+xml\r\n` +
          `X-Timestamp:${Date.now()}\r\n` +
          `Path:ssml\r\n\r\n` +
          ssml;

        ws.send(ssmlMsg);
      });

      ws.on('message', (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          const headerLength = data.readUInt16BE(0) + 2;
          const audioData = data.subarray(headerLength);
          if (audioData.length > 0) audioChunks.push(audioData);
        } else {
          const msg = data.toString();
          if (msg.includes('Path:turn.end')) {
            clearTimeout(timeout);
            ws.close();
          }
        }
      });

      ws.on('close', (code: number) => {
        clearTimeout(timeout);
        if (audioChunks.length === 0) {
          reject(
            new Error(
              `Edge TTS returned no audio data (close code: ${code})`,
            ),
          );
          return;
        }
        resolve(Buffer.concat(audioChunks));
      });

      ws.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private buildSsml(text: string, voice: string): string {
    return (
      `<speak xmlns="http://www.w3.org/2001/10/synthesis" ` +
      `xmlns:mstts="http://www.w3.org/2001/mstts" ` +
      `xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">` +
      `<voice name="${voice}">` +
      `<prosody rate="0%" pitch="0%">` +
      `${this.escapeXml(text)}` +
      `</prosody>` +
      `</voice>` +
      `</speak>`
    );
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
