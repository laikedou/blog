'use client';

import { Sparkles, Edit3, History, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

type TabKey = 'generate' | 'edit' | 'versions' | 'preview';

interface Props {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  hasContent: boolean;
  accentColor: string;
}

const TABS: { key: TabKey; icon: React.ElementType; labelKey: string }[] = [
  { key: 'generate', icon: Sparkles, labelKey: 'tabs.generate' },
  { key: 'edit', icon: Edit3, labelKey: 'tabs.edit' },
  { key: 'versions', icon: History, labelKey: 'tabs.versions' },
  { key: 'preview', icon: Eye, labelKey: 'tabs.preview' },
];

export default function AIToolTabs({ activeTab, onChange, hasContent, accentColor }: Props) {
  const t = useTranslations('viz.tools');

  return (
    <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        const isDisabled = !hasContent && (tab.key === 'edit' || tab.key === 'versions' || tab.key === 'preview');

        return (
          <button
            key={tab.key}
            onClick={() => !isDisabled && onChange(tab.key)}
            disabled={isDisabled}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all duration-200 relative whitespace-nowrap ${
              isActive
                ? 'text-white'
                : isDisabled
                  ? 'text-white/15 cursor-not-allowed'
                  : 'text-white/35 hover:text-white/60'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{t(tab.labelKey)}</span>
            {isActive && (
              <div
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
