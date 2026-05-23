'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  toolType: string;
  loading: boolean;
  accentColor: string;
  onGenerate: () => void;
  studentAnswer?: string;
  onStudentAnswerChange?: (value: string) => void;
}

const TOOL_HINTS: Record<string, string> = {
  lessonPlan: 'Generates a structured 7-section lesson plan: objectives, prerequisites, key concepts, teaching sequence, discussion questions, practice activities, and assessment checkpoints.',
  examGen: 'Creates a balanced 100-point exam: multiple choice (30pts), short answer (42pts), problem solving (28pts), plus a complete answer key with scoring rubrics.',
  brainstorm: 'Builds an interactive tree diagram: one central concept, 5-7 branches (### headings), sub-points as bold bullet children, and supporting details as deeper nodes. All labels are kept short for clarity.',
  grading: 'Evaluates a student answer against reference content with a detailed rubric: accuracy (40pts), reasoning (30pts), completeness (20pts), clarity (10pts), plus strengths, improvements, corrected understanding, and recommended review.',
};

export default function AIToolTabGenerate({ toolType, loading, accentColor, onGenerate, studentAnswer, onStudentAnswerChange }: Props) {
  const t = useTranslations('viz.tools');
  const hint = TOOL_HINTS[toolType] || '';
  const needsInput = toolType === 'grading';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 overflow-y-auto">
      {/* AI visualization */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)` }} />
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accentColor}15 0%, transparent 60%)`,
            border: `1px solid ${accentColor}20`,
          }}
        >
          <Sparkles className="h-10 w-10" style={{ color: accentColor }} />
        </div>
      </div>

      <div className="shrink-0">
        <h3 className="text-lg font-display text-white/80 mb-2">
          {t('generating') || 'Ready to Generate'}
        </h3>
        <p className="text-sm text-white/35 max-w-md leading-relaxed">{hint}</p>
      </div>

      {/* Student answer input for grading tool */}
      {needsInput && (
        <div className="w-full max-w-md space-y-2 shrink-0">
          <label className="block text-xs font-medium text-white/50 text-left">
            {t('grading.inputLabel') || 'Student Answer'}
          </label>
          <textarea
            value={studentAnswer || ''}
            onChange={e => onStudentAnswerChange?.(e.target.value)}
            placeholder={t('viz.tools.grading.placeholder')}
            rows={6}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/30 focus:ring-1 focus:ring-cyan-400/10 resize-none transition-colors"
          />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={loading || (needsInput && !studentAnswer?.trim())}
        className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 30px ${accentColor}10`,
        }}
      >
        {/* Shimmer */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('generating')}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t('generate')}
            <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}
