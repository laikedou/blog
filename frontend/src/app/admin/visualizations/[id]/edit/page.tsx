'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import CodePreview from '@/components/Visualizations/CodePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ChevronLeft, Save, Wand2, Loader2, AlertCircle, Check, Eye, EyeOff, History, ImagePlus,
  Sparkles, Code2, Copy, RotateCcw, RefreshCw, ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { VersionPanel, VersionPanelCompact } from './VersionPanel';

export default function EditVisualizationPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [viz, setViz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [refining, setRefining] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generatingMetadata, setGeneratingMetadata] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [detailedExplanation, setDetailedExplanation] = useState('');
  const [knowledgeSummary, setKnowledgeSummary] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'code'>('preview');

  useEffect(() => {
    visualizations.get(id)
      .then(v => {
        setViz(v);
        setCode(v.htmlContent);
        setTitle(v.title);
        setDescription(v.description || '');
        setIntroduction(v.introduction || '');
        setDetailedExplanation(v.detailedExplanation || '');
        setKnowledgeSummary(v.knowledgeSummary || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setRefining(true);
    try {
      const result = await visualizations.refine({ visualizationId: id, feedback: feedback.trim() });
      setCode(result.htmlContent);
      setFeedback('');
      toast.success(t('admin.vizRefined'));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRefining(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await visualizations.update(id, { title, description, introduction, detailedExplanation, knowledgeSummary, htmlContent: code });
      toast.success(t('common.success'));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const newStatus = viz?.status === 'published' ? 'draft' : 'published';
    setPublishing(true);
    try {
      await visualizations.publish(id, newStatus);
      setViz((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(newStatus === 'published' ? 'Published!' : 'Unpublished');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    try {
      const result = await visualizations.generateCover(id);
      setViz((prev: any) => ({ ...prev, featuredImage: result.featuredImage }));
      toast.success(t('admin.vizCoverGenerated'));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleGenerateMetadata = async () => {
    setGeneratingMetadata(true);
    try {
      const result = await visualizations.generateMetadata(id);
      setIntroduction(result.introduction);
      setDetailedExplanation(result.detailedExplanation);
      setKnowledgeSummary(result.knowledgeSummary);
      toast.success(t('admin.vizMetadataGenerated'));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingMetadata(false);
    }
  };

  const handleRestore = (htmlContent: string) => {
    setCode(htmlContent);
    setRenderError(null);
    toast.success(t('admin.vizVersionRestored'));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-96 rounded-editorial" />
      </div>
    );
  }

  if (!viz) {
    return (
      <Card className="p-12 text-center">
        <p className="text-ink-muted">{t('admin.vizNotFound')}</p>
        <Link href="/admin/visualizations"><Button variant="outline" className="mt-4">{t('common.back')}</Button></Link>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="max-w-grid mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/visualizations"
              className="inline-flex items-center justify-center w-8 h-8 rounded-editorial-xs text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-display-sm text-ink leading-none">{viz.title}</h1>
              <p className="text-caption-sm text-ink-muted mt-0.5 flex items-center gap-2">
                <Badge variant={viz.status === 'published' ? 'default' : 'outline'} className="text-caption-xs">
                  {viz.status === 'published' ? t('admin.published') : t('admin.draft')}
                </Badge>
                <span>v{viz.version}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-1" /> {t('admin.vizVersions')}
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t('admin.vizVersionDesc')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SheetContent className="w-[400px] sm:max-w-[400px]">
                <SheetHeader className="mb-6">
                  <SheetTitle>{t('admin.vizVersions')}</SheetTitle>
                </SheetHeader>
                <VersionPanel visualizationId={id} currentCode={code} onRestore={handleRestore} />
              </SheetContent>
            </Sheet>
            <Button
              onClick={handleSave}
              disabled={saving || publishing}
              variant="outline"
              size="sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? t('common.saving') : t('common.save')}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || saving}
              size="sm"
              className={viz.status === 'published'
                ? 'bg-ink text-white hover:bg-ink/90 shadow-sm'
                : 'bg-clay text-white hover:bg-clay-dark shadow-sm'
              }
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : viz.status === 'published' ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {publishing
                ? (viz.status === 'published' ? t('admin.vizUnpublishing') : t('admin.vizPublishing'))
                : (viz.status === 'published' ? t('admin.vizUnpublish') : t('admin.vizPublish'))
              }
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-grid mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Preview + AI Refine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview / Code tabs */}
            <Card className="border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-surface-warm">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActivePreviewTab('preview')}
                    className={`px-3 py-1.5 rounded-editorial-xs text-caption-sm font-medium transition-colors ${
                      activePreviewTab === 'preview' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5 inline mr-1.5" />{t('admin.vizLivePreview')}
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('code')}
                    className={`px-3 py-1.5 rounded-editorial-xs text-caption-sm font-medium transition-colors ${
                      activePreviewTab === 'code' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5 inline mr-1.5" />{t('admin.vizCode')}
                  </button>
                </div>
                {activePreviewTab === 'code' && (
                  <Button variant="ghost" size="sm" className="h-7 text-caption-xs" onClick={() => { navigator.clipboard.writeText(code); toast.success('Code copied'); }}>
                    <Copy className="h-3 w-3 mr-1" /> {t('common.copy')}
                  </Button>
                )}
              </div>

              {activePreviewTab === 'preview' ? (
                <div className="bg-white">
                  {renderError && (
                    <div className="p-4 border-b border-border bg-clay-pale">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-clay shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-clay mb-1">{t('admin.vizRenderError')}</p>
                          <p className="text-body-sm text-ink-muted">{renderError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <HtmlVisualizationRenderer
                    htmlContent={code}
                    visualizationId={id}
                    className="min-h-[400px] p-6"
                    onError={setRenderError}
                  />
                </div>
              ) : (
                <CodePreview code={code} dark />
              )}
            </Card>

            {/* Refine */}
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-caption-sm text-ink-muted font-semibold block mb-1">{t('admin.vizTitle')}</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} className="text-body-sm" />
                </div>
                <div>
                  <label className="text-caption-sm text-ink-muted font-semibold block mb-1">{t('admin.vizDescription')}</label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className="resize-none text-body-sm"
                  />
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-caption-sm text-ink-muted font-semibold">{t('admin.vizIntroduction')}</label>
                    <button
                      type="button"
                      onClick={handleGenerateMetadata}
                      disabled={generatingMetadata}
                      className="text-caption-xs text-clay hover:text-clay-dark transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {generatingMetadata ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      {t('admin.vizGenerateAI')}
                    </button>
                  </div>
                  <Textarea
                    value={introduction}
                    onChange={e => setIntroduction(e.target.value)}
                    placeholder={t('admin.vizIntroductionPlaceholder')}
                    rows={2}
                    className="resize-none text-body-sm"
                  />
                </div>
                <div>
                  <label className="text-caption-sm text-ink-muted font-semibold block mb-1">{t('admin.vizDetailedExplanation')}</label>
                  <Textarea
                    value={detailedExplanation}
                    onChange={e => setDetailedExplanation(e.target.value)}
                    rows={3}
                    className="resize-none text-body-sm"
                  />
                </div>
                <div>
                  <label className="text-caption-sm text-ink-muted font-semibold block mb-1">{t('admin.vizKnowledgeSummary')}</label>
                  <Textarea
                    value={knowledgeSummary}
                    onChange={e => setKnowledgeSummary(e.target.value)}
                    rows={2}
                    className="resize-none text-body-sm"
                  />
                </div>
                <Separator />
                <div className="text-caption-sm text-ink-muted space-y-1.5">
                  <div className="flex justify-between">
                    <span>{t('admin.vizSubject')}</span>
                    <span className="text-ink font-medium">{viz.subject === 'math' ? t('admin.vizMathematics') : t('admin.vizPhysics')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizVersion')}</span>
                    <span className="text-ink font-mono">{viz.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizViews')}</span>
                    <span className="text-ink">{viz.viewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizInteractions')}</span>
                    <span className="text-ink">{viz.interactCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizCreated')}</span>
                    <span className="text-ink">{new Date(viz.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card className="border-border">
              <CardContent className="p-5 space-y-3">
                <h4 className="text-caption-sm font-semibold text-ink">{t('admin.vizCoverImage')}</h4>
                {viz.featuredImage ? (
                  <>
                    <div className="aspect-video rounded-editorial-xs overflow-hidden bg-cream-300">
                      <img src={viz.featuredImage} alt={viz.title} className="w-full h-full object-cover" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleGenerateCover} disabled={generatingCover}>
                      {generatingCover ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      {t('admin.vizRegenerateAI')}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="aspect-video rounded-editorial-xs bg-cream-300 flex items-center justify-center">
                      <ImagePlus className="h-10 w-10 text-ink-faint" />
                    </div>
                    <Button size="sm" className="w-full" onClick={handleGenerateCover} disabled={generatingCover}>
                      {generatingCover ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      {t('admin.vizGenerateCoverAI')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Version History (compact) */}
            <VersionPanelCompact visualizationId={id} currentCode={code} onRestore={handleRestore} />
          </div>
        </div>
      </div>
    </div>
  );
}
