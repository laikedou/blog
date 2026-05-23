'use client';

import { useMemo, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Eye, EyeOff, Download, FileDown } from 'lucide-react';
import { examPaperSchema } from '@/lib/exam-schema';
import type { ExamPaper, ExamSection, ExamQuestion, ExamAnswerEntry } from '@/lib/exam-schema';
import { exportExamToPdf } from '@/lib/exam-pdf-export';
import { exportExamToDocx } from '@/lib/exam-docx-export';
import { toast } from 'sonner';
import AIToolTabPreview from './AIToolTabPreview';

interface Props {
  content: string;
  title: string;
  accentColor: string;
}

// ── JSON-first parsing with markdown fallback ──

function parseExamContent(raw: string): ExamPaper | null {
  if (!raw.trim()) return null;

  // Try JSON first (new format)
  try {
    const parsed = JSON.parse(raw);
    const result = examPaperSchema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // Not JSON, try markdown
  }

  // Try to extract JSON from code fences
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      const result = examPaperSchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch {
      // Continue to markdown parser
    }
  }

  // Fallback to old markdown parser for backward compat
  return parseExamMarkdown(raw);
}

// ── Backward-compat markdown parser (simplified) ──

function parseExamMarkdown(md: string): ExamPaper | null {
  let text = md.replace(/^```[a-z]*\s*\n/gm, '').replace(/^```\s*$/gm, '');

  let title = '';
  let subject = '';
  let totalPoints = 100;
  let timeLimit = '';
  let gradeLevel = '';
  let difficulty = '';

  const h1Match = text.match(/^#\s+(.+)$/m);
  if (h1Match) title = h1Match[1].replace(/\*\*/g, '').trim();

  const subjMatch = text.match(/\*\*Subject:\*\*\s*(.+)/i);
  if (subjMatch) subject = subjMatch[1].trim();

  const ptsMatch = text.match(/\*\*Total Points:\*\*\s*(\d+)/i);
  if (ptsMatch) totalPoints = parseInt(ptsMatch[1], 10);

  const timeMatch = text.match(/\*\*Time(?: Limit)?:\*\*\s*(.+)/i);
  if (timeMatch) timeLimit = timeMatch[1].trim();

  const answerKeyRegex = /\n##\s+(Answer Key|Answers?|Answer Key & Scoring Rubric|参考答案)\s*\n/i;
  const answerSplit = text.split(answerKeyRegex);
  const mainPart = answerSplit[0];
  const answerPart = answerSplit.length > 2 ? answerSplit[2] : '';

  const sections: ExamSection[] = [];
  const sectionBlocks = mainPart.split(/\n(?=##\s+)/);

  for (const block of sectionBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();
    if (!/^##\s+/.test(firstLine)) continue;

    const sectionTitle = firstLine.replace(/^##\s+/, '').trim();

    let defaultType: ExamQuestion['type'] = 'shortAnswer';
    const titleLower = sectionTitle.toLowerCase();
    if (/multiple.choice|mcq|choice|选择题|选择/i.test(titleLower)) {
      defaultType = 'mcq';
    } else if (/problem|solving|essay|问题解决|解答/i.test(titleLower)) {
      defaultType = 'problemSolving';
    }

    let instructions = '';
    let questionStartIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (/^###\s+/.test(lines[i])) { questionStartIndex = i; break; }
      const t = lines[i].trim();
      if (t && !/^---/.test(t)) {
        instructions += (instructions ? ' ' : '') + t.replace(/^\*\*Instructions?:\*\*\s*/i, '').replace(/^[*_]\s*/, '').replace(/\s*[*_]$/, '');
      }
    }

    if (questionStartIndex === -1) continue;

    const section: ExamSection = {
      title: sectionTitle,
      type: defaultType,
      questions: [],
      ...(instructions ? { instructions } : {}),
    };

    const questionPart = lines.slice(questionStartIndex).join('\n');
    const questionBlocks = questionPart.split(/\n(?=###\s+)/);

    for (const qBlock of questionBlocks) {
      const qLines = qBlock.trim().split('\n');
      const headerLine = qLines[0].trim();

      let qNumber = 0;
      let qText = '';
      let qPoints = 6;

      const qPatterns = [
        /^###\s+Q(\d+)\b[.!]?\s+(.*)/i,
        /^###\s+(\d+)\b[.!]?\s+(.*)/,
        /^###\s+Question\s+(\d+)[.!]?\s+(.*)/i,
      ];

      for (const pat of qPatterns) {
        const m = headerLine.match(pat);
        if (m) { qNumber = parseInt(m[1], 10); qText = m[2].trim(); break; }
      }
      if (qNumber === 0) continue;

      const ptsMatch = qText.match(/\((\d+)\s*(?:points?|pts?)\)\s*$/i);
      if (ptsMatch) {
        qPoints = parseInt(ptsMatch[1], 10);
        qText = qText.replace(/\((\d+)\s*(?:points?|pts?)\)\s*$/i, '').trim();
      }

      const question: ExamQuestion = { number: qNumber, text: qText, points: qPoints, type: defaultType };

      if (defaultType === 'mcq') {
        question.options = [];
        for (let i = 1; i < qLines.length; i++) {
          const optMatch = qLines[i].trim().match(/^([A-D])[).]\s+(.+)/);
          if (optMatch) {
            question.options.push({ label: optMatch[1], text: optMatch[2].trim() });
          }
        }
      }
      section.questions.push(question);
    }

    if (section.questions.length > 0) sections.push(section);
  }

  // Parse answer key
  const answerKey: ExamAnswerEntry[] = [];
  if (answerPart) {
    const ansBlocks = answerPart.split(/\n(?=###\s+)/);
    for (const block of ansBlocks) {
      const lines = block.trim().split('\n');
      const headerLine = lines[0].trim();
      let qNum = 0;

      const ansHeaderPatterns = [/^###\s+Q(\d+)/i, /^###\s+(\d+)\b/, /^###\s+Question\s+(\d+)/i];
      for (const pat of ansHeaderPatterns) {
        const m = headerLine.match(pat);
        if (m) { qNum = parseInt(m[1], 10); break; }
      }
      if (qNum === 0) continue;

      const bodyText = lines.slice(1).join('\n');
      const entry: ExamAnswerEntry = { questionNumber: qNum, answer: '' };

      const ansMatch = bodyText.match(/\*\*Answer:\*\*\s*(.+?)(?:\n\*\*|\n$|$)/is);
      if (ansMatch) entry.answer = ansMatch[1].trim();

      const expMatch = bodyText.match(/\*\*Explanation:\*\*\s*(.+?)(?:\n\*\*|\n$|$)/is);
      if (expMatch) entry.explanation = expMatch[1].trim();

      const rubMatch = bodyText.match(/\*\*(?:Scoring|Rubric):\*\*\s*(.+?)(?:\n\*\*|\n$|$)/is);
      if (rubMatch) entry.rubric = rubMatch[1].trim();

      if (!entry.answer && !entry.explanation && !entry.rubric) {
        entry.answer = bodyText.trim();
      }
      answerKey.push(entry);
    }
  }

  // Auto-number questions sequentially
  let globalNum = 0;
  for (const section of sections) {
    for (const q of section.questions) {
      globalNum++;
      q.number = globalNum;
    }
  }

  return {
    title: title || 'Exam Paper',
    subject: subject || undefined,
    totalPoints,
    timeLimit: timeLimit || undefined,
    gradeLevel: gradeLevel || undefined,
    difficulty: difficulty || undefined,
    sections,
    answerKey,
  };
}

// ── Sub-components ──

function ExamHeader({ paper, accentColor }: { paper: ExamPaper; accentColor: string }) {
  return (
    <div className="text-center mb-8 pb-6 border-b-2 border-double" style={{ borderColor: `${accentColor}30` }}>
      <h1 className="text-2xl font-bold text-white/90 mb-2">{paper.title}</h1>
      <div className="flex items-center justify-center gap-6 text-sm text-white/50">
        {paper.subject && <span>{paper.subject}</span>}
        {paper.gradeLevel && <span>{paper.gradeLevel}</span>}
        {paper.difficulty && <span>{paper.difficulty}</span>}
        <span>Total: {paper.totalPoints} points</span>
        {paper.timeLimit && <span>Time: {paper.timeLimit}</span>}
      </div>
      <div className="mt-4 flex justify-center gap-8 text-sm">
        <span className="text-white/35">Name: _______________</span>
        <span className="text-white/35">Date: _______________</span>
        <span className="text-white/35">Score: _____ / {paper.totalPoints}</span>
      </div>
    </div>
  );
}

function QuestionCard({ question, accentColor, showAnswer }: { question: ExamQuestion; accentColor: string; showAnswer?: { answer: string; explanation?: string; rubric?: string } }) {
  const t = useTranslations('viz.tools');
  return (
    <div className="mb-6 pl-4 border-l-2" style={{ borderColor: `${accentColor}20` }}>
      <div className="flex items-start gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
          style={{ background: `${accentColor}20`, color: accentColor }}>
          {question.number}
        </span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-white/80 leading-relaxed">{question.text}</p>
            <span className="text-xs text-white/30 shrink-0">[{question.points} pts]</span>
          </div>
        </div>
      </div>

      {question.type === 'mcq' && question.options && question.options.length > 0 && (
        <div className="ml-9 grid grid-cols-1 gap-1.5 mt-2">
          {question.options.map(opt => (
            <label key={opt.label}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0"
                style={{ background: `${accentColor}10`, color: accentColor }}>
                {opt.label}
              </span>
              {opt.text}
            </label>
          ))}
        </div>
      )}

      {showAnswer && question.type === 'mcq' && (
        <div className="ml-9 mt-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: `${accentColor}08`, color: accentColor }}>
          <span className="font-semibold">{t('examGen.editor.answer')}: </span>
          {showAnswer.answer}
          {showAnswer.explanation && (
            <span className="text-white/50"> — {showAnswer.explanation}</span>
          )}
        </div>
      )}

      {question.type === 'shortAnswer' && (
        <div className="ml-9 mt-2">
          {showAnswer ? (
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}15` }}>
              <p><span className="font-semibold" style={{ color: accentColor }}>{t('examGen.editor.answer')}: </span><span className="text-white/70">{showAnswer.answer}</span></p>
              {showAnswer.explanation && <p className="text-white/50">{showAnswer.explanation}</p>}
              {showAnswer.rubric && <p className="text-white/35 text-[11px]">{showAnswer.rubric}</p>}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed" style={{ borderColor: `${accentColor}10`, minHeight: 80 }} />
          )}
        </div>
      )}

      {question.type === 'problemSolving' && (
        <div className="ml-9 mt-2">
          {showAnswer ? (
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}15` }}>
              <p><span className="font-semibold" style={{ color: accentColor }}>{t('examGen.editor.answer')}: </span><span className="text-white/70">{showAnswer.answer}</span></p>
              {showAnswer.explanation && <p className="text-white/50">{showAnswer.explanation}</p>}
              {showAnswer.rubric && <p className="text-white/35 text-[11px]">{showAnswer.rubric}</p>}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-3" style={{ borderColor: `${accentColor}10`, minHeight: 120 }}>
              <span className="text-xs text-white/20">{t('examGen.editor.showWork')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerKeyView({ paper, accentColor }: { paper: ExamPaper; accentColor: string }) {
  const t = useTranslations('viz.tools');
  return (
    <div>
      <h2 className="text-xl font-bold text-white/90 mb-6 pb-3 border-b" style={{ borderColor: `${accentColor}20` }}>
        {t('examGen.preview.answerKey')}
      </h2>
      {paper.answerKey.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">{t('examGen.preview.noAnswerKey')}</p>
      ) : (
        <div className="space-y-6">
          {paper.answerKey.map(entry => (
            <div key={entry.questionNumber} className="p-4 rounded-xl"
              style={{ background: `${accentColor}06`, border: `1px solid ${accentColor}10` }}>
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: `${accentColor}20`, color: accentColor }}>
                  {entry.questionNumber}
                </span>
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t('examGen.editor.answer')}</span>
                    <p className="text-sm text-white/80 mt-0.5">{entry.answer || t('examGen.preview.noAnswer')}</p>
                  </div>
                  {entry.explanation && (
                    <div>
                      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t('examGen.editor.explanation')}</span>
                      <p className="text-sm text-white/60 mt-0.5">{entry.explanation}</p>
                    </div>
                  )}
                  {entry.rubric && (
                    <div>
                      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t('examGen.editor.scoringRubric')}</span>
                      <p className="text-sm text-white/60 mt-0.5">{entry.rubric}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──

export default function AIToolExamPaperPreview({ content, title, accentColor }: Props) {
  const t = useTranslations('viz.tools');
  const [version, setVersion] = useState<'student' | 'teacher'>('student');
  const [exporting, setExporting] = useState<string | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const paper = useMemo(() => parseExamContent(content), [content]);
  const showAnswers = version === 'teacher';

  const handleExport = async (format: 'pdf' | 'docx', includeAnswers: boolean) => {
    if (!paper) return;
    const key = `${format}-${includeAnswers ? 'teacher' : 'student'}`;
    setExporting(key);
    try {
      if (format === 'pdf') {
        await exportExamToPdf(paper, title, { includeAnswers });
      } else {
        await exportExamToDocx(paper, title, { includeAnswers });
      }
      toast.success(`${format.toUpperCase()} (${includeAnswers ? 'Teacher' : 'Student'}) downloaded`);
    } catch {
      toast.error(`${format.toUpperCase()} export failed`);
    } finally {
      setExporting(null);
    }
  };

  // Fallback: no structured data
  if (!paper || paper.sections.length === 0) {
    if (content.trim()) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center px-4 py-1.5 border-b border-white/[0.06] shrink-0">
            <span className="text-xs text-white/25 italic">Structured exam view unavailable — showing raw preview</span>
          </div>
          <AIToolTabPreview content={content} />
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
        <FileText className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/25">{t('examGen.preview.generateToPreview')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] shrink-0">
        {/* Student/Teacher toggle */}
        <div className="flex items-center rounded-lg border border-white/[0.08] overflow-hidden">
          <button
            onClick={() => setVersion('student')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              version === 'student' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Eye className="h-3.5 w-3.5 inline mr-1" />
            {t('examGen.preview.studentVersion')}
          </button>
          <button
            onClick={() => setVersion('teacher')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/[0.08] ${
              version === 'teacher' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <EyeOff className="h-3.5 w-3.5 inline mr-1" />
            {t('examGen.preview.teacherVersion')}
          </button>
        </div>

        <div className="flex-1" />

        {/* Download buttons */}
        <button
          onClick={() => handleExport('docx', false)}
          disabled={exporting !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        >
          <FileDown className="h-3.5 w-3.5" />
          {exporting === 'docx-student' ? '...' : t('examGen.preview.studentDocx')}
        </button>

        <button
          onClick={() => handleExport('pdf', false)}
          disabled={exporting !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting === 'pdf-student' ? '...' : t('examGen.preview.studentPdf')}
        </button>

        <div className="w-px h-5 bg-white/[0.08]" />

        <button
          onClick={() => handleExport('docx', true)}
          disabled={exporting !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ color: accentColor }}
        >
          <FileDown className="h-3.5 w-3.5" />
          {exporting === 'docx-teacher' ? '...' : t('examGen.preview.teacherDocx')}
        </button>

        <button
          onClick={() => handleExport('pdf', true)}
          disabled={exporting !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ color: accentColor, background: `${accentColor}10` }}
        >
          <Download className="h-3.5 w-3.5" />
          {exporting === 'pdf-teacher' ? '...' : t('examGen.preview.teacherPdf')}
        </button>
      </div>

      {/* Paper content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div ref={paperRef} className="max-w-3xl mx-auto">
          {/* Version badge */}
          <div className="text-center mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              showAnswers ? 'text-red-400/70 bg-red-400/5 border border-red-400/15' : 'text-white/25 bg-white/[0.02] border border-white/[0.05]'
            }`}>
              {showAnswers ? t('examGen.preview.teacherBadge') : t('examGen.preview.studentBadge')}
            </span>
          </div>

          <ExamHeader paper={paper} accentColor={accentColor} />

          {paper.sections.map((section, si) => (
            <div key={si} className="mb-8">
              <h2 className="text-lg font-bold text-white/80 mb-1">{section.title}</h2>
              {section.instructions && (
                <p className="text-xs text-white/35 italic mb-4">{section.instructions}</p>
              )}
              {section.questions.map(q => {
                const answerEntry = paper.answerKey.find(a => a.questionNumber === q.number);
                return (
                  <QuestionCard
                    key={q.number}
                    question={q}
                    accentColor={accentColor}
                    showAnswer={showAnswers ? answerEntry : undefined}
                  />
                );
              })}
            </div>
          ))}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-white/[0.06]">
            <p className="text-sm text-white/30">{t('examGen.preview.endOfExam')} — Total: {paper.totalPoints} points</p>
          </div>

          {/* Answer Key section (teacher version) */}
          {showAnswers && (
            <div className="mt-10 pt-8 border-t-2 border-double" style={{ borderColor: `${accentColor}25` }}>
              <AnswerKeyView paper={paper} accentColor={accentColor} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
