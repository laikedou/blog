'use client';

import { useTranslation } from 'react-i18next';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';

interface Perspective {
  id: number;
  perspectiveName: string;
  subtitle: string;
  visualization: {
    id: number;
    title: string;
    htmlContent: string;
    description?: string;
  };
}

interface Props {
  perspectives: Perspective[];
  activeIndex: number;
  onChange: (index: number, perspective: Perspective) => void;
}

export default function ExperimentSwitcher({ perspectives, activeIndex, onChange }: Props) {
  const { t } = useTranslation();

  if (perspectives.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-clay" />
        <span className="text-caption-sm font-medium text-ink-muted uppercase tracking-wider">
          {t('viz.experiment.perspectives')}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {perspectives.map((p, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={p.id}
              onClick={() => onChange(i, p)}
              className={`shrink-0 text-left px-4 py-3 rounded-xl border transition-all min-w-[200px] ${
                isActive
                  ? 'border-clay bg-clay/5 shadow-sm'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <p className={`font-label-sm text-label-sm ${isActive ? 'text-clay' : 'text-ink'}`}>
                {i + 1}. {p.perspectiveName}
              </p>
              {p.subtitle && (
                <p className="text-caption-sm text-ink-muted mt-0.5 truncate">{p.subtitle}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
