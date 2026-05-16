'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import VisualizationLikeButton from '@/components/Visualizations/VisualizationLikeButton';
import VisualizationComments from '@/components/Visualizations/VisualizationComments';
import RelatedVisualizations from '@/components/Visualizations/RelatedVisualizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft, BookOpen, Atom, Clock, User, Eye, Share2, BarChart3,
  Maximize2, Minimize2, Download, MessageSquare, Layers, Code, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function VisualizationDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [viz, setViz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'related'>('comments');
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    visualizations.get(id)
      .then(v => {
        setViz(v);
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
      toast.success('Link copied to clipboard');
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
    toast.success('Downloaded as HTML');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-200">
        <div className="max-w-grid mx-auto px-6 py-section-sm">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-[500px] rounded-editorial" />
        </div>
      </div>
    );
  }

  if (error || !viz) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-ink-faint" />
          <h2 className="font-display text-display-md text-ink mb-2">Not Found</h2>
          <p className="text-body-sm text-ink-muted mb-6">{error || 'This visualization does not exist.'}</p>
          <Link href="/visualizations">
            <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-1" /> Browse Visualizations</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const renderer = (
    <HtmlVisualizationRenderer
      htmlContent={viz.htmlContent}
      visualizationId={id}
      onStat={handleInteract}
      className={fullscreen ? 'min-h-screen' : 'min-h-[500px]'}
    />
  );

  return (
    <div className={`bg-cream-200 ${fullscreen ? '' : 'min-h-screen'}`}>
      {/* Header bar */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-grid mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/visualizations"
            className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Browse All
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-caption-sm text-ink-muted mr-2 hidden sm:inline">
              v{viz.version}
              {viz.aiGenerated && <span className="ml-1.5 inline-flex items-center gap-0.5"><Sparkles className="h-3 w-3 text-clay" />AI</span>}
            </span>

            <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)} title="View source code">
              <Code className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleDownload} title="Download as HTML">
              <Download className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleFullscreen} title="Fullscreen">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-grid mx-auto px-6 py-section-sm">
        {/* Title section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-caption-sm font-medium px-2 py-0.5 rounded-pill flex items-center gap-1 ${
              viz.subject === 'math' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {viz.subject === 'math' ? <BookOpen className="h-3 w-3" /> : <Atom className="h-3 w-3" />}
              {viz.subject === 'math' ? 'Mathematics' : 'Physics'}
            </span>
            <span className="text-caption-sm text-ink-muted">Version {viz.version}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-display-lg text-ink">{viz.title}</h1>
              {viz.description && (
                <p className="text-lead text-ink-muted mt-2 max-w-reading">{viz.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VisualizationLikeButton visualizationId={id} initialLikes={viz.likesCount || 0} />
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-caption-sm text-ink-muted">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {viz.author?.displayName || viz.author?.username}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(viz.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {viz.viewCount || 0} views</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Updated {new Date(viz.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Introduction */}
        {viz.introduction && (
          <Card className="border-border bg-surface-warm mb-6">
            <CardContent className="p-6">
              <h2 className="font-display text-display-xs text-ink mb-2">About This Visualization</h2>
              <p className="text-body text-ink-muted leading-relaxed">{viz.introduction}</p>
            </CardContent>
          </Card>
        )}

        {/* Visualization renderer */}
        <Card className={`border-border shadow-card overflow-hidden mb-6 ${fullscreen ? 'shadow-none border-0 rounded-none' : ''}`}>
          <div className="bg-white relative" ref={rendererRef}>
            {renderer}
          </div>
        </Card>

        {/* Detailed Explanation */}
        {viz.detailedExplanation && (
          <Card className="border-border shadow-card mb-6">
            <CardContent className="p-6">
              <h2 className="font-display text-display-xs text-ink mb-3">Detailed Explanation</h2>
              <div className="text-body text-ink-muted leading-relaxed space-y-3">
                {viz.detailedExplanation.split('\n\n').filter(Boolean).map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Knowledge Summary */}
        {viz.knowledgeSummary && (
          <Card className="border-border shadow-card mb-6">
            <CardContent className="p-6">
              <h2 className="font-display text-display-xs text-ink mb-3">Key Knowledge Points</h2>
              <ul className="space-y-2">
                {viz.knowledgeSummary.split('\n').filter(Boolean).map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-body text-ink-muted">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-clay shrink-0" />
                    <span>{point.replace(/^[-•*]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Code view */}
        {showCode && (
          <Card className="border-border mb-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-cream-100">
                <span className="text-caption-sm font-medium text-ink-muted uppercase tracking-wider">HTML Source Code</span>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(viz.htmlContent); toast.success('Code copied'); }}>
                  Copy
                </Button>
              </div>
              <pre className="p-5 overflow-x-auto text-body-sm font-mono text-ink-soft max-h-[400px] overflow-y-auto">
                {viz.htmlContent}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Prompt info */}
        {viz.prompt && (
          <Card className="border-border bg-surface-warm mb-6">
            <CardContent className="p-5">
              <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">Generation Prompt</p>
              <p className="text-body-sm text-ink-muted">{viz.prompt}</p>
            </CardContent>
          </Card>
        )}

        {/* Comments + Related tabs */}
        <Card className="border-border shadow-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 border-b border-border mb-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 text-body-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments' ? 'border-clay text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-1.5" />
                Comments
              </button>
              <button
                onClick={() => setActiveTab('related')}
                className={`pb-3 text-body-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'related' ? 'border-clay text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <Layers className="h-4 w-4 inline mr-1.5" />
                Related
              </button>
            </div>

            {activeTab === 'comments' ? (
              <VisualizationComments visualizationId={id} />
            ) : (
              <RelatedVisualizations visualizationId={id} currentSubject={viz.subject} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
