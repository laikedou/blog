'use client';

import Link from 'next/link';
import { useSiteConfig } from '@/lib/use-site-config';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { config } = useSiteConfig();
  const { t } = useTranslation();

  const siteTitle = config.siteTitle || 'AI Blog';
  const description = config.siteDescription || t('footer.description');
  const footerText = config.footerText || t('common.poweredBy');
  const copyrightText = config.copyrightText || `&copy; ${currentYear} ${siteTitle}. ${t('common.allRightsReserved')}.`;

  const CATEGORIES = [
    { href: '/category/technology', label: t('footer.technology') },
    { href: '/category/programming', label: t('footer.programming') },
    { href: '/category/design', label: t('footer.design') },
    { href: '/category/ai', label: t('footer.aiMl') },
  ];

  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = JSON.parse(config.socialLinks || '{}');
  } catch {}

  return (
    <footer className="bg-cream-200 border-t border-border mt-auto" role="contentinfo">
      <div className="section-container py-section-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <h3 className="font-display text-display-sm text-ink mb-4">{siteTitle}</h3>
            <p className="text-body-sm text-ink-muted leading-relaxed max-w-xs">
              {description}
            </p>
            {config.contactEmail && (
              <p className="mt-3 text-body-sm text-ink-muted">
                <a href={`mailto:${config.contactEmail}`} className="hover:text-clay transition-colors">{config.contactEmail}</a>
              </p>
            )}
            {Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-3 mt-3">
                {Object.entries(socialLinks).map(([platform, url]) =>
                  url ? (
                    <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="text-body-sm text-ink-muted hover:text-clay transition-colors capitalize">
                      {platform}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
          <nav aria-label={t('footer.quickLinks')}>
            <h3 className="text-caption text-ink tracking-wider uppercase mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-body text-ink-soft hover:text-clay transition-colors">{t('footer.home')}</Link></li>
              <li><Link href="/login" className="text-body text-ink-soft hover:text-clay transition-colors">{t('footer.signIn')}</Link></li>
              <li><Link href="/register" className="text-body text-ink-soft hover:text-clay transition-colors">{t('footer.register')}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t('footer.categories')}>
            <h3 className="text-caption text-ink tracking-wider uppercase mb-4">{t('footer.categories')}</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map(cat => (
                <li key={cat.href}>
                  <Link href={cat.href} className="text-body text-ink-soft hover:text-clay transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('footer.support')}>
            <h3 className="text-caption text-ink tracking-wider uppercase mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/privacy-policy" className="text-body text-ink-soft hover:text-clay transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link href="/terms-of-use" className="text-body text-ink-soft hover:text-clay transition-colors">{t('footer.termsOfUse')}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="divider-wave mt-12 mb-6" aria-hidden="true" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-ink-muted">
            {copyrightText}
          </p>
          <p className="text-caption-sm text-ink-muted tracking-wider uppercase">
            {footerText}
          </p>
        </div>
      </div>
    </footer>
  );
}
