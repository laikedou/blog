export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const LANGUAGE_MAP: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
};

const LANGUAGE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'zh-CN':
    '你必须使用简体中文输出所有内容。所有标题、正文、描述、摘要都必须使用简体中文。',
  'zh-TW':
    '你必須使用繁體中文輸出所有內容。所有標題、正文、描述、摘要都必須使用繁體中文。',
  'en': 'You MUST output all content in English. All titles, body text, descriptions, and summaries must be in English.',
  'ja': 'すべてのコンテンツを日本語で出力してください。タイトル、本文、説明、要約はすべて日本語で記述する必要があります。',
};

export function getLanguageName(locale: SupportedLocale): string {
  return LANGUAGE_MAP[locale];
}

/**
 * Normalize a locale string to one of the supported locales.
 * Falls back to 'en' for unknown locales.
 */
export function normalizeLocale(locale?: string): SupportedLocale {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase().replace(/_/g, '-');
  if (normalized.startsWith('zh-cn') || normalized === 'zh' || normalized.startsWith('zh-hans')) return 'zh-CN';
  if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk') || normalized.startsWith('zh-hant')) return 'zh-TW';
  if (normalized.startsWith('ja')) return 'ja';
  return 'en';
}

export function getLanguageInstruction(locale?: SupportedLocale): string {
  if (!locale || !LANGUAGE_INSTRUCTIONS[locale]) return '';
  return `\n\n[语言要求/Language Requirement]\n${LANGUAGE_INSTRUCTIONS[locale]}\n\n你必须严格遵循上述语言要求。`;
}
