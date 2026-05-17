import { Injectable } from '@nestjs/common';

const IP_LOCALE_MAP: Record<string, string> = {
  CN: 'zh-CN',
  TW: 'zh-TW',
  HK: 'zh-TW',
  MO: 'zh-TW',
  SG: 'zh-CN',
  JP: 'ja',
  US: 'en',
  GB: 'en',
  AU: 'en',
  CA: 'en',
};

const ACCEPT_LANG_MAP: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'zh-HK': 'zh-TW',
  'zh': 'zh-CN',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'ja': 'ja',
};

export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

@Injectable()
export class I18nService {
  private cache = new Map<string, { locale: string; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  isValidLocale(locale: string): locale is SupportedLocale {
    return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
  }

  detectFromAcceptLanguage(acceptLanguage?: string): string | null {
    if (!acceptLanguage) return null;
    const locales = acceptLanguage
      .split(',')
      .map((l) => {
        const [lang, q = '1'] = l.trim().split(';q=');
        return { lang: lang.trim(), q: parseFloat(q) || 1 };
      })
      .sort((a, b) => b.q - a.q);

    for (const { lang } of locales) {
      const base = lang.split('-')[0];
      if (ACCEPT_LANG_MAP[lang]) return ACCEPT_LANG_MAP[lang];
      if (ACCEPT_LANG_MAP[base]) return ACCEPT_LANG_MAP[base];
    }
    return null;
  }

  async detectFromIp(ip: string): Promise<string | null> {
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.locale;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const countryCode: string = data.countryCode;
        const locale = IP_LOCALE_MAP[countryCode] || null;
        this.cache.set(ip, { locale: locale || 'en', timestamp: Date.now() });
        return locale;
      }
    } catch {
      // Silently fail — geolocation errors are non-critical
    }
    return null;
  }

  async detectLocale(ip: string, acceptLanguage?: string): Promise<string> {
    // 1. Accept-Language header (browser preference)
    const fromAcceptLang = this.detectFromAcceptLanguage(acceptLanguage);
    if (fromAcceptLang) return fromAcceptLang;

    // 2. IP geolocation
    const fromIp = await this.detectFromIp(ip);
    if (fromIp) return fromIp;

    // 3. Default
    return 'zh-CN';
  }
}
