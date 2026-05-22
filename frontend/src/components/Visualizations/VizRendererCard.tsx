'use client';

import { Maximize2, Minimize2, Download, Code } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();

  return (
    <Card
      className={`relative border-0 bg-surface-container-high shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden mb-6 group/viz transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)] ${
        fullscreen ? 'shadow-none border-0 rounded-none' : 'inner-glow'
      }`}
    >
      {/* Corner accents */}
      {!fullscreen && (
        <>
          <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none z-10" aria-hidden="true">
            <div className="absolute top-3 left-3 w-3 h-[1px] bg-gradient-to-r from-clay/40 to-transparent" />
            <div className="absolute top-3 left-3 h-3 w-[1px] bg-gradient-to-b from-clay/40 to-transparent" />
          </div>
          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none z-10" aria-hidden="true">
            <div className="absolute top-3 right-3 w-3 h-[1px] bg-gradient-to-l from-clay/40 to-transparent" />
            <div className="absolute top-3 right-3 h-3 w-[1px] bg-gradient-to-b from-clay/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none z-10" aria-hidden="true">
            <div className="absolute bottom-3 left-3 w-3 h-[1px] bg-gradient-to-r from-clay/40 to-transparent" />
            <div className="absolute bottom-3 left-3 h-3 w-[1px] bg-gradient-to-t from-clay/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none z-10" aria-hidden="true">
            <div className="absolute bottom-3 right-3 w-3 h-[1px] bg-gradient-to-l from-clay/40 to-transparent" />
            <div className="absolute bottom-3 right-3 h-3 w-[1px] bg-gradient-to-t from-clay/40 to-transparent" />
          </div>
        </>
      )}

      {/* Subtle noise texture */}
      {!fullscreen && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-[1]">
        {children}
      </div>

      {/* Floating action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/viz:opacity-100 transition-all duration-200 translate-y-[-4px] group-hover/viz:translate-y-0 z-20">
        <button
          onClick={onToggleCode}
          className={`p-2 rounded-lg bg-surface/80 backdrop-blur-sm text-on-surface hover:bg-surface hover:scale-110 transition-all ${showCode ? 'ring-2 ring-tertiary shadow-md shadow-tertiary/20' : ''}`}
          title={t('viz.viewSource')}
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          onClick={onDownload}
          className="p-2 rounded-lg bg-surface/80 backdrop-blur-sm text-on-surface hover:bg-surface hover:scale-110 transition-all"
          title={t('viz.downloadHtml')}
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg bg-surface/80 backdrop-blur-sm text-on-surface hover:bg-surface hover:scale-110 transition-all"
          title={t('viz.fullscreen')}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </Card>
  );
}
