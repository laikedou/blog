'use client';

import { useRef, useEffect, useState, useCallback, useMemo, memo, useLayoutEffect } from 'react';
import { visualizations } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface Props {
  htmlContent: string;
  visualizationId?: number;
  className?: string;
  /** Called when a runtime error occurs */
  onError?: (error: string) => void;
  /** Called when a stat event should be recorded */
  onStat?: (action: string) => void;
}

/**
 * Renders AI-generated HTML content with script execution support.
 * 
 * This version uses a "Manual Control" approach:
 * 1. React renders an empty div wrapper.
 * 2. useLayoutEffect manually sets the innerHTML and injects scripts.
 * 3. React never touches the inner content again during re-renders.
 */
function HtmlVisualizationRendererComponent({ htmlContent, visualizationId, className, onError, onStat }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onErrorRef = useRef(onError);
  const scriptsRef = useRef<HTMLScriptElement[]>([]);
  const isInitializedRef = useRef<string | null>(null);

  // Update callbacks ref
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Record view stat
  useEffect(() => {
    if (visualizationId) {
      visualizations.recordStat(visualizationId, 'view').catch(() => { });
      onStat?.('view');
    }
  }, [visualizationId, onStat]);

  // Extract scripts and clean HTML
  const { strippedHtml, scriptData } = useMemo(() => {
    if (!htmlContent) return { strippedHtml: '', scriptData: [] };

    const data: { attrs: string; body: string }[] = [];
    const stripped = htmlContent.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (_, attrs, body) => {
      data.push({ attrs: attrs.trim(), body });
      return '';
    });

    return { strippedHtml: stripped, scriptData: data };
  }, [htmlContent]);

  // Manual DOM Management
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !htmlContent) return;

    // Prevent double-initialization for the same content in Strict Mode
    // BUT we must allow re-initialization if the content is different
    // However, the disappearing issue suggests that we need to be very careful.

    // 1. Cleanup previous run and hide content until re-initialization is complete.
    setRenderError(null);
    setIsVisible(false);
    scriptsRef.current.forEach(s => s.parentNode?.removeChild(s));
    scriptsRef.current = [];
    container.innerHTML = '';

    // 2. Set new content manually
    container.innerHTML = strippedHtml;

    // 3. Define error handler for AI scripts
    (window as any).__vizError = (msg: string) => {
      setRenderError(msg);
      onErrorRef.current?.(msg);
    };

    // 4. Inject scripts one by one. Keep the container hidden until script
    // insertion is complete to avoid a visible flash of un-initialized content.
    const tempDiv = document.createElement('div');

    scriptData.forEach(({ attrs, body }) => {
      try {
        const script = document.createElement('script');

        // Parse and apply attributes
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
      // Note: We don't clear container.innerHTML here to prevent flash on unmount
      // if it's just a quick re-render.
    };
  }, [htmlContent, strippedHtml, scriptData]);

  const handleDismissError = useCallback(() => {
    setRenderError(null);
  }, []);

  if (!htmlContent) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full rounded-editorial" />
      </div>
    );
  }

  return (
    <div className={className}>
      {renderError && (
        <Card className="mb-3 p-4 border-clay/20 bg-clay-pale">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-clay shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-clay mb-1">Render Error</p>
              <pre className="text-caption-sm text-ink-muted whitespace-pre-wrap font-mono bg-white/60 p-3 rounded-editorial-xs">
                {renderError}
              </pre>
              <button
                onClick={handleDismissError}
                className="mt-2 text-caption-sm text-clay hover:text-clay-dark underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* 
          IMPORTANT: We return a div with NO children and NO dangerouslySetInnerHTML.
          The content is injected manually via the useLayoutEffect above.
          This prevents React from ever touching the internal DOM of this div.
      */}
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
      prev.className === next.className
    );
  }
);
