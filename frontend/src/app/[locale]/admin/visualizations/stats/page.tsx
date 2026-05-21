'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { VisualizationStatsOverview } from '@/components/Visualizations/VisualizationStats';

export default function VisualizationStatsPage() {
  const t = useTranslations();
  return (
    <div>
      <Link
        href="/admin/visualizations"
        className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        {t('admin.backToVisualizations')}
      </Link>

      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6">{t('admin.visualizationAnalytics')}</h1>
      <VisualizationStatsOverview />
    </div>
  );
}
