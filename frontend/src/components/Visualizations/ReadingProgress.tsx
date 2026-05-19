'use client';

import { useTranslation } from 'react-i18next';

interface Props {
  progress: number;
}

export default function ReadingProgress({ progress }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-surface-container-highest/30">
      <div
        className="h-full bg-clay transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('viz.article.progress')}
      />
    </div>
  );
}
