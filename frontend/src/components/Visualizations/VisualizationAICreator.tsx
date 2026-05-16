'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { visualizations } from '@/lib/api';
import { HtmlVisualizationRenderer } from './VisualizationRenderer';
import { useVisualizationStream } from '@/hooks/useVisualizationStream';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Send, Check, RotateCcw, AlertCircle, Loader2, Save, Eye, Wand2, ChevronLeft, ChevronRight, X, Code2,
} from 'lucide-react';

interface StepProps {
  onComplete: (data: { title: string; subject: 'math' | 'physics'; prompt: string }) => void;
}

function TopicStep({ onComplete }: StepProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<'math' | 'physics'>('math');
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onComplete({ title: title.trim() || prompt.trim().slice(0, 80), subject, prompt: prompt.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-caption-sm text-ink-muted uppercase tracking-wider block mb-1.5">Subject</label>
        <div className="flex gap-2">
          {(['math', 'physics'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all ${
                subject === s
                  ? 'bg-clay text-white shadow-sm'
                  : 'bg-surface-warm text-ink-muted hover:bg-cream-300'
              }`}
            >
              {s === 'math' ? '📐 Mathematics' : '⚛️ Physics'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="viz-prompt" className="text-caption-sm text-ink-muted uppercase tracking-wider block mb-1.5">
          What do you want to visualize?
        </label>
        <Textarea
          id="viz-prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g., Pythagorean theorem proof with interactive triangles and area calculations"
          rows={4}
          className="w-full resize-none"
        />
      </div>

      <div>
        <label htmlFor="viz-title" className="text-caption-sm text-ink-muted uppercase tracking-wider block mb-1.5">
          Title (optional — auto-generated from prompt if empty)
        </label>
        <Input
          id="viz-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Pythagorean Theorem Visualizer"
        />
      </div>

      <Button type="submit" disabled={!prompt.trim()} size="lg" className="w-full">
        <Sparkles className="h-4 w-4 mr-2" /> Generate Visualization
      </Button>
    </form>
  );
}

interface VisualizationMeta {
  introduction: string;
  detailedExplanation: string;
  knowledgeSummary: string;
}

interface GenerateStepProps {
  title: string;
  subject: string;
  prompt: string;
  onGenerated: (data: { id: number; htmlContent: string } & VisualizationMeta) => void;
  onBack: () => void;
}

function GenerateStep({ title, subject, prompt, onGenerated, onBack }: GenerateStepProps) {
  const { state, start, abort } = useVisualizationStream();
  const generatedRef = useRef(false);
  const codeContainerRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom as code streams in
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [state.code]);

  // Start generation on mount — guard against React StrictMode double-fire
  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    start({ prompt, subject, title });
  }, []);

  // Once complete, let parent transition to ReviewStep after a brief pause
  useEffect(() => {
    if (state.status === 'complete' && state.fullResponse) {
      const response = state.fullResponse;
      const timer = setTimeout(() => {
        onGenerated({
          id: response.id,
          htmlContent: response.htmlContent,
          introduction: '',
          detailedExplanation: '',
          knowledgeSummary: '',
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.fullResponse]);

  // ── Connecting state ──
  if (state.status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-clay" />
        <p className="text-body-sm text-ink-muted">Connecting to AI and preparing generation...</p>
      </div>
    );
  }

  // ── Streaming / Complete state ──
  if (state.status === 'streaming' || state.status === 'complete') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.status === 'streaming' ? (
              <Loader2 className="h-5 w-5 animate-spin text-clay" />
            ) : (
              <Check className="h-5 w-5 text-teal-600" />
            )}
            <div>
              <p className="text-body-sm font-medium text-ink">
                {state.status === 'streaming' ? 'Generating visualization...' : 'Generation complete'}
              </p>
              <p className="text-caption-sm text-ink-muted">
                {state.code.length.toLocaleString()} characters received
              </p>
            </div>
          </div>
          {state.status === 'streaming' && (
            <Button variant="outline" size="sm" onClick={abort} className="shrink-0">
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
        </div>

        {/* Code display */}
        <div className="relative">
          <div className="absolute top-2 right-2 flex items-center gap-1.5 text-caption-sm text-ink-muted bg-surface/80 backdrop-blur-sm px-2 py-1 rounded-editorial-xs z-10">
            <Code2 className="h-3 w-3" />
            Generated Code
          </div>
          <pre
            ref={codeContainerRef}
            className="p-4 bg-surface-tile text-cream-100 rounded-editorial-xs text-caption-sm font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap border border-border"
          >
            <code>{state.code || 'Waiting for output...'}</code>
            {state.status === 'streaming' && (
              <span className="inline-block w-2 h-4 bg-clay animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (state.status === 'error') {
    return (
      <Card className="p-6 border-clay/20 bg-clay-pale">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-clay shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium text-clay mb-1">Generation Failed</p>
            <p className="text-body-sm text-ink-muted mb-4">{state.error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => start({ prompt, subject, title })}>
                <RotateCcw className="h-4 w-4 mr-1" /> Retry
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ── Aborted state ──
  if (state.status === 'aborted') {
    return (
      <Card className="p-6 border-ink-faint/20 bg-surface-warm">
        <p className="text-body-sm text-ink-muted mb-4">Generation was cancelled.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={() => start({ prompt, subject, title })}>
            <RotateCcw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      </Card>
    );
  }

  return null; // idle state should not render
}

interface ReviewStepProps {
  visualizationId: number;
  initialCode: string;
  initialIntroduction: string;
  initialDetailedExplanation: string;
  initialKnowledgeSummary: string;
  onSave: () => void;
  onBack: () => void;
}

function ReviewStep({ visualizationId, initialCode, initialIntroduction, initialDetailedExplanation, initialKnowledgeSummary, onSave, onBack }: ReviewStepProps) {
  const [code, setCode] = useState(initialCode);
  const [feedback, setFeedback] = useState('');
  const [introduction, setIntroduction] = useState(initialIntroduction);
  const [detailedExplanation, setDetailedExplanation] = useState(initialDetailedExplanation);
  const [knowledgeSummary, setKnowledgeSummary] = useState(initialKnowledgeSummary);
  const [refining, setRefining] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [generatingMetadata, setGeneratingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setRefining(true);
    setError(null);
    try {
      const result = await visualizations.refine({ visualizationId, feedback: feedback.trim() });
      setCode(result.htmlContent);
      setRenderError(null);
      setFeedback('');
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
      const result = await visualizations.fixError({ visualizationId, error: renderError });
      setCode(result.htmlContent);
      setRenderError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFixing(false);
    }
  };

  const handleGenerateMetadata = async () => {
    setGeneratingMetadata(true);
    try {
      const result = await visualizations.generateMetadata(visualizationId);
      setIntroduction(result.introduction);
      setDetailedExplanation(result.detailedExplanation);
      setKnowledgeSummary(result.knowledgeSummary);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingMetadata(false);
    }
  };

  const metaRef = useRef<HTMLDetailsElement>(null);

  // Open metadata section by default on first render
  useEffect(() => {
    if (metaRef.current) metaRef.current.open = true;
  }, []);

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-body-sm font-medium text-ink flex items-center gap-2">
            <Eye className="h-4 w-4 text-ink-soft" /> Live Preview
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-caption-sm">
              v{visualizationId}
            </Badge>
            <span className="text-caption-sm text-ink-muted">ID: {visualizationId}</span>
          </div>
        </div>

        {renderError && (
          <Card className="mb-3 p-4 border-clay/20 bg-clay-pale">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-clay shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-clay mb-1">Compilation Error</p>
                <p className="text-body-sm text-ink-muted mb-3">{renderError}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleFixError}
                    disabled={fixing}
                  >
                    {fixing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-1" />
                    )}
                    Fix with AI
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRenderError(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="border border-border rounded-editorial overflow-hidden bg-surface">
          <HtmlVisualizationRenderer
            htmlContent={code}
            visualizationId={visualizationId}
            className="min-h-[300px]"
            onError={setRenderError}
          />
        </div>
      </div>

      {/* AI-Generated Content Metadata */}
      <details className="group" ref={metaRef}>
        <summary className="text-caption-sm text-ink-muted cursor-pointer hover:text-ink transition-colors select-none flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> AI-Generated Content &mdash; Review and edit
        </summary>
        <div className="mt-3 space-y-4">
          {(introduction || detailedExplanation || knowledgeSummary) ? (
            <>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1 font-medium">Introduction</label>
                <Textarea
                  value={introduction}
                  onChange={e => setIntroduction(e.target.value)}
                  rows={2}
                  className="w-full resize-none text-body-sm"
                />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1 font-medium">Detailed Explanation</label>
                <Textarea
                  value={detailedExplanation}
                  onChange={e => setDetailedExplanation(e.target.value)}
                  rows={4}
                  className="w-full resize-none text-body-sm"
                />
              </div>
              <div>
                <label className="text-caption-sm text-ink-muted block mb-1 font-medium">Knowledge Summary</label>
                <Textarea
                  value={knowledgeSummary}
                  onChange={e => setKnowledgeSummary(e.target.value)}
                  rows={3}
                  className="w-full resize-none text-body-sm"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-body-sm text-ink-muted mb-3">Generate an AI-written introduction, explanation, and knowledge summary for this visualization.</p>
              <Button
                size="sm"
                onClick={handleGenerateMetadata}
                disabled={generatingMetadata}
              >
                {generatingMetadata ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                Generate AI Metadata
              </Button>
            </div>
          )}
        </div>
      </details>

      {/* Code view */}
      <details className="group">
        <summary className="text-caption-sm text-ink-muted cursor-pointer hover:text-ink transition-colors select-none">
          View generated code
        </summary>
        <pre className="mt-2 p-4 bg-surface-tile text-cream-100 rounded-editorial-xs text-caption-sm font-mono overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap">
          {code}
        </pre>
      </details>

      {/* Refine */}
      <div className="space-y-3">
        <label className="text-caption-sm text-ink-muted uppercase tracking-wider block">
          Not satisfied? Tell the AI what to change
        </label>
        <div className="flex gap-2">
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="e.g., Make the triangle interactive with draggable vertices, add labels..."
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleRefine}
            disabled={!feedback.trim() || refining}
            className="self-end"
          >
            {refining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            <span className="ml-1.5 hidden sm:inline">Refine</span>
          </Button>
        </div>
        {error && (
          <p className="text-caption-sm text-clay flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> New Topic
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => visualizations.publish(visualizationId, 'published').then(onSave)}>
            <Check className="h-4 w-4 mr-1" /> Publish
          </Button>
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-1" /> Save as Draft
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface AICreationResult {
  id: number;
  title: string;
  subject: string;
  status: string;
}

interface VisualizationAICreatorProps {
  onDone?: (result: AICreationResult) => void;
}

/**
 * Multi-step AI creation wizard:
 * 1. Enter topic + subject
 * 2. AI generates the visualization
 * 3. Review, preview, refine, save or publish
 */
export function VisualizationAICreator({ onDone }: VisualizationAICreatorProps) {
  const [step, setStep] = useState<'topic' | 'generating' | 'review'>('topic');
  const [config, setConfig] = useState({ title: '', subject: 'math' as 'math' | 'physics', prompt: '' });
  const [vizData, setVizData] = useState<{ id: number; htmlContent: string } & VisualizationMeta | null>(null);

  const handleTopicComplete = (data: { title: string; subject: 'math' | 'physics'; prompt: string }) => {
    setConfig(data);
    setStep('generating');
  };

  const handleGenerated = (data: { id: number; htmlContent: string } & VisualizationMeta) => {
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
    <Card className="border-border shadow-card">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-clay" />
          <CardTitle className="font-display text-display-sm text-ink">
            {step === 'topic' ? 'Create Visualization with AI' :
             step === 'generating' ? 'Generating...' : 'Review & Refine'}
          </CardTitle>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-3">
          {[{ key: 'topic', label: 'Topic' }, { key: 'generating', label: 'Generate' }, { key: 'review', label: 'Review' }].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-caption-sm font-medium transition-colors ${
                step === s.key ? 'bg-clay text-white' : 'bg-cream-300 text-ink-muted'
              }`}>
                {i + 1}
              </div>
              <span className={`text-caption-sm ${step === s.key ? 'text-ink font-medium' : 'text-ink-muted'}`}>
                {s.label}
              </span>
              {i < 2 && <ChevronRight className="h-3 w-3 text-ink-faint" />}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {step === 'topic' && (
          <TopicStep onComplete={handleTopicComplete} />
        )}
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
            initialIntroduction={vizData.introduction}
            initialDetailedExplanation={vizData.detailedExplanation}
            initialKnowledgeSummary={vizData.knowledgeSummary}
            onSave={handleSave}
            onBack={() => setStep('topic')}
          />
        )}
      </CardContent>
    </Card>
  );
}
