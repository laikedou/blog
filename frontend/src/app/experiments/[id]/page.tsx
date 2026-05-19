'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { experiments } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import ExperimentSwitcher from '@/components/Visualizations/ExperimentSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Layers, BookOpen, Atom } from 'lucide-react';

export default function ExperimentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = Number(params.id);

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    experiments.get(id)
      .then((g) => {
        setGroup(g);
        // If a perspective ID is in URL params, switch to it
        const pId = searchParams.get('p');
        if (pId) {
          const idx = g.perspectives.findIndex((p: any) => p.id === Number(pId));
          if (idx >= 0) setActiveIndex(idx);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-200">
        <div className="max-w-grid mx-auto px-6 py-section-sm">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Layers className="h-16 w-16 mx-auto mb-4 text-ink-faint" />
          <p className="text-body text-ink-muted">{error || t('viz.experiment.notFound')}</p>
          <Link href="/experiments" className="mt-4 inline-block">
            <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-1" /> {t('common.back')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const activePerspective = group.perspectives[activeIndex];
  const activeViz = activePerspective?.visualization;

  return (
    <div className="min-h-screen bg-cream-200">
      <div className="max-w-grid mx-auto px-6 py-section-sm">
        <Link href="/experiments" className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink mb-4">
          <ChevronLeft className="h-4 w-4" />
          {t('viz.experiment.title')}
        </Link>

        <h1 className="font-display text-display-lg text-ink mb-2">{group.title}</h1>
        <p className="text-lead text-ink-muted mb-6">{group.description}</p>

        <ExperimentSwitcher
          perspectives={group.perspectives}
          activeIndex={activeIndex}
          onChange={(idx) => setActiveIndex(idx)}
        />

        <Card className="border-border shadow-card overflow-hidden">
          <div className="bg-white relative min-h-[500px]">
            {activeViz ? (
              <HtmlVisualizationRenderer
                htmlContent={activeViz.htmlContent}
                visualizationId={activeViz.id}
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-ink-muted">
                {t('viz.experiment.noViz')}
              </div>
            )}
          </div>
        </Card>

        {activeViz?.description && (
          <Card className="border-border bg-surface-warm mt-6">
            <CardContent className="p-6">
              <h2 className="font-display text-display-xs text-ink mb-2">{activePerspective.perspectiveName}</h2>
              <p className="text-body text-ink-muted">{activePerspective.subtitle}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
