'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseReadingProgressOptions {
  /** Selector for section elements to track */
  sectionSelector?: string;
  /** Root margin for IntersectionObserver */
  rootMargin?: string;
}

interface ReadingProgressState {
  activeSection: string;
  progress: number; // 0-100
  sections: { id: string; title: string; read: boolean }[];
}

export function useReadingProgress({
  sectionSelector = '[data-article-section]',
  rootMargin = '-80px 0px -80% 0px',
}: UseReadingProgressOptions = {}) {
  const [state, setState] = useState<ReadingProgressState>({
    activeSection: '',
    progress: 0,
    sections: [],
  });
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(sectionSelector)) as HTMLElement[];

    const sectionData = sections.map((el) => ({
      id: el.id,
      title: el.dataset.sectionTitle || el.id,
      read: false,
    }));
    setState((prev) => ({ ...prev, sections: sectionData }));

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setState((prev) => {
              const updatedSections = prev.sections.map((s) =>
                s.id === id ? { ...s, read: true } : s
              );
              const readCount = updatedSections.filter((s) => s.read).length;
              const total = updatedSections.length || 1;
              return {
                ...prev,
                activeSection: id,
                sections: updatedSections,
                progress: Math.round((readCount / total) * 100),
              };
            });
          }
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    sections.forEach((el) => observerRef.current?.observe(el));

    // Track scroll progress for the progress bar
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      setState((prev) => ({ ...prev, progress: Math.max(prev.progress, scrollProgress) }));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionSelector, rootMargin]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { ...state, scrollToSection };
}
