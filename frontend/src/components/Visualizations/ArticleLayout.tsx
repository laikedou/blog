'use client';

import { ReactNode } from 'react';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import TableOfContents from './TableOfContents';
import ReadingProgress from './ReadingProgress';

interface Props {
  children: ReactNode;
  /** Quiz JSON string from visualization */
  quiz?: string;
  /** Render quiz component */
  renderQuiz?: (questions: any[]) => ReactNode;
}

export default function ArticleLayout({ children, quiz, renderQuiz }: Props) {
  const { activeSection, progress, sections, scrollToSection } = useReadingProgress();

  let quizQuestions: any[] = [];
  try {
    if (quiz) quizQuestions = JSON.parse(quiz);
  } catch {}

  return (
    <>
      <ReadingProgress progress={progress} />

      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Sidebar: TOC */}
        <aside className="hidden lg:block w-64 shrink-0">
          <TableOfContents
            sections={sections}
            activeSection={activeSection}
            onSelect={scrollToSection}
          />
        </aside>
      </div>

      {/* Quiz section at the bottom */}
      {quizQuestions.length > 0 && renderQuiz?.(quizQuestions)}
    </>
  );
}
