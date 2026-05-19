'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useAudioNarrationPlayer(narration: NarrationData | null, audioUrl: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // Calculate total duration from segments
  const totalDuration = narration?.segments?.length
    ? narration.segments[narration.segments.length - 1].endTime
    : 0;

  // Create audio element
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);

      // Find matching segment
      const segments = narration?.segments || [];
      let found = -1;
      for (let i = 0; i < segments.length; i++) {
        if (t >= segments[i].startTime && t < segments[i].endTime) {
          found = i;
          break;
        }
      }
      if (found !== currentSegment) {
        setCurrentSegment(found);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentSegment(-1);
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    // Attach API URL (backend base URL)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    audio.src = `${baseUrl}${audioUrl}`;

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Sync speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setCurrentTime(0);
    setCurrentSegment(-1);
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback((index: number) => {
    const a = audioRef.current;
    const segments = narration?.segments || [];
    if (!a || index < 0 || index >= segments.length) return;
    a.currentTime = segments[index].startTime;
    setCurrentSegment(index);
    a.play().catch(() => {});
  }, [narration]);

  return {
    isPlaying,
    currentSegment,
    currentTime,
    duration: duration || totalDuration,
    speed,
    setSpeed,
    play,
    pause,
    stop,
    seekTo,
    totalSegments: narration?.segments?.length || 0,
    isReady,
  };
}
