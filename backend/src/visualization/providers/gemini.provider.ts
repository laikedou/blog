import { AiProvider, GenerateResult, StreamChunk } from '../interfaces/ai-provider.interface';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private apiKey: string;
  readonly model: string;
  private timeout: number;
  private maxTokens: number;

  constructor(config: { apiKey: string; model?: string; timeout?: number; maxTokens?: number }) {
    this.google = createGoogleGenerativeAI({ apiKey: config.apiKey });
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash';
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

  private buildPrompt(prompt: string, subject: string, existingCode?: string): string {
    if (existingCode) {
      return `You are a visualization expert for K-12 math and physics education.

EXISTING HTML CODE:
${existingCode}

USER FEEDBACK:
${prompt}

Revise the visualization according to the feedback above. Return ONLY the complete HTML wrapped in a \`\`\`html code block.`;
    }

    return `You are a visualization expert for K-12 math and physics education.

Generate an interactive HTML visualization for this ${subject} topic:

"${prompt}"

## CRITICAL RULES:
1. Return ONLY the HTML code inside a single \`\`\`html code block — no explanations.
2. Root element: <div class="viz-root">. viz-root's max-width is always 100%.All content inside it.
3. Use <style> tags for ALL styling — scoped class selectors prefixed with "viz-".
4. Use <script> for ALL interactivity — vanilla JavaScript only. NO imports or external libraries.
5. Use SVG for math diagrams (coordinates, shapes, graphs). Use <canvas> for physics simulations.
6. Make it interactive: include buttons, sliders, click-to-toggle interactions.
7. Use CSS animations (@keyframes, transitions) and requestAnimationFrame for smooth motion.
8. The .viz-root container MUST have: max-width: 100%; width: 100%; DO NOT add box-shadow, border, or outline to .viz-root (inner elements can have shadows/borders).
9. Clean polished inner design: rounded corners, subtle shadows on inner elements, readable typography, accent colors.
10. Add labels, annotations, formulas, step-by-step explanations to teach the concept.
11. Wrap main logic in try-catch. On error call: window.__vizError(error.message).
12. NOT a full HTML document — just the fragment.

Example structure:
\`\`\`html
<div class="viz-root">
  <style>
    .viz-title { font-size: 18px; font-weight: bold; }
    .viz-canvas { width: 100%; height: 400px; }
  </style>
  <div class="viz-title">Interactive Visualization</div>
  <canvas class="viz-canvas"></canvas>
  <div>
    <input type="range" class="viz-slider" min="0" max="100" value="50">
  </div>
  <script>
    // interactivity logic
  </script>
</div>
\`\`\`

Generate an educational, visually appealing, interactive HTML visualization.`;
  }

  async generateVisualization(prompt: string, subject: string): Promise<GenerateResult> {
    const body = {
      contents: [{
        parts: [{ text: this.buildPrompt(prompt, subject) }],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: this.maxTokens,
      },
    };

    const response = await this.fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeout: this.timeout,
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const code = this.extractCode(text);
    const usage = data?.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata.totalTokenCount ?? 0,
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
        model: this.google(this.model),
        prompt: this.buildPrompt(prompt, subject),
        maxOutputTokens: this.maxTokens,
        temperature: 0.7,
        abortSignal: signal,
        timeout: this.timeout,
      });

      for await (const chunk of result.textStream) {
        yield { type: 'text', text: chunk };
      }
    } catch (error: any) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async refineVisualization(code: string, feedback: string): Promise<GenerateResult> {
    return this.generateVisualization(feedback, '');
  }

  async fixError(code: string, error: string): Promise<GenerateResult> {
    const body = {
      contents: [{
        parts: [{
          text: `Fix ONLY the error in the HTML below. Do NOT change behavior, features, style, or appearance. Make minimal changes.

\`\`\`html
${code}
\`\`\`

Error:
${error}

Return the COMPLETE corrected HTML in a single \`\`\`html block.`,
        }],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: this.maxTokens,
      },
    };

    const response = await this.fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data?.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata.totalTokenCount ?? 0,
      model: this.model,
    } : undefined;
    return { code: this.extractCode(text), raw: text, usage };
  }

  validateCode(code: string): { valid: boolean; error?: string } {
    if (!code || !code.trim()) return { valid: false, error: 'Empty HTML content' };
    return { valid: true };
  }

  async generateText(prompt: string): Promise<string> {
    const body = {
      contents: [{
        parts: [{ text: prompt }],
      }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
    };

    const response = await this.fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini text generation error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private extractCode(text: string): string {
    const match = text.match(/```(?:html|jsx?|javascript)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    const divMatch = text.match(/(<div\s+class="viz-root"[\s\S]*<\/div>)/);
    if (divMatch) return divMatch[1].trim();
    return text.trim();
  }
}
