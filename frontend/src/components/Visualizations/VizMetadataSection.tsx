'use client';

import { BookOpen, Atom, Clock, User, Eye, BarChart3, Share2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import VisualizationLikeButton from './VisualizationLikeButton';

interface Props {
  viz: any;
  visualizationId: number;
  onShare: () => void;
}

export default function VizMetadataSection({ viz, visualizationId, onShare }: Props) {
  const t = useTranslations();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-caption-sm font-medium px-2 py-0.5 rounded-pill inline-flex items-center gap-1 ${
          viz.subject === 'math' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {viz.subject === 'math' ? <BookOpen className="h-3 w-3" /> : <Atom className="h-3 w-3" />}
          {viz.subject === 'math' ? t('viz.mathematics') : t('viz.physicsLabel')}
        </span>
        <span className="text-caption-sm text-ink-muted">{t('viz.versionLabel', { version: viz.version })}</span>
        {viz.aiGenerated && (
          <span className="inline-flex items-center gap-0.5 text-caption-sm text-ink-muted">
            <Sparkles className="h-3 w-3 text-tertiary" />
            {t('viz.aiGenerated')}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-display-lg text-ink">{viz.title}</h1>
          {viz.description && (
            <p className="text-lead text-ink-muted mt-2 max-w-reading">{viz.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <VisualizationLikeButton visualizationId={visualizationId} initialLikes={viz.likesCount || 0} />
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-1" /> {t('viz.share')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-caption-sm text-ink-muted">
        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {viz.author?.displayName || viz.author?.username}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(viz.createdAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {t('viz.views', { count: viz.viewCount || 0 })}</span>
        <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {t('viz.updated')} {new Date(viz.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
