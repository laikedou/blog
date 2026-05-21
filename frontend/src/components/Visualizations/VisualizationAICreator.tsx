'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from './VisualizationRenderer';
import VersionDiff from './VersionDiff';
import CodePreview from './CodePreview';
import { useVisualizationStream } from '@/hooks/useVisualizationStream';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Sparkles, Send, Check, RotateCcw, AlertCircle, Loader2, Save, Eye, Wand2,
  ChevronLeft, ChevronRight, X, Code2, History, RefreshCw, FileCode2,
  Clock, ArrowLeftRight, BookOpen, Atom, FunctionSquare, Shuffle,
  Layers, Download, Copy, Trash2, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────

/** Strip markdown code fences from AI-generated code */
function stripCodeFences(code: string): string {
  return code.replace(/^```(?:html|jsx?|javascript)?\s*\n?([\s\S]*?)```\s*$/gm, '$1').trim();
}

// ─── Types ───────────────────────────────────────────────────

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  subject: 'math' | 'physics';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface VersionInfo {
  id: number;
  version: number;
  changeNote: string;
  prompt: string;
  createdAt: string;
  isCurrent: boolean;
}

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-clay-pale text-clay',
};

// ─── Topic Step ──────────────────────────────────────────────

interface TopicStepProps {
  onComplete: (data: { title: string; subject: 'math' | 'physics'; prompt: string }) => void;
}

function TopicStep({ onComplete }: TopicStepProps) {
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<'math' | 'physics'>('math');
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const loadSuggestions = useCallback(async (subj?: string) => {
    setLoadingTopics(true);
    try {
      const topics = await visualizations.suggestTopics({ subject: subj, count: 6 });
      setSuggestions(topics);
    } catch {
      // Silently fail — user can still type manually
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions(subject);
  }, [subject, loadSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onComplete({ title: title.trim() || prompt.trim().slice(0, 80), subject, prompt: prompt.trim() });
  };

  const handleSuggestionClick = (s: TopicSuggestion) => {
    setSubject(s.subject);
    setPrompt(s.description);
    setTitle(s.title);
  };

  return (
    <div className="space-y-8">
      {/* Subject selector */}
      <div>
        <label className="text-caption-sm text-ink-muted uppercase tracking-wider font-semibold mb-3 block">
          {t('admin.vizSubject')}
        </label>
        <div className="flex gap-2">
          {(['math', 'physics'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setSubject(s); }}
              className={`group relative px-5 py-3 rounded-editorial-sm text-body-sm font-medium transition-all flex-1 ${
                subject === s
                  ? 'bg-clay text-white shadow-md shadow-clay/20'
                  : 'bg-surface-warm text-ink-muted hover:bg-cream-300 border border-border'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {s === 'math' ? (
                  <FunctionSquare className={`h-5 w-5 ${subject === s ? 'text-white' : 'text-ink-muted'}`} />
                ) : (
                  <Atom className={`h-5 w-5 ${subject === s ? 'text-white' : 'text-ink-muted'}`} />
                )}
                <span className="font-medium">{s === 'math' ? t('admin.vizMathematics') : t('admin.vizPhysics')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Topic suggestions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-caption-sm text-ink-muted uppercase tracking-wider font-semibold">
            {t('admin.vizSuggestedTopics')}
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadSuggestions(subject)}
            disabled={loadingTopics}
            className="text-caption-sm h-7"
          >
            <Shuffle className={`h-3.5 w-3.5 mr-1 ${loadingTopics ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
        {loadingTopics && suggestions.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-editorial-sm bg-cream-300 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="group text-left p-4 rounded-editorial-sm bg-surface-warm border border-border hover:border-clay/30 hover:bg-clay-pale/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`text-caption-xs font-semibold px-1.5 py-0.5 rounded-pill flex items-center gap-1 shrink-0 ${
                    s.subject === 'math' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {s.subject === 'math' ? <FunctionSquare className="h-2.5 w-2.5" /> : <Atom className="h-2.5 w-2.5" />}
                    {s.subject === 'math' ? t('admin.vizMathematics') : t('admin.vizPhysics')}
                  </span>
                  <span className={`text-caption-xs px-1.5 py-0.5 rounded-pill ${difficultyColor[s.difficulty] || ''}`}>
                    {s.difficulty === 'beginner' ? t('viz.beginner') : s.difficulty === 'intermediate' ? t('viz.intermediate') : t('viz.advanced')}
                  </span>
                </div>
                <h4 className="text-body-sm font-semibold text-ink group-hover:text-clay transition-colors mb-1">
                  {s.title}
                </h4>
                <p className="text-caption-sm text-ink-muted line-clamp-2 leading-relaxed">
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Custom prompt */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="viz-prompt" className="text-caption-sm text-ink-muted uppercase tracking-wider font-semibold block mb-1.5">
            {t('admin.vizCustomPrompt')}
          </label>
          <Textarea
            id="viz-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={t('viz.promptPlaceholder')}
            rows={3}
            className="w-full resize-none text-body-sm"
          />
        </div>

        <div>
          <label htmlFor="viz-title" className="text-caption-sm text-ink-muted uppercase tracking-wider font-semibold block mb-1.5">
            {t('admin.vizTitle')} <span className="font-normal normal-case text-ink-faint">{t('admin.vizOptional')}</span>
          </label>
          <Input
            id="viz-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('admin.vizTitlePlaceholder')}
          />
        </div>

        <Button type="submit" disabled={!prompt.trim()} size="lg" className="w-full h-12 text-body-sm shadow-md shadow-clay/20 disabled:shadow-none">
          <Sparkles className="h-4 w-4 mr-2" /> {t('admin.vizGenerateBtn')}
        </Button>
      </form>
    </div>
  );
}

// ─── Generate Step ───────────────────────────────────────────

interface GenerateStepProps {
  title: string;
  subject: string;
  prompt: string;
  onGenerated: (data: { id: number; htmlContent: string }) => void;
  onBack: () => void;
}

function GenerateStep({ title, subject, prompt, onGenerated, onBack }: GenerateStepProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { state, start, abort } = useVisualizationStream();
  const generatedRef = useRef(false);
  const codeContainerRef = useRef<HTMLPreElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [state.code]);

  // Estimate progress based on code length
  const progress = Math.min(95, Math.floor(state.code.length / 200));

  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    start({ prompt, subject, title, language: locale });
  }, []);

  useEffect(() => {
    if (state.status === 'complete' && state.fullResponse) {
      const response = state.fullResponse;
      const timer = setTimeout(() => {
        onGenerated({
          id: response.id,
          htmlContent: stripCodeFences(response.htmlContent),
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.fullResponse]);

  if (state.status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-clay" />
          <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-clay/10" />
        </div>
        <div className="text-center">
          <p className="text-body font-medium text-ink">{t('admin.vizConnecting')}</p>
          <p className="text-caption-sm text-ink-muted mt-1">{t('admin.vizPreparing')}</p>
        </div>
      </div>
    );
  }

  if (state.status === 'streaming' || state.status === 'complete') {
    return (
      <div className="space-y-6">
        {/* Progress bar */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {state.status === 'streaming' ? (
                  <div className="w-3 h-3 rounded-full bg-clay animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-teal" />
                )}
                <div>
                  <p className="text-body-sm font-medium text-ink">
                    {state.status === 'streaming' ? t('admin.vizGenerating') : t('admin.vizGenerationComplete')}
                  </p>
                  <p className="text-caption-sm text-ink-muted">
                    {state.status === 'streaming'
                      ? t('admin.vizCharsGenerated', { count: state.code.length.toLocaleString() })
                      : t('admin.vizCharsFinal', { count: state.code.length.toLocaleString() })}
                  </p>
                </div>
              </div>
              {state.status === 'streaming' && (
                <Button variant="outline" size="sm" onClick={abort} className="shrink-0">
                  <X className="h-4 w-4 mr-1" /> {t('common.cancel')}
                </Button>
              )}
            </div>
            {state.status === 'streaming' && (
              <Progress value={progress} className="h-1.5" />
            )}
          </CardContent>
        </Card>

        {/* Code display */}
        <Card className="border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-ink text-cream-100 border-b border-white/10">
            <div className="flex items-center gap-2 text-caption-sm">
              <FileCode2 className="h-4 w-4" />
              {t('admin.vizGeneratedCode')}
              <Badge variant="outline" className="text-caption-xs text-white/60 border-white/20 ml-2">
                {t('admin.vizHtmlJs')}
              </Badge>
            </div>
            {state.status === 'complete' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-cream-100 hover:text-white hover:bg-white/10 h-7"
                onClick={() => { navigator.clipboard.writeText(state.code); toast.success(t('admin.vizCodeCopied')); }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> {t('admin.vizCopy')}
              </Button>
            )}
          </div>
          <pre
            ref={codeContainerRef}
            className="p-5 bg-surface-tile text-cream-100 text-caption-sm font-mono overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap"
          >
            <code>{state.code || t('admin.vizWaitingOutput')}</code>
            {state.status === 'streaming' && (
              <span className="inline-block w-2 h-4 bg-clay animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
        </Card>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <Card className="border-clay/20 bg-clay-pale">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-clay/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-clay" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-clay mb-1">{t('admin.vizGenerationFailed')}</p>
              <p className="text-body-sm text-ink-muted mb-4">{state.error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> {t('admin.vizBack')}
                </Button>
                <Button size="sm" onClick={() => start({ prompt, subject, title })}>
                  <RotateCcw className="h-4 w-4 mr-1" /> {t('common.retry')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'aborted') {
    return (
      <Card className="border-border bg-surface-warm">
        <CardContent className="p-6 text-center">
          <p className="text-body-sm text-ink-muted mb-4">{t('admin.vizGenerationCancelled')}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-1" /> {t('admin.vizBack')}
            </Button>
            <Button size="sm" onClick={() => start({ prompt, subject, title })}>
              <RotateCcw className="h-4 w-4 mr-1" /> {t('common.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

// ─── Version Panel (v0.dev style) ────────────────────────────

function VersionPanel({
  visualizationId,
  currentCode,
  onRestore,
}: {
  visualizationId: number;
  currentCode: string;
  onRestore: (htmlContent: string, version: VersionInfo) => void;
}) {
  const t = useTranslations();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await visualizations.getVersions(visualizationId);
      setVersions(list);
    } catch {
      toast.error(t('admin.vizFailedLoadVersions'));
    } finally {
      setLoading(false);
    }
  }, [visualizationId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleSelectVersion = async (v: VersionInfo) => {
    setSelectedVersion(v);
    if (v.isCurrent) {
      setPreviewCode(currentCode);
    } else {
      try {
        const detail = await visualizations.getVersionDetail(visualizationId, v.id);
        setPreviewCode(detail.htmlContent);
      } catch {
        toast.error(t('admin.vizFailedLoadVersion'));
      }
    }
  };

  const handleRestore = async (v: VersionInfo) => {
    setRestoring(v.id);
    try {
      const result = await visualizations.restoreVersion(visualizationId, v.id, t('admin.vizVersionRestoreNote', { version: v.version }));
      onRestore(result.htmlContent, v);
      toast.success(t('admin.vizVersionRestored'));
      loadVersions();
    } catch {
      toast.error(t('admin.vizFailedRestore'));
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-body-sm font-semibold text-ink">{t('admin.vizVersions')}</h3>
            <p className="text-caption-sm text-ink-muted">{t('admin.vizVersionCount', { count: versions.length })}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadVersions} disabled={loading} className="h-7">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        {loading && versions.length === 0 ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-editorial-xs bg-cream-300 animate-pulse" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-8 w-8 mx-auto mb-2 text-ink-faint" />
            <p className="text-caption-sm text-ink-muted">{t('admin.vizNoVersionHistory')}</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-3 bottom-3 w-px bg-border" />

            {versions.map((v, i) => {
              const isSelected = selectedVersion?.id === v.id;
              const isFirst = i === 0;

              return (
                <div key={v.id} className="relative pl-10 pb-4 group">
                  {/* Timeline dot */}
                  <div className={`absolute left-[13px] top-[6px] w-[10px] h-[10px] rounded-full border-2 ${
                    v.isCurrent
                      ? 'bg-clay border-clay'
                      : isSelected
                        ? 'bg-clay/20 border-clay'
                        : 'bg-surface border-border group-hover:border-clay/50 transition-colors'
                  }`} />

                  <div
                    className={`p-3 rounded-editorial-xs cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-clay-pale border-clay/20 shadow-sm'
                        : v.isCurrent
                          ? 'bg-surface-warm border-border'
                          : 'bg-surface border-border hover:border-clay/20 hover:bg-surface-warm'
                    }`}
                    onClick={() => handleSelectVersion(v)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body-sm font-semibold text-ink">v{v.version}</span>
                        {v.isCurrent && (
                          <Badge variant="default" className="text-caption-xs h-4 px-1.5 bg-clay text-white border-0">
                            {t('admin.vizCurrent')}
                          </Badge>
                        )}
                      </div>
                      <span className="text-caption-xs text-ink-muted">
                        {new Date(v.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-caption-sm text-ink-muted line-clamp-1">
                      {v.changeNote || v.prompt?.slice(0, 80) || t('admin.vizNoDescription')}
                    </p>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                        {!v.isCurrent && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-caption-xs"
                              onClick={(e) => { e.stopPropagation(); handleRestore(v); }}
                              disabled={restoring === v.id}
                            >
                              {restoring === v.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <RotateCcw className="h-3 w-3 mr-1" />
                              )}
                              {t('admin.vizRestore')}
                            </Button>
                            {previewCode && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-caption-xs"
                                onClick={(e) => { e.stopPropagation(); setShowDiff(!showDiff); }}
                              >
                                <ArrowLeftRight className="h-3 w-3 mr-1" />
                                {t('admin.vizDiff')}
                              </Button>
                            )}
                          </>
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

      {/* Preview / Diff panel when version selected */}
      {selectedVersion && previewCode && !selectedVersion.isCurrent && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-caption-sm font-semibold text-ink">
              {showDiff ? t('admin.vizComparing') : t('admin.vizPreviewVersion', { version: selectedVersion.version })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-caption-xs"
              onClick={() => { setSelectedVersion(null); setPreviewCode(null); setShowDiff(false); }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {showDiff ? (
            <VersionDiff
              visualizationId={visualizationId}
              fromVersionId={selectedVersion.id}
              toVersionId={versions.find(v => v.isCurrent)?.id || selectedVersion.id}
              fromLabel={`v${selectedVersion.version}`}
              toLabel={t('admin.vizCurrent')}
            />
          ) : (
            <div className="border border-border rounded-editorial-xs overflow-hidden bg-white" style={{ height: 200 }}>
              <HtmlVisualizationRenderer
                htmlContent={previewCode}
                visualizationId={visualizationId}
                className="h-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Review Step ─────────────────────────────────────────────

interface ReviewStepProps {
  visualizationId: number;
  initialCode: string;
  onSave: () => void;
  onBack: () => void;
}

function ReviewStep({ visualizationId, initialCode, onSave, onBack }: ReviewStepProps) {
  const [code, setCode] = useState(() => stripCodeFences(initialCode));
  const [feedback, setFeedback] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [detailedExplanation, setDetailedExplanation] = useState('');
  const [knowledgeSummary, setKnowledgeSummary] = useState('');
  const [refining, setRefining] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const t = useTranslations();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  useEffect(() => {
    visualizations.get(visualizationId).then(v => {
      setTitle(v.title);
      setDescription(v.description || '');
      setIntroduction(v.introduction || '');
      setDetailedExplanation(v.detailedExplanation || '');
      setKnowledgeSummary(v.knowledgeSummary || '');
    }).catch(() => {});
  }, [visualizationId]);

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setRefining(true);
    setError(null);
    try {
      const result = await visualizations.refine({ visualizationId, feedback: feedback.trim(), language: locale });
      setCode(result.htmlContent);
      setRenderError(null);
      setFeedback('');
      toast.success(t('admin.vizRefined'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefining(false);
    }
  };

  const handleFixError = async () => {
    if (!renderError) return;
    setFixing(true);
    setError(null);
    try {
      const result = await visualizations.fixError({ visualizationId, error: renderError, language: locale });
      setCode(result.htmlContent);
      setRenderError(null);
      toast.success(t('admin.vizErrorFixed'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFixing(false);
    }
  };

  const handleRestore = (htmlContent: string, version: any) => {
    setCode(htmlContent);
    setRenderError(null);
  };

  const handleGenerateMeta = async () => {
    setGeneratingMeta(true);
    setIntroduction('');
    setDetailedExplanation('');
    setKnowledgeSummary('');

    const abortController = new AbortController();

    try {
      await visualizations.generateMetadataStream(visualizationId, locale, {
        onFieldChunk: (field, text) => {
          switch (field) {
            case 'introduction':
              setIntroduction(prev => prev + text);
              break;
            case 'detailedExplanation':
              setDetailedExplanation(prev => prev + text);
              break;
            case 'knowledgeSummary':
              setKnowledgeSummary(prev => prev + text);
              break;
          }
        },
        onDone: (data) => {
          setIntroduction(data.introduction);
          setDetailedExplanation(data.detailedExplanation);
          setKnowledgeSummary(data.knowledgeSummary);
          toast.success(t('admin.vizMetadataGenerated'));
        },
        onError: (message) => {
          toast.error(message);
        },
      }, abortController.signal);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error(e.message);
      }
    } finally {
      setGeneratingMeta(false);
    }
  };

  const handleSave = async () => {
    setSavingDraft(true);
    try {
      await visualizations.update(visualizationId, {
        title, description, introduction, detailedExplanation, knowledgeSummary,
        htmlContent: code,
      });
      onSave();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await visualizations.update(visualizationId, {
        title, description, introduction, detailedExplanation, knowledgeSummary,
        htmlContent: code,
      });
      await visualizations.publish(visualizationId, 'published');
      onSave();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await visualizations.update(visualizationId, {
        title, description, introduction, detailedExplanation, knowledgeSummary,
        htmlContent: code,
      });
      await visualizations.publish(visualizationId, 'draft');
      onSave();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main content */}
      <div className="xl:col-span-3 space-y-5 min-w-0">
        {/* Title + meta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-display text-display-sm text-ink border-0 px-0 h-auto focus-visible:ring-0 -ml-0.5"
            />
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="secondary" className="rounded-pill text-caption-xs">
                {t('admin.vizId')}: {visualizationId}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-1" /> {t('admin.vizVersions')}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:max-w-[400px]">
                <SheetHeader className="mb-6">
                  <SheetTitle>{t('admin.vizVersions')}</SheetTitle>
                </SheetHeader>
                <VersionPanel
                  visualizationId={visualizationId}
                  currentCode={code}
                  onRestore={handleRestore}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Error banner */}
        {renderError && (
          <Card className="border-clay/20 bg-clay-pale">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-clay shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-clay mb-1">{t('admin.vizRenderError')}</p>
                  <p className="text-caption-sm text-ink-muted mb-3">{renderError}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={handleFixError} disabled={fixing}>
                      {fixing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />}
                      {t('admin.vizFixWithAI')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRenderError(null)}>
                      {t('viz.dismiss')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Preview / Code */}
        <div className="border border-border rounded-editorial overflow-hidden bg-surface">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-surface-warm">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-editorial-xs text-caption-sm font-medium transition-colors ${
                  activeTab === 'preview' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Eye className="h-3.5 w-3.5 inline mr-1.5" />{t('admin.vizLivePreview')}
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-editorial-xs text-caption-sm font-medium transition-colors ${
                  activeTab === 'code' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Code2 className="h-3.5 w-3.5 inline mr-1.5" />{t('admin.vizCode')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'code' && (
                <>
                  <Badge variant="outline" className="text-caption-xs">
                    {t('admin.vizHTML')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-caption-xs"
                    onClick={() => { navigator.clipboard.writeText(code); toast.success(t('admin.vizCodeCopied')); }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> {t('admin.vizCopy')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {activeTab === 'preview' ? (
            <div className="bg-white min-h-[400px]">
              <HtmlVisualizationRenderer
                htmlContent={code}
                visualizationId={visualizationId}
                className="min-h-[400px]"
                onError={setRenderError}
              />
            </div>
          ) : (
            <CodePreview code={code} dark />
          )}
        </div>

        {/* AI Refine */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="h-4 w-4 text-clay" />
              <span className="text-body-sm font-semibold text-ink">{t('admin.vizAIRefine')}</span>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder={t('admin.vizRefinePlaceholder')}
                rows={2}
                className="flex-1 resize-none text-body-sm"
              />
              <Button
                onClick={handleRefine}
                disabled={!feedback.trim() || refining}
                className="self-end"
              >
                {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                <span className="ml-1.5 hidden sm:inline">{t('admin.vizRefine')}</span>
              </Button>
            </div>
            {error && (
              <p className="text-caption-sm text-clay flex items-center gap-1 mt-2">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="xl:col-span-1 space-y-4">
        {/* Details */}
        <Card className="border-border">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-caption-sm text-ink-muted font-semibold block mb-1.5">{t('admin.vizDescription')}</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('admin.vizDescriptionPlaceholder')}
                rows={2}
                className="w-full resize-none text-body-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-caption-sm text-ink-muted font-semibold">{t('viz.detailedExplanation')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateMeta}
                disabled={generatingMeta}
                className="h-7 text-caption-xs"
              >
                {generatingMeta ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                {t('admin.vizGenerateAI')}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">{t('viz.introduction')}</label>
                <Textarea
                  value={introduction}
                  onChange={e => setIntroduction(e.target.value)}
                  placeholder={t('admin.vizIntroductionPlaceholder')}
                  rows={2}
                  className="w-full resize-none text-body-sm"
                />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">{t('viz.detailedExplanation')}</label>
                <Textarea
                  value={detailedExplanation}
                  onChange={e => setDetailedExplanation(e.target.value)}
                  placeholder={t('admin.vizRefinePlaceholder')}
                  rows={3}
                  className="w-full resize-none text-body-sm"
                />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">{t('viz.knowledgeSummary')}</label>
                <Textarea
                  value={knowledgeSummary}
                  onChange={e => setKnowledgeSummary(e.target.value)}
                  placeholder={t('admin.vizIntroductionPlaceholder')}
                  rows={2}
                  className="w-full resize-none text-body-sm"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-caption-sm">
                <span className="text-ink-muted">{t('admin.vizStatus')}</span>
                <Badge variant="outline" className="text-caption-xs">{t('common.draftStatus')}</Badge>
              </div>
              <div className="flex items-center justify-between text-caption-sm">
                <span className="text-ink-muted">{t('admin.vizLinesOfCode')}</span>
                <span className="text-ink font-mono">{code.split('\n').length.toLocaleString()}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button onClick={handleSaveDraft} disabled={savingDraft || publishing} variant="outline" className="w-full">
                {savingDraft ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {savingDraft ? t('admin.vizSaving') : t('admin.vizSaveAsDraft')}
              </Button>
              <Button onClick={handlePublish} disabled={publishing || savingDraft} size="lg" className="w-full h-11 text-body-sm font-semibold bg-clay text-white hover:bg-clay-dark shadow-sm">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {publishing ? t('admin.vizPublishing') : t('admin.vizPublish')}
              </Button>
              <Button variant="outline" onClick={onBack} className="w-full">
                <ChevronLeft className="h-4 w-4 mr-2" /> {t('admin.vizNewTopic')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version timeline (compact) */}
        <VersionPanelCompact visualizationId={visualizationId} currentCode={code} onRestore={handleRestore} />
      </div>
    </div>
  );
}

// ─── Compact Version Panel (sidebar) ─────────────────────────

function VersionPanelCompact({
  visualizationId,
  currentCode,
  onRestore,
}: {
  visualizationId: number;
  currentCode: string;
  onRestore: (htmlContent: string, version: VersionInfo) => void;
}) {
  const t = useTranslations();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await visualizations.getVersions(visualizationId);
      setVersions(list);
    } catch {} finally {
      setLoading(false);
    }
  }, [visualizationId]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleRestore = async (v: VersionInfo) => {
    setRestoring(v.id);
    try {
      const detail = await visualizations.getVersionDetail(visualizationId, v.id);
      const result = await visualizations.restoreVersion(visualizationId, v.id, t('admin.vizVersionRestoreNote', { version: v.version }));
      onRestore(result.htmlContent, v);
      toast.success(t('admin.vizVersionRestored'));
      loadVersions();
    } catch {
      toast.error(t('admin.vizFailedRestore'));
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-caption-sm font-semibold text-ink flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> {t('admin.vizVersions')}
          </h4>
          <Button variant="ghost" size="sm" onClick={loadVersions} disabled={loading} className="h-6 w-6 p-0">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-10 rounded-editorial-xs bg-cream-300 animate-pulse" />)}
          </div>
        ) : versions.length === 0 ? (
          <p className="text-caption-sm text-ink-muted text-center py-4">{t('admin.vizNoVersionsYet')}</p>
        ) : (
          <div className="space-y-1">
            {versions.slice(0, 5).map(v => (
              <div key={v.id} className={`flex items-center justify-between p-2 rounded-editorial-xs text-caption-sm ${
                v.isCurrent ? 'bg-clay-pale border border-clay/10' : 'hover:bg-surface-warm'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-mono font-semibold ${v.isCurrent ? 'text-clay' : 'text-ink'}`}>
                    v{v.version}
                  </span>
                  <span className="text-ink-muted truncate text-caption-xs">
                    {v.changeNote?.slice(0, 30) || `v${v.version}`}
                  </span>
                </div>
                {!v.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => handleRestore(v)}
                    disabled={restoring === v.id}
                  >
                    {restoring === v.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            ))}
            {versions.length > 5 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-caption-xs">
                    {t('admin.vizViewAllVersions', { count: versions.length })}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:max-w-[400px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle>{t('admin.vizVersions')}</SheetTitle>
                  </SheetHeader>
                  <VersionPanel visualizationId={visualizationId} currentCode={currentCode} onRestore={onRestore} />
                </SheetContent>
              </Sheet>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────

export interface AICreationResult {
  id: number;
  title: string;
  subject: string;
  status: string;
}

interface VisualizationAICreatorProps {
  onDone?: (result: AICreationResult) => void;
}

export function VisualizationAICreator({ onDone }: VisualizationAICreatorProps) {
  const t = useTranslations();
  const [step, setStep] = useState<'topic' | 'generating' | 'review'>('topic');
  const [config, setConfig] = useState({ title: '', subject: 'math' as 'math' | 'physics', prompt: '' });
  const [vizData, setVizData] = useState<{ id: number; htmlContent: string } | null>(null);

  const handleTopicComplete = (data: { title: string; subject: 'math' | 'physics'; prompt: string }) => {
    setConfig(data);
    setStep('generating');
  };

  const handleGenerated = (data: { id: number; htmlContent: string }) => {
    setVizData(data);
    setStep('review');
  };

  const handleSave = async () => {
    if (vizData && onDone) {
      const result = await visualizations.get(vizData.id);
      onDone({
        id: vizData.id,
        title: result.title,
        subject: result.subject,
        status: result.status,
      });
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[
          { key: 'topic', label: t('admin.vizLabelTopic'), icon: Sparkles },
          { key: 'generating', label: t('admin.vizLabelGenerate'), icon: Loader2 },
          { key: 'review', label: t('admin.vizLabelReview'), icon: Eye },
        ].map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          const isPast = step === 'generating' && s.key === 'topic' || step === 'review' && (s.key === 'topic' || s.key === 'generating');

          return (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-pill transition-all ${
                isActive
                  ? 'bg-clay text-white shadow-sm'
                  : isPast
                    ? 'bg-teal/10 text-teal'
                    : 'bg-surface-warm text-ink-muted'
              }`}>
                <Icon className={`h-4 w-4 ${isActive && step === 'generating' ? 'animate-spin' : ''}`} />
                <span className="text-caption-sm font-semibold">{s.label}</span>
                {isPast && <Check className="h-3 w-3" />}
              </div>
              {i < 2 && (
                <div className={`w-8 h-px mx-1 ${isPast || (step === 'review' && i === 1) ? 'bg-teal/30' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 'topic' && <TopicStep onComplete={handleTopicComplete} />}
      {step === 'generating' && config && (
        <GenerateStep
          title={config.title}
          subject={config.subject}
          prompt={config.prompt}
          onGenerated={handleGenerated}
          onBack={() => setStep('topic')}
        />
      )}
      {step === 'review' && vizData && (
        <ReviewStep
          visualizationId={vizData.id}
          initialCode={vizData.htmlContent}
          onSave={handleSave}
          onBack={() => setStep('topic')}
        />
      )}
    </div>
  );
}
