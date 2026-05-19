export interface AiProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface StreamChunk {
  type: 'text';
  text: string;
}

export interface AiUsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export interface AiProvider {
  /** Unique provider identifier */
  readonly name: string;
  /** Model name used by this provider instance */
  readonly model: string;

  /** Generate TSX visualization code from a prompt */
  generateVisualization(prompt: string, subject: string, language?: string): Promise<GenerateResult>;

  /** Stream visualization code generation — optional, falls back to generateVisualization */
  generateVisualizationStream?(
    prompt: string,
    subject: string,
    signal?: AbortSignal,
    language?: string,
  ): AsyncGenerator<StreamChunk, void, undefined>;

  /** Refine existing code with a new prompt */
  refineVisualization(code: string, feedback: string, language?: string): Promise<GenerateResult>;

  /** Fix a specific error in the code with minimal changes — no style/behavior changes */
  fixError(code: string, error: string, language?: string): Promise<GenerateResult>;

  /** Generate plain text (e.g. metadata like introduction, explanation, summary) */
  generateText(prompt: string, language?: string): Promise<string>;

  /** Stream plain text generation — optional, falls back to generateText */
  generateTextStream?(prompt: string, signal?: AbortSignal, language?: string): AsyncGenerator<StreamChunk, void, undefined>;

  /** Generate a quiz from knowledge summary content — falls back to generateText if not implemented */
  generateQuiz?(prompt: string, language?: string): Promise<string>;

  /** Generate a contextual tutor explanation */
  generateContextualExplanation?(context: string, language?: string): Promise<string>;

  /** Generate narration script segments */
  generateNarration?(context: string, locale: string): Promise<string>;

  /** Generate difficulty variants of a concept */
  generateDifficultyVariants?(context: string, levels: string[], language?: string): Promise<string>;

  /** Generate multiple perspectives on a concept */
  generatePerspectives?(concept: string, subject: string, count: number, language?: string): Promise<string>;

  /** Validate code syntax */
  validateCode(code: string): { valid: boolean; error?: string };
}

export interface GenerateResult {
  code: string;
  raw: string;
  introduction?: string;
  detailedExplanation?: string;
  knowledgeSummary?: string;
  usage?: AiUsageData;
}

export const PROVIDER_NAMES = ['grok', 'deepseek', 'gemini', 'openai', 'claude'] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];
