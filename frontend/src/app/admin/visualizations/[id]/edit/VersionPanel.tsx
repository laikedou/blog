'use client';

import { useState, useCallback, useEffect } from 'react';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import VersionDiff from '@/components/Visualizations/VersionDiff';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface VersionInfo {
  id: number;
  version: number;
  changeNote: string;
  prompt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface VersionPanelProps {
  visualizationId: number;
  currentCode: string;
  onRestore: (htmlContent: string) => void;
}

export function VersionPanel({ visualizationId, currentCode, onRestore }: VersionPanelProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [diffMode, setDiffMode] = useState(false);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await visualizations.getVersions(visualizationId);
      setVersions(list);
    } catch {
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, [visualizationId]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleSelectVersion = async (v: VersionInfo) => {
    setSelectedVersion(v);
    if (v.isCurrent) {
      setPreviewCode(currentCode);
    } else {
      try {
        const detail = await visualizations.getVersionDetail(visualizationId, v.id);
        setPreviewCode(detail.htmlContent);
      } catch {
        toast.error('Failed to load version');
      }
    }
  };

  const handleRestore = async (v: VersionInfo) => {
    setRestoring(v.id);
    try {
      const result = await visualizations.restoreVersion(visualizationId, v.id, `Restored from version ${v.version}`);
      onRestore(result.htmlContent);
      toast.success(`Restored version ${v.version}`);
      loadVersions();
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t('admin.vizVersionCount', { count: versions.length })}</p>
        </div>
        <button
          onClick={loadVersions}
          disabled={loading}
          className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg p-1.5 transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {loading && versions.length === 0 ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-lg bg-surface-container-highest/30 animate-pulse" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">history</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{t('admin.vizNoVersionHistory')}</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[17px] top-3 bottom-3 w-px bg-white/5" />
            {versions.map(v => {
              const isSelected = selectedVersion?.id === v.id;
              return (
                <div key={v.id} className="relative pl-10 pb-4 group">
                  <div className={`absolute left-[13px] top-[6px] w-[10px] h-[10px] rounded-full border-2 transition-colors ${
                    v.isCurrent ? 'bg-tertiary border-tertiary' : isSelected ? 'bg-tertiary/20 border-tertiary' : 'bg-surface border-white/20 group-hover:border-tertiary/50'
                  }`} />
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-primary/5 border-primary/20'
                        : v.isCurrent
                          ? 'bg-surface-container-low border-white/5'
                          : 'bg-surface-container border-white/5 hover:border-primary/20 hover:bg-surface-container-low'
                    }`}
                    onClick={() => handleSelectVersion(v)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-body-sm text-body-sm font-semibold text-on-surface">v{v.version}</span>
                        {v.isCurrent && (
                          <span className="text-label-sm text-[11px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded-full border border-tertiary/20">
                            {t('admin.vizCurrent')}
                          </span>
                        )}
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {new Date(v.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{v.changeNote || v.prompt?.slice(0, 80) || t('admin.vizNoDescription')}</p>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                        {!v.isCurrent && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(v); }}
                            disabled={restoring === v.id}
                            className="h-7 px-2 rounded-lg text-label-sm font-label-sm transition-all disabled:opacity-50 flex items-center gap-1"
                            style={{
                              background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                              color: '#ffffff',
                              border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                            }}
                          >
                            {restoring === v.id ? (
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">restore</span>
                            )}
                            {t('admin.vizRestore')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedVersion && previewCode && !selectedVersion.isCurrent && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-body-sm text-body-sm font-semibold text-on-surface">
              {diffMode ? t('admin.vizComparing') : t('admin.vizPreviewVersion', { version: selectedVersion.version })}
            </h4>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDiffMode(!diffMode)}
                className={`px-2 py-1 rounded-lg text-label-sm font-label-sm transition-all flex items-center gap-1 ${
                  diffMode
                    ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                    : 'bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{diffMode ? 'code_off' : 'difference'}</span>
                {diffMode ? t('common.hide') : t('admin.vizDiff')}
              </button>
              <button
                onClick={() => { setSelectedVersion(null); setPreviewCode(null); setDiffMode(false); }}
                className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>
          {diffMode ? (
            <VersionDiff
              visualizationId={visualizationId}
              fromVersionId={selectedVersion.id}
              toVersionId={versions.find(v => v.isCurrent)?.id || selectedVersion.id}
              fromLabel={`v${selectedVersion.version}`}
              toLabel={t('admin.vizCurrent')}
            />
          ) : (
            <div
              className="border border-white/10 rounded-lg overflow-hidden bg-surface-container-low"
              style={{ height: 200 }}
            >
              <HtmlVisualizationRenderer htmlContent={previewCode} visualizationId={visualizationId} className="h-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface VersionPanelCompactProps {
  visualizationId: number;
  currentCode: string;
  onRestore: (htmlContent: string) => void;
}

export function VersionPanelCompact({ visualizationId, currentCode, onRestore }: VersionPanelCompactProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try { setVersions(await visualizations.getVersions(visualizationId)); } catch {} finally { setLoading(false); }
  }, [visualizationId]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleRestore = async (v: VersionInfo) => {
    setRestoring(v.id);
    try {
      const result = await visualizations.restoreVersion(visualizationId, v.id, `Restored from version ${v.version}`);
      onRestore(result.htmlContent);
      toast.success(`Restored version ${v.version}`);
      loadVersions();
    } catch { toast.error('Failed to restore version'); } finally { setRestoring(null); }
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgba(34, 42, 61, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-body-sm text-body-sm font-semibold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">history</span>
          {t('admin.vizVersions')}
        </h4>
        <button
          onClick={loadVersions}
          disabled={loading}
          className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg p-1 transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-surface-container-highest/30 animate-pulse" />)}</div>
      ) : versions.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-4">{t('admin.vizNoVersionHistory')}</p>
      ) : (
        <div className="space-y-1">
          {versions.slice(0, 5).map(v => (
            <div key={v.id} className={`flex items-center justify-between p-2 rounded-lg text-body-sm ${v.isCurrent ? 'bg-tertiary/5 border border-tertiary/10' : 'hover:bg-white/5'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-mono font-semibold ${v.isCurrent ? 'text-tertiary' : 'text-on-surface'}`}>v{v.version}</span>
                <span className="text-on-surface-variant truncate font-body-sm text-body-sm">{v.changeNote?.slice(0, 30) || `v${v.version}`}</span>
              </div>
              {!v.isCurrent && (
                <button
                  onClick={() => handleRestore(v)}
                  disabled={restoring === v.id}
                  className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg p-1 transition-colors disabled:opacity-50 shrink-0"
                >
                  {restoring === v.id ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-[14px]">restore</span>
                  )}
                </button>
              )}
            </div>
          ))}
          {versions.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg py-1.5 text-label-sm font-label-sm mt-1 transition-colors"
            >
              {showAll ? t('admin.vizShowLess') || 'Show less' : t('admin.vizViewAllVersions', { count: versions.length })}
            </button>
          )}
        </div>
      )}

      {/* Inline full version panel when "View All" is clicked */}
      {showAll && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <VersionPanel visualizationId={visualizationId} currentCode={currentCode} onRestore={onRestore} />
        </div>
      )}
    </div>
  );
}
