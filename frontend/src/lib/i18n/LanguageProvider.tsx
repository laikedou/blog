'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/lib/i18n/i18n';

export type { SupportedLocale };
export { SUPPORTED_LOCALES };

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  isLoading: boolean;
  supportedLocales: readonly SupportedLocale[];
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'zh-CN',
  setLocale: () => {},
  isLoading: true,
  supportedLocales: SUPPORTED_LOCALES,
});

async function detectLocale(): Promise<SupportedLocale> {
  try {
    const res = await fetch('/api/i18n/detect');
    if (res.ok) {
      const data = await res.json();
      const detected = data.locale;
      if (SUPPORTED_LOCALES.includes(detected as SupportedLocale)) {
        return detected as SupportedLocale;
      }
    }
  } catch {
    // Fallback to browser language
    const browserLang = navigator.language;
    const baseLang = browserLang.split('-')[0];

    if (baseLang === 'zh') {
      const region = browserLang.split('-')[1];
      return region === 'TW' || region === 'HK' ? 'zh-TW' : 'zh-CN';
    }
    if (baseLang === 'ja') return 'ja';
    if (baseLang === 'en') return 'en';
  }
  return 'zh-CN';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<SupportedLocale>('zh-CN');
  const [isLoading, setIsLoading] = useState(true);

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      setLocaleState(newLocale);
      i18n.changeLanguage(newLocale);
      document.documentElement.lang = newLocale;
    },
    [i18n],
  );

  useEffect(() => {
    const savedLocale = localStorage.getItem('i18nextLng') || document.cookie.match(/(?:^|;\s*)i18next=([^;]*)/)?.[1];
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as SupportedLocale)) {
      setLocale(savedLocale as SupportedLocale);
      setIsLoading(false);
      return;
    }

    detectLocale().then((detected) => {
      setLocale(detected);
      setIsLoading(false);
    });
  }, [setLocale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isLoading, supportedLocales: SUPPORTED_LOCALES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
