'use client';

import { useRef, useCallback } from 'react';
import type { CelebrationHandle } from '@/components/Visualizations/CelebrationEffect';

export function useCelebration() {
  const ref = useRef<CelebrationHandle>(null);

  const firework = useCallback((x?: number, y?: number) => {
    ref.current?.firework(x, y);
  }, []);

  const confetti = useCallback((x?: number, y?: number) => {
    ref.current?.confetti(x, y);
  }, []);

  const celebrate = useCallback((x?: number, y?: number) => {
    ref.current?.celebrate(x, y);
  }, []);

  return { celebrationRef: ref, firework, confetti, celebrate };
}
