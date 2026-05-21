'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import VisualizationComments from './VisualizationComments';
import RelatedVisualizations from './RelatedVisualizations';

interface Props {
  visualizationId: number;
  currentSubject?: string;
}

export default function VizSocialTabs({ visualizationId, currentSubject }: Props) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('comments');

  return (
    <Card className="border-border shadow-card mb-6">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="comments">{t('viz.comments_tab')}</TabsTrigger>
            <TabsTrigger value="related">{t('viz.related_tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="animate-fade-in">
            <VisualizationComments visualizationId={visualizationId} />
          </TabsContent>

          <TabsContent value="related" className="animate-fade-in">
            <RelatedVisualizations visualizationId={visualizationId} currentSubject={currentSubject || ''} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
