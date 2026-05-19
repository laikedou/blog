import { AiProvider, GenerateResult, StreamChunk } from '../interfaces/ai-provider.interface';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { getLanguageInstruction, SupportedLocale } from '../../common/language.helper';

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

  private buildPrompt(prompt: string, existingCode?: string, language?: string): string {
    const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
    const context = existingCode
      ? `Existing HTML code:\n${existingCode}\n\nRevise based on feedback below.`
      : 'Generate a new interactive visualization.';

    return `${context}

## RULES:
1. Return ONLY HTML inside a \`\`\`html code block. No explanations.
2. Root element must be a <div class="viz-root">.viz-root's width is always 100%.All content inside it.
3. Use <style> for ALL styling — scoped class selectors (prefix with viz-).
4. Use <script> for ALL interactivity — vanilla JavaScript only. NO imports.
5. SVG for math diagrams (coordinates, shapes, graphs). <canvas> for physics simulations.
6. Make it interactive: sliders, buttons, click-to-toggle. CSS animations + requestAnimationFrame for motion. For EVERY interactive element, emit a postMessage event in its event handler: window.parent.postMessage({ type: 'viz:interact', payload: { parameter: '<name>', value: <currentValue>, action: '<drag|click|change>', timestamp: Date.now() } }, '*');
7. ALSO add a window.addEventListener('message', (e) => { if (e.data?.type === 'viz:sync' && e.data?.payload) { const p = e.data.payload; /* update the interactive element matching p.parameter to p.value */ } }) to receive real-time sync events from a teacher in classroom mode.
8. The .viz-root container MUST have: max-width: 100%; width: 100%; DO NOT add box-shadow, border, or outline to .viz-root (inner elements can have shadows/borders).
8. Clean polished inner design: rounded corners, subtle shadows on inner elements, readable typography, accent colors.
9. Add labels, annotations, formulas, step-by-step explanations.
10. Wrap main logic in try-catch. On error call: window.__vizError(error.message)
11. NOT a full HTML document — just the fragment.

Prompt: ${prompt}${langInstruction}`;
  }

  async generateVisualization(prompt: string, _subject: string, language?: string): Promise<GenerateResult> {
    const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
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
        system: `You are a visualization expert creating interactive HTML/CSS/JS educational content for K-12 math and physics.${langInstruction}`,
        messages: [{ role: 'user', content: this.buildPrompt(prompt, undefined, language) }],
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
    language?: string,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    try {
      const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
      const result = streamText({
        model: this.anthropic(this.model),
        system: `You are a visualization expert creating interactive HTML/CSS/JS educational content for K-12 math and physics.${langInstruction}`,
        prompt: this.buildPrompt(prompt, undefined, language),
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

  async refineVisualization(code: string, feedback: string, language?: string): Promise<GenerateResult> {
    const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
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
        system: `You are an HTML/CSS/JS visualization expert.${langInstruction}`,
        messages: [{ role: 'user', content: this.buildPrompt(feedback, code, language) }],
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

  async fixError(code: string, error: string, language?: string): Promise<GenerateResult> {
    const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
    const messages = [
      {
        role: 'user' as const,
        content: `Fix ONLY the error in the HTML below. Do NOT change the code's behavior, features, style, or appearance. Make the minimal change needed to fix the error.

\`\`\`html
${code}
\`\`\`

Error:
${error}

Return the COMPLETE corrected HTML in a single \`\`\`html block. Only fix what is broken.${langInstruction}`,
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
        system: `You are a code repair specialist. Your only job is to fix bugs — never modify behavior, style, or features beyond what the error requires.${langInstruction}`,
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

  async generateText(prompt: string, language?: string): Promise<string> {
    const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
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
        system: `You are an educational content writer for K-12 math and physics. Generate clear, concise, and accurate explanations.${langInstruction}`,
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

  async *generateTextStream(
    prompt: string,
    signal?: AbortSignal,
    language?: string,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    try {
      const langInstruction = language ? getLanguageInstruction(language as SupportedLocale) : '';
      const result = streamText({
        model: this.anthropic(this.model),
        system: `You are an educational content writer for K-12 math and physics. Generate clear, concise, and accurate explanations.${langInstruction}`,
        prompt,
        maxOutputTokens: 4096,
        temperature: 0.5,
        abortSignal: signal,
        timeout: this.timeout,
      });
      for await (const chunk of result.textStream) {
        yield { type: 'text', text: chunk };
      }
    } catch (error: any) {
      throw new Error(`Claude text generation error: ${error.message}`);
    }
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:html|jsx?|javascript)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    return text.trim();
  }
}
