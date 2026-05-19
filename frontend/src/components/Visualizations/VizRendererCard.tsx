'use client';

import { Maximize2, Minimize2, Download, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
  fullscreen: boolean;
  showCode: boolean;
  onToggleFullscreen: () => void;
  onDownload: () => void;
  onToggleCode: () => void;
}

export default function VizRendererCard({
  children,
  fullscreen,
  showCode,
  onToggleFullscreen,
  onDownload,
  onToggleCode,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card className={`border-border shadow-card overflow-hidden mb-6 group/viz ${fullscreen ? 'shadow-none border-0 rounded-none' : ''}`}>
      <div className=" relative">
        {children}

        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/viz:opacity-100 transition-opacity duration-200">
          <button
            onClick={onToggleCode}
            className={`p-2 rounded-lg bg-surface/80 backdrop-blur-sm text-on-surface hover:bg-surface transition-colors ${showCode ? 'ring-2 ring-tertiary' : ''}`}
            title={t('viz.viewSource')}
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={onDownload}
            className="p-2 rounded-lg bg-surface/80 backdrop-blur-sm text-on-surface hover:bg-surface transition-colors"
            title={t('viz.downloadHtml')}
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-surface/80 backdrop-blur-sm text-on-surface hover:bg-surface transition-colors"
            title={t('viz.fullscreen')}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Card>
  );
}
