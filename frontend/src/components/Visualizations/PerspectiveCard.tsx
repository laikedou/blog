'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
}

export default function PerspectiveCard({ experiment }: Props) {
  const t = useTranslations();

  return (
    <Card className="border-border shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-6">
        <h3 className="font-display text-display-xs text-ink mb-1">{experiment.title}</h3>
        <p className="text-body-sm text-ink-muted mb-4">{experiment.description}</p>

        <div className="space-y-2">
          {experiment.perspectives.map((p) => (
            <Link
              key={p.id}
              href={`/experiments/${experiment.id}?p=${p.id}`}
              className="block px-4 py-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-clay/10 flex items-center justify-center shrink-0">
                  {p.visualization.subject === 'math' ? (
                    <BookOpen className="h-4 w-4 text-clay" />
                  ) : (
                    <Atom className="h-4 w-4 text-clay" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-label-sm text-label-sm text-ink group-hover:text-clay transition-colors">
                    {p.perspectiveName}
                  </p>
                  <p className="text-caption-sm text-ink-muted truncate">{p.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
