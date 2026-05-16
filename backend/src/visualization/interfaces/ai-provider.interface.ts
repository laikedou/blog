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
  generateVisualization(prompt: string, subject: string): Promise<GenerateResult>;

  /** Stream visualization code generation — optional, falls back to generateVisualization */
  generateVisualizationStream?(
    prompt: string,
    subject: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamChunk, void, undefined>;

  /** Refine existing code with a new prompt */
  refineVisualization(code: string, feedback: string): Promise<GenerateResult>;

  /** Fix a specific error in the code with minimal changes — no style/behavior changes */
  fixError(code: string, error: string): Promise<GenerateResult>;

  /** Generate plain text (e.g. metadata like introduction, explanation, summary) */
  generateText(prompt: string): Promise<string>;

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
