'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Atom } from 'lucide-react';
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

  const concept = experiment.concept || 'math';
  const gradientColor = conceptColors[concept?.toLowerCase()] || conceptColors.math;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1],
        delay: index !== undefined ? index * 0.1 : 0,
      }}
    >
      <Card className="group relative border-border shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden">
        {/* Top gradient stripe */}
        <div className={`perspective-stripe absolute top-0 left-0 right-0 bg-gradient-to-r ${gradientColor}`} />

        <CardContent className="p-6 pt-7">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shrink-0 opacity-80`}>
              {concept === 'math' ? <BookOpen className="h-5 w-5 text-white/90" /> : <Atom className="h-5 w-5 text-white/90" />}
            </div>
            <div>
              <h3 className="font-display text-display-xs text-ink group-hover:text-clay transition-colors">{experiment.title}</h3>
              <span className="text-caption-sm text-ink-faint capitalize">{concept}</span>
            </div>
          </div>
          <p className="text-body-sm text-ink-muted mb-5 line-clamp-2">{experiment.description}</p>

          <div className="space-y-1 bg-surface-tile/40 rounded-xl p-1 mt-4">
            {experiment.perspectives.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/experiments/${experiment.id}?p=${p.id}`}
                className="perspective-row group/perspective"
              >
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center shrink-0 opacity-60`}>
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
                <span className="perspective-arrow shrink-0">{t('common.view')} →</span>
              </Link>
            ))}

            {experiment.perspectives.length > 3 && (
              <Link
                href={`/experiments/${experiment.id}`}
                className="block text-center text-caption-sm text-ink-muted hover:text-clay transition-colors py-2"
              >
                +{experiment.perspectives.length - 3} {t('viz.experiment.morePerspectives')}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
