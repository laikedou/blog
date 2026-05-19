import { Injectable } from '@nestjs/common';
import { AiProvider, StreamChunk, ProviderName, PROVIDER_NAMES, GenerateResult } from './interfaces/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GrokProvider } from './providers/grok.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AiUsageService } from '../ai-usage/ai-usage.service';

@Injectable()
export class VisualizationAiService {
  private providers = new Map<string, AiProvider>();

  constructor(private readonly aiUsage: AiUsageService) {
    this.registerProviders();
  }

  private registerProviders() {
    const aiTimeout = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : 120_000;
    const aiMaxTokens = process.env.AI_MAX_TOKENS ? Number(process.env.AI_MAX_TOKENS) : 65536;

    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        timeout: aiTimeout,
        maxTokens: aiMaxTokens,
      }));
    }
    if (process.env.GROK_API_KEY) {
      this.providers.set('grok', new GrokProvider({
        apiKey: process.env.GROK_API_KEY,
        model: process.env.GROK_MODEL || 'grok-4-3',
        timeout: aiTimeout,
        maxTokens: aiMaxTokens,
      }));
    }
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', new DeepSeekProvider({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL,
        model: process.env.DEEPSEEK_MODEL,
        timeout: aiTimeout,
        maxTokens: aiMaxTokens,
      }));
    }
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        timeout: aiTimeout,
        maxTokens: aiMaxTokens,
      }));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('claude', new ClaudeProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6-20250512',
        timeout: aiTimeout,
        maxTokens: aiMaxTokens,
      }));
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): string | null {
    const keys = Array.from(this.providers.keys());
    if (keys.length === 0) return null;
    for (const name of PROVIDER_NAMES) {
      if (keys.includes(name)) return name;
    }
    return keys[0];
  }

  getProvider(name?: string): AiProvider {
    const providerName = name || this.getDefaultProvider();
    if (!providerName) {
      throw new Error(
        'No AI provider configured. Set GROK_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY in .env',
      );
    }
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(
        `Provider "${providerName}" not available. Available: ${this.getAvailableProviders().join(', ')}`,
      );
    }
    return provider;
  }

  async generate(prompt: string, subject: string, providerName?: string, userId?: number, language?: string): Promise<GenerateResult> {
    const provider = this.getProvider(providerName);
    const startTime = Date.now();
    const feature = 'generateVisualization';
    try {
      const result = await provider.generateVisualization(prompt, subject, language);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, result.usage, durationMs, 'success', undefined, userId);
      const { usage, ...clean } = result;
      return clean;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  async generateStream(
    prompt: string,
    subject: string,
    providerName?: string,
    signal?: AbortSignal,
    language?: string,
  ): Promise<AsyncGenerator<StreamChunk, void, undefined>> {
    const provider = this.getProvider(providerName);

    if (provider.generateVisualizationStream) {
      return provider.generateVisualizationStream(prompt, subject, signal, language);
    }

    // Fallback: wrap blocking call in a single-yield generator
    const result = await provider.generateVisualization(prompt, subject, language);
    return (async function* () {
      yield { type: 'text' as const, text: result.code };
    })();
  }

  async generateTextStream(
    prompt: string,
    providerName?: string,
    signal?: AbortSignal,
    language?: string,
  ): Promise<AsyncGenerator<StreamChunk, void, undefined>> {
    const provider = this.getProvider(providerName);

    if (provider.generateTextStream) {
      return provider.generateTextStream(prompt, signal, language);
    }

    // Fallback: wrap blocking call in a single-yield generator
    const text = await provider.generateText(prompt, language);
    return (async function* () {
      yield { type: 'text' as const, text };
    })();
  }

  async generateQuiz(prompt: string, subject: string, providerName?: string, userId?: number, language?: string) {
    const provider = this.getProvider(providerName);
    const langInstruction = language
      ? `\n\nCRITICAL: Generate all content in the language corresponding to locale "${language}".`
      : '';
    const quizPrompt = `Given the following topic in ${subject}: "${prompt}"

Generate 4 multiple-choice quiz questions to test understanding of this concept.
Each question should have 4 options with one correct answer and a brief explanation.

Format your response as a valid JSON array (no markdown, no code fences — just the raw JSON):

[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0,
    "explanation": "..."
  }
]${langInstruction}`;

    const startTime = Date.now();
    const feature = 'generateQuiz';
    try {
      const raw = await provider.generateText(quizPrompt, language);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'success', undefined, userId);
      return this.extractJson(raw);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  async generateTutorResponse(
    vizContext: { title: string; subject: string; description?: string; knowledgeSummary?: string },
    interaction: { interactionType: string; parameterName: string; parameterValue: string },
    history: { parameterName: string; interactionType: string; aiResponse: string }[],
    providerName?: string,
    userId?: number,
    language?: string,
  ): Promise<string> {
    const provider = this.getProvider(providerName);
    const langInstruction = language
      ? `\n\nRespond in the language corresponding to locale "${language}".`
      : '';

    const historyStr = history.length > 0
      ? `\n\nPrevious interactions:\n${history.map(h => `- User changed "${h.parameterName}" → AI said: "${h.aiResponse.slice(0, 200)}"`).join('\n')}`
      : '';

    const tutorPrompt = `You are an AI tutor helping a student understand an interactive visualization.

Visualization: "${vizContext.title}" (${vizContext.subject})
${vizContext.description ? `Description: ${vizContext.description}` : ''}
${vizContext.knowledgeSummary ? `Key concepts: ${vizContext.knowledgeSummary}` : ''}

The student just ${interaction.interactionType === 'param_change' ? 'adjusted the parameter' : 'interacted with'} "${interaction.parameterName}" (new value: ${interaction.parameterValue}).

Give a brief, helpful, contextual explanation (2-4 sentences). Explain WHY this parameter affects the system the way it does. Use concrete, accessible language suitable for a student. Do NOT repeat yourself if you've already explained this parameter before.${historyStr}${langInstruction}`;

    const startTime = Date.now();
    const feature = 'generateTutorResponse';
    try {
      const result = await provider.generateText(tutorPrompt, language);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'success', undefined, userId);
      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  async generateNarrationScript(
    vizContext: { title: string; subject: string; description?: string; introduction?: string; detailedExplanation?: string; knowledgeSummary?: string },
    locale: string,
    providerName?: string,
    userId?: number,
  ): Promise<{ segments: Array<{ startTime: number; endTime: number; text: string; cuePoint?: string }>; fullText: string }> {
    const provider = this.getProvider(providerName);
    const narrationPrompt = `You are a documentary narrator for educational visualizations. Write a narration script for this visualization:

Title: "${vizContext.title}"
Subject: ${vizContext.subject}
${vizContext.introduction ? `Introduction: ${vizContext.introduction}` : ''}
${vizContext.detailedExplanation ? `Explanation: ${vizContext.detailedExplanation}` : ''}
${vizContext.knowledgeSummary ? `Key points: ${vizContext.knowledgeSummary}` : ''}

Write a narration in ${locale} that:
1. Opens with a hook (5-10 seconds)
2. Introduces the concept (10-15 seconds)
3. Explains what the visualization shows (15-20 seconds)
4. Describes key interactions the user can try (10-15 seconds)
5. Ends with a summary and encouragement to explore (5-10 seconds)

Format as a JSON array of timed segments (no markdown, just raw JSON):
[
  { "startTime": 0, "endTime": 8, "text": "...", "cuePoint": "intro" },
  { "startTime": 8, "endTime": 22, "text": "...", "cuePoint": "concept" },
  ...
]

CRITICAL: Generate in ${locale} language. Total duration should be 45-75 seconds.`;

    const startTime = Date.now();
    const feature = 'generateNarration';
    try {
      const raw = await provider.generateText(narrationPrompt, undefined);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'success', undefined, userId);
      const segments = this.extractJson(raw) as any[];
      const fullText = segments?.map((s: any) => s.text).join(' ') || raw;
      return { segments: segments || [], fullText };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  private extractJson(text: string): any {
    // Try to parse directly first
    try { return JSON.parse(text); } catch {}
    // Try to extract from code fences
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1].trim()); } catch {}
    }
    // Try to find a JSON array or object
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch {}
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch {}
    }
    return text;
  }

  async generateMetadata(title: string, subject: string, providerName?: string, userId?: number, language?: string): Promise<{ introduction: string; detailedExplanation: string; knowledgeSummary: string }> {
    const provider = this.getProvider(providerName);
    const langInstruction = language
      ? `\n\nCRITICAL: Generate all content in the language corresponding to locale "${language}".`
      : '';
    const metaPrompt = `For the following ${subject} topic titled "${title}"

Generate three sections for an educational article. Write in a clear, accessible style suitable for learners.

===INTRO===
Write an engaging introduction (2-3 sentences) that hooks the reader and explains why this topic matters.
===DETAILED===
Write a detailed explanation (3-5 paragraphs) covering the mechanism, key relationships, and real-world implications.
===SUMMARY===
Write a concise summary (2-3 bullet points) of the most important takeaways.${langInstruction}

CRITICAL: Use the EXACT markers ===INTRO===, ===DETAILED===, and ===SUMMARY=== to separate sections.`;

    const startTime = Date.now();
    const feature = 'generateMetadata';
    try {
      const raw = await provider.generateText(metaPrompt, language);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'success', undefined, userId);
      return this.parseMetadataResponse(raw);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  parseMetadataResponse(text: string): { introduction: string; detailedExplanation: string; knowledgeSummary: string } {
    const extract = (marker: string): string => {
      const re = new RegExp(`===${marker}===\\n?([\\s\\S]*?)(?=\\n===|$)`);
      const match = text.match(re);
      return match ? match[1].trim() : '';
    };

    return {
      introduction: extract('INTRO'),
      detailedExplanation: extract('DETAILED'),
      knowledgeSummary: extract('SUMMARY'),
    };
  }

  async refineStream(
    code: string,
    feedback: string,
    providerName?: string,
    signal?: AbortSignal,
    language?: string,
  ): Promise<AsyncGenerator<StreamChunk, void, undefined>> {
    const provider = this.getProvider(providerName);

    // Construct a self-contained prompt embedding the code + feedback
    const prompt = `EXISTING HTML CODE TO REFINE:
\`\`\`html
${code}
\`\`\`

USER FEEDBACK: ${feedback}

Based on the feedback, produce the COMPLETE refined HTML code. Only change what is needed to address the feedback — keep everything else identical. Return the full HTML inside a \`\`\`html code block.`;

    if (provider.generateVisualizationStream) {
      return provider.generateVisualizationStream(prompt, '', signal, language);
    }

    // Fallback to blocking refine then yield all at once
    const result = await provider.refineVisualization(code, feedback, language);
    return (async function* () {
      yield { type: 'text' as const, text: result.code };
    })();
  }

  async refine(code: string, feedback: string, providerName?: string, userId?: number, language?: string): Promise<GenerateResult> {
    const provider = this.getProvider(providerName);
    const startTime = Date.now();
    const feature = 'refineVisualization';
    try {
      const result = await provider.refineVisualization(code, feedback, language);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, result.usage, durationMs, 'success', undefined, userId);
      const { usage, ...clean } = result;
      return clean;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  async fixError(code: string, error: string, providerName?: string, userId?: number, language?: string): Promise<GenerateResult> {
    const provider = this.getProvider(providerName);
    const startTime = Date.now();
    const feature = 'fixError';
    try {
      const result = await provider.fixError(code, error, language);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, result.usage, durationMs, 'success', undefined, userId);
      const { usage, ...clean } = result;
      return clean;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  validate(code: string, providerName?: string) {
    const provider = this.getProvider(providerName);
    return provider.validateCode(code);
  }

  private async logUsage(
    provider: AiProvider,
    feature: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined,
    durationMs: number,
    status: string,
    errorMessage?: string,
    userId?: number,
  ) {
    await this.aiUsage.log({
      provider: provider.name,
      model: provider.model,
      feature,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
      durationMs,
      status,
      errorMessage,
      userId,
    }).catch(() => {});
  }
}
