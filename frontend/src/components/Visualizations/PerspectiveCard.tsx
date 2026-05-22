'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { animate } from 'animejs';
import { Layers, BookOpen, Atom } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  experiment: {
    id: number;
    title: string;
    description: string;
    concept: string;
    perspectives: {
      id: number;
      perspectiveName: string;
      subtitle: string;
      visualization: {
        id: number;
        title: string;
        subject: string;
        featuredImage?: string;
        viewCount: number;
        likesCount: number;
      };
    }[];
  };
  index?: number;
}

const conceptColors: Record<string, string> = {
  math: 'from-blue-500 to-cyan-500',
  physics: 'from-violet-500 to-fuchsia-500',
  biology: 'from-emerald-500 to-teal-500',
};

export default function PerspectiveCard({ experiment, index }: Props) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anim = animate(el, {
      opacity: [0, 1],
      translateY: [20, 0],
      easing: 'easeOutCubic',
      duration: 500,
      delay: index !== undefined ? index * 100 : 0,
    });
    return () => { anim.stop(); };
  }, [index]);

  const concept = experiment.concept || 'math';
  const gradientColor = conceptColors[concept?.toLowerCase()] || conceptColors.math;

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      <Card className="group relative border-border shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden">
        {/* Left color stripe */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientColor} opacity-40 group-hover:opacity-100 group-hover:w-1.5 transition-all duration-300`} />

        <CardContent className="p-6 pl-7">
          <h3 className="font-display text-display-xs text-ink mb-1 group-hover:text-clay transition-colors">{experiment.title}</h3>
          <p className="text-body-sm text-ink-muted mb-5 line-clamp-2">{experiment.description}</p>

          <div className="space-y-2">
            {experiment.perspectives.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/experiments/${experiment.id}?p=${p.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-all group/perspective"
              >
                <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradientColor} bg-opacity-10 flex items-center justify-center shrink-0`}>
                  {p.visualization.subject === 'math' ? (
                    <BookOpen className="h-4 w-4 text-white/80" />
                  ) : (
                    <Atom className="h-4 w-4 text-white/80" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-label-sm text-ink group-hover/perspective:text-clay transition-colors">
                    {p.perspectiveName}
                  </p>
                  <p className="text-caption-sm text-ink-muted truncate">{p.subtitle}</p>
                </div>
                <span className="text-caption-sm text-ink-faint opacity-0 group-hover/perspective:opacity-100 transition-opacity shrink-0">
                  {t('common.view')} →
                </span>
              </Link>
            ))}

            {experiment.perspectives.length > 3 && (
              <Link
                href={`/experiments/${experiment.id}`}
                className="block text-center text-caption-sm text-ink-muted hover:text-clay transition-colors py-1"
              >
                +{experiment.perspectives.length - 3} {t('viz.experiment.morePerspectives')}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
