'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, HelpCircle, RotateCcw, Trophy, Target, CircleDot } from 'lucide-react';

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
  const t = useTranslations();
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

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const correctCount = submitted
    ? questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const isPerfect = submitted && correctCount === questions.length;

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-clay/10 border border-clay/20 flex items-center justify-center mb-4">
          <HelpCircle className="h-8 w-8 text-clay/50" />
        </div>
        <p className="text-body text-on-surface-variant mb-1">{t('viz.quiz.empty')}</p>
        <p className="text-caption-sm text-on-surface-variant/50">{t('viz.quiz.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-clay/10 border border-clay/20 flex items-center justify-center">
            <Target className="h-4 w-4 text-clay" />
          </div>
          <h2 className="font-display text-display-xs text-on-surface">{t('viz.article.quiz')}</h2>
        </div>
        {!submitted && (
          <span className="text-caption-sm text-on-surface-variant/60 bg-surface-container-high px-2.5 py-1 rounded-full">
            {answeredCount}/{questions.length}
          </span>
        )}
      </div>

      {/* Score reveal after submission */}
      {submitted && (
        <div className={`rounded-xl border p-5 animate-scale-in ${
          isPerfect
            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
            : scorePercent >= 50
              ? 'bg-gradient-to-br from-clay/5 to-tertiary/5 border-clay/20'
              : 'bg-surface-warm border-outline-variant/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isPerfect
                ? 'bg-amber-100'
                : scorePercent >= 50
                  ? 'bg-clay/10'
                  : 'bg-surface-container-high'
            }`}>
              {isPerfect ? (
                <Trophy className="h-7 w-7 text-amber-600" />
              ) : (
                <Target className="h-7 w-7 text-clay" />
              )}
            </div>
            <div>
              <p className="font-display text-display-xs text-on-surface">
                {isPerfect ? t('viz.quiz.perfect') : t('viz.article.score')}
              </p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                <span className="text-display-sm font-bold text-on-surface">{correctCount}</span>
                <span className="text-on-surface-variant/60"> / {questions.length}</span>
                <span className="text-on-surface-variant/40 mx-2">·</span>
                <span className={scorePercent >= 50 ? 'text-clay font-medium' : 'text-on-surface-variant/60'}>
                  {scorePercent}%
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress dots */}
      {!submitted && questions.length > 1 && (
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                answers[i] !== undefined
                  ? 'bg-clay flex-1'
                  : 'bg-outline-variant/30 w-4'
              }`}
            />
          ))}
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qi) => {
        const selected = answers[qi];
        const isCorrect = submitted && selected === q.correctIndex;
        const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

        return (
          <div
            key={qi}
            className={`p-5 rounded-xl border transition-all duration-500 ${
              submitted
                ? isCorrect
                  ? 'border-emerald-300 bg-emerald-50/60 shadow-sm shadow-emerald-100/50'
                  : isWrong
                    ? 'border-red-300 bg-red-50/60 shadow-sm shadow-red-100/50'
                    : 'border-outline-variant/30 bg-surface-container-high'
                : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
            }`}
          >
            <p className="font-medium text-body text-on-surface mb-3 flex items-start gap-2.5">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-caption-xs font-bold ${
                submitted
                  ? isCorrect
                    ? 'bg-emerald-100 text-emerald-700'
                    : isWrong
                      ? 'bg-red-100 text-red-700'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  : 'bg-clay/10 text-clay'
              }`}>
                {qi + 1}
              </span>
              <span>{q.question}</span>
            </p>

            <div className="space-y-1.5 ml-8.5">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const showCorrect = submitted && oi === q.correctIndex;
                const showWrong = submitted && isSelected && oi !== q.correctIndex;

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-body-sm transition-all duration-200 flex items-center justify-between group ${
                      showCorrect
                        ? 'bg-emerald-100 text-emerald-800 font-medium'
                        : showWrong
                          ? 'bg-red-100 text-red-800 line-through'
                          : isSelected
                            ? 'bg-clay/10 text-clay font-medium ring-1 ring-clay/30 shadow-sm'
                            : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface hover:shadow-sm'
                    } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        showCorrect
                          ? 'border-emerald-500 bg-emerald-500'
                          : showWrong
                            ? 'border-red-500 bg-red-500'
                            : isSelected
                              ? 'border-clay'
                              : 'border-outline-variant group-hover:border-outline'
                      }`}>
                        {showCorrect && <CheckCircle className="h-3 w-3 text-white" />}
                        {showWrong && <XCircle className="h-3 w-3 text-white" />}
                        {!submitted && isSelected && <CircleDot className="h-2.5 w-2.5 text-clay" />}
                      </span>
                      <span>{opt}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <div className={`mt-3 ml-8.5 px-3.5 py-2.5 rounded-lg text-body-sm transition-all duration-300 ${
                isCorrect
                  ? 'bg-emerald-100/50 text-emerald-800'
                  : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/30'
              }`}>
                <span className="text-caption-xs font-medium uppercase tracking-wider text-on-surface-variant/50 mr-2">
                  {t('viz.quiz.explanation')}
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Action footer */}
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
        {submitted ? (
          <>
            <p className="text-caption-sm text-on-surface-variant/60">
              {isPerfect
                ? t('viz.quiz.perfectMessage')
                : scorePercent >= 50
                  ? t('viz.quiz.goodJob')
                  : t('viz.quiz.keepTrying')}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-sm font-medium text-clay hover:bg-clay/5 active:bg-clay/10 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              {t('viz.article.retry')}
            </button>
          </>
        ) : (
          <>
            <p className="text-caption-sm text-on-surface-variant/50">
              {allAnswered
                ? t('viz.quiz.ready')
                : t('viz.quiz.selectAll')}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-clay text-white text-body-sm font-medium hover:bg-clay/90 active:scale-[0.97] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md shadow-clay/20"
            >
              <CheckCircle className="h-4 w-4" />
              {t('viz.article.submit')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
