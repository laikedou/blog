'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { SUPPORTED_LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type SupportedLocale } from '@/lib/i18n/i18n';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full' | 'minimal';
}

export default function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1">
        {SUPPORTED_LOCALES.map((lng) => (
          <button
            key={lng}
            onClick={() => setLocale(lng as SupportedLocale)}
            className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
              locale === lng
                ? 'bg-clay text-white font-medium'
                : 'text-ink-muted hover:text-ink hover:bg-cream-200'
            }`}
            title={LOCALE_LABELS[lng as SupportedLocale]}
          >
            {lng === 'zh-CN' ? '简' : lng === 'zh-TW' ? '繁' : lng === 'ja' ? '日' : 'EN'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-ink-soft hover:text-ink"
          aria-label={t('common.switchLanguage')}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {variant === 'full' && (
            <span className="hidden sm:inline text-body-sm">
              {LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 mt-2">
        <div className="px-3 py-2 border-b border-border mb-1">
          <p className="text-caption text-ink-muted font-medium">{t('common.languageMenu')}</p>
        </div>
        {SUPPORTED_LOCALES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => {
              setLocale(lng as SupportedLocale);
              setOpen(false);
            }}
            className={locale === lng ? 'bg-clay/10 text-clay font-medium' : ''}
          >
            <span className="mr-2">{LOCALE_FLAGS[lng as SupportedLocale]}</span>
            {LOCALE_LABELS[lng as SupportedLocale]}
            {locale === lng && <span className="ml-auto text-caption">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
