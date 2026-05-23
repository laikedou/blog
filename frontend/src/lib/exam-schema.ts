import { z } from 'zod';

// ── Primitives ──

export const examMcqOptionSchema = z.object({
  label: z.string(),
  text: z.string(),
});

export const examQuestionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
  points: z.number().positive(),
  type: z.enum(['mcq', 'shortAnswer', 'problemSolving']),
  options: z.array(examMcqOptionSchema).optional(),
});

export const examSectionSchema = z.object({
  title: z.string(),
  instructions: z.string().optional(),
  type: z.enum(['mcq', 'shortAnswer', 'problemSolving']),
  questions: z.array(examQuestionSchema),
});

export const examAnswerEntrySchema = z.object({
  questionNumber: z.number().int().positive(),
  answer: z.string(),
  explanation: z.string().optional(),
  rubric: z.string().optional(),
});

export const examPaperSchema = z.object({
  title: z.string(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  difficulty: z.string().optional(),
  totalPoints: z.number().positive(),
  timeLimit: z.string().optional(),
  sections: z.array(examSectionSchema),
  answerKey: z.array(examAnswerEntrySchema),
});

// ── TypeScript types derived from Zod ──

export type ExamPaper = z.infer<typeof examPaperSchema>;
export type ExamSection = z.infer<typeof examSectionSchema>;
export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type ExamMcqOption = z.infer<typeof examMcqOptionSchema>;
export type ExamAnswerEntry = z.infer<typeof examAnswerEntrySchema>;

// ── Exam Configuration (user-facing form state) ──

export interface ExamConfig {
  gradeLevel: 'elementary' | 'middleSchool' | 'highSchool' | 'college';
  difficulty: 'easy' | 'medium' | 'hard';
  mcqCount: number;
  shortAnswerCount: number;
  problemSolvingCount: number;
  mcqPoints: number;
  shortAnswerPoints: number;
  problemSolvingPoints: number;
  timeLimit: number;
  topicFocus: string;
}

export const DEFAULT_EXAM_CONFIG: ExamConfig = {
  gradeLevel: 'highSchool',
  difficulty: 'medium',
  mcqCount: 5,
  shortAnswerCount: 3,
  problemSolvingCount: 2,
  mcqPoints: 6,
  shortAnswerPoints: 14,
  problemSolvingPoints: 14,
  timeLimit: 60,
  topicFocus: '',
};

export function computeTotalPoints(config: ExamConfig): number {
  return (
    config.mcqCount * config.mcqPoints +
    config.shortAnswerCount * config.shortAnswerPoints +
    config.problemSolvingCount * config.problemSolvingPoints
  );
}

export function computeTotalQuestions(config: ExamConfig): number {
  return config.mcqCount + config.shortAnswerCount + config.problemSolvingCount;
}
