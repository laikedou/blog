'use client';

import { useState, useCallback, useEffect } from 'react';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  History, RotateCcw, RefreshCw, X, Loader2, ArrowLeftRight,
} from 'lucide-react';
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
          <p className="text-caption-sm text-ink-muted">{t('admin.vizVersionCount', { count: versions.length })}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadVersions} disabled={loading} className="h-7">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        {loading && versions.length === 0 ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-editorial-xs bg-cream-300 animate-pulse" />)}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-8 w-8 mx-auto mb-2 text-ink-faint" />
            <p className="text-caption-sm text-ink-muted">{t('admin.vizNoVersionHistory')}</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[17px] top-3 bottom-3 w-px bg-border" />
            {versions.map(v => {
              const isSelected = selectedVersion?.id === v.id;
              return (
                <div key={v.id} className="relative pl-10 pb-4 group">
                  <div className={`absolute left-[13px] top-[6px] w-[10px] h-[10px] rounded-full border-2 ${
                    v.isCurrent ? 'bg-clay border-clay' : isSelected ? 'bg-clay/20 border-clay' : 'bg-surface border-border group-hover:border-clay/50 transition-colors'
                  }`} />
                  <div
                    className={`p-3 rounded-editorial-xs cursor-pointer transition-all border ${
                      isSelected ? 'bg-clay-pale border-clay/20 shadow-sm' : v.isCurrent ? 'bg-surface-warm border-border' : 'bg-surface border-border hover:border-clay/20 hover:bg-surface-warm'
                    }`}
                    onClick={() => handleSelectVersion(v)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body-sm font-semibold text-ink">v{v.version}</span>
                        {v.isCurrent && <Badge variant="default" className="text-caption-xs h-4 px-1.5 bg-clay text-white border-0">{t('admin.vizCurrent')}</Badge>}
                      </div>
                      <span className="text-caption-xs text-ink-muted">
                        {new Date(v.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-caption-sm text-ink-muted line-clamp-1">{v.changeNote || v.prompt?.slice(0, 80) || t('admin.vizNoDescription')}</p>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                        {!v.isCurrent && (
                          <Button size="sm" variant="default" className="h-7 text-caption-xs" onClick={(e) => { e.stopPropagation(); handleRestore(v); }} disabled={restoring === v.id}>
                            {restoring === v.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                            {t('admin.vizRestore')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {selectedVersion && previewCode && !selectedVersion.isCurrent && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-caption-sm font-semibold text-ink">{t('admin.vizPreviewVersion', { version: selectedVersion.version })}</h4>
            <Button variant="ghost" size="sm" className="h-6 text-caption-xs" onClick={() => { setSelectedVersion(null); setPreviewCode(null); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="border border-border rounded-editorial-xs overflow-hidden bg-white" style={{ height: 200 }}>
            <HtmlVisualizationRenderer htmlContent={previewCode} visualizationId={visualizationId} className="h-full" />
          </div>
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
    <div className="p-4 rounded-editorial-sm border border-border bg-surface">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-caption-sm font-semibold text-ink flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" /> {t('admin.vizVersions')}
        </h4>
        <Button variant="ghost" size="sm" onClick={loadVersions} disabled={loading} className="h-6 w-6 p-0">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-editorial-xs bg-cream-300 animate-pulse" />)}</div>
      ) : versions.length === 0 ? (
        <p className="text-caption-sm text-ink-muted text-center py-4">{t('admin.vizNoVersionHistory')}</p>
      ) : (
        <div className="space-y-1">
          {versions.slice(0, 5).map(v => (
            <div key={v.id} className={`flex items-center justify-between p-2 rounded-editorial-xs text-caption-sm ${v.isCurrent ? 'bg-clay-pale border border-clay/10' : 'hover:bg-surface-warm'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-mono font-semibold ${v.isCurrent ? 'text-clay' : 'text-ink'}`}>v{v.version}</span>
                <span className="text-ink-muted truncate text-caption-xs">{v.changeNote?.slice(0, 30) || `v${v.version}`}</span>
              </div>
              {!v.isCurrent && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleRestore(v)} disabled={restoring === v.id}>
                  {restoring === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                </Button>
              )}
            </div>
          ))}
          {versions.length > 5 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-caption-xs mt-1">{t('admin.vizViewAllVersions', { count: versions.length })}</Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:max-w-[400px]">
                <SheetHeader className="mb-6"><SheetTitle>{t('admin.vizVersions')}</SheetTitle></SheetHeader>
                <VersionPanel visualizationId={visualizationId} currentCode={currentCode} onRestore={onRestore} />
              </SheetContent>
            </Sheet>
          )}
        </div>
      )}
    </div>
  );
}
