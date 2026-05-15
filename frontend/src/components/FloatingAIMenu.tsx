'use client';

import { useState, useRef, useEffect } from 'react';
import { ai } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Sparkles, Languages, RefreshCw, SpellCheck, Minimize2, Maximize2, Search, Tags, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';

interface FloatingAIMenuProps {
  onGenerate: (data: any) => void;
  currentContent?: string;
  currentTitle?: string;
  onOpenFullTools?: () => void;
  style?: React.CSSProperties;
}

const quickActions = [
  { mode: 'polish', label: '润色', icon: Languages },
  { mode: 'rewrite', label: '重写', icon: RefreshCw },
  { mode: 'improve-grammar', label: '语法', icon: SpellCheck },
  { mode: 'summarize', label: '摘要', icon: Minimize2 },
  { mode: 'expand', label: '扩写', icon: Maximize2 },
] as const;

export default function FloatingAIMenu({ onGenerate, currentContent, currentTitle, onOpenFullTools, style }: FloatingAIMenuProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        orbRef.current && !orbRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const handleEnhance = async (mode: string) => {
    if (!currentContent) return;
    setLoading(mode);
    setError('');
    try {
      const r = await ai.enhanceContent({ content: currentContent, mode });
      onGenerate({ content: r.enhancedContent });
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(null);
  };

  const handleSeo = async () => {
    if (!currentTitle) return;
    setLoading('seo');
    setError('');
    try {
      const r = await ai.generateSeo({ title: currentTitle, content: currentContent });
      onGenerate(r);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(null);
  };

  const handleTags = async () => {
    if (!currentContent) return;
    setLoading('tags');
    setError('');
    try {
      const r = await ai.suggestTags({ content: currentContent });
      onGenerate(r);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(null);
  };

  return (
    <div className="fixed bottom-32 z-50 flex flex-col items-end" style={style}>
      {/* Popover menu (opens above) */}
      {isOpen && (
        <div
          ref={menuRef}
          className="mb-3 w-56 origin-bottom-right
            bg-white/95 backdrop-blur-xl rounded-editorial-sm border border-border
            shadow-elevated animate-scale-in overflow-hidden"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-clay" />
              <span className="text-caption uppercase tracking-wider text-ink-muted">AI 快速操作</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-3.5 mt-2 px-3 py-2 bg-clay-subtle text-clay text-body-xs rounded-editorial-xs border border-clay/20">
              {error}
            </div>
          )}

          {/* Quick actions grid */}
          <div className="p-2.5">
            <div className="grid grid-cols-5 gap-1">
              {quickActions.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleEnhance(mode)}
                  disabled={!!loading || !currentContent}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-editorial-xs
                    hover:bg-cream-200 transition-colors duration-150
                    disabled:opacity-40 disabled:cursor-not-allowed
                    group/action"
                >
                  {loading === mode ? (
                    <Loader2 className="h-4 w-4 text-clay animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 text-ink-soft group-hover/action:text-clay transition-colors" />
                  )}
                  <span className="text-[10px] font-medium text-ink-muted group-hover/action:text-ink-soft transition-colors whitespace-nowrap">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* Secondary actions */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={handleSeo}
              disabled={!!loading || !currentTitle}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-editorial-xs
                hover:bg-cream-200 transition-colors duration-150
                disabled:opacity-40 disabled:cursor-not-allowed text-body-sm text-ink-soft"
            >
              {loading === 'seo' ? <Loader2 className="h-4 w-4 text-clay animate-spin" /> : <Search className="h-4 w-4" />}
              <span>SEO 优化</span>
            </button>
            <button
              type="button"
              onClick={handleTags}
              disabled={!!loading || !currentContent}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-editorial-xs
                hover:bg-cream-200 transition-colors duration-150
                disabled:opacity-40 disabled:cursor-not-allowed text-body-sm text-ink-soft"
            >
              {loading === 'tags' ? <Loader2 className="h-4 w-4 text-clay animate-spin" /> : <Tags className="h-4 w-4" />}
              <span>智能标签</span>
            </button>
          </div>

          {/* Divider */}
          {onOpenFullTools && <div className="border-t border-border/60" />}

          {/* Open full tools */}
          {onOpenFullTools && (
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => { setIsOpen(false); onOpenFullTools(); }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-editorial-xs
                  hover:bg-cream-200 transition-colors duration-150 text-body-sm text-ink"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4" />
                  <span>打开完整 AI 工具</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orb button */}
      <button
        ref={orbRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-center w-11 h-11 rounded-full
          bg-white/80 backdrop-blur-md border border-border shadow-card
          hover:shadow-card-hover hover:bg-white
          transition-all duration-300 ease-out
          active:scale-95"
        title="AI Tools"
      >
        <Sparkles className="h-5 w-5 text-clay" />
        <span className="absolute inset-0 rounded-full ring-1 ring-clay/20 group-hover:ring-clay/40 transition-all duration-300" />
      </button>
    </div>
  );
}
