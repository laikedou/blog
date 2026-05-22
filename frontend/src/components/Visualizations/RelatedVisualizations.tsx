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
        <Loader2 className="h-5 w-5 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-on-surface-variant" />
        <h3 className="font-display text-display-sm text-on-surface">{t('viz.relatedVisualizations')}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/visualizations/${item.id}`}
            className="group block bg-surface-container-high rounded-editorial-xs border border-outline-variant/50 overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="h-32 bg-surface-container-lowest flex items-center justify-center overflow-hidden relative">
              {item.featuredImage ? (
                <img
                  src={item.featuredImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                />
              ) : (
                <Layers className="h-10 w-10 text-on-surface-variant/20" />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-surface/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-on-surface text-caption-sm font-medium bg-surface/80 backdrop-blur-sm px-3 py-1 rounded-pill">
                  {t('viz.viewInteract')}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-caption-sm px-2 py-0.5 rounded-pill font-medium ${
                  item.subject === 'math'
                    ? 'bg-blue-400/10 text-blue-300 border border-blue-400/20'
                    : 'bg-green-400/10 text-green-300 border border-green-400/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.subject === 'math' ? 'bg-blue-400' : 'bg-green-400'}`} />
                  {item.subject}
                </span>
                <span className="text-caption-sm text-on-surface-variant/60">v{item.version}</span>
              </div>
              <h4 className="text-body-sm font-medium text-on-surface group-hover:text-clay transition-colors line-clamp-1 mb-1">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-caption-sm text-on-surface-variant/60 line-clamp-1 mb-2">{item.description}</p>
              )}
              <div className="flex items-center gap-3 text-caption-sm text-on-surface-variant/60">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.viewCount}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.likesCount}</span>
                <span className="ml-auto truncate max-w-[80px]">{item.author.displayName}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
