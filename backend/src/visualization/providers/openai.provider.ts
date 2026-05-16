import { AiProvider, GenerateResult, StreamChunk } from '../interfaces/ai-provider.interface';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  private openai: ReturnType<typeof createOpenAI>;
  private apiKey: string;
  private baseUrl: string;
  readonly model: string;
  private timeout: number;
  private maxTokens: number;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string; timeout?: number; maxTokens?: number }) {
    this.openai = createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o';
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

## RULES:
1. Return ONLY the HTML inside a \`\`\`html code block. No explanations.
2. Root element: <div class="viz-root">. viz-root's max-width is always 100%.All content inside it.
3. Use <style> for ALL styling — scoped selectors prefixed with "viz-".
4. Use <script> for ALL interactivity — vanilla JavaScript only. NO imports.
5. SVG for math diagrams. <canvas> for physics simulations.
6. Interactive: buttons, sliders (input type="range"), click-to-toggle.
7. CSS animations + requestAnimationFrame for smooth motion.
8. The .viz-root container MUST have: max-width: 100%; width: 100%; NO box-shadow, border, or outline on .viz-root (inner elements can have them).
9. Clean inner design: rounded corners, subtle shadows on inner elements, readable typography, accent colors.
10. Labels, annotations, formulas, step-by-step explanations.
11. Wrap logic in try-catch. On error call: window.__vizError(error.message).
12. NOT a full HTML document — just the fragment.`;
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
        max_tokens: this.maxTokens,
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
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
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
    try {
      const result = streamText({
        model: this.openai(this.model),
        system: this.systemPrompt(),
        prompt,
        maxOutputTokens: this.maxTokens,
        temperature: 0.7,
        abortSignal: signal,
        timeout: this.timeout,
      });

      for await (const chunk of result.textStream) {
        yield { type: 'text', text: chunk };
      }
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
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
        max_tokens: this.maxTokens,
        temperature: 0.5,
        messages: [
          { role: 'system', content: `Existing HTML code:\n${code}\n\nRevise based on feedback. Return only code in \`\`\`html.` },
          { role: 'user', content: feedback },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error (${response.status})`);
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
        max_tokens: this.maxTokens,
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

    if (!response.ok) throw new Error(`OpenAI API error (${response.status})`);
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
        max_tokens: 4096,
        temperature: 0.5,
        messages: [
          { role: 'system', content: 'You are an educational content writer for K-12 math and physics. Generate clear, concise, and accurate explanations.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI text generation error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:html|jsx?|javascript)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    return text.trim();
  }
}
