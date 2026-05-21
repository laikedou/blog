'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';

export default function EmbedPage() {
  const t = useTranslations();
  const params = useParams();
  const id = Number(params.id);
  const [viz, setViz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    visualizations.get(id)
      .then(setViz)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!viz || !viz.htmlContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white/60 text-sm">
{t('vizNotFound')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HtmlVisualizationRenderer
        htmlContent={viz.htmlContent}
        visualizationId={viz.id}
        className="min-h-screen"
      />
    </div>
  );
}
