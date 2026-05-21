import { defineRouting } from 'next-intl/routing';

export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
};

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  'en': '🇺🇸',
  'ja': '🇯🇵',
};

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'zh-CN',
  localePrefix: 'always',
});

export const pathnames = {
  '/': '/',
  '/posts': '/posts',
  '/admin': '/admin',
  '/login': '/login',
  '/register': '/register',
  '/visualizations': '/visualizations',
  '/experiments': '/experiments',
  '/classroom': '/classroom',
  '/privacy-policy': '/privacy-policy',
  '/terms-of-use': '/terms-of-use',
};
