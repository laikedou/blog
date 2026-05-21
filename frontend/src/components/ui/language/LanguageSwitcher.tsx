'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { SUPPORTED_LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type SupportedLocale } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full' | 'minimal';
}

export default function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const t = useTranslations();
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (newLocale: SupportedLocale) => {
    router.replace(pathname, { locale: newLocale });
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1">
        {SUPPORTED_LOCALES.map((lng) => (
          <button
            key={lng}
            onClick={() => setLocale(lng as SupportedLocale)}
            className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
              locale === lng
                ? 'bg-primary text-on-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-lg hover:bg-white/5"
          aria-label={t('common.switchLanguage')}
        >
          <span className="material-symbols-outlined text-[20px]">translate</span>
          {variant === 'full' && (
            <span className="hidden sm:inline text-body-sm">
              {LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-label-sm text-on-surface-variant">{t('common.languageMenu')}</div>
        <DropdownMenuSeparator />
        {SUPPORTED_LOCALES.map((lng) => {
          const isActive = locale === lng;
          return (
            <DropdownMenuItem
              key={lng}
              onClick={() => setLocale(lng as SupportedLocale)}
              className={isActive ? 'bg-primary/10 text-primary font-medium' : ''}
            >
              <span>{LOCALE_FLAGS[lng as SupportedLocale]}</span>
              <span className="flex-1">{LOCALE_LABELS[lng as SupportedLocale]}</span>
              {isActive && <span className="material-symbols-outlined text-[16px]">check</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
