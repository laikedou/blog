import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import type { ExamPaper, ExamSection, ExamQuestion, ExamAnswerEntry } from './exam-schema';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 50;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

function drawWrappedText(
  page: PDFPage, text: string, font: any, fontSize: number,
  x: number, y: number, maxWidth: number, color: any, lineHeight: number,
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }
  return y;
}

export async function exportExamToPdf(
  paper: ExamPaper,
  filename: string,
  options: { includeAnswers?: boolean } = {},
): Promise<void> {
  const includeAnswers = options.includeAnswers ?? true;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const textColor = rgb(0.13, 0.13, 0.18);
  const mutedColor = rgb(0.35, 0.35, 0.45);
  const accentColor = rgb(0.15, 0.4, 0.75);
  const lineColor = rgb(0.8, 0.8, 0.85);
  const watermarkColor = rgb(0.9, 0.15, 0.15);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  const checkSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN_TOP;
    }
  };

  // Version label
  const versionLabel = includeAnswers ? '[TEACHER VERSION]' : '[STUDENT VERSION]';
  page.drawText(versionLabel, { x: MARGIN_LEFT, y, size: 8, font: fontBold, color: includeAnswers ? watermarkColor : mutedColor });
  y -= 18;

  // Watermark for teacher version
  if (includeAnswers) {
    page.drawText('CONFIDENTIAL', {
      x: PAGE_WIDTH - MARGIN_RIGHT - 72, y: PAGE_HEIGHT - MARGIN_TOP,
      size: 7, font: fontBold, color: watermarkColor,
    });
  }

  // Header
  page.drawText(paper.title, { x: MARGIN_LEFT, y, size: 18, font: fontBold, color: textColor });
  y -= 28;

  const headerParts: string[] = [];
  if (paper.subject) headerParts.push(paper.subject);
  headerParts.push(`Total: ${paper.totalPoints} points`);
  if (paper.timeLimit) headerParts.push(`Time: ${paper.timeLimit}`);
  page.drawText(headerParts.join('  ·  '), { x: MARGIN_LEFT, y, size: 10, font, color: mutedColor });
  y -= 18;

  page.drawText('Name: _______________    Date: _______________    Score: _____', {
    x: MARGIN_LEFT, y, size: 9, font, color: mutedColor,
  });
  y -= 24;

  page.drawLine({ start: { x: MARGIN_LEFT, y }, end: { x: PAGE_WIDTH - MARGIN_RIGHT, y }, color: lineColor, thickness: 1 });
  y -= 20;

  // Sections
  for (const section of paper.sections) {
    checkSpace(60);
    page.drawText(section.title, { x: MARGIN_LEFT, y, size: 14, font: fontBold, color: textColor });
    y -= 22;

    if (section.instructions) {
      checkSpace(20);
      y = drawWrappedText(page, section.instructions, fontOblique, 9, MARGIN_LEFT, y, USABLE_WIDTH, mutedColor, 14);
      y -= 10;
    }

    for (const question of section.questions) {
      const qLabel = `${question.number}.`;
      const qText = `${question.text}  [${question.points} pts]`;

      const qLines = wrapText(qText, font, 10, USABLE_WIDTH - 24);
      const neededLines = qLines.length + (question.type === 'mcq' && question.options ? question.options.length : 0) + 2;
      const needed = neededLines * 18 + (question.type !== 'mcq' ? 60 : 10);
      checkSpace(needed);

      page.drawText(qLabel, { x: MARGIN_LEFT, y, size: 10, font: fontBold, color: accentColor });
      y = drawWrappedText(page, qText, font, 10, MARGIN_LEFT + 20, y, USABLE_WIDTH - 24, textColor, 16);
      y -= 4;

      // MCQ options
      if (question.type === 'mcq' && question.options) {
        for (const opt of question.options) {
          checkSpace(16);
          page.drawText(`${opt.label}.`, { x: MARGIN_LEFT + 20, y, size: 10, font: fontBold, color: accentColor });
          page.drawText(opt.text, { x: MARGIN_LEFT + 38, y, size: 10, font, color: textColor });
          y -= 16;
        }
        y -= 4;
      }

      // Teacher version: show answer inline for non-MCQ
      if (includeAnswers && question.type !== 'mcq') {
        const answerEntry = paper.answerKey.find(a => a.questionNumber === question.number);
        if (answerEntry) {
          checkSpace(30);
          const ansText = `Answer: ${answerEntry.answer}`;
          y = drawWrappedText(page, ansText, fontOblique, 8, MARGIN_LEFT + 20, y, USABLE_WIDTH - 24, accentColor, 13);
          y -= 4;
        }
      }

      // Answer space for student version (or all versions for non-MCQ)
      if (question.type === 'shortAnswer' || question.type === 'problemSolving') {
        checkSpace(50);
        const spaceH = question.type === 'problemSolving' ? 60 : 40;
        page.drawRectangle({
          x: MARGIN_LEFT + 20, y: y - spaceH,
          width: USABLE_WIDTH - 24, height: spaceH,
          borderColor: lineColor, borderWidth: 0.5,
          color: rgb(0.98, 0.98, 0.99),
        });
        y -= (spaceH + 10);
      }
    }

    y -= 8;
  }

  // End of exam
  y -= 10;
  page.drawText('─ END OF EXAM ─', {
    x: MARGIN_LEFT, y, size: 10, font, color: mutedColor,
  });

  // Answer Key (teacher version only)
  if (includeAnswers && paper.answerKey.length > 0) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;
    page.drawText('Answer Key & Scoring Rubric', { x: MARGIN_LEFT, y, size: 16, font: fontBold, color: textColor });
    y -= 28;

    for (const entry of paper.answerKey) {
      const content = [
        `Answer: ${entry.answer || 'N/A'}`,
        entry.explanation ? `Explanation: ${entry.explanation}` : '',
        entry.rubric ? `Rubric: ${entry.rubric}` : '',
      ].filter(Boolean).join('\n');

      const lines = wrapText(content, font, 9, USABLE_WIDTH - 24);
      const needed = lines.length * 14 + 30;
      checkSpace(needed);

      page.drawText(`Q${entry.questionNumber}.`, { x: MARGIN_LEFT, y, size: 10, font: fontBold, color: accentColor });
      y -= 6;
      y = drawWrappedText(page, content, font, 9, MARGIN_LEFT + 16, y, USABLE_WIDTH - 20, textColor, 13);
      y -= 10;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const suffix = includeAnswers ? 'teacher' : 'student';
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[^a-z0-9]/gi, '_')}_exam_${suffix}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
