'use client';

import { BookOpen, Atom, Clock, User, Eye, BarChart3, Share2, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
    <div className="mb-6 animate-fade-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-caption-sm mb-4" aria-label={t('common.breadcrumb')}>
        <Link
          href="/visualizations"
          className="text-on-surface-variant/60 hover:text-on-surface transition-colors"
        >
          {t('viz.browseAll')}
        </Link>
        <ChevronRight className="h-3 w-3 text-on-surface-variant/40" />
        <Link
          href={`/visualizations?subject=${viz.subject}`}
          className="text-on-surface-variant/60 hover:text-on-surface transition-colors"
        >
          {viz.subject === 'math' ? t('viz.mathematics') : t('viz.physicsLabel')}
        </Link>
        <ChevronRight className="h-3 w-3 text-on-surface-variant/40" />
        <span className="text-on-surface-variant truncate max-w-[200px]">{viz.title}</span>
      </nav>

      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 text-caption-sm font-medium px-2.5 py-1 rounded-pill border ${
          viz.subject === 'math'
            ? 'bg-blue-400/10 text-blue-300 border-blue-400/20'
            : 'bg-green-400/10 text-green-300 border-green-400/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${viz.subject === 'math' ? 'bg-blue-400' : 'bg-green-400'}`} />
          {viz.subject === 'math' ? <BookOpen className="h-3 w-3" /> : <Atom className="h-3 w-3" />}
          {viz.subject === 'math' ? t('viz.mathematics') : t('viz.physicsLabel')}
        </span>
        <span className="text-caption-sm text-on-surface-variant/60 bg-surface-container-high px-2 py-1 rounded-pill border border-outline-variant/30">
          {t('viz.versionLabel', { version: viz.version })}
        </span>
        {viz.aiGenerated && (
          <span className="inline-flex items-center gap-1 text-caption-sm text-clay bg-clay/5 px-2 py-1 rounded-pill border border-clay/20">
            <Sparkles className="h-3 w-3" />
            {t('viz.aiGenerated')}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className={`font-display text-display-lg bg-gradient-to-r bg-clip-text text-transparent ${
              viz.subject === 'math'
                ? 'from-blue-400 via-blue-300 to-purple-400'
                : 'from-cyan-400 via-teal-300 to-green-400'
            }`}
          >
            {viz.title}
          </h1>
          {viz.description && (
            <p className="text-lead text-on-surface-variant mt-2 max-w-reading">{viz.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <VisualizationLikeButton visualizationId={visualizationId} initialLikes={viz.likesCount || 0} />
          <Button variant="outline" size="sm" onClick={onShare} className="gap-1.5 hover:bg-surface-container-high transition-colors">
            <Share2 className="h-4 w-4" />
            {t('viz.share')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-caption-sm text-on-surface-variant/60">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {viz.author?.displayName || viz.author?.username}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {new Date(viz.createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          {t('viz.views', { count: viz.viewCount || 0 })}
        </span>
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          {t('viz.updated')} {new Date(viz.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
