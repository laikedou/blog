'use client';

import { useState, useEffect, useRef } from 'react';
import { ai } from '@/lib/api';
import { Languages, RefreshCw, Loader2, Sparkles, ImageIcon } from 'lucide-react';

interface SelectionAIToolbarProps {
  editor: any;
  editorContainer: HTMLElement | null;
  onImageAction?: (src: string) => void;
}

export default function SelectionAIToolbar({ editor, editorContainer, onImageAction }: SelectionAIToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [imageSrc, setImageSrc] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const suppressHideRef = useRef(false);

  // Handle text selection
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

      // Check if selection is within the editor
      const range = sel.getRangeAt(0);
      if (!editorContainer.contains(range.commonAncestorContainer)) {
        setVisible(false);
        return;
      }

      // Don't show if toolbar itself is selected
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

  // Handle image click
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

  // Hide on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Hide when clicking outside the toolbar
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
      setError(err.message || 'Enhance failed');
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
      <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-xl rounded-editorial-sm border border-border shadow-elevated px-2 py-1.5 animate-fade-in">
        <div className="flex items-center gap-1.5 px-1.5 text-caption-sm text-ink-muted">
          <Sparkles className="h-3 w-3 text-clay" />
          <span>AI</span>
        </div>
        <div className="w-px h-4 bg-border" />

        {mode === 'text' && (
          <>
            <button
              type="button"
              onClick={() => handleEnhance('polish')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-editorial-xs text-body-sm text-ink-soft hover:bg-cream-200 hover:text-clay transition-colors disabled:opacity-40"
            >
              {loading === 'polish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
              润色
            </button>

            <button
              type="button"
              onClick={() => handleEnhance('rewrite')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-editorial-xs text-body-sm text-ink-soft hover:bg-cream-200 hover:text-clay transition-colors disabled:opacity-40"
            >
              {loading === 'rewrite' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              重写
            </button>
          </>
        )}

        {mode === 'image' && (
          <button
            type="button"
            onClick={() => { onImageAction?.(imageSrc); setVisible(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-editorial-xs text-body-sm text-ink-soft hover:bg-cream-200 hover:text-clay transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            AI Image
          </button>
        )}

        {error && (
          <span className="text-body-xs text-clay ml-1">{error}</span>
        )}
      </div>
    </div>
  );
}
