'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { visualizations } from '@/lib/api';
import type { VizInteractionPayload } from '@/components/Visualizations/VisualizationRenderer';

interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

interface UseAITutorOptions {
  visualizationId: number;
  language?: string;
}

export function useAITutor({ visualizationId, language }: UseAITutorOptions) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionIdRef = useRef(`tutor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<string>('');

  const sendInteraction = useCallback(async (payload: VizInteractionPayload) => {
    const key = `${payload.parameter}:${payload.value}`;
    if (key === lastSentRef.current) return;
    lastSentRef.current = key;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const userMsg: TutorMessage = {
          id: `u-${Date.now()}`,
          role: 'user',
          text: payload.action === 'drag'
            ? t('viz.tutor.dragAction', { param: payload.parameter, value: payload.value })
            : payload.action === 'click'
            ? t('viz.tutor.clickAction', { param: payload.parameter })
            : t('viz.tutor.changeAction', { param: payload.parameter }),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);

        const result = await visualizations.askTutor(visualizationId, {
          sessionId: sessionIdRef.current,
          interactionType: payload.action === 'drag' ? 'param_change' : 'button_click',
          parameterName: payload.parameter,
          parameterValue: String(payload.value),
          language,
        });

        const tutorMsg: TutorMessage = {
          id: `t-${Date.now()}`,
          role: 'tutor',
          text: result.aiResponse,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, tutorMsg]);
        setOpen(true); // Auto-open on first response
      } catch {
        // Silently fail — tutor is optional
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [visualizationId, language]);

  const askQuestion = useCallback(async (question: string) => {
    setLoading(true);
    try {
      const userMsg: TutorMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: question,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const result = await visualizations.askTutor(visualizationId, {
        sessionId: sessionIdRef.current,
        interactionType: 'question',
        question,
        language,
      });

      const tutorMsg: TutorMessage = {
        id: `t-${Date.now()}`,
        role: 'tutor',
        text: result.aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [visualizationId, language]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return {
    messages,
    loading,
    open,
    sendInteraction,
    askQuestion,
    clearHistory,
    toggle,
    setOpen,
  };
}
