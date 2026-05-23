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

export default function VizCoverSection({ viz, visualizationId, onShare }: Props) {
  const t = useTranslations();
  const isMath = viz.subject === 'math';
  const accentColor = isMath ? '#60a5fa' : '#2dd4bf';

  const coverUrl = viz.featuredImage
    ? `${process.env.NEXT_PUBLIC_API_URL || ''}${viz.featuredImage}`
    : null;

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl" style={{ minHeight: 340 }}>
      {/* Cover image background */}
      {coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}

      {/* Fallback gradient when no cover */}
      {!coverUrl && (
        <div
          className="absolute inset-0"
          style={{
            background: isMath
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
          }}
        />
      )}

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(8,12,24,0.4) 0%, rgba(8,12,24,0.75) 60%, rgba(8,12,24,0.95) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs mb-4 animate-fade-up" aria-label={t('common.breadcrumb')}>
          <Link href="/visualizations" className="text-white/35 hover:text-white/60 transition-colors">
            {t('viz.browseAll')}
          </Link>
          <ChevronRight className="h-3 w-3 text-white/20" />
          <Link
            href={`/visualizations?subject=${viz.subject}`}
            className="text-white/35 hover:text-white/60 transition-colors"
          >
            {isMath ? t('viz.mathematics') : t('viz.physicsLabel')}
          </Link>
          <ChevronRight className="h-3 w-3 text-white/20" />
          <span className="text-white/50 truncate max-w-[200px]">{viz.title}</span>
        </nav>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border"
            style={{
              background: `${accentColor}14`,
              borderColor: `${accentColor}28`,
              color: accentColor,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
            {isMath ? <BookOpen className="h-3 w-3" /> : <Atom className="h-3 w-3" />}
            {isMath ? t('viz.mathematics') : t('viz.physicsLabel')}
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-white/35 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            {t('viz.versionLabel', { version: viz.version })}
          </span>

          {viz.aiGenerated && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
              style={{ color: accentColor, background: `${accentColor}0a`, borderColor: `${accentColor}1a` }}
            >
              <Sparkles className="h-3 w-3" />
              {t('viz.aiGenerated')}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white max-w-3xl">
            {viz.title}
          </h1>

          {viz.description && (
            <p className="text-sm sm:text-base text-white/55 mt-3 max-w-2xl leading-relaxed">
              {viz.description}
            </p>
          )}
        </div>

        {/* Stats + Actions */}
        <div className="flex flex-wrap items-center gap-4 mt-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
            {viz.author?.displayName && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-white/25" />
                {viz.author.displayName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-white/25" />
              {new Date(viz.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-white/25" />
              {t('viz.views', { count: viz.viewCount || 0 })}
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-white/25" />
              {t('viz.updated')} {new Date(viz.updatedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <VisualizationLikeButton visualizationId={visualizationId} initialLikes={viz.likesCount || 0} />
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-1.5 border-white/[0.08] text-white/60 hover:text-white/80 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
            >
              <Share2 className="h-4 w-4" />
              {t('viz.share')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
