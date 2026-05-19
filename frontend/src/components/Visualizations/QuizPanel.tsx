'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, HelpCircle, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
}

export default function QuizPanel({ questions }: Props) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const correctCount = submitted
    ? questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;
  const allAnswered = Object.keys(answers).length === questions.length;

  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-display-sm text-ink">{t('viz.article.quiz')}</h2>
        {submitted && (
          <span className="text-body-sm font-medium text-clay">
            {t('viz.article.score')}: {correctCount}/{questions.length}
          </span>
        )}
      </div>

      {questions.map((q, qi) => {
        const selected = answers[qi];
        const isCorrect = submitted && selected === q.correctIndex;
        const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

        return (
          <div
            key={qi}
            className={`p-5 rounded-xl border transition-colors ${
              submitted
                ? isCorrect
                  ? 'border-green-300 bg-green-50/50'
                  : isWrong
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-border bg-surface'
                : 'border-border bg-surface'
            }`}
          >
            <p className="font-label-sm text-label-sm text-ink mb-3 flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-clay shrink-0 mt-0.5" />
              <span>{q.question}</span>
            </p>

            <div className="space-y-2 ml-6">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const showCorrect = submitted && oi === q.correctIndex;
                const showWrong = submitted && isSelected && oi !== q.correctIndex;

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-body-sm transition-all flex items-center justify-between ${
                      showCorrect
                        ? 'bg-green-100 text-green-800 font-medium'
                        : showWrong
                        ? 'bg-red-100 text-red-800'
                        : isSelected
                        ? 'bg-clay/10 text-clay font-medium ring-1 ring-clay/30'
                        : 'bg-surface-container-highest/50 text-ink-muted hover:bg-surface-container-highest hover:text-ink'
                    } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span>{opt}</span>
                    {showCorrect && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                    {showWrong && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <p className={`mt-3 ml-6 text-body-sm ${isCorrect ? 'text-green-700' : 'text-ink-muted'}`}>
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex justify-end gap-3">
        {submitted ? (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-label-sm font-label-sm text-clay hover:text-clay/80 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {t('viz.article.retry')}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-clay text-white text-label-sm font-label-sm hover:bg-clay/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4" />
            {t('viz.article.submit')}
          </button>
        )}
      </div>
    </div>
  );
}
