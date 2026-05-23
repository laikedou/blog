import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import type { ExamPaper } from './exam-schema';

const ACCENT_COLOR = '#2563EB';

function questionTypeLabel(type: string): string {
  switch (type) {
    case 'mcq': return 'Multiple Choice';
    case 'shortAnswer': return 'Short Answer';
    case 'problemSolving': return 'Problem Solving';
    default: return 'Question';
  }
}

export async function exportExamToDocx(
  paper: ExamPaper,
  filename: string,
  options: { includeAnswers?: boolean } = {},
): Promise<void> {
  const includeAnswers = options.includeAnswers ?? true;
  const children: Paragraph[] = [];

  // Version label
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: includeAnswers ? '[TEACHER VERSION]' : '[STUDENT VERSION]',
          size: 14,
          bold: true,
          color: includeAnswers ? '#CC2222' : '#888888',
        }),
      ],
    }),
  );

  if (includeAnswers) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'CONFIDENTIAL', size: 14, bold: true, color: '#CC2222' })],
      }),
    );
  }

  // Title
  children.push(
    new Paragraph({
      text: paper.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Meta info
  const metaParts: string[] = [];
  if (paper.subject) metaParts.push(paper.subject);
  metaParts.push(`Total: ${paper.totalPoints} points`);
  if (paper.timeLimit) metaParts.push(`Time: ${paper.timeLimit}`);
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: metaParts.flatMap((part, i) => [
        new TextRun({ text: part, size: 20, color: '#666666' }),
        ...(i < metaParts.length - 1 ? [new TextRun({ text: '  ·  ', size: 20, color: '#AAAAAA' })] : []),
      ]),
    }),
  );

  // Student info
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: 'Name: _______________    Date: _______________    Score: _____ / ', size: 18, color: '#888888' }),
        new TextRun({ text: `${paper.totalPoints}`, size: 18, color: '#888888' }),
      ],
    }),
  );

  // Sections
  for (const section of paper.sections) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
    );

    if (section.instructions) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: section.instructions, italics: true, size: 20, color: '#666666' })],
        }),
      );
    }

    for (const question of section.questions) {
      const qRuns: TextRun[] = [
        new TextRun({ text: `${question.number}. `, bold: true, size: 21, color: ACCENT_COLOR }),
        new TextRun({ text: `${question.text}  `, size: 21 }),
        new TextRun({ text: `[${question.points} pts]`, size: 18, color: '#999999' }),
      ];

      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: qRuns,
        }),
      );

      // MCQ options
      if (question.type === 'mcq' && question.options) {
        for (const opt of question.options) {
          children.push(
            new Paragraph({
              indent: { left: 480 },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${opt.label}. `, bold: true, size: 20, color: ACCENT_COLOR }),
                new TextRun({ text: opt.text, size: 20 }),
              ],
            }),
          );
        }
      }

      // Teacher version: show answer inline for non-MCQ
      if (includeAnswers && question.type !== 'mcq') {
        const answerEntry = paper.answerKey.find(a => a.questionNumber === question.number);
        if (answerEntry) {
          children.push(
            new Paragraph({
              indent: { left: 480 },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: 'Answer: ', bold: true, size: 18, color: ACCENT_COLOR }),
                new TextRun({ text: answerEntry.answer, size: 18, italics: true, color: '#444444' }),
              ],
            }),
          );
        }
      }

      // Answer space for non-MCQ
      if (question.type === 'shortAnswer' || question.type === 'problemSolving') {
        const lines = question.type === 'problemSolving' ? 6 : 4;
        for (let i = 0; i < lines; i++) {
          children.push(
            new Paragraph({
              indent: { left: 480 },
              spacing: { after: 40 },
              children: [new TextRun({ text: '─'.repeat(60), size: 16, color: '#DDDDDD' })],
            }),
          );
        }
      }

      // Question type tag
      children.push(
        new Paragraph({
          indent: { left: 480 },
          spacing: { after: 80 },
          children: [new TextRun({ text: `[${questionTypeLabel(question.type)} · ${question.points} points]`, size: 16, italics: true, color: '#AAAAAA' })],
        }),
      );
    }
  }

  // End of exam
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [new TextRun({ text: '─ END OF EXAM ─', size: 18, color: '#CCCCCC' })],
      alignment: AlignmentType.CENTER,
    }),
  );

  // Answer Key (teacher version only)
  if (includeAnswers && paper.answerKey.length > 0) {
    children.push(
      new Paragraph({
        text: 'Answer Key & Scoring Rubric',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
      }),
    );

    for (const entry of paper.answerKey) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [new TextRun({ text: `Q${entry.questionNumber}.`, bold: true, size: 22, color: ACCENT_COLOR })],
        }),
      );

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'Answer: ', bold: true, size: 20 }),
            new TextRun({ text: entry.answer || 'N/A', size: 20 }),
          ],
        }),
      );

      if (entry.explanation) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: 'Explanation: ', bold: true, size: 20 }),
              new TextRun({ text: entry.explanation, size: 20, color: '#444444' }),
            ],
          }),
        );
      }

      if (entry.rubric) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'Rubric: ', bold: true, size: 20 }),
              new TextRun({ text: entry.rubric, size: 20, color: '#444444' }),
            ],
          }),
        );
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1200,
            right: 1200,
            bottom: 1200,
            left: 1200,
          },
        },
      },
      children,
    }],
  });

  const suffix = includeAnswers ? 'teacher' : 'student';
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[^a-z0-9]/gi, '_')}_exam_${suffix}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
