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
      const result = await provider.generateVisualization(prompt, subject);
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
      return provider.generateVisualizationStream(prompt, subject, signal);
    }

    // Fallback: wrap blocking call in a single-yield generator
    const result = await provider.generateVisualization(prompt, subject);
    return (async function* () {
      yield { type: 'text' as const, text: result.code };
    })();
  }

  async generateMetadata(prompt: string, subject: string, providerName?: string, userId?: number, language?: string) {
    const provider = this.getProvider(providerName);
    const langInstruction = language
      ? `\n\nCRITICAL: Generate all content in the language corresponding to locale "${language}". Translate everything.`
      : '';
    const metaPrompt = `Given the following topic in ${subject}: "${prompt}"

Generate educational content with these three sections:

1. Introduction: A brief 1-2 sentence introduction explaining what this topic demonstrates and what the user will learn.
2. Detailed Explanation: A comprehensive 3-5 paragraph explanation covering the underlying concepts and real-world applications.
3. Knowledge Summary: 3-5 key knowledge points summarizing the most important takeaways.

Format your response exactly as:
===INTRO===
<introduction text>
===DETAILED===
<detailed explanation>
===SUMMARY===
<knowledge points, one per line>${langInstruction}`;

    const startTime = Date.now();
    const feature = 'generateText';
    try {
      const raw = await provider.generateText(metaPrompt);
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'success', undefined, userId);
      return this.parseMetadataResponse(raw);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      await this.logUsage(provider, feature, undefined, durationMs, 'error', error.message, userId);
      throw error;
    }
  }

  private parseMetadataResponse(text: string): { introduction: string; detailedExplanation: string; knowledgeSummary: string } {
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

  async refine(code: string, feedback: string, providerName?: string, userId?: number): Promise<GenerateResult> {
    const provider = this.getProvider(providerName);
    const startTime = Date.now();
    const feature = 'refineVisualization';
    try {
      const result = await provider.refineVisualization(code, feedback);
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

  async fixError(code: string, error: string, providerName?: string, userId?: number): Promise<GenerateResult> {
    const provider = this.getProvider(providerName);
    const startTime = Date.now();
    const feature = 'fixError';
    try {
      const result = await provider.fixError(code, error);
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
