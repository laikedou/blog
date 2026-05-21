'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

interface NarrationSegment {
  startTime: number;
  endTime: number;
  text: string;
  cuePoint?: string;
}

interface NarrationData {
  segments: NarrationSegment[];
  fullText: string;
  locale: string;
}

export function useNarrationPlayer(narration: NarrationData | null) {
  const currentLocale = useLocale();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [voicesReady, setVoicesReady] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segmentIndexRef = useRef(0);
  const isStoppedRef = useRef(false);
  const speedRef = useRef(speed);
  const segmentsRef = useRef<NarrationSegment[]>([]);
  const unlockedRef = useRef(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    segmentsRef.current = narration?.segments || [];
  }, [narration]);

  // Load voices — retry up to 5 times with increasing delay
  useEffect(() => {
    let attempts = 0;
    let maxAttempts = 5;
    let timer: ReturnType<typeof setTimeout>;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
        setVoiceError(null);
        return;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        setVoiceError(
          'No speech voices available. On Chrome, check that system speech is enabled. On macOS, go to System Settings > Accessibility > Spoken Content.'
        );
        return;
      }
      // Retry with exponential backoff
      timer = setTimeout(loadVoices, 300 * Math.pow(2, attempts));
    };

    // Try immediately
    loadVoices();

    // Chrome loads voices asynchronously
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      clearTimeout(timer);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Helper to get best available voice for a locale
  const getVoice = useCallback((locale: string): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    // Exact match
    let v = voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase());
    if (v) return v;
    // Prefix match (e.g. 'zh-CN' should match any 'zh-*' voice)
    const prefix = locale.split('-')[0].toLowerCase();
    v = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (v) return v;
    // Fallback to first voice
    return voices[0];
  }, []);

  const speakSegment = useCallback((index: number) => {
    const segments = segmentsRef.current;
    if (index >= segments.length || isStoppedRef.current) {
      setIsPlaying(false);
      setCurrentSegment(-1);
      return;
    }

    const segment = segments[index];
    segmentIndexRef.current = index;
    setCurrentSegment(index);

    const utterance = new SpeechSynthesisUtterance(segment.text);
    const locale = narration?.locale || currentLocale || 'en';
    utterance.lang = locale;
    utterance.rate = speedRef.current;

    const voice = getVoice(locale);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (!isStoppedRef.current) {
        speakSegment(index + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('Speech error:', e.error);
        setVoiceError(`Speech failed: ${e.error}`);
      }
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    // Cancel any lingering speech before starting new one (prevents overlap)
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, [narration?.locale, currentLocale, getVoice]);

  // Unlock speech — Chrome sometimes needs a "warmup" utterance from a user gesture
  const unlockSpeech = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    u.rate = 1;
    speechSynthesis.speak(u);
  }, []);

  const play = useCallback(() => {
    if (!narration?.segments?.length) return;
    if (!voicesReady) {
      // Try one final voice load before giving up
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        setVoiceError('No voices loaded yet. Please try again in a moment.');
        return;
      }
      setVoicesReady(true);
    }
    unlockSpeech();
    isStoppedRef.current = false;
    setIsPlaying(true);
    const startIndex = currentSegment >= 0 ? currentSegment : 0;
    speakSegment(startIndex);
  }, [narration, speakSegment, currentSegment, voicesReady, unlockSpeech]);

  const pause = useCallback(() => {
    isStoppedRef.current = true;
    speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentSegment(-1);
    segmentIndexRef.current = 0;
  }, []);

  const seekTo = useCallback((index: number) => {
    speechSynthesis.cancel();
    isStoppedRef.current = false;
    setIsPlaying(true);
    speakSegment(index);
  }, [speakSegment]);

  return {
    isPlaying,
    currentSegment,
    speed,
    setSpeed,
    play,
    pause,
    stop,
    seekTo,
    totalSegments: narration?.segments?.length || 0,
    voicesReady,
    voiceError,
  };
}
