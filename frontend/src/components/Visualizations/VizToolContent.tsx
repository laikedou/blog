'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ai } from '@/lib/api';
import { toast } from 'sonner';
import { BookOpen, FileText, PenLine, Sparkles, Loader2, Copy, Check, ArrowRight } from 'lucide-react';

type ToolKey = 'lessonPlan' | 'examGen' | 'grading';

interface Props {
  toolKey: ToolKey;
  visualizationTitle: string;
  visualizationSubject: string;
  knowledgeSummary?: string;
  detailedExplanation?: string;
  language?: string;
}

interface ToolResult {
  content: string;
  timestamp: number;
}

const TOOL_CONFIG = {
  lessonPlan: {
    icon: BookOpen,
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconColor: 'text-blue-500',
    accentBorder: 'border-blue-400/30',
    accentBg: 'bg-blue-50/20',
    titleKey: 'viz.tools.lessonPlan.title' as const,
    descKey: 'viz.tools.lessonPlan.description' as const,
    showInput: false,
  },
  examGen: {
    icon: FileText,
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-500',
    accentBorder: 'border-amber-400/30',
    accentBg: 'bg-amber-50/20',
    titleKey: 'viz.tools.examGen.title' as const,
    descKey: 'viz.tools.examGen.description' as const,
    showInput: false,
  },
  grading: {
    icon: PenLine,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-500',
    accentBorder: 'border-emerald-400/30',
    accentBg: 'bg-emerald-50/20',
    titleKey: 'viz.tools.grading.title' as const,
    descKey: 'viz.tools.grading.description' as const,
    showInput: true,
  },
};

function buildSystemPrompt(toolKey: ToolKey, subject: string, langName: string): string {
  switch (toolKey) {
    case 'lessonPlan':
      return `You are an expert education designer specializing in ${subject}. Create a structured, engaging lesson plan based on the provided topic. The response MUST be in ${langName}.

Format with clear markdown sections:
## Learning Objectives
(3-5 clear, measurable objectives)
## Prerequisites
## Key Concepts
## Teaching Sequence (45-min flow with timing)
## Discussion Questions (3-5)
## Practice Activities (2-3 with instructions)
## Assessment Checkpoints

Make it practical, classroom-ready, and grade-level appropriate.`;

    case 'examGen':
      return `You are an expert exam designer for ${subject} education. Create a comprehensive 100-point exam. The response MUST be in ${langName}.

## Section A: Multiple Choice (5 × 6pts = 30pts)
Four options each, testing factual recall.

## Section B: Short Answer (3 × 14pts = 42pts)
Testing conceptual understanding.

## Section C: Problem Solving (2 × 14pts = 28pts)
Testing application and analysis.

## Answer Key & Scoring Rubric
Complete answers with explanations.`;

    case 'grading':
      return `You are an expert ${subject} teacher grading student work. The response MUST be in ${langName}.

Evaluate using:
- Accuracy (/40) - Factual correctness
- Reasoning (/30) - Logic and structure
- Completeness (/20) - All parts addressed
- Clarity (/10) - Clear expression

Include: Total Score /100, Section Breakdown, Strengths (2-3), Areas for Improvement (2-3), Recommended Review topics. Be encouraging, focus on growth.`;
  }
}

export default function VizToolContent({
  toolKey,
  visualizationTitle,
  visualizationSubject,
  knowledgeSummary,
  detailedExplanation,
  language,
}: Props) {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const config = TOOL_CONFIG[toolKey];
  const Icon = config.icon;
  const langName = language === 'zh-CN' ? 'Simplified Chinese' : language === 'zh-TW' ? 'Traditional Chinese' : language === 'ja' ? 'Japanese' : 'English';

  const vizContext = [
    `Title: ${visualizationTitle}`,
    `Subject: ${visualizationSubject}`,
    knowledgeSummary && `Key Points: ${knowledgeSummary}`,
    detailedExplanation && `Content: ${detailedExplanation}`,
  ].filter(Boolean).join('\n');

  useEffect(() => { if (result && resultRef.current) resultRef.current.scrollTop = 0; }, [result]);

  const handleGenerate = async () => {
    if (config.showInput && !input.trim()) return;
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(toolKey, visualizationSubject, langName);
      const userMessage = config.showInput
        ? `Reference topic:\n${vizContext}\n\nStudent's answer to grade:\n${input}`
        : `Create content for the following topic:\n\n${vizContext}`;

      const response = await ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      const resultText = typeof response === 'string'
        ? response
        : response?.content || response?.message || response?.aiResponse || JSON.stringify(response);

      setResult({ content: resultText, timestamp: Date.now() });
    } catch {
      toast.error(t('viz.tools.generateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-outline-variant/30">
        <div className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        <div>
          <h3 className="font-display text-display-xs text-on-surface">{t(config.titleKey)}</h3>
          <p className="text-caption-xs text-on-surface-variant/45">{t(config.descKey)}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input for grading */}
        {config.showInput && (
          <div>
            <label className="text-caption-xs text-on-surface-variant/50 uppercase tracking-wider font-medium mb-2 block">
              {t('viz.tools.grading.inputLabel')}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('viz.tools.grading.placeholder')}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant/25 focus:outline-none focus:ring-2 focus:ring-clay/15 focus:border-clay/30 resize-none transition-all"
            />
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || (config.showInput && !input.trim())}
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-clay to-tertiary text-white text-body-sm font-semibold hover:from-clay/95 hover:to-tertiary/95 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-clay/15"
        >
          {loading ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              {t('viz.tools.generating')}
            </>
          ) : (
            <>
              <Sparkles className="h-4.5 w-4.5" />
              {t('viz.tools.generate')}
              <ArrowRight className="h-4 w-4 opacity-60" />
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div ref={resultRef} className="rounded-xl border border-outline-variant/20 bg-surface overflow-hidden animate-fade-up shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/10 bg-surface-container-lowest/40">
              <span className="text-caption-xs text-on-surface-variant/40 font-medium">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-caption-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600">{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {t('common.copy')}
                  </>
                )}
              </button>
            </div>
            <div className="p-4 max-h-[350px] overflow-y-auto">
              <div className="text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {result.content}
              </div>
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!result && !config.showInput && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <Sparkles className="h-8 w-8 text-clay/20" />
            <p className="text-caption-sm text-on-surface-variant/35">{t('viz.tools.clickToGenerate')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
