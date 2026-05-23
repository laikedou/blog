// Types-only mirror of frontend/src/lib/exam-schema.ts
// Used for AI response validation on the backend

export interface ExamMcqOption {
  label: string;
  text: string;
}

export interface ExamQuestion {
  number: number;
  text: string;
  points: number;
  type: 'mcq' | 'shortAnswer' | 'problemSolving';
  options?: ExamMcqOption[];
}

export interface ExamSection {
  title: string;
  instructions?: string;
  type: 'mcq' | 'shortAnswer' | 'problemSolving';
  questions: ExamQuestion[];
}

export interface ExamAnswerEntry {
  questionNumber: number;
  answer: string;
  explanation?: string;
  rubric?: string;
}

export interface ExamPaper {
  title: string;
  subject?: string;
  gradeLevel?: string;
  difficulty?: string;
  totalPoints: number;
  timeLimit?: string;
  sections: ExamSection[];
  answerKey: ExamAnswerEntry[];
}

export function validateExamJson(data: unknown): ExamPaper | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  if (typeof d.title !== 'string' || !d.title.trim()) return null;
  if (typeof d.totalPoints !== 'number' || d.totalPoints <= 0) return null;
  if (!Array.isArray(d.sections) || d.sections.length === 0) return null;
  if (!Array.isArray(d.answerKey)) return null;

  for (const section of d.sections) {
    if (!section || typeof section !== 'object') return null;
    const s = section as Record<string, unknown>;
    if (typeof s.title !== 'string') return null;
    if (!Array.isArray(s.questions)) return null;
    if (!['mcq', 'shortAnswer', 'problemSolving'].includes(s.type as string)) return null;

    for (const q of s.questions) {
      if (!q || typeof q !== 'object') return null;
      const question = q as Record<string, unknown>;
      if (typeof question.number !== 'number') return null;
      if (typeof question.text !== 'string' || !question.text.trim()) return null;
      if (typeof question.points !== 'number' || question.points <= 0) return null;
    }
  }

  for (const entry of d.answerKey) {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;
    if (typeof e.questionNumber !== 'number') return null;
    if (typeof e.answer !== 'string') return null;
  }

  return d as unknown as ExamPaper;
}
