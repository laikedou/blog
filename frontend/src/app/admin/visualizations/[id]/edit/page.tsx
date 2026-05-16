'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ChevronLeft, Save, Wand2, Loader2, AlertCircle, Check, Eye, EyeOff, History, ImagePlus,
} from 'lucide-react';

export default function EditVisualizationPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [viz, setViz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      toast.success('Refined — review the updated preview below');
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
      toast.success('Saved');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const newStatus = viz?.status === 'published' ? 'draft' : 'published';
      await visualizations.publish(id, newStatus);
      setViz((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(newStatus === 'published' ? 'Published!' : 'Unpublished');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    try {
      const result = await visualizations.generateCover(id);
      setViz((prev: any) => ({ ...prev, featuredImage: result.featuredImage }));
      toast.success('Cover image generated!');
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
      toast.success('AI metadata generated!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingMetadata(false);
    }
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
        <p className="text-ink-muted">Visualization not found</p>
        <Link href="/admin/visualizations"><Button variant="outline" className="mt-4">Back</Button></Link>
      </Card>
    );
  }

  return (
    <div>
      <Link
        href="/admin/visualizations"
        className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Preview + AI Refine */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-body-sm font-medium">Live Preview</CardTitle>
              <Badge variant={viz.status === 'published' ? 'default' : 'outline'}>
                {viz.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {renderError && (
                <div className="p-4 border-b border-border bg-clay-pale">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-clay shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-clay mb-1">Compilation Error</p>
                      <p className="text-body-sm text-ink-muted">{renderError}</p>
                      <p className="text-body-sm text-ink-muted mt-2">
                        Try refining the code with AI below, or check the generated code for syntax issues.
                      </p>
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
            </CardContent>
          </Card>

          {/* Refine */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-body-sm font-medium flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-clay" /> AI Refine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex gap-2">
                <Textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Tell the AI what to change — e.g., 'Add a slider for angle control...'"
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button
                  onClick={handleRefine}
                  disabled={!feedback.trim() || refining}
                  className="self-end"
                >
                  {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  <span className="ml-1.5 hidden sm:inline">Refine</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Code view */}
          <details className="group">
            <summary className="text-caption-sm text-ink-muted cursor-pointer hover:text-ink transition-colors select-none flex items-center gap-1">
              <History className="h-3 w-3" /> View generated code (v{viz.version})
            </summary>
            <pre className="mt-2 p-4 bg-surface-tile text-cream-100 rounded-editorial-xs text-caption-sm font-mono overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap">
              {code}
            </pre>
          </details>
        </div>

        {/* Sidebar: Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-body-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-caption-sm text-ink-muted">Introduction</label>
                  <button
                    type="button"
                    onClick={handleGenerateMetadata}
                    disabled={generatingMetadata}
                    className="text-caption-xs text-clay hover:text-clay-dark transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    {generatingMetadata ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    Generate AI
                  </button>
                </div>
                <Textarea
                  value={introduction}
                  onChange={e => setIntroduction(e.target.value)}
                  placeholder="Brief 1-2 sentence introduction about this visualization"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">Detailed Explanation</label>
                <Textarea
                  value={detailedExplanation}
                  onChange={e => setDetailedExplanation(e.target.value)}
                  placeholder="In-depth explanation of the concepts and interactive elements"
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1">Knowledge Summary</label>
                <Textarea
                  value={knowledgeSummary}
                  onChange={e => setKnowledgeSummary(e.target.value)}
                  placeholder="Key knowledge points, one per line"
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="text-caption-sm text-ink-muted space-y-1">
                <p>Subject: {viz.subject === 'math' ? '📐 Math' : '⚛️ Physics'}</p>
                <p>Version: {viz.version}</p>
                <p>Views: {viz.viewCount}</p>
                <p>Interactions: {viz.interactCount}</p>
                <p>Created: {new Date(viz.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-body-sm font-medium">Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {viz.featuredImage ? (
                <div className="space-y-3">
                  <div className="aspect-video rounded-editorial-xs overflow-hidden bg-cream-300">
                    <img
                      src={viz.featuredImage}
                      alt={viz.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleGenerateCover}
                    disabled={generatingCover}
                  >
                    {generatingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Regenerate with AI
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="aspect-video rounded-editorial-xs bg-cream-300 flex items-center justify-center">
                    <ImagePlus className="h-10 w-10 text-ink-faint" />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleGenerateCover}
                    disabled={generatingCover}
                  >
                    {generatingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Generate Cover with AI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handlePublish}>
              {viz.status === 'published'
                ? <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                : <><Check className="h-4 w-4 mr-2" /> Publish</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
