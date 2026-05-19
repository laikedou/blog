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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/90 backdrop-blur-xl border-t border-outline-variant">
      <div className="flex items-center justify-around py-2 px-4">
        <button
          onClick={onToggleTutor}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
            tutorOpen ? 'text-tertiary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[10px] font-medium">Tutor</span>
        </button>

        {hasNarration && (
          <button
            onClick={onToggleNarration}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
              isNarrationPlaying ? 'text-tertiary' : 'text-on-surface-variant hover:text-on-surface'
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
  );
}
