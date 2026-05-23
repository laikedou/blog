'use client';

import { useTranslations } from 'next-intl';
import { History, RotateCcw, GitCompare, Loader2 } from 'lucide-react';

interface VersionInfo {
  id: number;
  version: number;
  changeNote: string;
  createdAt: string;
}

interface Props {
  versions: VersionInfo[];
  currentVersion: number;
  accentColor: string;
  loading: boolean;
  diffMode: boolean;
  selectedForDiff: number | null;
  onRestore: (versionId: number) => void;
  onStartDiff: (versionId: number) => void;
  onCancelDiff: () => void;
}

export default function AIToolTabVersions({
  versions,
  currentVersion,
  accentColor,
  loading,
  diffMode,
  selectedForDiff,
  onRestore,
  onStartDiff,
  onCancelDiff,
}: Props) {
  const t = useTranslations('viz.tools');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
        <History className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/25">{t('versionHistory') || 'No versions yet'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {diffMode && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <GitCompare className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-white/50">
            {selectedForDiff ? t('diff.selectSecond') : t('diff.selectFirst')}
          </span>
          <button onClick={onCancelDiff} className="ml-auto text-xs text-white/30 hover:text-white/60">
            {t('cancel')}
          </button>
        </div>
      )}

      <div className="relative pl-6 space-y-1">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />

        {versions.map((v) => {
          const isCurrent = v.version === currentVersion;
          return (
            <div key={v.id} className="relative pb-4 last:pb-0">
              {/* Dot */}
              <div
                className={`absolute left-[-13px] top-1.5 w-[7px] h-[7px] rounded-full transition-all ${
                  isCurrent ? 'ring-2 ring-offset-2 ring-offset-[rgb(12,16,32)]' : ''
                }`}
                style={{
                  background: isCurrent ? accentColor : 'rgba(255,255,255,0.2)',
                  ...(isCurrent ? { boxShadow: `0 0 8px ${accentColor}60` } : {}),
                }}
              />

              <div
                className={`rounded-xl border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-white/[0.04] border-white/[0.08]'
                    : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color: isCurrent ? accentColor : 'rgba(255,255,255,0.5)' }}
                      >
                        v{v.version}
                      </span>
                      {isCurrent && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: `${accentColor}15`, color: accentColor }}
                        >
                          {t('currentVersion') || 'Current'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5 truncate">
                      {v.changeNote || (t('noDescription') || 'No description')}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {new Date(v.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isCurrent && !diffMode && (
                      <button
                        onClick={() => onRestore(v.id)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                        title={t('restoreVersion') || 'Restore'}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!isCurrent && diffMode && (
                      <button
                        onClick={() => onStartDiff(v.id)}
                        className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                        title={t('common.compare')}
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
