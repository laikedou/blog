'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type CharacterState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'sleeping';

interface Live2DContextValue {
  state: CharacterState;
  setState: (state: CharacterState) => void;
  isHidden: boolean;
  hide: () => void;
  show: () => void;
}

const Live2DContext = createContext<Live2DContextValue | null>(null);

export function Live2DProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CharacterState>('idle');
  const [isHidden, setIsHidden] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('live2d-hidden') === 'true';
  });

  const hide = useCallback(() => {
    setIsHidden(true);
    localStorage.setItem('live2d-hidden', 'true');
  }, []);

  const show = useCallback(() => {
    setIsHidden(false);
    localStorage.setItem('live2d-hidden', 'false');
  }, []);

  return (
    <Live2DContext.Provider value={{ state, setState, isHidden, hide, show }}>
      {children}
    </Live2DContext.Provider>
  );
}

export function useLive2D() {
  const ctx = useContext(Live2DContext);
  if (!ctx) throw new Error('useLive2D must be used within Live2DProvider');
  return ctx;
}
