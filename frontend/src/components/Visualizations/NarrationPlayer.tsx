'use client';

import { useTranslation } from 'react-i18next';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  currentSegment: number;
  totalSegments: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeekTo: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  locale?: string;
  currentText?: string;
  voicesReady?: boolean;
  voiceError?: string;
  audioUrl?: string;
  duration?: number;
  currentTime?: number;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NarrationPlayer({
  isPlaying,
  currentSegment,
  totalSegments,
  speed,
  onPlay,
  onPause,
  onStop,
  onSeekTo,
  onSpeedChange,
  locale,
  currentText,
  voicesReady,
  voiceError,
  audioUrl,
  duration,
  currentTime,
}: Props) {
  const { t } = useTranslation();

  if (totalSegments === 0) return null;

  const isAudioMode = !!audioUrl;
  const progress = isAudioMode && duration && currentTime !== undefined
    ? (currentTime / duration) * 100
    : totalSegments > 0 ? ((currentSegment + 1) / totalSegments) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border shadow-2xl">
      {/* Current text */}
      {currentText && (
        <div className="max-w-grid mx-auto px-6 pt-2">
          <p className="text-body-sm text-ink-muted truncate italic">
            "{currentText}"
          </p>
        </div>
      )}

      <div className="max-w-grid mx-auto px-6 py-3 flex items-center gap-4">
        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-clay rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        {/* Counter: time for audio mode, segment for speech mode */}
        <span className="text-caption-sm text-ink-muted min-w-[5rem] text-center tabular-nums">
          {isAudioMode && currentTime !== undefined && duration
            ? `${formatTime(currentTime)} / ${formatTime(duration)}`
            : `${currentSegment >= 0 ? currentSegment + 1 : 0} / ${totalSegments}`}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSeekTo(Math.max(0, currentSegment - 1))}
            disabled={currentSegment <= 0}
            className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg transition-colors"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPause}
              className="p-2 rounded-xl bg-clay text-white hover:bg-clay/90 transition-colors"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="p-2 rounded-xl bg-clay text-white hover:bg-clay/90 transition-colors"
            >
              <Play className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onStop}
            className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg transition-colors"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            onClick={() => onSeekTo(Math.min(totalSegments - 1, currentSegment + 1))}
            disabled={currentSegment >= totalSegments - 1}
            className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg transition-colors"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Speed + voice status */}
        <div className="flex items-center gap-1.5">
          {isAudioMode ? (
            <Volume2 className="h-3.5 w-3.5 text-clay" />
          ) : voiceError ? (
            <span title={voiceError}>
              <VolumeX className="h-3.5 w-3.5 text-red-500" />
            </span>
          ) : voicesReady === false ? (
            <span title={t('viz.narration.noVoice')}>
              <VolumeX className="h-3.5 w-3.5 text-amber-500" />
            </span>
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-ink-muted" />
          )}
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="text-caption-sm bg-transparent border border-border rounded-lg px-2 py-1 text-ink-muted cursor-pointer"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>

        {/* Locale badge */}
        {locale && (
          <span className="text-[10px] font-medium text-ink-muted bg-surface-container-highest px-2 py-0.5 rounded-full uppercase">
            {locale}
          </span>
        )}
      </div>
    </div>
  );
}
