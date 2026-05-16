import { AiProvider, GenerateResult, StreamChunk } from '../interfaces/ai-provider.interface';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export class ClaudeProvider implements AiProvider {
  readonly name = 'claude';
  private anthropic: ReturnType<typeof createAnthropic>;
  private apiKey: string;
  readonly model: string;
  private timeout: number;
  private maxTokens: number;

  constructor(config: { apiKey: string; model?: string; timeout?: number; maxTokens?: number }) {
    this.anthropic = createAnthropic({ apiKey: config.apiKey });
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-6-20250512';
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

  private buildPrompt(prompt: string, existingCode?: string): string {
    const context = existingCode
      ? `Existing HTML code:\n${existingCode}\n\nRevise based on feedback below.`
      : 'Generate a new interactive visualization.';

    return `${context}

## RULES:
1. Return ONLY HTML inside a \`\`\`html code block. No explanations.
2. Root element must be a <div class="viz-root">.viz-root's max-width is always 100%.All content inside it.
3. Use <style> for ALL styling — scoped class selectors (prefix with viz-).
4. Use <script> for ALL interactivity — vanilla JavaScript only. NO imports.
5. SVG for math diagrams (coordinates, shapes, graphs). <canvas> for physics simulations.
6. Make it interactive: sliders, buttons, click-to-toggle. CSS animations + requestAnimationFrame for motion.
7. The .viz-root container MUST have: max-width: 100%; width: 100%; DO NOT add box-shadow, border, or outline to .viz-root (inner elements can have shadows/borders).
8. Clean polished inner design: rounded corners, subtle shadows on inner elements, readable typography, accent colors.
9. Add labels, annotations, formulas, step-by-step explanations.
10. Wrap main logic in try-catch. On error call: window.__vizError(error.message)
11. NOT a full HTML document — just the fragment.

Prompt: ${prompt}`;
  }

  async generateVisualization(prompt: string, _subject: string): Promise<GenerateResult> {
    const response = await this.fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.7,
        system: 'You are a visualization expert creating interactive HTML/CSS/JS educational content for K-12 math and physics.',
        messages: [{ role: 'user', content: this.buildPrompt(prompt) }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    const usage = data?.usage ? {
      promptTokens: data.usage.input_tokens ?? 0,
      completionTokens: data.usage.output_tokens ?? 0,
      totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  async *generateVisualizationStream(
    prompt: string,
    _subject: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    try {
      const result = streamText({
        model: this.anthropic(this.model),
        system: 'You are a visualization expert creating interactive HTML/CSS/JS educational content for K-12 math and physics.',
        prompt: this.buildPrompt(prompt),
        maxOutputTokens: this.maxTokens,
        temperature: 0.7,
        abortSignal: signal,
        timeout: this.timeout,
      });

      for await (const chunk of result.textStream) {
        yield { type: 'text', text: chunk };
      }
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  async refineVisualization(code: string, feedback: string): Promise<GenerateResult> {
    const response = await this.fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.5,
        system: 'You are an HTML/CSS/JS visualization expert.',
        messages: [{ role: 'user', content: this.buildPrompt(feedback, code) }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error (${response.status})`);
    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    const usage = data?.usage ? {
      promptTokens: data.usage.input_tokens ?? 0,
      completionTokens: data.usage.output_tokens ?? 0,
      totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  async fixError(code: string, error: string): Promise<GenerateResult> {
    const messages = [
      {
        role: 'user' as const,
        content: `Fix ONLY the error in the HTML below. Do NOT change the code's behavior, features, style, or appearance. Make the minimal change needed to fix the error.

\`\`\`html
${code}
\`\`\`

Error:
${error}

Return the COMPLETE corrected HTML in a single \`\`\`html block. Only fix what is broken.`,
      },
    ];

    const response = await this.fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.3,
        system: 'You are a code repair specialist. Your only job is to fix bugs — never modify behavior, style, or features beyond what the error requires.',
        messages,
      }),
    });

    if (!response.ok) throw new Error(`Claude API error (${response.status})`);
    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    const usage = data?.usage ? {
      promptTokens: data.usage.input_tokens ?? 0,
      completionTokens: data.usage.output_tokens ?? 0,
      totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  validateCode(code: string): { valid: boolean; error?: string } {
    // HTML is always "valid" in the sense that it renders — we catch runtime errors differently
    if (!code || !code.trim()) return { valid: false, error: 'Empty HTML content' };
    return { valid: true };
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.5,
        system: 'You are an educational content writer for K-12 math and physics. Generate clear, concise, and accurate explanations.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude text generation error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data?.content?.[0]?.text || '';
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:html|jsx?|javascript)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    return text.trim();
  }
}
