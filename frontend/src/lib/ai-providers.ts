import type { LanguageModel } from 'ai';

import { createGateway } from '@ai-sdk/gateway';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const deepseekProvider = createOpenAICompatible({
  name: 'deepseek',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const grokProvider = createOpenAICompatible({
  name: 'grok',
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY,
});

let _gatewayProvider: ReturnType<typeof createGateway> | null = null;
const gatewayProvider = (apiKey?: string) => {
  if (!_gatewayProvider) {
    _gatewayProvider = createGateway({ apiKey });
  }
  return _gatewayProvider;
};

export function getModel(modelId: string, gatewayApiKey?: string): LanguageModel {
  const [prefix] = modelId.split('/');

  switch (prefix) {
    case 'deepseek':
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured.');
      }
      return deepseekProvider(modelId.replace('deepseek/', '')) as LanguageModel;
    case 'grok':
    case 'xai':
      if (!process.env.XAI_API_KEY && !process.env.GROK_API_KEY) {
        throw new Error('XAI_API_KEY or GROK_API_KEY is not configured.');
      }
      return grokProvider(modelId) as LanguageModel;
    default:
      return gatewayProvider(gatewayApiKey)(modelId) as LanguageModel;
  }
}

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export const DEFAULT_MODEL = process.env.AI_GATEWAY_API_KEY
  ? 'openai/gpt-4o-mini'
  : `deepseek/${DEEPSEEK_MODEL}`;

export const DEFAULT_TOOL_MODEL = process.env.AI_GATEWAY_API_KEY
  ? 'google/gemini-2.5-flash'
  : `deepseek/${DEEPSEEK_MODEL}`;
