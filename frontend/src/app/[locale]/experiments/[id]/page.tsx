'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { experiments } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Layers, BookOpen, Atom } from 'lucide-react';

export default function ExperimentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
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
          <Skeleton className="h-5 w-48 mb-2 shimmer" />
          <Skeleton className="h-10 w-96 mb-3 shimmer" />
          <Skeleton className="h-5 w-64 mb-8 shimmer" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-9 w-28 rounded-lg shimmer" />
            <Skeleton className="h-9 w-28 rounded-lg shimmer" />
            <Skeleton className="h-9 w-28 rounded-lg shimmer" />
          </div>
          <Skeleton className="h-[500px] rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <div className="p-12 text-center max-w-md rounded-2xl border border-border bg-surface">
          <Layers className="h-16 w-16 mx-auto mb-4 text-ink-faint" />
          <p className="text-body text-ink-muted">{error || t('viz.experiment.notFound')}</p>
          <Link href="/experiments" className="mt-4 inline-block">
            <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-1" /> {t('common.back')}</Button>
          </Link>
        </div>
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

        {/* Pill-style perspective switcher */}
        <div className="pill-switcher mb-6" role="tablist">
          {group.perspectives.map((p: any, i: number) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={`pill-tab whitespace-nowrap ${i === activeIndex ? 'active' : ''}`}
            >
              {p.perspectiveName}
            </button>
          ))}
        </div>

        {/* Viz container with ambient glow */}
        <div className="relative rounded-2xl border border-border bg-surface overflow-hidden shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-clay/[0.02] via-transparent to-primary/[0.02] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-clay/10 to-transparent pointer-events-none" aria-hidden="true" />
          <div className="relative min-h-[500px]">
            {activeViz ? (
              <HtmlVisualizationRenderer
                htmlContent={activeViz.htmlContent}
                visualizationId={activeViz.id}
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-ink-muted">
                <Layers className="h-10 w-10 animate-breathe opacity-40" />
              </div>
            )}
          </div>
          {activeViz?.description && (
            <div className="px-6 py-5 border-t border-border bg-surface-warm/50">
              <h2 className="font-display text-display-xs text-ink mb-1">{activePerspective.perspectiveName}</h2>
              <p className="text-body-sm text-ink-muted">{activePerspective.subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
