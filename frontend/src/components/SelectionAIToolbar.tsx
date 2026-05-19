'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ai } from '@/lib/api';

interface SelectionAIToolbarProps {
  editor: any;
  editorContainer: HTMLElement | null;
  onImageAction?: (src: string) => void;
}

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function SelectionAIToolbar({ editor, editorContainer, onImageAction }: SelectionAIToolbarProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [imageSrc, setImageSrc] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const suppressHideRef = useRef(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (loading || suppressHideRef.current) {
        suppressHideRef.current = false;
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount || !editorContainer) {
        setVisible(false);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!editorContainer.contains(range.commonAncestorContainer)) {
        setVisible(false);
        return;
      }

      if (toolbarRef.current && toolbarRef.current.contains(sel.focusNode as Node)) {
        return;
      }

      const rect = range.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
      setMode('text');
      setError('');
      setVisible(true);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [editorContainer, loading]);

  useEffect(() => {
    if (!editorContainer) return;

    const handleClick = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest('img');
      if (!img || !editorContainer.contains(img)) return;
      if (toolbarRef.current?.contains(e.target as Node)) return;

      const rect = img.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
      setImageSrc(img.src);
      setMode('image');
      setError('');
      setVisible(true);
      suppressHideRef.current = true;
    };

    editorContainer.addEventListener('click', handleClick, true);
    return () => editorContainer.removeEventListener('click', handleClick, true);
  }, [editorContainer]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handleOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [visible]);

  const handleEnhance = async (enhanceMode: string) => {
    const selectedText = editor?.getSelectionText();
    if (!selectedText || !selectedText.trim()) return;

    setLoading(enhanceMode);
    setError('');
    try {
      const r = await ai.enhanceContent({ content: selectedText, mode: enhanceMode });
      editor.dangerouslyInsertHtml(r.enhancedContent);
      setVisible(false);
    } catch (err: any) {
      setError(err.message || t('common.enhanceFailed'));
    }
    setLoading(null);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none"
      style={{ top: position.top, left: position.left }}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl shadow-2xl px-2 py-1.5 animate-fade-in bg-surface-container-high/95 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-1.5 px-1.5 text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
          <span>{t('common.aiLabel')}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />

        {mode === 'text' && (
          <>
            <button
              type="button"
              onClick={() => handleEnhance('polish')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors disabled:opacity-40"
            >
              {loading === 'polish' ? <Spinner /> : <span className="material-symbols-outlined text-[14px]">globe</span>}
              {t('common.polish')}
            </button>

            <button
              type="button"
              onClick={() => handleEnhance('rewrite')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors disabled:opacity-40"
            >
              {loading === 'rewrite' ? <Spinner /> : <span className="material-symbols-outlined text-[14px]">refresh</span>}
              {t('common.rewrite')}
            </button>
          </>
        )}

        {mode === 'image' && (
          <button
            type="button"
            onClick={() => { onImageAction?.(imageSrc); setVisible(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">image</span>
            {t('common.aiImage')}
          </button>
        )}

        {error && (
          <span className="text-body-sm text-error ml-1">{error}</span>
        )}
      </div>
    </div>
  );
}
