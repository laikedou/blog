'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ai } from '@/lib/api';
import { toast } from 'sonner';
import {
  BookOpen, FileText, PenLine, ChevronDown, Sparkles,
  Loader2, Copy, Check, GraduationCap, ArrowRight,
} from 'lucide-react';

interface ToolResult {
  content: string;
  timestamp: number;
}

interface Props {
  visualizationTitle: string;
  visualizationSubject: string;
  knowledgeSummary?: string;
  detailedExplanation?: string;
  language?: string;
}

function ToolCard({
  icon: Icon,
  iconBg,
  iconColor,
  accentBorder,
  accentBg,
  title,
  description,
  placeholder,
  showInput = false,
  inputLabel,
  expanded,
  onToggle,
  loading,
  result,
  onGenerate,
  onCopy,
  copied,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  accentBg: string;
  title: string;
  description: string;
  placeholder?: string;
  showInput?: boolean;
  inputLabel?: string;
  expanded: boolean;
  onToggle: () => void;
  loading: boolean;
  result: ToolResult | null;
  onGenerate: (input?: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollTop = 0;
    }
  }, [result]);

  return (
    <div className={`rounded-xl border-2 transition-all duration-300 ${
      expanded
        ? `${accentBorder} ${accentBg} shadow-md`
        : 'border-outline-variant/15 bg-surface-container-high/40 hover:border-outline-variant/30 hover:bg-surface-container-high/60 hover:shadow-sm'
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className={`w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center shrink-0`}>
          <Icon className={`h-5.5 w-5.5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-on-surface">{title}</p>
          <p className="text-caption-sm text-on-surface-variant/55 mt-0.5">{description}</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-on-surface-variant/30 transition-transform duration-300 shrink-0 ${
          expanded ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Expanded area */}
      <div className={`overflow-hidden transition-all duration-300 ${
        expanded ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-5 pb-5 space-y-4">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent" />

          {/* Input for grading */}
          {showInput && (
            <div>
              <label className="text-caption-xs text-on-surface-variant/50 uppercase tracking-wider font-medium mb-2 block">
                {inputLabel}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface text-body-sm text-on-surface placeholder:text-on-surface-variant/25 focus:outline-none focus:ring-2 focus:ring-clay/15 focus:border-clay/30 resize-none transition-all"
              />
            </div>
          )}

          {/* Generate CTA */}
          <button
            onClick={() => onGenerate(showInput ? input : undefined)}
            disabled={loading || (showInput && !input.trim())}
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
            <div
              ref={resultRef}
              className="rounded-xl border border-outline-variant/20 bg-surface overflow-hidden animate-fade-up shadow-sm"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/10 bg-surface-container-lowest/40">
                <span className="text-caption-xs text-on-surface-variant/40 font-medium">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={onCopy}
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
              <div className="p-4 max-h-[320px] overflow-y-auto">
                <div className="text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {result.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VizToolsPanel({
  visualizationTitle,
  visualizationSubject,
  knowledgeSummary,
  detailedExplanation,
  language,
}: Props) {
  const t = useTranslations();
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [loadingTool, setLoadingTool] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const [copiedTool, setCopiedTool] = useState<string | null>(null);

  const vizContext = [
    `Title: ${visualizationTitle}`,
    `Subject: ${visualizationSubject}`,
    knowledgeSummary && `Key Points: ${knowledgeSummary}`,
    detailedExplanation && `Content: ${detailedExplanation}`,
  ].filter(Boolean).join('\n');

  const langName = language === 'zh-CN' ? 'Simplified Chinese' : language === 'zh-TW' ? 'Traditional Chinese' : language === 'ja' ? 'Japanese' : 'English';

  const handleGenerate = async (toolKey: string, systemPrompt: string, userMessage: string, input?: string) => {
    setLoadingTool(toolKey);
    try {
      const content = input || userMessage;
      const response = await ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ]);

      const resultText = typeof response === 'string'
        ? response
        : response?.content || response?.message || response?.aiResponse || JSON.stringify(response);

      setResults(prev => ({
        ...prev,
        [toolKey]: { content: resultText, timestamp: Date.now() },
      }));
    } catch {
      toast.error(t('viz.tools.generateFailed'));
    } finally {
      setLoadingTool(null);
    }
  };

  const handleCopy = (toolKey: string) => {
    const result = results[toolKey];
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopiedTool(toolKey);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedTool(null), 2000);
  };

  const toggleTool = (key: string) => {
    setExpandedTool(prev => prev === key ? null : key);
  };

  const tools = [
    {
      key: 'lessonPlan',
      icon: BookOpen,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      accentBorder: 'border-blue-400/40',
      accentBg: 'bg-blue-50/30',
      title: t('viz.tools.lessonPlan.title'),
      description: t('viz.tools.lessonPlan.description'),
      systemPrompt: `You are an expert education designer specializing in ${visualizationSubject}. Create a structured, engaging lesson plan based on the provided topic. The response MUST be in ${langName}.

Format your response with clear sections using markdown headings:
## Learning Objectives
(3-5 clear, measurable objectives)

## Prerequisites
(What students should already know)

## Key Concepts
(Break down the core ideas with explanations)

## Teaching Sequence
(Step-by-step 45-minute lesson flow with timing)

## Discussion Questions
(3-5 thought-provoking questions)

## Practice Activities
(2-3 hands-on exercises with instructions)

## Assessment Checkpoints
(How to verify student understanding)

Make it practical, classroom-ready, and grade-level appropriate.`,
      userMessage: `Create a detailed lesson plan for the following topic:\n\n${vizContext}`,
    },
    {
      key: 'examGen',
      icon: FileText,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      accentBorder: 'border-amber-400/40',
      accentBg: 'bg-amber-50/30',
      title: t('viz.tools.examGen.title'),
      description: t('viz.tools.examGen.description'),
      systemPrompt: `You are an expert exam designer for ${visualizationSubject} education. Create a comprehensive, well-structured exam paper. The response MUST be in ${langName}.

Design a balanced 100-point exam with clear sections:

## Section A: Multiple Choice (5 questions × 6 points = 30 points)
Four options each, testing factual recall and basic understanding.

## Section B: Short Answer (3 questions × 14 points = 42 points)
Testing conceptual understanding and ability to explain key ideas.

## Section C: Problem Solving (2 questions × 14 points = 28 points)
Testing application, analysis, and synthesis skills.

## Answer Key & Scoring Rubric
Provide complete answers with detailed explanations and point allocation.

Make questions clear, unambiguous, and appropriately challenging.`,
      userMessage: `Create a comprehensive exam paper for the following topic:\n\n${vizContext}`,
    },
    {
      key: 'grading',
      icon: PenLine,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      accentBorder: 'border-emerald-400/40',
      accentBg: 'bg-emerald-50/30',
      title: t('viz.tools.grading.title'),
      description: t('viz.tools.grading.description'),
      showInput: true,
      inputLabel: t('viz.tools.grading.inputLabel'),
      placeholder: t('viz.tools.grading.placeholder'),
      systemPrompt: `You are an expert ${visualizationSubject} teacher providing detailed, constructive grading and feedback. The response MUST be in ${langName}.

Evaluate the student's work using this rubric:

## Scoring Breakdown
- **Accuracy** (/40): Is the factual understanding correct?
- **Reasoning** (/30): Is the logic clear, coherent, and well-structured?
- **Completeness** (/20): Are all parts of the question addressed?
- **Clarity** (/10): Is the expression clear and well-communicated?

## Your response MUST include:
1. **Total Score**: X/100
2. **Section Scores**: Breakdown by each criterion
3. **Strengths**: What the student did well (2-3 specific points)
4. **Areas for Improvement**: Specific, actionable feedback (2-3 points)
5. **Recommended Review**: Specific topics or concepts to revisit

Be encouraging but honest. Focus on growth mindset and actionable improvement.`,
      userMessage: `Reference topic for grading context:\n${vizContext}`,
    },
  ];

  return (
    <div className="h-full flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/30">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-clay/20 to-tertiary/20 border border-clay/20 flex items-center justify-center">
          <Sparkles className="h-4.5 w-4.5 text-clay" />
        </div>
        <div>
          <h3 className="font-display text-display-xs text-on-surface">{t('viz.tools.title')}</h3>
          <p className="text-caption-xs text-on-surface-variant/45">{t('viz.tools.subtitle')}</p>
        </div>
      </div>

      {/* Tool cards — each card is a standalone module with generous spacing */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {tools.map(tool => (
          <ToolCard
            key={tool.key}
            icon={tool.icon}
            iconBg={tool.iconBg}
            iconColor={tool.iconColor}
            accentBorder={tool.accentBorder}
            accentBg={tool.accentBg}
            title={tool.title}
            description={tool.description}
            placeholder={tool.placeholder}
            showInput={tool.showInput}
            inputLabel={tool.inputLabel}
            expanded={expandedTool === tool.key}
            onToggle={() => toggleTool(tool.key)}
            loading={loadingTool === tool.key}
            result={results[tool.key] || null}
            onGenerate={(input) => handleGenerate(tool.key, tool.systemPrompt, tool.userMessage, input)}
            onCopy={() => handleCopy(tool.key)}
            copied={copiedTool === tool.key}
          />
        ))}

        {/* Bottom hint */}
        <div className="pt-1 pb-2">
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-surface-warm/80 border border-outline-variant/15">
            <GraduationCap className="h-4.5 w-4.5 text-clay/50 shrink-0 mt-0.5" />
            <p className="text-caption-xs text-on-surface-variant/45 leading-relaxed">
              {t('viz.tools.hint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
