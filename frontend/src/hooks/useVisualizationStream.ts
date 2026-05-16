'use client';

import { useCompletion } from '@ai-sdk/react';
import { useCallback, useRef, useState } from 'react';
import { visualizations } from '@/lib/api';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error' | 'aborted';

export interface StreamState {
  status: StreamStatus;
  visualizationId: number | null;
  title: string;
  code: string;
  error: string | null;
  fullResponse: {
    id: number;
    htmlContent: string;
    raw: string;
    title: string;
    status: string;
  } | null;
}

export function useVisualizationStream() {
  const vizIdRef = useRef<number | null>(null);
  const vizTitleRef = useRef<string>('');
  const [fullResponse, setFullResponse] = useState<StreamState['fullResponse']>(null);
  const [abortedByUser, setAbortedByUser] = useState(false);
  const hasStartedRef = useRef(false);

  // Intercept the fetch response to extract viz ID/title from headers before
  // useCompletion consumes the stream.
  const captureHeaders: typeof fetch = useCallback(async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok) return response; // let useCompletion handle errors

    const id = response.headers.get('X-Viz-Id');
    const title = response.headers.get('X-Viz-Title');
    if (id) vizIdRef.current = parseInt(id, 10);
    if (title) vizTitleRef.current = decodeURIComponent(title);

    return response;
  }, []);

  const { completion, isLoading, error, stop, complete } = useCompletion({
    api: '/api/visualizations/generate-stream',
    streamProtocol: 'text',
    headers:
      typeof window !== 'undefined' && localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')!}` }
        : {},
    fetch: captureHeaders,
    onFinish: (_prompt, result) => {
      // The completion result is the full HTML code — set synchronously
      // so the UI can transition immediately.
      const loadedId = vizIdRef.current ?? 0;
      setFullResponse({
        id: loadedId,
        htmlContent: result,
        raw: result,
        title: vizTitleRef.current || '',
        status: 'draft',
      });

      // Fire-and-forget: fetch the real status from backend for the review step
      if (loadedId) {
        visualizations.get(loadedId).then((viz) => {
          setFullResponse((prev) =>
            prev ? { ...prev, status: viz.status } : prev,
          );
        }).catch(() => {});
      }
    },
  });

  const getStatus = (): StreamStatus => {
    if (abortedByUser) return 'aborted';
    if (error) return 'error';
    if (!hasStartedRef.current) return 'idle';
    if (isLoading && !completion) return 'connecting';
    if (isLoading) return 'streaming';
    if (completion) return 'complete';
    return 'idle';
  };

  const start = useCallback(async (data: { prompt: string; subject: string; title?: string }) => {
    hasStartedRef.current = true;
    setAbortedByUser(false);
    setFullResponse(null);
    vizIdRef.current = null;
    vizTitleRef.current = '';

    await complete(data.prompt, {
      body: { subject: data.subject, title: data.title || '' },
    });
  }, [complete]);

  const abort = useCallback(() => {
    setAbortedByUser(true);
    stop();
  }, [stop]);

  const reset = useCallback(() => {
    hasStartedRef.current = false;
    setAbortedByUser(false);
    setFullResponse(null);
    vizIdRef.current = null;
    vizTitleRef.current = '';
  }, []);

  return {
    state: {
      status: getStatus(),
      visualizationId: vizIdRef.current,
      title: vizTitleRef.current,
      code: completion,
      error: error?.message ?? null,
      fullResponse,
    },
    start,
    abort,
    reset,
  };
}
