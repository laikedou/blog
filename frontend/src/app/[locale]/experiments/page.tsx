'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { experiments } from '@/lib/api';
import PerspectiveCard from '@/components/Visualizations/PerspectiveCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Layers, Beaker, Binary, Atom, Dna } from 'lucide-react';

export default function ExperimentsPage() {
  const t = useTranslations();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    experiments.list()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [activeConcept, setActiveConcept] = useState<string | null>(null);

  const CONCEPTS = [
    { slug: null, label: t('admin.all'), icon: Beaker },
    { slug: 'math', label: t('viz.mathematics'), icon: Binary },
    { slug: 'physics', label: t('viz.physicsLabel'), icon: Atom },
    { slug: 'biology', label: t('viz.biology'), icon: Dna },
  ];

  const filteredData = activeConcept
    ? data.filter((exp: any) => (exp.concept || 'math').toLowerCase() === activeConcept)
    : data;

  return (
    <div className="min-h-screen bg-cream-200">
      {/* Lab Hero Header */}
      <section className="relative overflow-hidden bg-cream-100 border-b border-border">
        {/* Floating lab shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="lab-shape square" style={{ width: 60, height: 60, top: '15%', left: '8%' }} />
          <div className="lab-shape circle" style={{ width: 45, height: 45, top: '60%', right: '12%' }} />
          <div className="lab-shape hex" style={{ width: 80, height: 80, top: '20%', right: '20%' }} />
          <div className="lab-shape square" style={{ width: 35, height: 35, top: '70%', left: '20%' }} />
          <div className="lab-shape circle" style={{ width: 55, height: 55, top: '10%', left: '55%' }} />
          {/* Glow dots */}
          <div className="particle-dot fast" style={{ width: 6, height: 6, background: 'rgba(76,215,246,0.25)', top: '30%', left: '40%', boxShadow: '0 0 12px rgba(76,215,246,0.15)' }} />
          <div className="particle-dot slow" style={{ width: 4, height: 4, background: 'rgba(175,198,255,0.35)', top: '50%', left: '60%' }} />
          <div className="particle-dot fast" style={{ width: 5, height: 5, background: 'rgba(76,215,246,0.2)', top: '72%', right: '30%', boxShadow: '0 0 10px rgba(76,215,246,0.1)' }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-clay/5 blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="max-w-grid mx-auto px-6 py-16 md:py-24 relative z-10">
          <Link href="/visualizations" className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors mb-6">
            <ChevronLeft className="h-4 w-4" />
            {t('viz.browseAll')}
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-clay/20 to-primary/10 border border-clay/10 flex items-center justify-center">
              <Layers className="h-7 w-7 text-clay" />
            </div>
            <div>
              <h1 className="font-display text-display-lg text-ink">{t('viz.experiment.title')}</h1>
              <p className="text-body-sm text-ink-muted">{t('viz.experiment.subtitle')}</p>
            </div>
          </div>

          {/* Concept filter pills */}
          <div className="flex flex-wrap gap-2">
            {CONCEPTS.map((concept) => {
              const Icon = concept.icon;
              const isActive = activeConcept === concept.slug;
              return (
                <button
                  key={concept.slug || 'all'}
                  onClick={() => setActiveConcept(concept.slug)}
                  className={`filter-pill flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {concept.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <div className="max-w-grid mx-auto px-6 py-16 md:py-24">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl shimmer" />)}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative inline-block mb-6">
              <Layers className="h-16 w-16 mx-auto text-ink-faint animate-breathe" />
              <div className="absolute inset-0 rounded-full bg-clay/10 blur-2xl animate-pulse-glow" aria-hidden="true" />
            </div>
            <p className="text-body text-ink-muted">{t('viz.experiment.empty')}</p>
            {activeConcept && (
              <Button variant="ghost" size="sm" onClick={() => setActiveConcept(null)} className="mt-3">
                {t('common.clearFilter')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredData.map((exp, idx) => (
              <PerspectiveCard key={exp.id} experiment={exp} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
