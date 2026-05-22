'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const tabs = [
    { key: 'comments', label: t('viz.comments_tab') },
    { key: 'related', label: t('viz.related_tab') },
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

  return (
    <Card className="border-border shadow-card mb-6">
      <CardContent className="p-6">
        {/* Sliding indicator tabs */}
        <div className="relative mb-6">
          <div className="flex gap-0 border-b border-outline-variant/50" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.key}
                ref={el => { tabRefs.current[tab.key] = el; }}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative shrink-0 px-4 py-2.5 text-body-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.key
                    ? 'text-on-surface'
                    : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="absolute bottom-0 h-[2px] bg-gradient-to-r from-clay to-tertiary rounded-full transition-[left,width] duration-300 ease-out"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>

        {/* Content panels */}
        <div key={activeTab} className="animate-fade-up">
          {activeTab === 'comments' && (
            <VisualizationComments visualizationId={visualizationId} />
          )}
          {activeTab === 'related' && (
            <RelatedVisualizations visualizationId={visualizationId} currentSubject={currentSubject || ''} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
