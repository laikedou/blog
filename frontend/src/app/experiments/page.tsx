'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { experiments } from '@/lib/api';
import PerspectiveCard from '@/components/Visualizations/PerspectiveCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Layers } from 'lucide-react';

export default function ExperimentsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    experiments.list()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream-200">
      <div className="max-w-grid mx-auto px-6 py-section-sm">
        <Link href="/visualizations" className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink mb-4">
          <ChevronLeft className="h-4 w-4" />
          {t('viz.browseAll')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Layers className="h-8 w-8 text-clay" />
          <div>
            <h1 className="font-display text-display-lg text-ink">{t('viz.experiment.title')}</h1>
            <p className="text-body-sm text-ink-muted">{t('viz.experiment.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20">
            <Layers className="h-16 w-16 mx-auto mb-4 text-ink-faint" />
            <p className="text-body text-ink-muted">{t('viz.experiment.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((exp) => (
              <PerspectiveCard key={exp.id} experiment={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
