"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, GripVertical, Save } from "lucide-react";
import { examPaperSchema } from "@/lib/exam-schema";
import type { ExamPaper, ExamSection, ExamQuestion, ExamAnswerEntry } from "@/lib/exam-schema";
import { toast } from "sonner";

interface Props {
  content: string;
  accentColor: string;
  onSave: (content: string) => Promise<void>;
}

function QuestionEditor({
  question,
  answerEntry,
  accentColor,
  onChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  question: ExamQuestion;
  answerEntry?: ExamAnswerEntry;
  accentColor: string;
  onChange: (q: ExamQuestion, a?: ExamAnswerEntry) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const t = useTranslations("viz.tools");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <GripVertical className="size-4 text-white/15 shrink-0" />
        <span className="text-xs font-bold text-white/30 shrink-0">Q{question.number}</span>
        <span className="flex-1 text-sm text-white/70 truncate">{question.text}</span>
        <span className="text-[10px] text-white/25 shrink-0">{question.type} · {question.points}pts</span>
        {expanded ? (
          <ChevronUp className="size-4 text-white/30" />
        ) : (
          <ChevronDown className="size-4 text-white/30" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
              {t("examGen.editor.questionStem")}
            </label>
            <textarea
              value={question.text}
              onChange={(e) => onChange({ ...question, text: e.target.value }, answerEntry)}
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/30 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                {t("examGen.editor.points")}
              </label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => onChange({ ...question, points: Math.max(1, parseInt(e.target.value) || 0) }, answerEntry)}
                min={1}
                className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-400/30"
              />
            </div>
            {onMoveUp && onMoveDown && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className="px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  {t("examGen.editor.moveUp")}
                </button>
                <button
                  type="button"
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  className="px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  {t("examGen.editor.moveDown")}
                </button>
              </div>
            )}
          </div>

          {question.type === "mcq" && (
            <div>
              <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                {t("examGen.editor.options")}
              </label>
              <div className="space-y-1.5">
                {(question.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/25 w-5 shrink-0">{opt.label}.</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])];
                        newOptions[oi] = { ...newOptions[oi], text: e.target.value };
                        onChange({ ...question, options: newOptions }, answerEntry);
                      }}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-400/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
              {t("examGen.editor.answer")}
            </label>
            <textarea
              value={answerEntry?.answer || ""}
              onChange={(e) =>
                onChange(question, {
                  questionNumber: question.number,
                  answer: e.target.value,
                  explanation: answerEntry?.explanation,
                  rubric: answerEntry?.rubric,
                })
              }
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-cyan-400/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
              {t("examGen.editor.explanation")}
              <span className="text-white/15 ml-1">({t("examGen.config.optional")})</span>
            </label>
            <textarea
              value={answerEntry?.explanation || ""}
              onChange={(e) =>
                onChange(question, {
                  questionNumber: question.number,
                  answer: answerEntry?.answer || "",
                  explanation: e.target.value,
                  rubric: answerEntry?.rubric,
                })
              }
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-cyan-400/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
              {t("examGen.editor.scoringRubric")}
              <span className="text-white/15 ml-1">({t("examGen.config.optional")})</span>
            </label>
            <textarea
              value={answerEntry?.rubric || ""}
              onChange={(e) =>
                onChange(question, {
                  questionNumber: question.number,
                  answer: answerEntry?.answer || "",
                  explanation: answerEntry?.explanation,
                  rubric: e.target.value,
                })
              }
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-cyan-400/30 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIToolQuestionEditor({ content, accentColor, onSave }: Props) {
  const t = useTranslations("viz.tools");
  const [saving, setSaving] = useState(false);

  const paper = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      const result = examPaperSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }, [content]);

  const [editedPaper, setEditedPaper] = useState<ExamPaper | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize edited state from parsed paper
  const working = editedPaper || paper;

  // Collect all questions in order with section index and answer entry
  const allQuestions = useMemo(() => {
    if (!working) return [];
    return working.sections.flatMap((section, si) =>
      section.questions.map((q, qi) => ({
        question: q,
        sectionIndex: si,
        questionIndex: qi,
        answerEntry: working.answerKey.find((a) => a.questionNumber === q.number),
      }))
    );
  }, [working]);

  if (!paper) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <p className="text-sm text-white/25">
          {t("examGen.editor.requiresJson")}
        </p>
      </div>
    );
  }

  const handleQuestionChange = (
    globalIdx: number,
    q: ExamQuestion,
    a?: ExamAnswerEntry
  ) => {
    if (!working) return;

    const updated = structuredClone(working);
    const flat = updated.sections.flatMap((s, si) =>
      s.questions.map((_, qi) => ({ si, qi }))
    );
    const { si, qi } = flat[globalIdx];

    updated.sections[si].questions[qi] = q;

    // Update or insert answer entry
    if (a) {
      const ansIdx = updated.answerKey.findIndex(
        (e) => e.questionNumber === q.number
      );
      if (ansIdx >= 0) {
        updated.answerKey[ansIdx] = a;
      } else {
        updated.answerKey.push(a);
      }
    }

    setEditedPaper(updated);
    setIsDirty(true);
  };

  const handleMove = (fromIdx: number, direction: -1 | 1) => {
    if (!working) return;
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= allQuestions.length) return;

    const updated = structuredClone(working);
    const flat = updated.sections.flatMap((s, si) =>
      s.questions.map((_, qi) => ({ si, qi }))
    );
    const from = flat[fromIdx];
    const to = flat[toIdx];

    // Swap questions
    const temp = updated.sections[from.si].questions[from.qi];
    updated.sections[from.si].questions[from.qi] =
      updated.sections[to.si].questions[to.qi];
    updated.sections[to.si].questions[to.qi] = temp;

    // Re-number all questions
    let num = 0;
    for (const section of updated.sections) {
      for (const q of section.questions) {
        num++;
        q.number = num;
      }
    }

    // Re-number answer keys to match
    for (const entry of updated.answerKey) {
      const matchingQ = updated.sections
        .flatMap((s) => s.questions)
        .find((q) => q.number === entry.questionNumber);
      // Update based on new numbering — this is a simplified approach
      // We'll re-map answer keys by order
    }

    // Full re-number: re-map answer keys
    const newAnswerKey: ExamAnswerEntry[] = [];
    let newNum = 0;
    for (const section of updated.sections) {
      for (const q of section.questions) {
        newNum++;
        const oldEntry = working.answerKey.find(
          (e) => e.questionNumber === q.number
        );
        if (oldEntry) {
          newAnswerKey.push({ ...oldEntry, questionNumber: newNum });
        }
      }
    }
    updated.answerKey = newAnswerKey;

    setEditedPaper(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!working) return;
    setSaving(true);
    try {
      await onSave(JSON.stringify(working));
      setEditedPaper(null);
      setIsDirty(false);
    } catch {
      toast.error(t('viz.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-xs text-white/25">
          {t("examGen.editor.questionsCount", { count: allQuestions.length })}
        </span>
        <div className="flex-1" />
        {isDirty && (
          <span className="text-[10px] text-amber-400/60">{t("examGen.editor.unsavedChanges")}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ color: accentColor, background: `${accentColor}10` }}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? t("generating") : t("save")}
        </button>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allQuestions.map((item, globalIdx) => (
          <QuestionEditor
            key={`${item.sectionIndex}-${item.questionIndex}`}
            question={item.question}
            answerEntry={item.answerEntry}
            accentColor={accentColor}
            onChange={(q, a) => handleQuestionChange(globalIdx, q, a)}
            onMoveUp={() => handleMove(globalIdx, -1)}
            onMoveDown={() => handleMove(globalIdx, 1)}
            canMoveUp={globalIdx > 0}
            canMoveDown={globalIdx < allQuestions.length - 1}
          />
        ))}

        {allQuestions.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-white/25">{t("examGen.editor.noQuestions")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
