'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations, classrooms } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import ClassroomAudioOverlay from '@/components/Visualizations/ClassroomAudioOverlay';
import AITutorSidebar from '@/components/Visualizations/AITutorSidebar';
import DifficultySwitcher from '@/components/Visualizations/DifficultySwitcher';
import NarrationPlayer from '@/components/Visualizations/NarrationPlayer';
import ClassroomPanel from '@/components/Visualizations/ClassroomPanel';
import CodePreview from '@/components/Visualizations/CodePreview';
import VizStickyHeader from '@/components/Visualizations/VizStickyHeader';
import VizCoverSection from '@/components/Visualizations/VizCoverSection';
import VizRendererCard from '@/components/Visualizations/VizRendererCard';
import VizContentTabs from '@/components/Visualizations/VizContentTabs';
import VisualizationComments from '@/components/Visualizations/VisualizationComments';
import RelatedVisualizations from '@/components/Visualizations/RelatedVisualizations';
import VizMobileBottomBar from '@/components/Visualizations/VizMobileBottomBar';
import VisualizationLikeButton from '@/components/Visualizations/VisualizationLikeButton';
import VizStatsPanel from '@/components/Visualizations/VizStatsPanel';

import VizAITools from '@/components/Visualizations/VizAITools';
import { VizAIToolsDialog } from '@/components/Visualizations/AITools';
import { CelebrationEffect } from '@/components/Visualizations/CelebrationEffect';
import { useAITutor } from '@/hooks/useAITutor';
import { useNarrationPlayer } from '@/hooks/useNarrationPlayer';
import { useAudioNarrationPlayer } from '@/hooks/useAudioNarrationPlayer';
import { useClassroomSocket } from '@/hooks/useClassroomSocket';
import { useLivekitClassroom } from '@/hooks/useLivekitClassroom';
import { useCelebration } from '@/hooks/useCelebration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft, BarChart3, Sparkles, Users, Play,
  Share2, Code, Download, Maximize2, Minimize2, GitFork, Code2,
  MessageSquare, Layers, Loader2, PenLine, Lightbulb, BookOpen, FileText,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function VisualizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const id = Number(params.id);
  const [viz, setViz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const t = useTranslations();
  const locale = useLocale();

  // AI Tutor (Feature 1)
  const tutor = useAITutor({ visualizationId: id, language: locale });

  // Celebration effect
  const { celebrationRef, celebrate } = useCelebration();

  // Difficulty switching (Feature 4)
  const [difficultyLevel, setDifficultyLevel] = useState<string>('beginner');
  const [difficultyVariants, setDifficultyVariants] = useState<Record<string, any> | null>(null);

  // Narration (Feature 3)
  const [narration, setNarration] = useState<any>(null);
  const [narrationGenerating, setNarrationGenerating] = useState(false);
  const narrationPlayer = useNarrationPlayer(narration);
  const audioNarrationPlayer = useAudioNarrationPlayer(narration, narration?.audioUrl || null);
  const activePlayer = narration?.audioUrl ? audioNarrationPlayer : narrationPlayer;

  // Classroom (Feature 2)
  const [classroomCreating, setClassroomCreating] = useState(false);
  const [classroomCreated, setClassroomCreated] = useState<any>(null);

  // Fork loading
  const [forking, setForking] = useState(false);

  // Quiz generation
  const [quizGenerating, setQuizGenerating] = useState(false);

  const classroomSocketData = classroomCreated ? { classroomId: classroomCreated.id, joinCode: classroomCreated.joinCode } : null;
  const classroomSocket = useClassroomSocket(classroomSocketData || { classroomId: 0, joinCode: '' });

  const { config: livekitConfig } = useLivekitClassroom(classroomCreated?.id ?? null);

  const handleInteractionForClassroom = useCallback((payload: any) => {
    if (classroomCreated) {
      classroomSocket.sendTeacherSync('interaction', payload);
    }
  }, [classroomCreated, classroomSocket.sendTeacherSync]);

  const handleDifficultySwitch = async (level: string, variant: any) => {
    setDifficultyLevel(level);
    if (variant.htmlContent) {
      setViz((prev: any) => ({ ...prev, htmlContent: variant.htmlContent, title: variant.title || prev.title }));
    }
  };

  const handleGenerateNarration = async () => {
    setNarrationGenerating(true);
    try {
      const result = await visualizations.generateNarration(id, locale);
      setNarration({ segments: result.segments, fullText: result.fullText, locale: locale, audioUrl: result.audioUrl || null });
      toast.success(t('viz.narration.generate') + ' ✓');
      celebrate();
    } catch {
      toast.error(t('viz.narration.failed'));
    } finally {
      setNarrationGenerating(false);
    }
  };

  const handleCreateClassroom = async () => {
    setClassroomCreating(true);
    try {
      const classroom = await classrooms.create({ name: `${viz.title} - ${t('viz.classroom.create')}`, visualizationId: id });
      setClassroomCreated(classroom);
      toast.success(t('viz.classroom.created', { code: classroom.joinCode }));
      const link = `${window.location.origin}/classroom/${classroom.joinCode}`;
      await navigator.clipboard.writeText(link);
      toast.success(t('viz.classroom.copyLink'));
      celebrate();
    } catch {
      toast.error(t('viz.classroom.createFailed'));
    } finally {
      setClassroomCreating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizGenerating(true);
    try {
      const result = await visualizations.generateArticleQuiz(id, locale);
      const quizData = result.quiz;
      setViz((prev: any) => ({
        ...prev,
        quiz: typeof quizData === 'string' ? quizData : JSON.stringify(quizData),
      }));
      toast.success(t('viz.quiz.generated'));
      celebrate();
    } catch {
      toast.error(t('viz.quiz.generateFailed'));
    } finally {
      setQuizGenerating(false);
    }
  };

  useEffect(() => {
    visualizations.get(id)
      .then(v => {
        setViz(v);
        if (v.difficultyLevels) {
          try {
            const levels = typeof v.difficultyLevels === 'string' ? JSON.parse(v.difficultyLevels) : v.difficultyLevels;
            setDifficultyVariants(levels);
          } catch {}
        }
        visualizations.getNarration(id).then(n => {
          if (n) setNarration({ segments: n.segments, fullText: n.fullText, locale: n.locale || locale, audioUrl: n.audioUrl || null });
        }).catch(() => {});
        visualizations.recordStat(id, 'view').catch(() => {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInteract = useCallback(() => {
    visualizations.recordStat(id, 'interact').catch(() => {});
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({ title: viz?.title, url });
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success(t('viz.linkCopied'));
    }
    visualizations.recordStat(id, 'share').catch(() => {});
    celebrate();
  };

  const handleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  const handleDownload = () => {
    const blob = new Blob([viz.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viz.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('viz.downloaded'));
    celebrate();
  };

  const handleFork = async () => {
    if (!isAuthenticated) {
      toast.error(t('viz.signInToLike'));
      return;
    }
    setForking(true);
    try {
      const forked = await visualizations.fork(id);
      toast.success(t('viz.forked'));
      celebrate();
      router.push(`/admin/visualizations/${forked.id}/edit`);
    } catch {
      toast.error(t('viz.forkFailed'));
      setForking(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(viz.htmlContent);
    toast.success(t('common.copied'));
    celebrate();
  };

  const handleCopyEmbed = () => {
    const code = `<iframe src="${window.location.origin}/embed/${id}" width="100%" height="600" style="border:0" allow="fullscreen" title="${viz?.title || t('common.visualization')}"></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success(t('viz.linkCopied'));
    celebrate();
  };

  const handleCombinedInteraction = useCallback((payload: any) => {
    tutor.sendInteraction(payload);
    handleInteractionForClassroom(payload);
  }, [tutor.sendInteraction, handleInteractionForClassroom]);

  const [sidebarTab, setSidebarTab] = useState<'stats' | 'classroom'>('stats');
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [aiToolsDefault, setAiToolsDefault] = useState<'lessonPlan' | 'examGen' | 'brainstorm' | 'grading'>('lessonPlan');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-grid mx-auto px-3 sm:px-6 py-section-sm">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !viz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md border-0 shadow-card">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-clay/10 to-tertiary/10 rounded-[2rem] blur-2xl" />
            <div className="relative w-20 h-20 rounded-[2rem] bg-surface-container-high border border-outline-variant flex items-center justify-center mx-auto">
              <BarChart3 className="h-10 w-10 text-on-surface-variant" />
            </div>
          </div>
          <h2 className="font-display text-display-md text-on-surface mb-2">{t('common.pageNotFound')}</h2>
          <p className="text-body-sm text-on-surface-variant mb-6">{error || t('viz.notFound')}</p>
          <Link href="/visualizations" className="inline-flex items-center gap-1.5 text-body-sm text-clay hover:underline">
            <ChevronLeft className="h-4 w-4" />
            {t('viz.browseAll')}
          </Link>
        </Card>
      </div>
    );
  }

  const renderer = (
    <ClassroomAudioOverlay config={classroomCreated ? livekitConfig : null}>
      <HtmlVisualizationRenderer
        htmlContent={viz.htmlContent}
        visualizationId={id}
        onStat={handleInteract}
        onInteraction={handleCombinedInteraction}
        className={fullscreen ? 'min-h-screen' : 'min-h-[400px] sm:min-h-[500px]'}
      />
    </ClassroomAudioOverlay>
  );

  // Action buttons for the toolbar
  const primaryActions = [
    { key: 'tutor', icon: Sparkles, label: t('viz.tutor.title'), onClick: tutor.toggle, active: tutor.open, primary: true },
    { key: 'quiz', icon: MessageSquare, label: t('viz.quiz.generate'), loadingLabel: t('viz.quiz.generating'), onClick: handleGenerateQuiz, loading: quizGenerating, primary: true },
    ...(isAuthenticated ? [
      { key: 'classroom', icon: Users, label: t('viz.classroom.create'), loadingLabel: t('viz.classroom.creating'), onClick: handleCreateClassroom, loading: classroomCreating, primary: true },
      { key: 'narration', icon: Play, label: t('viz.narration.generate'), loadingLabel: t('viz.narration.generating'), onClick: handleGenerateNarration, loading: narrationGenerating, primary: true },
    ] : []),
    { key: 'source', icon: Code, label: t('viz.viewSource'), onClick: () => setSourceOpen(true) },
    { key: 'fullscreen', icon: fullscreen ? Minimize2 : Maximize2, label: t('viz.fullscreen'), onClick: handleFullscreen },
    { key: 'fork', icon: GitFork, label: t('viz.fork'), loadingLabel: t('viz.forking'), onClick: handleFork, loading: forking },
    { key: 'embed', icon: Code2, label: t('viz.embed'), onClick: () => setEmbedOpen(true) },
    { key: 'share', icon: Share2, label: t('viz.share'), onClick: handleShare },
    { key: 'download', icon: Download, label: t('viz.downloadHtml'), onClick: handleDownload },
  ];

  return (
    <>
      <div className={`min-h-screen bg-background ${narration ? 'pb-40 lg:pb-0' : 'pb-20 lg:pb-0'}`}>
        <VizStickyHeader
          fullscreen={fullscreen}
          showCode={false}
          tutorOpen={tutor.open}
          isAuthenticated={isAuthenticated}
          classroomCreating={classroomCreating}
          narrationGenerating={narrationGenerating}
          forking={forking}
          aiGenerated={viz.aiGenerated}
          version={viz.version}
          onToggleCode={() => setSourceOpen(true)}
          onDownload={handleDownload}
          onToggleTutor={tutor.toggle}
          onCreateClassroom={handleCreateClassroom}
          onGenerateNarration={handleGenerateNarration}
          onToggleFullscreen={handleFullscreen}
          onFork={handleFork}
          onEmbedOpen={() => setEmbedOpen(true)}
          onShare={handleShare}
        />

        <div className="max-w-grid mx-auto px-3 sm:px-6 py-section-sm">
          <VizCoverSection viz={viz} visualizationId={id} onShare={handleShare} />

          {difficultyVariants && (
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <DifficultySwitcher
                variants={difficultyVariants}
                active={difficultyLevel}
                onChange={handleDifficultySwitch}
              />
            </div>
          )}

          {/* Two-column layout on desktop: viz content + side panel */}
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
            {/* Left column: viz + content */}
            <div className="min-w-0">
              <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
                {viz.articleMode ? (
                  <VizContentTabs viz={viz} renderer={renderer} showCode={false} />
                ) : (
                  <>
                    <VizRendererCard
                      fullscreen={fullscreen}
                      showCode={false}
                      onToggleFullscreen={handleFullscreen}
                      onDownload={handleDownload}
                      onToggleCode={() => setSourceOpen(true)}
                    >
                      {renderer}
                    </VizRendererCard>

                    {/* === Action Toolbar — prominent, directly below renderer === */}
                    <div className="mb-6 animate-fade-up" style={{ animationDelay: '0.18s' }}>
                      <Card className="border-0 bg-surface-container-high/60 backdrop-blur-sm shadow-sm">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            {primaryActions.map((action, i) => {
                              const isLoading = (action as any).loading;
                              return (
                                <button
                                  key={action.key}
                                  onClick={action.onClick}
                                  disabled={isLoading}
                                  className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-editorial-xs text-body-sm font-medium transition-all duration-200 relative overflow-hidden ${
                                    action.active
                                      ? 'bg-clay text-surface shadow-md shadow-clay/20'
                                      : isLoading
                                        ? 'bg-surface-container-high border border-clay/40 text-clay shadow-md shadow-clay/10 cursor-wait'
                                        : action.primary
                                          ? 'bg-surface-container-high border border-outline-variant/40 text-on-surface hover:bg-surface-container-highest hover:border-outline-variant hover:shadow-md active:scale-[0.97]'
                                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:scale-[0.97]'
                                  }`}
                                >
                                  {/* Shimmer sweep during loading */}
                                  {isLoading && (
                                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                  )}
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <action.icon className="h-4 w-4" />
                                  )}
                                  <span className="hidden sm:inline">
                                    {isLoading && (action as any).loadingLabel
                                      ? (action as any).loadingLabel
                                      : action.label}
                                  </span>
                                </button>
                              );
                            })}
                            {/* Like button integrated */}
                            <div className="shrink-0 ml-auto">
                              <VisualizationLikeButton visualizationId={id} initialLikes={viz.likesCount || 0} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Mobile classroom controls */}
                    {classroomCreated && (
                      <div className="lg:hidden mb-6">
                        <ClassroomPanel
                          classroomId={classroomCreated.id}
                          classroomName={classroomCreated.name}
                          joinCode={classroomCreated.joinCode}
                          students={classroomSocket.students || []}
                          connectionStatus={classroomSocket.status}
                          onEnd={() => {
                            classrooms.remove(classroomCreated.id).catch(() => {});
                            setClassroomCreated(null);
                            toast.success(t('viz.classroom.ended'));
                          }}
                        />
                      </div>
                    )}

                    <VizContentTabs viz={viz} showCode={false} />
                  </>
                )}
              </div>

              {/* === Comments Section — productized, full-width === */}
              <div className="animate-fade-up mt-10" style={{ animationDelay: '0.3s' }}>
                <Card className="border-0 bg-surface-container-high shadow-card overflow-hidden">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-5 w-5 text-clay" />
                      <h2 className="font-display text-display-xs text-on-surface">{t('viz.comments_tab')}</h2>
                    </div>
                    <p className="text-body-sm text-on-surface-variant/60 mb-6">
                      {t('viz.commentPlaceholder')}
                    </p>
                    <VisualizationComments visualizationId={id} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column: AI Tools triggers + Tabbed side panel */}
            <div className="hidden lg:block space-y-4">
              {/* AI Tools — trigger buttons */}
              <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <Card className="border-0 bg-surface-container-high/80 backdrop-blur-xl shadow-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-clay" />
                      <h3 className="font-display text-display-xs text-on-surface">{t('viz.aiTools.title')}</h3>
                    </div>
                    <p className="text-caption-xs text-on-surface-variant/45 mt-0.5">{t('viz.aiTools.subtitle')}</p>
                  </div>
                  <div className="p-3.5 space-y-2.5">
                    {([
                      { key: 'lessonPlan' as const, icon: BookOpen, color: '#38bdf8', label: t('viz.tools.lessonPlan.title'), desc: t('viz.tools.lessonPlan.description') },
                      { key: 'examGen' as const, icon: FileText, color: '#f59e0b', label: t('viz.tools.examGen.title'), desc: t('viz.tools.examGen.description') },
                      { key: 'brainstorm' as const, icon: Lightbulb, color: '#a78bfa', label: t('viz.tools.brainstorm.title'), desc: t('viz.tools.brainstorm.description') },
                      { key: 'grading' as const, icon: PenLine, color: '#34d399', label: t('viz.tools.grading.title'), desc: t('viz.tools.grading.description') },
                    ]).map(btn => (
                      <button
                        key={btn.key}
                        onClick={() => { setAiToolsDefault(btn.key); setAiToolsOpen(true); }}
                        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-outline-variant/15 bg-surface-container-high/40 hover:bg-surface-container-high/60 hover:border-outline-variant/30 hover:shadow-sm transition-all duration-200 text-left group"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${btn.color}15`, border: `1px solid ${btn.color}20` }}>
                          <btn.icon className="h-4.5 w-4.5" style={{ color: btn.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-on-surface group-hover:text-clay transition-colors">{btn.label}</p>
                          <p className="text-caption-xs text-on-surface-variant/45 truncate">{btn.desc}</p>
                        </div>
                        <Sparkles className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Tabbed side panel: Stats + Grading + Classroom */}
              <div className="sticky top-20 animate-fade-up" style={{ animationDelay: '0.25s' }}>
                <Card className="border-0 bg-surface-container-high/80 backdrop-blur-xl shadow-card overflow-hidden">
                  <div className="flex border-b border-outline-variant/30 overflow-x-auto scrollbar-hide">
                    {([
                      { key: 'stats' as const, icon: BarChart3, label: t('viz.stats.title') },
                      { key: 'classroom' as const, icon: Users, label: t('viz.classroom.shortLabel') },
                    ]).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setSidebarTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-3 text-body-sm font-medium transition-all duration-200 relative whitespace-nowrap ${
                          sidebarTab === tab.key
                            ? 'text-clay'
                            : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-caption-xs">{tab.label}</span>
                        {sidebarTab === tab.key && (
                          <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-gradient-to-r from-clay to-tertiary rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="animate-fade-up" key={sidebarTab}>
                    {sidebarTab === 'stats' && (
                      <VizStatsPanel
                        visualizationId={id}
                        viewCount={viz.viewCount || 0}
                        interactCount={viz.interactCount || 0}
                        likesCount={viz.likesCount || 0}
                      />
                    )}
                    {sidebarTab === 'classroom' && (
                      <div className="p-4">
                        {classroomCreated ? (
                          <ClassroomPanel
                            classroomId={classroomCreated.id}
                            classroomName={classroomCreated.name}
                            joinCode={classroomCreated.joinCode}
                            students={classroomSocket.students || []}
                            connectionStatus={classroomSocket.status}
                            onEnd={() => {
                              classrooms.remove(classroomCreated.id).catch(() => {});
                              setClassroomCreated(null);
                              toast.success(t('viz.classroom.ended'));
                            }}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-2xl bg-clay/10 border border-clay/20 flex items-center justify-center mx-auto mb-4">
                              <Users className="h-6 w-6 text-clay" />
                            </div>
                            <p className="text-body-sm text-on-surface-variant mb-4">
                              {t('viz.classroom.shareCode')}
                            </p>
                            <Button
                              onClick={handleCreateClassroom}
                              disabled={classroomCreating}
                              size="sm"
                              className="gap-2"
                            >
                              {classroomCreating && <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                              {t('viz.classroom.create')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* === Related Visualizations — standalone section at bottom === */}
        <div className="mt-8 border-t border-outline-variant/20">
          <div className="max-w-grid mx-auto px-3 sm:px-6 py-section-sm">
            <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />
                <div className="flex items-center gap-2 px-4 py-2 rounded-pill bg-surface-container-high border border-outline-variant/30">
                  <Layers className="h-4 w-4 text-clay" />
                  <span className="text-body-sm font-medium text-on-surface">{t('viz.related_tab')}</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />
              </div>
              <RelatedVisualizations visualizationId={id} currentSubject={viz.subject || ''} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile AI Tutor (overlay) */}
      <AITutorSidebar
        open={tutor.open}
        onClose={() => tutor.setOpen(false)}
        messages={tutor.messages}
        loading={tutor.loading}
        onAskQuestion={tutor.askQuestion}
        onClearHistory={tutor.clearHistory}
        variant="overlay"
      />

      {/* Narration Player */}
      <NarrationPlayer
        isPlaying={activePlayer.isPlaying}
        currentSegment={activePlayer.currentSegment}
        totalSegments={activePlayer.totalSegments}
        speed={activePlayer.speed}
        onPlay={activePlayer.play}
        onPause={activePlayer.pause}
        onStop={activePlayer.stop}
        onSeekTo={activePlayer.seekTo}
        onSpeedChange={activePlayer.setSpeed}
        locale={narration?.locale}
        currentText={narration?.segments?.[activePlayer.currentSegment]?.text}
        voicesReady={'voicesReady' in activePlayer ? activePlayer.voicesReady : undefined}
        voiceError={'voiceError' in activePlayer ? (activePlayer as any).voiceError : undefined}
        audioUrl={narration?.audioUrl || undefined}
        duration={'duration' in activePlayer ? (activePlayer as any).duration : undefined}
        currentTime={'currentTime' in activePlayer ? (activePlayer as any).currentTime : undefined}
      />

      {/* View Source dialog */}
      <Dialog open={sourceOpen} onOpenChange={setSourceOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogTitle>{t('viz.htmlSourceCode')}</DialogTitle>
          <div className="flex-1 overflow-auto -mx-6">
            <CodePreview code={viz.htmlContent} maxHeight="60vh" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              {t('viz.downloadHtml')}
            </Button>
            <Button size="sm" onClick={handleCopyCode}>
              {t('common.copy')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed dialog */}
      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{t('viz.embedTitle')}</DialogTitle>
          <p className="text-body-sm text-on-surface-variant mb-3">
            {t('viz.embedDescription')}
          </p>
          <div className="bg-surface-container-high rounded-lg p-3 font-mono text-[13px] text-on-surface overflow-x-auto">
            {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${id}" width="100%" height="600" style="border:0" allow="fullscreen" title="${viz?.title || t('common.visualization')}"></iframe>`}
          </div>
          <Button
            onClick={handleCopyEmbed}
            className="mt-3 w-full"
          >
            {t('viz.copyCode')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* AI Tools Dialog */}
      <VizAIToolsDialog
        open={aiToolsOpen}
        onOpenChange={setAiToolsOpen}
        visualizationId={id}
        visualizationTitle={viz?.title || ''}
        visualizationSubject={viz?.subject || ''}
        knowledgeSummary={viz?.knowledgeSummary}
        detailedExplanation={viz?.detailedExplanation}
        language={locale}
        defaultTool={aiToolsDefault}
      />

      {/* Mobile bottom bar */}
      <VizMobileBottomBar
        visualizationId={id}
        tutorOpen={tutor.open}
        onToggleTutor={tutor.toggle}
        isNarrationPlaying={activePlayer.isPlaying}
        onToggleNarration={activePlayer.isPlaying ? activePlayer.pause : activePlayer.play}
        hasNarration={!!narration}
      />

      {/* Celebration effect overlay */}
      <CelebrationEffect ref={celebrationRef} />
    </>
  );
}
