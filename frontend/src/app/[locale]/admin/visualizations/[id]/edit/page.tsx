'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import CodePreview from '@/components/Visualizations/CodePreview';
import { toast } from 'sonner';
import { VersionPanel, VersionPanelCompact } from './VersionPanel';

export default function EditVisualizationPage() {
  const t = useTranslations();
  const locale = useLocale();
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
  const [versionsOpen, setVersionsOpen] = useState(false);

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
    setCode('');
    setRenderError(null);
    setActivePreviewTab('code');

    const abortController = new AbortController();

    try {
      await visualizations.refineStream(
        { visualizationId: id, feedback: feedback.trim(), language: locale },
        {
          onChunk: (text) => {
            setCode(prev => prev + text);
          },
          onDone: (data) => {
            setCode(data.htmlContent);
            setFeedback('');
            setActivePreviewTab('preview');
            toast.success(t('admin.vizRefined'));
          },
          onError: (message) => {
            toast.error(message);
          },
        },
        abortController.signal,
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error(e.message);
      }
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
      toast.success(newStatus === 'published' ? t('admin.vizToastPublished') : t('admin.vizToastUnpublished'));
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
    setIntroduction('');
    setDetailedExplanation('');
    setKnowledgeSummary('');

    const abortController = new AbortController();

    try {
      await visualizations.generateMetadataStream(id, locale, {
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
      setGeneratingMetadata(false);
    }
  };

  const handleRestore = (htmlContent: string) => {
    setCode(htmlContent);
    setRenderError(null);
    toast.success(t('admin.vizVersionRestored'));
  };

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-surface-container-highest/30 animate-pulse rounded" />
        <div className="h-96 bg-surface-container-highest/30 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!viz) {
    return (
      <div
        className="rounded-xl py-12 text-center"
        style={{
          background: 'rgba(34, 42, 61, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p className="font-body-sm text-body-sm text-on-surface-variant">{t('admin.vizNotFound')}</p>
        <Link
          href="/admin/visualizations"
          className="inline-block mt-4 bg-transparent border border-white/20 text-on-surface hover:bg-white/5 rounded-lg px-4 py-2 text-label-sm font-label-sm transition-all"
        >
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const isPublished = viz.status === 'published';

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 border-b border-white/5"
        style={{
          background: 'rgba(11, 19, 38, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/visualizations"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </Link>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface leading-none">{viz.title}</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-label-sm ${
                  isPublished
                    ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                    : 'bg-surface-variant/50 text-on-surface-variant border border-white/10'
                }`}>
                  {isPublished ? t('admin.published') : t('admin.draft')}
                </span>
                <span>v{viz.version}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVersionsOpen(!versionsOpen)}
              className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all flex items-center gap-1"
              title={t('admin.vizVersionDesc')}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              {t('admin.vizVersions')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || publishing}
              className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">save</span>}
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || saving}
              className="py-1.5 px-3 rounded-lg text-label-sm font-label-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              style={{
                background: isPublished
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                color: isPublished ? '#dae2fd' : '#ffffff',
                border: isPublished ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isPublished ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {publishing ? <Spinner /> : (
                <span className="material-symbols-outlined text-[16px]">
                  {isPublished ? 'visibility_off' : 'check'}
                </span>
              )}
              {publishing
                ? (isPublished ? t('admin.vizUnpublishing') : t('admin.vizPublishing'))
                : (isPublished ? t('admin.vizUnpublish') : t('admin.vizPublish'))
              }
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Preview + AI Refine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview / Code tabs */}
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: 'rgba(34, 42, 61, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-surface-container-low/50">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActivePreviewTab('preview')}
                    className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-medium transition-all ${
                      activePreviewTab === 'preview' ? 'bg-surface border border-white/10 text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">visibility</span>
                    {t('admin.vizLivePreview')}
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('code')}
                    className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-medium transition-all ${
                      activePreviewTab === 'code' ? 'bg-surface border border-white/10 text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">code</span>
                    {t('admin.vizCode')}
                  </button>
                </div>
                {activePreviewTab === 'code' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { navigator.clipboard.writeText(code); toast.success(t('viz.codeCopied')); }}
                      className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-2 py-1 text-label-sm font-label-sm transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">copy</span>
                      {t('common.copy')}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([code], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success(t('admin.vizDownloaded'));
                      }}
                      className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-2 py-1 text-label-sm font-label-sm transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      {t('common.download')}
                    </button>
                  </div>
                )}
              </div>

              {activePreviewTab === 'preview' ? (
                <div className="bg-surface-container-lowest">
                  {renderError && (
                    <div className="p-4 border-b border-white/5" style={{ background: 'rgba(255, 180, 171, 0.05)' }}>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error shrink-0 mt-0.5">warning</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-sm text-body-sm font-medium text-error mb-1">{t('admin.vizRenderError')}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{renderError}</p>
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
            </div>

            {/* Refine */}
            <div
              className="rounded-xl"
              style={{
                background: 'rgba(34, 42, 61, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">{t('admin.vizAIRefine')}</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder={t('admin.vizRefinePlaceholder')}
                    rows={2}
                    className="flex-1 resize-none bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <button
                    onClick={handleRefine}
                    disabled={!feedback.trim() || refining}
                    className="self-end py-2 px-4 rounded-lg text-label-sm font-label-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    {refining ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
                    <span className="hidden sm:inline">{t('admin.vizRefine')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div
              className="rounded-xl"
              style={{
                background: 'rgba(34, 42, 61, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="p-5 space-y-4">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">{t('admin.vizTitle')}</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">{t('admin.vizDescription')}</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className="w-full resize-none bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div className="border-t border-white/5" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">{t('admin.vizIntroduction')}</label>
                    <button
                      type="button"
                      onClick={handleGenerateMetadata}
                      disabled={generatingMetadata}
                      className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {generatingMetadata ? <Spinner /> : <span className="material-symbols-outlined text-[14px]">auto_awesome</span>}
                      {t('admin.vizGenerateAI')}
                    </button>
                  </div>
                  <textarea
                    value={introduction}
                    onChange={e => setIntroduction(e.target.value)}
                    placeholder={t('admin.vizIntroductionPlaceholder')}
                    rows={2}
                    className="w-full resize-none bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">{t('admin.vizDetailedExplanation')}</label>
                  <textarea
                    value={detailedExplanation}
                    onChange={e => setDetailedExplanation(e.target.value)}
                    rows={3}
                    className="w-full resize-none bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">{t('admin.vizKnowledgeSummary')}</label>
                  <textarea
                    value={knowledgeSummary}
                    onChange={e => setKnowledgeSummary(e.target.value)}
                    rows={2}
                    className="w-full resize-none bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div className="border-t border-white/5" />
                <div className="font-body-sm text-body-sm text-on-surface-variant space-y-1.5">
                  <div className="flex justify-between">
                    <span>{t('admin.vizSubject')}</span>
                    <span className="text-on-surface font-medium">
                      {viz.subject === 'math' ? t('admin.vizMathematics') : t('admin.vizPhysics')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizVersion')}</span>
                    <span className="text-on-surface font-mono">{viz.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizViews')}</span>
                    <span className="text-on-surface">{viz.viewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizInteractions')}</span>
                    <span className="text-on-surface">{viz.interactCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.vizCreated')}</span>
                    <span className="text-on-surface">{new Date(viz.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div
              className="rounded-xl"
              style={{
                background: 'rgba(34, 42, 61, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="p-5 space-y-3">
                <h4 className="font-label-sm text-label-sm font-semibold text-on-surface">{t('admin.vizCoverImage')}</h4>
                {viz.featuredImage ? (
                  <>
                    <div className="aspect-video rounded-lg overflow-hidden bg-surface-container-low">
                      <img src={viz.featuredImage} alt={viz.title} className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={handleGenerateCover}
                      disabled={generatingCover}
                      className="w-full bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {generatingCover ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
                      {t('admin.vizRegenerateAI')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="aspect-video rounded-lg bg-surface-container-low flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">image</span>
                    </div>
                    <button
                      onClick={handleGenerateCover}
                      disabled={generatingCover}
                      className="w-full py-1.5 px-3 rounded-lg text-label-sm font-label-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1"
                      style={{
                        background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                      }}
                    >
                      {generatingCover ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
                      {t('admin.vizGenerateCoverAI')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Version History (compact) */}
            <VersionPanelCompact visualizationId={id} currentCode={code} onRestore={handleRestore} />
          </div>
        </div>
      </div>

      {/* Versions side panel */}
      {versionsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVersionsOpen(false)} />
          <div
            className="relative w-[400px] h-full shadow-2xl overflow-y-auto z-10"
            style={{
              background: 'rgba(23, 31, 51, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-md text-headline-md text-on-surface">{t('admin.vizVersions')}</h2>
                <button
                  onClick={() => setVersionsOpen(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <VersionPanel visualizationId={id} currentCode={code} onRestore={handleRestore} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
