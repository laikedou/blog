'use client';

import { Sparkles, Play, Pause } from 'lucide-react';
import VisualizationLikeButton from './VisualizationLikeButton';

interface Props {
  visualizationId: number;
  tutorOpen: boolean;
  onToggleTutor: () => void;
  isNarrationPlaying: boolean;
  onToggleNarration: () => void;
  hasNarration: boolean;
}

export default function VizMobileBottomBar({
  visualizationId,
  tutorOpen,
  onToggleTutor,
  isNarrationPlaying,
  onToggleNarration,
  hasNarration,
}: Props) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
      {/* Top glow line */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-clay/30 to-transparent" />

      <div className="bg-surface/80 backdrop-blur-xl border-t border-outline-variant/50">
        <div className="flex items-center justify-around py-2 px-4">
          <button
            onClick={onToggleTutor}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
              tutorOpen
                ? 'text-clay'
                : 'text-on-surface-variant/60 hover:text-on-surface active:scale-95'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] font-medium">Tutor</span>
            {!tutorOpen && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-clay animate-pulse" />
            )}
          </button>

          {hasNarration && (
            <button
              onClick={onToggleNarration}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                isNarrationPlaying
                  ? 'text-clay'
                  : 'text-on-surface-variant/60 hover:text-on-surface active:scale-95'
              }`}
            >
              {isNarrationPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="text-[10px] font-medium">Narrate</span>
            </button>
          )}

          <div className="flex flex-col items-center">
            <VisualizationLikeButton visualizationId={visualizationId} />
          </div>
        </div>
      </div>
    </div>
  );
}
