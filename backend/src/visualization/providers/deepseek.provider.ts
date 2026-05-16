import { AiProvider, GenerateResult, StreamChunk } from '../interfaces/ai-provider.interface';
import { extractHtmlCode } from '../extract-code';

export class DeepSeekProvider implements AiProvider {
  readonly name = 'deepseek';
  private apiKey: string;
  private baseUrl: string;
  readonly model: string;
  private timeout: number;
  private maxTokens: number;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string; timeout?: number; maxTokens?: number }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
    this.model = config.model || 'deepseek-chat';
    this.timeout = config.timeout ?? 120_000;
    this.maxTokens = config.maxTokens ?? 65536;
  }

  private async fetchWithTimeout(url: string, options: RequestInit & { timeout?: number; signal?: AbortSignal }): Promise<Response> {
    const timeout = options.timeout ?? this.timeout;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const externalSignal = options.signal;
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  private systemPrompt(): string {
    return `You are a visualization expert creating interactive HTML/CSS/JS content for K-12 math and physics education.

## OUTPUT RULES
- Return ONLY the HTML code inside a single \`\`\`html code block. No explanations.
- Root element: <div class="viz-root">.  viz-root's max-width is always 100%. All content inside it.
- Use <style> for ALL styling — scoped class selectors prefixed with "viz-".
- Use <script> for ALL interactivity — vanilla JavaScript only. NO imports.
- NOT a full HTML document — just the fragment.

## VISUALIZATION QUALITY
1. SVG for math diagrams (coordinates, shapes, graphs, angles). <canvas> for physics (particles, motion, waves).
2. Every visualization MUST have interactivity: sliders, buttons, click-to-toggle, or draggable elements.
3. CSS animations (@keyframes, transitions) and requestAnimationFrame for smooth motion.
4. Clean design: rounded corners, subtle shadows, readable fonts, accent colors, good spacing.
5. Use Flexbox/Grid for responsive layout within the container.
6. Label axes, annotate key points, show formulas, include brief instructions.
7. Color-code related elements for clarity — avoid raw hex colors, use semantic palette.
8. Wrap main logic in try-catch. On error call: window.__vizError(error.message)`;
  }

  async generateVisualization(prompt: string, _subject: string): Promise<GenerateResult> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: this.systemPrompt() },
          { role: 'user', content: prompt },
        ],
      }),
      timeout: this.timeout,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage ? {
      promptTokens: data.usage.prompt_tokens ?? 0,
      completionTokens: data.usage.completion_tokens ?? 0,
      totalTokens: data.usage.total_tokens ?? 0,
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  async *generateVisualizationStream(
    prompt: string,
    _subject: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.7,
        stream: true,
        messages: [
          { role: 'system', content: this.systemPrompt() },
          { role: 'user', content: prompt },
        ],
      }),
      signal,
      timeout: this.timeout,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6).trim();
          if (payload === '[DONE]') return;

          try {
            const parsed = JSON.parse(payload);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: 'text', text: content };
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async refineVisualization(code: string, feedback: string): Promise<GenerateResult> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.5,
        messages: [
          { role: 'system', content: `Existing HTML code:\n${code}\n\nRevise according to feedback. Follow the same quality guidelines. Return only code in \`\`\`html.` },
          { role: 'user', content: feedback },
        ],
      }),
    });

    if (!response.ok) throw new Error(`DeepSeek API error (${response.status})`);
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage ? {
      promptTokens: data.usage.prompt_tokens ?? 0,
      completionTokens: data.usage.completion_tokens ?? 0,
      totalTokens: data.usage.total_tokens ?? 0,
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  async fixError(code: string, error: string): Promise<GenerateResult> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are a code repair specialist. Fix ONLY bugs — never change behavior, style, or features beyond what the error requires. Make minimal changes.',
          },
          {
            role: 'user',
            content: `Fix ONLY the error in the HTML below. Do NOT change behavior, features, style, or appearance. Minimal change only.

\`\`\`html
${code}
\`\`\`

Error:
${error}

Return the COMPLETE corrected HTML in a single \`\`\`html block.`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`DeepSeek API error (${response.status})`);
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage ? {
      promptTokens: data.usage.prompt_tokens ?? 0,
      completionTokens: data.usage.completion_tokens ?? 0,
      totalTokens: data.usage.total_tokens ?? 0,
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  validateCode(code: string): { valid: boolean; error?: string } {
    if (!code || !code.trim()) return { valid: false, error: 'Empty HTML content' };
    return { valid: true };
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.5,
        messages: [
          { role: 'system', content: 'You are an educational content writer for K-12 math and physics. Generate clear, concise, and accurate explanations.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek text generation error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  private extractCode(text: string): string {
    return extractHtmlCode(text);
  }
}
