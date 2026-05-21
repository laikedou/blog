'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { Layers, Eye, Heart, Loader2 } from 'lucide-react';

interface RelatedViz {
  id: number;
  title: string;
  subject: string;
  description: string;
  featuredImage: string;
  viewCount: number;
  likesCount: number;
  version: number;
  createdAt: string;
  author: { id: number; username: string; displayName: string };
}

interface Props {
  visualizationId: number;
  currentSubject: string;
}

export default function RelatedVisualizations({ visualizationId, currentSubject }: Props) {
  const t = useTranslations();
  const [items, setItems] = useState<RelatedViz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    visualizations.getRelated(visualizationId)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visualizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-ink-muted" />
        <h3 className="font-display text-display-sm text-ink">{t('viz.relatedVisualizations')}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/visualizations/${item.id}`}
            className="group block bg-white rounded-editorial-xs border border-border overflow-hidden hover:shadow-elevated transition-all"
          >
            <div className="h-32 bg-gradient-to-br from-cream-200 to-cream-300 flex items-center justify-center overflow-hidden">
              {item.featuredImage ? (
                <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <Layers className="h-10 w-10 text-ink-muted/30" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-caption-sm px-1.5 py-0.5 rounded-editorial-xs font-medium ${
                  item.subject === 'math' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.subject}
                </span>
                <span className="text-caption-sm text-ink-muted">v{item.version}</span>
              </div>
              <h4 className="text-body-sm font-medium text-ink group-hover:text-clay transition-colors line-clamp-1 mb-1">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-caption-sm text-ink-muted line-clamp-1 mb-2">{item.description}</p>
              )}
              <div className="flex items-center gap-3 text-caption-sm text-ink-muted">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.viewCount}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.likesCount}</span>
                <span className="ml-auto">{item.author.displayName}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
