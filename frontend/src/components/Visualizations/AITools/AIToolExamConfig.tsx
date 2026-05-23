"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, ArrowRight, Clock, Target } from "lucide-react";
import { StepperInput } from "@/components/ui/stepper-input";
import type { ExamConfig } from "@/lib/exam-schema";
import { DEFAULT_EXAM_CONFIG, computeTotalPoints, computeTotalQuestions } from "@/lib/exam-schema";

interface Props {
  loading: boolean;
  accentColor: string;
  onGenerate: (config: ExamConfig) => void;
}

const GRADE_LEVEL_KEYS = ["elementary", "middleSchool", "highSchool", "college"] as const;
const DIFFICULTY_KEYS = ["easy", "medium", "hard"] as const;

function PillSwitcher({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === opt.key
              ? "bg-white/[0.10] text-white shadow-sm"
              : "bg-white/[0.03] text-white/40 hover:text-white/60 hover:bg-white/[0.06]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface QuestionTypeCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label: string;
  count: number;
  onCountChange: (n: number) => void;
  points: number;
  onPointsChange: (n: number) => void;
  qtyLabel: string;
  ptsLabel: string;
  disabled?: boolean;
}

function QuestionTypeCard({
  enabled,
  onToggle,
  label,
  count,
  onCountChange,
  points,
  onPointsChange,
  qtyLabel,
  ptsLabel,
  disabled,
}: QuestionTypeCardProps) {
  return (
    <div
      className={`rounded-xl border transition-all ${
        enabled
          ? "border-white/[0.10] bg-white/[0.03]"
          : "border-white/[0.04] bg-white/[0.01]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={disabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            enabled ? "bg-amber-400/60" : "bg-white/[0.08]"
          }`}
        >
          <span
            className={`inline-block size-3.5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>

        <span
          className={`flex-1 text-sm font-medium transition-colors ${
            enabled ? "text-white/80" : "text-white/35"
          }`}
        >
          {label}
        </span>

        {enabled && (
          <div className="flex items-center gap-4">
            <StepperInput
              value={count}
              onChange={onCountChange}
              min={1}
              max={30}
              label={qtyLabel}
              disabled={disabled}
            />
            <StepperInput
              value={points}
              onChange={onPointsChange}
              min={1}
              max={100}
              label={ptsLabel}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIToolExamConfig({ loading, accentColor, onGenerate }: Props) {
  const t = useTranslations("viz.tools");

  const [gradeLevel, setGradeLevel] = useState<string>(DEFAULT_EXAM_CONFIG.gradeLevel);
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_EXAM_CONFIG.difficulty);
  const [mcqCount, setMcqCount] = useState(DEFAULT_EXAM_CONFIG.mcqCount);
  const [shortAnswerCount, setShortAnswerCount] = useState(DEFAULT_EXAM_CONFIG.shortAnswerCount);
  const [problemSolvingCount, setProblemSolvingCount] = useState(DEFAULT_EXAM_CONFIG.problemSolvingCount);
  const [mcqPoints, setMcqPoints] = useState(DEFAULT_EXAM_CONFIG.mcqPoints);
  const [shortAnswerPoints, setShortAnswerPoints] = useState(DEFAULT_EXAM_CONFIG.shortAnswerPoints);
  const [problemSolvingPoints, setProblemSolvingPoints] = useState(DEFAULT_EXAM_CONFIG.problemSolvingPoints);
  const [timeLimit, setTimeLimit] = useState(DEFAULT_EXAM_CONFIG.timeLimit);
  const [topicFocus, setTopicFocus] = useState(DEFAULT_EXAM_CONFIG.topicFocus);

  const [mcqEnabled, setMcqEnabled] = useState(true);
  const [shortAnswerEnabled, setShortAnswerEnabled] = useState(true);
  const [problemSolvingEnabled, setProblemSolvingEnabled] = useState(true);

  const config: ExamConfig = useMemo(
    () => ({
      gradeLevel: gradeLevel as ExamConfig["gradeLevel"],
      difficulty: difficulty as ExamConfig["difficulty"],
      mcqCount: mcqEnabled ? mcqCount : 0,
      shortAnswerCount: shortAnswerEnabled ? shortAnswerCount : 0,
      problemSolvingCount: problemSolvingEnabled ? problemSolvingCount : 0,
      mcqPoints,
      shortAnswerPoints,
      problemSolvingPoints,
      timeLimit,
      topicFocus,
    }),
    [
      gradeLevel, difficulty, mcqEnabled, shortAnswerEnabled, problemSolvingEnabled,
      mcqCount, shortAnswerCount, problemSolvingCount,
      mcqPoints, shortAnswerPoints, problemSolvingPoints,
      timeLimit, topicFocus,
    ]
  );

  const totalPoints = computeTotalPoints(config);
  const totalQuestions = computeTotalQuestions(config);
  const canGenerate = totalQuestions > 0 && totalPoints > 0;

  function handleGenerate() {
    if (!canGenerate || loading) return;
    onGenerate(config);
  }

  const gradeLevelOptions = GRADE_LEVEL_KEYS.map((k) => ({
    key: k,
    label: t(`examGen.config.gradeLevels.${k}`),
  }));

  const difficultyOptions = DIFFICULTY_KEYS.map((k) => ({
    key: k,
    label: t(`examGen.config.difficulties.${k}`),
  }));

  const gradeLevelLabel = t(`examGen.config.gradeLevels.${gradeLevel}`);
  const difficultyLabel = t(`examGen.config.difficulties.${difficulty}`);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 p-6 space-y-6">
        {/* Grade Level */}
        <section>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
            {t("examGen.config.gradeLevel")}
          </h4>
          <PillSwitcher
            options={gradeLevelOptions}
            value={gradeLevel}
            onChange={setGradeLevel}
            disabled={loading}
          />
        </section>

        {/* Difficulty */}
        <section>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
            {t("examGen.config.difficulty")}
          </h4>
          <PillSwitcher
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
            disabled={loading}
          />
        </section>

        {/* Question Types */}
        <section>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
            {t("examGen.config.questionTypes")}
          </h4>
          <div className="space-y-2">
            <QuestionTypeCard
              enabled={mcqEnabled}
              onToggle={setMcqEnabled}
              label={t("examGen.config.multipleChoice")}
              count={mcqCount}
              onCountChange={setMcqCount}
              points={mcqPoints}
              onPointsChange={setMcqPoints}
              qtyLabel={t("examGen.config.quantity")}
              ptsLabel={t("examGen.config.points")}
              disabled={loading}
            />
            <QuestionTypeCard
              enabled={shortAnswerEnabled}
              onToggle={setShortAnswerEnabled}
              label={t("examGen.config.shortAnswer")}
              count={shortAnswerCount}
              onCountChange={setShortAnswerCount}
              points={shortAnswerPoints}
              onPointsChange={setShortAnswerPoints}
              qtyLabel={t("examGen.config.quantity")}
              ptsLabel={t("examGen.config.points")}
              disabled={loading}
            />
            <QuestionTypeCard
              enabled={problemSolvingEnabled}
              onToggle={setProblemSolvingEnabled}
              label={t("examGen.config.problemSolving")}
              count={problemSolvingCount}
              onCountChange={setProblemSolvingCount}
              points={problemSolvingPoints}
              onPointsChange={setProblemSolvingPoints}
              qtyLabel={t("examGen.config.quantity")}
              ptsLabel={t("examGen.config.points")}
              disabled={loading}
            />
          </div>
        </section>

        {/* Time Limit */}
        <section>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
            {t("examGen.config.timeLimit")}
          </h4>
          <div className="flex items-center gap-2">
            <StepperInput
              value={timeLimit}
              onChange={setTimeLimit}
              min={5}
              max={180}
              step={5}
              disabled={loading}
            />
            <Clock className="size-3.5 text-white/30" />
            <span className="text-xs text-white/40">{t("examGen.config.minutes")}</span>
          </div>
        </section>

        {/* Topic Focus */}
        <section>
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
            {t("examGen.config.topicFocus")}
            <span className="text-white/20 ml-1">({t("examGen.config.optional")})</span>
          </h4>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20" />
            <input
              type="text"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              disabled={loading}
              placeholder={t("examGen.config.topicFocusPlaceholder")}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 focus:ring-1 focus:ring-amber-400/10 transition-colors"
            />
          </div>
        </section>
      </div>

      {/* Summary + CTA Footer */}
      <div className="border-t border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{t("examGen.config.summary", { questions: totalQuestions, points: totalPoints })}</span>
          <span>{gradeLevelLabel} &middot; {difficultyLabel}</span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className="group relative w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 0 30px ${accentColor}10`,
          }}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("generating")}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {t("examGen.config.generateButton", { questions: totalQuestions, points: totalPoints })}
              <ArrowRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
