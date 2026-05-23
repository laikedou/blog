'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { visualizations } from '@/lib/api';
import { Eye, Heart, MousePointerClick, Share2, TrendingUp, Activity } from 'lucide-react';

interface Props {
  visualizationId: number;
  viewCount: number;
  interactCount: number;
  likesCount: number;
}

interface StatsData {
  viewCount: number;
  interactCount: number;
  actions: Record<string, number>;
  dailyStats: Array<{ date: string; count: number }>;
}

function MiniSparkline({ data }: { data: Array<{ date: string; count: number }> }) {
  if (!data || data.length === 0) return null;

  const counts = data.map(d => d.count);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts, 0);
  const range = max - min || 1;

  const width = 100;
  const height = 32;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = counts.map((c, i) => {
    const x = padding + (i / (counts.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((c - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padding},${padding + chartHeight}`,
    ...points,
    `${width - padding},${padding + chartHeight}`,
  ];

  return (
    <div className="flex items-center gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 overflow-visible">
        <defs>
          <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.623 0.214 259.815)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.623 0.214 259.815)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints.join(' ')} fill="url(#spark-gradient)" />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="oklch(0.623 0.214 259.815)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    const from = display;
    const to = value;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

export default function VizStatsPanel({ visualizationId, viewCount, interactCount, likesCount }: Props) {
  const t = useTranslations();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    visualizations.getStats(visualizationId)
      .then(s => setStats(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visualizationId]);

  const shareCount = stats?.actions?.share ?? 0;
  const totalActions = (stats?.viewCount ?? viewCount) + (stats?.interactCount ?? interactCount);

  const statItems = [
    { icon: Eye, label: 'views', value: stats?.viewCount ?? viewCount, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Heart, label: 'likes', value: likesCount, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { icon: MousePointerClick, label: 'interactions', value: stats?.interactCount ?? interactCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Share2, label: 'shares', value: shareCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const hasDailyData = stats?.dailyStats && stats.dailyStats.length > 1;

  return (
    <div className="h-full flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant">
        <div className="w-7 h-7 rounded-lg bg-clay/10 border border-clay/20 flex items-center justify-center">
          <TrendingUp className="h-3.5 w-3.5 text-clay" />
        </div>
        <h3 className="font-display text-display-xs text-on-surface">
          {t('viz.stats.title')}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Engagement overview */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Total engagement card */}
            <div className="rounded-xl bg-gradient-to-br from-clay/10 via-tertiary/10 to-surface-container-high p-4 border border-outline-variant/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-clay" />
                <span className="text-caption-sm text-on-surface-variant/70 uppercase tracking-wider">
                  {t('viz.stats.totalEngagement')}
                </span>
              </div>
              <div className="text-display-md font-bold text-on-surface">
                <AnimatedNumber value={totalActions} />
              </div>
              <p className="text-caption-sm text-on-surface-variant/60 mt-0.5">
                {t('viz.stats.acrossAllActions')}
              </p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
              {statItems.map(item => (
                <div
                  key={item.label}
                  className="rounded-xl bg-surface-container-high border border-outline-variant/30 p-3.5 hover:border-outline-variant/50 transition-colors duration-200"
                >
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="text-display-xs font-semibold text-on-surface">
                    <AnimatedNumber value={item.value} />
                  </div>
                  <p className="text-caption-sm text-on-surface-variant/60 mt-0.5">
                    {t(`viz.stats.${item.label}`)}
                  </p>
                </div>
              ))}
            </div>

            {/* Views trend sparkline */}
            {hasDailyData && (
              <div className="rounded-xl bg-surface-container-high border border-outline-variant/30 p-4">
                <p className="text-caption-sm text-on-surface-variant/60 uppercase tracking-wider mb-3">
                  {t('viz.stats.viewsTrend')}
                </p>
                <MiniSparkline data={stats.dailyStats} />
                <div className="flex justify-between mt-2 text-caption-xs text-on-surface-variant/40">
                  <span>{stats.dailyStats[0]?.date}</span>
                  <span>{stats.dailyStats[stats.dailyStats.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* Quick insight */}
            {totalActions > 0 && (
              <div className="rounded-xl bg-surface-warm border border-outline-variant/20 p-4">
                <p className="text-caption-xs text-on-surface-variant/50 uppercase tracking-wider mb-1">
                  {t('viz.stats.insight')}
                </p>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {viewCount > 0 && interactCount > 0
                    ? t('viz.stats.insightEngaged', {
                        rate: Math.round((interactCount / viewCount) * 100),
                      })
                    : t('viz.stats.insightDefault')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
