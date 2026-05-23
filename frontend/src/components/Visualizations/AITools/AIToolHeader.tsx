'use client';

import { X, Sparkles } from 'lucide-react';

interface Props {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export default function AIToolHeader({ icon: Icon, iconColor, title, subtitle, onClose }: Props) {
  return (
    <div className="relative flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
      {/* Animated icon ring */}
      <div className="relative">
        <div className="absolute inset-0 rounded-xl animate-pulse opacity-50"
          style={{ background: `radial-gradient(circle, ${iconColor}20 0%, transparent 70%)` }} />
        <div className="relative w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-white/90">{title}</h2>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Sparkles className="h-3 w-3" style={{ color: iconColor }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: iconColor }}>AI</span>
          </div>
        </div>
        <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>
      </div>

      <button
        onClick={onClose}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
      >
        <X className="h-4.5 w-4.5" />
      </button>

      {/* Scanline accent at bottom */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    </div>
  );
}
