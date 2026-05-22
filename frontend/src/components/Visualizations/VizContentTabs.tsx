'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ArticleLayout from './ArticleLayout';
import ArticleSection from './ArticleSection';
import QuizPanel from './QuizPanel';
import CodePreview from './CodePreview';

interface Props {
  viz: any;
  renderer?: React.ReactNode;
  showCode: boolean;
}

export default function VizContentTabs({ viz, renderer, showCode }: Props) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const availableTabs = [
    { key: 'overview', label: t('viz.interactive') },
    ...(viz.detailedExplanation ? [{ key: 'explanation', label: t('viz.detailedExplanation') }] : []),
    ...(viz.knowledgeSummary ? [{ key: 'summary', label: t('viz.keyKnowledge') }] : []),
    ...(viz.quiz ? [{ key: 'quiz', label: t('viz.article.quiz') }] : []),
  ];

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    }
  }, [activeTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(viz.htmlContent);
    toast.success(t('common.copied'));
  };

  const quizQuestions = (() => {
    if (!viz.quiz) return null;
    try {
      return typeof viz.quiz === 'string' ? JSON.parse(viz.quiz) : viz.quiz;
    } catch {
      return null;
    }
  })();

  const content = (
    <div className="space-y-6">
      {/* Sliding indicator tabs */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-0 border-b border-outline-variant/50" role="tablist">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              ref={el => { tabRefs.current[tab.key] = el; }}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative shrink-0 px-4 py-3 text-body-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-on-surface'
                  : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Animated indicator */}
        <div
          className="absolute bottom-0 h-[2px] bg-gradient-to-r from-clay to-tertiary rounded-full transition-[left,width] duration-300 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>

      {/* Tab panels */}
      <div key={activeTab} className="animate-fade-up">
        {activeTab === 'overview' && (
          viz.introduction ? (
            <Card className="border-border bg-surface-warm border-l-[3px] border-l-clay/50">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-on-surface mb-2">{t('viz.aboutThis')}</h2>
                <p className="text-body text-on-surface-variant leading-relaxed">{viz.introduction}</p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-body text-on-surface-variant">{t('viz.noVizDesc')}</p>
          )
        )}

        {activeTab === 'explanation' && viz.detailedExplanation && (
          <Card className="border-border shadow-card border-l-[3px] border-l-clay/50">
            <CardContent className="p-6">
              <h2 className="font-display text-display-xs text-on-surface mb-3">{t('viz.detailedExplanation')}</h2>
              <div className="text-body text-on-surface-variant leading-relaxed space-y-3">
                {viz.detailedExplanation.split('\n\n').filter(Boolean).map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'summary' && viz.knowledgeSummary && (
          <Card className="border-border shadow-card">
            <CardContent className="p-6">
              <h2 className="font-display text-display-xs text-on-surface mb-3">{t('viz.keyKnowledge')}</h2>
              <ul className="space-y-2">
                {viz.knowledgeSummary.split('\n').filter(Boolean).map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-body text-on-surface-variant group/item">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      viz.subject === 'math' ? 'bg-blue-400' : 'bg-green-400'
                    } group-hover/item:scale-150 transition-transform duration-200`} />
                    <span>{point.replace(/^[-•*]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {activeTab === 'quiz' && quizQuestions && (
          <Card className="border-border shadow-card">
            <CardContent className="p-6">
              <QuizPanel questions={quizQuestions} />
            </CardContent>
          </Card>
        )}
      </div>

      {showCode && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-cream-100">
              <span className="text-caption-sm font-medium text-on-surface-variant uppercase tracking-wider">{t('viz.htmlSourceCode')}</span>
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                {t('common.copy')}
              </Button>
            </div>
            <CodePreview code={viz.htmlContent} maxHeight="400px" />
          </CardContent>
        </Card>
      )}

      {viz.prompt && (
        <Card className="border-border bg-surface-warm">
          <CardContent className="p-5">
            <p className="text-caption-sm text-on-surface-variant/60 uppercase tracking-wider mb-1">{t('viz.generationPrompt')}</p>
            <p className="text-body-sm text-on-surface-variant">{viz.prompt}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (viz.articleMode) {
    return (
      <ArticleLayout
        quiz={viz.quiz}
        renderQuiz={(questions) => (
          <Card className="border-border shadow-card mb-6">
            <CardContent className="p-6">
              <QuizPanel questions={questions} />
            </CardContent>
          </Card>
        )}
      >
        {viz.introduction && (
          <ArticleSection id="section-intro" title={t('viz.aboutThis')} className="mb-6">
            <Card className="border-border bg-surface-warm border-l-[3px] border-l-clay/50">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-on-surface mb-2">{t('viz.aboutThis')}</h2>
                <p className="text-body text-on-surface-variant leading-relaxed">{viz.introduction}</p>
              </CardContent>
            </Card>
          </ArticleSection>
        )}

        <ArticleSection id="section-viz" title={t('viz.interactive')} className="mb-6">
          {renderer}
        </ArticleSection>

        {viz.detailedExplanation && (
          <ArticleSection id="section-explanation" title={t('viz.detailedExplanation')} className="mb-6">
            <Card className="border-border shadow-card border-l-[3px] border-l-clay/50">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-on-surface mb-3">{t('viz.detailedExplanation')}</h2>
                <div className="text-body text-on-surface-variant leading-relaxed space-y-3">
                  {viz.detailedExplanation.split('\n\n').filter(Boolean).map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ArticleSection>
        )}

        {viz.knowledgeSummary && (
          <ArticleSection id="section-summary" title={t('viz.keyKnowledge')} className="mb-6">
            <Card className="border-border shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-on-surface mb-3">{t('viz.keyKnowledge')}</h2>
                <ul className="space-y-2">
                  {viz.knowledgeSummary.split('\n').filter(Boolean).map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-body text-on-surface-variant group/item">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        viz.subject === 'math' ? 'bg-blue-400' : 'bg-green-400'
                      } group-hover/item:scale-150 transition-transform duration-200`} />
                      <span>{point.replace(/^[-•*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </ArticleSection>
        )}

        {showCode && (
          <Card className="border-border mb-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-cream-100">
                <span className="text-caption-sm font-medium text-on-surface-variant uppercase tracking-wider">{t('viz.htmlSourceCode')}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                  {t('common.copy')}
                </Button>
              </div>
              <CodePreview code={viz.htmlContent} maxHeight="400px" />
            </CardContent>
          </Card>
        )}

        {viz.prompt && (
          <Card className="border-border bg-surface-warm mb-6">
            <CardContent className="p-5">
              <p className="text-caption-sm text-on-surface-variant/60 uppercase tracking-wider mb-1">{t('viz.generationPrompt')}</p>
              <p className="text-body-sm text-on-surface-variant">{viz.prompt}</p>
            </CardContent>
          </Card>
        )}
      </ArticleLayout>
    );
  }

  return content;
}
