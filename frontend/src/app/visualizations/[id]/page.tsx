'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import VizMetadataSection from '@/components/Visualizations/VizMetadataSection';
import VizRendererCard from '@/components/Visualizations/VizRendererCard';
import VizContentTabs from '@/components/Visualizations/VizContentTabs';
import VizSocialTabs from '@/components/Visualizations/VizSocialTabs';
import VizMobileBottomBar from '@/components/Visualizations/VizMobileBottomBar';
import { useAITutor } from '@/hooks/useAITutor';
import { useNarrationPlayer } from '@/hooks/useNarrationPlayer';
import { useAudioNarrationPlayer } from '@/hooks/useAudioNarrationPlayer';
import { useClassroomSocket } from '@/hooks/useClassroomSocket';
import { useLivekitClassroom } from '@/hooks/useLivekitClassroom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const rendererRef = useRef<HTMLDivElement>(null);

  // AI Tutor (Feature 1)
  const tutor = useAITutor({ visualizationId: id, language: i18n.language });

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
      const result = await visualizations.generateNarration(id, i18n.language);
      setNarration({ segments: result.segments, fullText: result.fullText, locale: i18n.language, audioUrl: result.audioUrl || null });
      toast.success(t('viz.narration.generate') + ' ✓');
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
    } catch {
      toast.error(t('viz.classroom.createFailed'));
    } finally {
      setClassroomCreating(false);
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
          if (n) setNarration({ segments: n.segments, fullText: n.fullText, locale: n.locale || i18n.language, audioUrl: n.audioUrl || null });
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
  };

  const handleFork = async () => {
    if (!isAuthenticated) {
      toast.error(t('viz.signInToLike'));
      return;
    }
    try {
      const forked = await visualizations.fork(id);
      toast.success(t('viz.forked'));
      router.push(`/admin/visualizations/${forked.id}/edit`);
    } catch {
      toast.error(t('viz.forkFailed'));
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(viz.htmlContent);
    toast.success(t('common.copied'));
  };

  const handleCopyEmbed = () => {
    const code = `<iframe src="${window.location.origin}/embed/${id}" width="100%" height="600" style="border:0" allow="fullscreen" title="${viz?.title || 'Visualization'}"></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success(t('viz.linkCopied'));
  };

  const handleCombinedInteraction = useCallback((payload: any) => {
    tutor.sendInteraction(payload);
    handleInteractionForClassroom(payload);
  }, [tutor.sendInteraction, handleInteractionForClassroom]);

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
        <Card className="p-12 text-center max-w-md">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display text-display-md text-foreground mb-2">{t('common.pageNotFound')}</h2>
          <p className="text-body-sm text-muted-foreground mb-6">{error || t('viz.notFound')}</p>
          <Link href="/visualizations" className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline">
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
          <VizMetadataSection viz={viz} visualizationId={id} onShare={handleShare} />

          {difficultyVariants && (
            <DifficultySwitcher
              variants={difficultyVariants}
              active={difficultyLevel}
              onChange={handleDifficultySwitch}
            />
          )}

          {/* Two-column layout on desktop: viz content + side panel */}
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
            {/* Left column: viz + content */}
            <div className="min-w-0">
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

                  {/* Mobile classroom controls — inline between viz and content */}
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

              <VizSocialTabs visualizationId={id} currentSubject={viz.subject} />
            </div>

            {/* Right column: Classroom controls + AI Tutor (desktop) */}
            <div className="hidden lg:flex lg:flex-col lg:gap-4">
              <div className="sticky top-20 flex flex-col gap-4">
                {classroomCreated && (
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
                )}
                <AITutorSidebar
                  open={true}
                  onClose={() => {}}
                  messages={tutor.messages}
                  loading={tutor.loading}
                  onAskQuestion={tutor.askQuestion}
                  onClearHistory={tutor.clearHistory}
                  variant="inline"
                />
              </div>
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
            {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${id}" width="100%" height="600" style="border:0" allow="fullscreen" title="${viz?.title || 'Visualization'}"></iframe>`}
          </div>
          <Button
            onClick={handleCopyEmbed}
            className="mt-3 w-full"
          >
            {t('viz.copyCode')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Mobile bottom bar */}
      <VizMobileBottomBar
        visualizationId={id}
        tutorOpen={tutor.open}
        onToggleTutor={tutor.toggle}
        isNarrationPlaying={activePlayer.isPlaying}
        onToggleNarration={activePlayer.isPlaying ? activePlayer.pause : activePlayer.play}
        hasNarration={!!narration}
      />
    </>
  );
}
