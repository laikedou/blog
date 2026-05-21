'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import { diffLines, Change } from 'diff';

interface VersionDiffProps {
  visualizationId: number;
  fromVersionId: number;
  toVersionId: number;
  fromLabel?: string;
  toLabel?: string;
}

export default function VersionDiff({
  visualizationId,
  fromVersionId,
  toVersionId,
  fromLabel,
  toLabel,
}: VersionDiffProps) {
  const t = useTranslations();
  const [tab, setTab] = useState<'code' | 'visual'>('code');
  const [loading, setLoading] = useState(true);
  const [diffResult, setDiffResult] = useState<Change[]>([]);
  const [htmlFrom, setHtmlFrom] = useState('');
  const [htmlTo, setHtmlTo] = useState('');

  useEffect(() => {
    setLoading(true);
    visualizations
      .compareVersions(visualizationId, fromVersionId, toVersionId)
      .then((res) => {
        setHtmlFrom(res.htmlContentFrom || '');
        setHtmlTo(res.htmlContentTo || '');
        setDiffResult(diffLines(res.htmlContentFrom || '', res.htmlContentTo || ''));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visualizationId, fromVersionId, toVersionId]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-container-highest/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const addedCount = diffResult.filter((d) => d.added).length;
  const removedCount = diffResult.filter((d) => d.removed).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setTab('code')}
          className={`px-3 py-1.5 rounded-md text-label-sm font-label-sm transition-all ${
            tab === 'code'
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">code</span>
          {t('admin.vizCodeDiff')}
        </button>
        <button
          onClick={() => setTab('visual')}
          className={`px-3 py-1.5 rounded-md text-label-sm font-label-sm transition-all ${
            tab === 'visual'
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">visibility</span>
          {t('admin.vizVisualPreview')}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-green-600/30 border border-green-600/50" />
          +{addedCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-red-600/30 border border-red-600/50" />
          -{removedCount}
        </span>
        <span className="text-on-surface-variant/60">
          {fromLabel || `v${fromVersionId}`} → {toLabel || `v${toVersionId}`}
        </span>
      </div>

      {tab === 'code' ? (
        <div
          className="border border-white/10 rounded-lg overflow-hidden bg-surface-container-low font-mono text-[13px] leading-relaxed"
          style={{ maxHeight: 480, overflowY: 'auto' }}
        >
          {diffResult.map((change, i) => {
            const bg = change.added
              ? 'bg-green-600/10 border-l-2 border-green-600/50'
              : change.removed
                ? 'bg-red-600/10 border-l-2 border-red-600/50'
                : '';
            const prefix = change.added ? '+' : change.removed ? '-' : ' ';
            const textColor = change.added
              ? 'text-green-400/90'
              : change.removed
                ? 'text-red-400/90'
                : 'text-on-surface-variant/70';
            return (
              <div key={i} className={`flex ${bg} ${textColor}`}>
                <span className="w-8 shrink-0 text-right pr-2 py-px text-white/20 select-none border-r border-white/5 mr-2">
                  {i + 1}
                </span>
                <span className="whitespace-pre-wrap py-px break-all">{prefix}{change.value}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1.5">{fromLabel || t('admin.vizVersionNumber', { version: fromVersionId })}</p>
            <div className="border border-white/10 rounded-lg overflow-hidden bg-surface-container-low" style={{ height: 320 }}>
              <HtmlVisualizationRenderer htmlContent={htmlFrom} visualizationId={visualizationId} className="h-full" />
            </div>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1.5">{toLabel || t('admin.vizVersionNumber', { version: toVersionId })}</p>
            <div className="border border-white/10 rounded-lg overflow-hidden bg-surface-container-low" style={{ height: 320 }}>
              <HtmlVisualizationRenderer htmlContent={htmlTo} visualizationId={visualizationId} className="h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
