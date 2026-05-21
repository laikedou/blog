'use client';

import { useRef, useEffect, useState, useCallback, useMemo, memo, useLayoutEffect } from 'react';
import { useTranslations } from 'next-intl';
import { visualizations } from '@/lib/api';

export interface VizInteractionPayload {
  parameter: string;
  value: any;
  action: 'drag' | 'click' | 'change';
  timestamp: number;
}

interface Props {
  htmlContent: string;
  visualizationId?: number;
  className?: string;
  /** Called when a runtime error occurs */
  onError?: (error: string) => void;
  /** Called when a stat event should be recorded */
  onStat?: (action: string) => void;
  /** Called when the rendered viz emits an interaction event via postMessage */
  onInteraction?: (payload: VizInteractionPayload) => void;
  /** External events to forward into the rendered visualization (for classroom sync) */
  externalEvent?: VizInteractionPayload | null;
}

function HtmlVisualizationRendererComponent({ htmlContent, visualizationId, className, onError, onStat, onInteraction, externalEvent }: Props) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onErrorRef = useRef(onError);
  const onInteractionRef = useRef(onInteraction);
  const scriptsRef = useRef<HTMLScriptElement[]>([]);
  const isInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onInteractionRef.current = onInteraction;
  }, [onInteraction]);

  useEffect(() => {
    if (visualizationId) {
      visualizations.recordStat(visualizationId, 'view').catch(() => { });
      onStat?.('view');
    }
  }, [visualizationId, onStat]);

  // Listen for postMessage events from the rendered visualization HTML
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'viz:interact' && event.data?.payload) {
        const payload: VizInteractionPayload = {
          parameter: event.data.payload.parameter || '',
          value: event.data.payload.value,
          action: event.data.payload.action || 'change',
          timestamp: event.data.payload.timestamp || Date.now(),
        };
        onInteractionRef.current?.(payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Forward external events (e.g. teacher sync) into the rendered visualization
  useEffect(() => {
    if (!externalEvent) return;
    window.postMessage({
      type: 'viz:sync',
      payload: externalEvent,
    }, '*');
  }, [externalEvent]);

  const { strippedHtml, scriptData } = useMemo(() => {
    if (!htmlContent) return { strippedHtml: '', scriptData: [] };

    const data: { attrs: string; body: string }[] = [];
    const stripped = htmlContent.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (_, attrs, body) => {
      data.push({ attrs: attrs.trim(), body });
      return '';
    });

    return { strippedHtml: stripped, scriptData: data };
  }, [htmlContent]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !htmlContent) return;

    setRenderError(null);
    scriptsRef.current.forEach(s => s.parentNode?.removeChild(s));
    scriptsRef.current = [];
    container.innerHTML = '';

    container.innerHTML = strippedHtml;

    (window as any).__vizError = (msg: string) => {
      setRenderError(msg);
      onErrorRef.current?.(msg);
    };

    const tempDiv = document.createElement('div');

    scriptData.forEach(({ attrs, body }) => {
      try {
        const script = document.createElement('script');

        tempDiv.innerHTML = `<script ${attrs}></script>`;
        const dummy = tempDiv.firstChild as HTMLScriptElement;
        if (dummy) {
          Array.from(dummy.attributes).forEach(a => script.setAttribute(a.name, a.value));
        }

        if (body.trim()) {
          script.textContent = body;
        }

        container.appendChild(script);
        scriptsRef.current.push(script);
      } catch (e: any) {
        console.error('Viz script error:', e);
      }
    });

    if (scriptData.length === 0) {
      setIsVisible(true);
    } else {
      setIsVisible(true);
    }

    return () => {
      delete (window as any).__vizError;
      scriptsRef.current.forEach(s => s.parentNode?.removeChild(s));
      scriptsRef.current = [];
    };
  }, [htmlContent, strippedHtml, scriptData]);

  const handleDismissError = useCallback(() => {
    setRenderError(null);
  }, []);

  if (!htmlContent) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-3/4 bg-surface-container-highest/30 animate-pulse rounded" />
        <div className="h-64 w-full bg-surface-container-highest/30 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className={className}>
      {renderError && (
        <div
          className="mb-3 p-4 rounded-xl border border-error/20"
          style={{
            background: 'rgba(255, 180, 171, 0.05)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-error shrink-0 mt-0.5">warning</span>
            <div className="flex-1 min-w-0">
              <p className="font-body-sm text-body-sm font-medium text-error mb-1">{t('viz.renderError')}</p>
              <pre className="font-label-sm text-label-sm text-on-surface-variant whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-lg">
                {renderError}
              </pre>
              <button
                onClick={handleDismissError}
                className="mt-2 font-label-sm text-label-sm text-error hover:text-error/80 underline"
              >
                {t('viz.dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="viz-container"
        style={{ visibility: isVisible ? 'visible' : 'hidden' }}
      />
    </div>
  );
}

export const HtmlVisualizationRenderer = memo(
  HtmlVisualizationRendererComponent,
  (prev, next) => {
    return (
      prev.htmlContent === next.htmlContent &&
      prev.visualizationId === next.visualizationId &&
      prev.className === next.className &&
      prev.externalEvent === next.externalEvent
    );
  }
);
