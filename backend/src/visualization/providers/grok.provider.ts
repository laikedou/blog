import { AiProvider, GenerateResult, StreamChunk } from '../interfaces/ai-provider.interface';
import { createXai } from '@ai-sdk/xai';
import { streamText } from 'ai';

export class GrokProvider implements AiProvider {
  readonly name = 'grok';
  private xai: ReturnType<typeof createXai>;
  private apiKey: string;
  private baseUrl: string;
  readonly model: string;
  private timeout: number;
  private maxTokens: number;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string; timeout?: number; maxTokens?: number }) {
    this.xai = createXai({ apiKey: config.apiKey, baseURL: config.baseUrl });
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.x.ai/v1';
    this.model = config.model || 'grok-4-3';
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

  private systemPrompt(subject: string, existingCode?: string): string {
    if (existingCode) {
      return `You are a visualization expert for K-12 math and physics education.

Existing HTML code:
${existingCode}

Revise the visualization according to the user's feedback. Follow all the same quality guidelines as the original generation. Return ONLY the complete HTML in a \`\`\`html code block.`;
    }

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
8. Wrap main logic in try-catch. On error call: window.__vizError(error.message)
Prompt: ${subject}`;
  }

  async generateVisualization(prompt: string, subject: string): Promise<GenerateResult> {
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
          { role: 'system', content: this.systemPrompt(subject) },
          { role: 'user', content: prompt },
        ],
      }),
      timeout: this.timeout,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const code = this.extractCode(text);
    const usage = data?.usage ? {
      promptTokens: data.usage.prompt_tokens ?? 0,
      completionTokens: data.usage.completion_tokens ?? 0,
      totalTokens: data.usage.total_tokens ?? 0,
      model: this.model,
    } : undefined;
    return { code, raw: text, usage };
  }

  async *generateVisualizationStream(
    prompt: string,
    subject: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    try {
      const result = streamText({
        model: this.xai.responses(this.model),
        system: this.systemPrompt(subject),
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
      throw new Error(`Grok API error: ${error.message}`);
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
          { role: 'system', content: this.systemPrompt('', code) },
          { role: 'user', content: feedback },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error (${response.status}): ${err}`);
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

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error (${response.status}): ${err}`);
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
      throw new Error(`Grok text generation error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:html|jsx?|javascript)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    const divMatch = text.match(/(<div\s+class="viz-root"[\s\S]*<\/div>)/);
    if (divMatch) return divMatch[1].trim();
    return text.trim();
  }
}
