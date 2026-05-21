'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

  const availableTabs = [
    { key: 'overview', label: t('viz.interactive') },
    ...(viz.detailedExplanation ? [{ key: 'explanation', label: t('viz.detailedExplanation') }] : []),
    ...(viz.knowledgeSummary ? [{ key: 'summary', label: t('viz.keyKnowledge') }] : []),
    ...(viz.quiz ? [{ key: 'quiz', label: t('viz.article.quiz') }] : []),
  ];

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="shrink-0">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="animate-fade-in">
          {viz.introduction ? (
            <Card className="border-border bg-surface-warm">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-ink mb-2">{t('viz.aboutThis')}</h2>
                <p className="text-body text-ink-muted leading-relaxed">{viz.introduction}</p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-body text-ink-muted">{t('viz.noVizDesc')}</p>
          )}
        </TabsContent>

        {viz.detailedExplanation && (
          <TabsContent value="explanation" className="animate-fade-in">
            <Card className="border-border shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-ink mb-3">{t('viz.detailedExplanation')}</h2>
                <div className="text-body text-ink-muted leading-relaxed space-y-3">
                  {viz.detailedExplanation.split('\n\n').filter(Boolean).map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {viz.knowledgeSummary && (
          <TabsContent value="summary" className="animate-fade-in">
            <Card className="border-border shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-ink mb-3">{t('viz.keyKnowledge')}</h2>
                <ul className="space-y-2">
                  {viz.knowledgeSummary.split('\n').filter(Boolean).map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-body text-ink-muted">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-clay shrink-0" />
                      <span>{point.replace(/^[-•*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {quizQuestions && (
          <TabsContent value="quiz" className="animate-fade-in">
            <Card className="border-border shadow-card">
              <CardContent className="p-6">
                <QuizPanel questions={quizQuestions} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {showCode && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-cream-100">
              <span className="text-caption-sm font-medium text-ink-muted uppercase tracking-wider">{t('viz.htmlSourceCode')}</span>
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
            <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">{t('viz.generationPrompt')}</p>
            <p className="text-body-sm text-ink-muted">{viz.prompt}</p>
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
            <Card className="border-border bg-surface-warm">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-ink mb-2">{t('viz.aboutThis')}</h2>
                <p className="text-body text-ink-muted leading-relaxed">{viz.introduction}</p>
              </CardContent>
            </Card>
          </ArticleSection>
        )}

        <ArticleSection id="section-viz" title={t('viz.interactive')} className="mb-6">
          {renderer}
        </ArticleSection>

        {viz.detailedExplanation && (
          <ArticleSection id="section-explanation" title={t('viz.detailedExplanation')} className="mb-6">
            <Card className="border-border shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-display-xs text-ink mb-3">{t('viz.detailedExplanation')}</h2>
                <div className="text-body text-ink-muted leading-relaxed space-y-3">
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
                <h2 className="font-display text-display-xs text-ink mb-3">{t('viz.keyKnowledge')}</h2>
                <ul className="space-y-2">
                  {viz.knowledgeSummary.split('\n').filter(Boolean).map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-body text-ink-muted">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-clay shrink-0" />
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
                <span className="text-caption-sm font-medium text-ink-muted uppercase tracking-wider">{t('viz.htmlSourceCode')}</span>
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
              <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">{t('viz.generationPrompt')}</p>
              <p className="text-body-sm text-ink-muted">{viz.prompt}</p>
            </CardContent>
          </Card>
        )}
      </ArticleLayout>
    );
  }

  return content;
}
