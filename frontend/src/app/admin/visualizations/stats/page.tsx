'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { VisualizationStatsOverview } from '@/components/Visualizations/VisualizationStats';
import { ChevronLeft } from 'lucide-react';

export default function VisualizationStatsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <Link
        href="/admin/visualizations"
        className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('admin.backToVisualizations')}
      </Link>

      <h1 className="font-display text-display-md text-ink mb-6">{t('admin.visualizationAnalytics')}</h1>
      <VisualizationStatsOverview />
    </div>
  );
}
