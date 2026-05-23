'use client';

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AIToolParticles from './AIToolParticles';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export default function AIToolDialogPortal({ open, onOpenChange, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Animate border glow via CSS custom property rotation
  useEffect(() => {
    if (!open) return;
    let angle = 0;
    const el = contentRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      angle = (angle + 0.5) % 360;
      el.style.setProperty('--border-angle', `${angle}deg`);
    }, 30);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-4xl !w-[95vw] !h-[90vh] !p-0 !gap-0 !border-0 !bg-transparent overflow-hidden"
      >
        <DialogTitle className="sr-only">AI Tools</DialogTitle>

        {/* Outer glow ring */}
        <div
          ref={contentRef}
          className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(12, 16, 32, 0.98)',
            boxShadow: `
              0 0 80px rgba(0, 240, 255, 0.06),
              0 0 40px rgba(124, 58, 237, 0.04),
              inset 0 1px 0 rgba(255,255,255,0.03)
            `,
            '--border-angle': '0deg',
          } as React.CSSProperties}
        >
          {/* Animated gradient border */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{
              padding: '1px',
              background: `conic-gradient(from var(--border-angle, 0deg) at 50% 50%, transparent, rgba(0,240,255,0.15), transparent, rgba(124,58,237,0.1), transparent)`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
            } as React.CSSProperties}
          />

          {/* Particle background */}
          <AIToolParticles />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
