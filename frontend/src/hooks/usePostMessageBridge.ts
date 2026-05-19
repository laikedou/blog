'use client';

import { useCallback, useRef } from 'react';

export interface VizInteractionPayload {
  parameter: string;
  value: any;
  action: 'drag' | 'click' | 'change';
  timestamp: number;
}

interface UsePostMessageBridgeOptions {
  /** Debounce window in ms for rapid events like slider drags (default: 300) */
  debounceMs?: number;
  /** Called with each interaction payload from the rendered viz */
  onInteraction: (payload: VizInteractionPayload) => void;
}

/**
 * Hook that provides debounced handling of postMessage events from rendered visualization HTML.
 * The rendered viz calls window.parent.postMessage({ type: 'viz:interact', payload }, '*')
 * and this hook processes them with optional debouncing.
 */
export function usePostMessageBridge({ debounceMs = 300, onInteraction }: UsePostMessageBridgeOptions) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef<VizInteractionPayload | null>(null);
  const onInteractionRef = useRef(onInteraction);
  onInteractionRef.current = onInteraction;

  const handleInteraction = useCallback((payload: VizInteractionPayload) => {
    // For 'drag' actions, debounce to avoid flooding
    if (payload.action === 'drag') {
      lastPayloadRef.current = payload;
      if (debounceTimerRef.current) return; // already waiting
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (lastPayloadRef.current) {
          onInteractionRef.current?.(lastPayloadRef.current);
          lastPayloadRef.current = null;
        }
      }, debounceMs);
    } else {
      // Immediate for clicks and discrete changes
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      onInteractionRef.current?.(payload);
    }
  }, [debounceMs]);

  return { handleInteraction };
}
