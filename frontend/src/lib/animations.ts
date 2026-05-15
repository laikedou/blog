import { animate, stagger } from 'animejs';
import { useEffect, useRef, useCallback } from 'react';

export function useAnimateOnMount() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    animate(el, {
      opacity: [0, 1],
      translateY: [20, 0],
      easing: 'easeOutCubic',
      duration: 600,
    });
  }, []);

  return ref;
}

export function useStaggerChildren(delay = 80) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const children = ref.current?.children;
    if (!children) return;

    animate(children, {
      opacity: [0, 1],
      translateY: [20, 0],
      easing: 'easeOutCubic',
      duration: 500,
      delay: stagger(delay),
    });
  }, [delay]);

  return ref;
}

export function useScaleOnClick() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    animate(target, {
      scale: [1, 0.95, 1],
      easing: 'easeOutCubic',
      duration: 200,
    });
  }, []);

  return handleClick;
}
