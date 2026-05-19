'use client';

import { useTranslation } from 'react-i18next';
import { BookOpen, GraduationCap, Microscope } from 'lucide-react';

interface DifficultyLevel {
  id: number;
  title: string;
  htmlContent: string;
  description?: string;
}

interface Props {
  variants: Record<string, DifficultyLevel> | null;
  active: string;
  onChange: (level: string, variant: DifficultyLevel) => void;
}

const LEVEL_CONFIG: Record<string, { icon: typeof BookOpen; label: string; description: string }> = {
  beginner: { icon: BookOpen, label: 'beginner', description: 'Intuitive, minimal math' },
  intermediate: { icon: GraduationCap, label: 'intermediate', description: 'Balanced depth' },
  advanced: { icon: Microscope, label: 'advanced', description: 'Rigorous, deep theory' },
};

export default function DifficultySwitcher({ variants, active, onChange }: Props) {
  const { t } = useTranslation();

  if (!variants || Object.keys(variants).length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-caption-sm font-medium text-ink-muted mr-2">{t('viz.difficulty.title')}:</span>
      <div className="flex bg-surface-container-highest rounded-xl p-1 gap-1">
        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
          if (!variants[level]) return null;
          const isActive = active === level;
          const Icon = config.icon;
          return (
            <button
              key={level}
              onClick={() => onChange(level, variants[level])}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-label-sm font-label-sm transition-all ${
                isActive
                  ? 'bg-clay text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-container-high'
              }`}
              title={t(`viz.difficulty.${config.label}Desc`) || config.description}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(`viz.difficulty.${config.label}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
