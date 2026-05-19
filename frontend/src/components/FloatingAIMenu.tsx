'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ai } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FloatingAIMenuProps {
  onGenerate: (data: any) => void;
  currentContent?: string;
  currentTitle?: string;
  onOpenFullTools?: () => void;
  style?: React.CSSProperties;
}

const quickActions = [
  { mode: 'polish', labelKey: 'common.polish', icon: 'globe' },
  { mode: 'rewrite', labelKey: 'common.rewrite', icon: 'refresh' },
  { mode: 'improve-grammar', labelKey: 'common.grammar', icon: 'spellcheck' },
  { mode: 'summarize', labelKey: 'common.summarize', icon: 'contract' },
  { mode: 'expand', labelKey: 'common.expand', icon: 'expand' },
] as const;

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function FloatingAIMenu({ onGenerate, currentContent, currentTitle, onOpenFullTools, style }: FloatingAIMenuProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isAuthenticated) return null;

  const handleEnhance = async (mode: string) => {
    if (!currentContent) return;
    setLoading(mode);
    setError('');
    try {
      const r = await ai.enhanceContent({ content: currentContent, mode });
      onGenerate({ content: r.enhancedContent });
      setOpen(false);
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ease-out active:scale-95 bg-primary/20 backdrop-blur-xl border border-primary/30 shadow-[0_0_20px_rgba(175,198,255,0.15)]"
          title={t('common.aiTools')}
        >
          <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-56 p-0"
        style={style}
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
            <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">{t('common.quickActions')}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3.5 mt-2 px-3 py-2 bg-error/10 text-error text-body-sm rounded-lg border border-error/20">
            {error}
          </div>
        )}

        {/* Quick actions grid */}
        <div className="p-2.5">
          <div className="grid grid-cols-5 gap-1">
            {quickActions.map(({ mode, labelKey, icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleEnhance(mode)}
                disabled={!!loading || !currentContent}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group/action"
              >
                {loading === mode ? (
                  <Spinner />
                ) : (
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover/action:text-primary transition-colors">{icon}</span>
                )}
                <span className="text-[10px] font-medium text-on-surface-variant/70 group-hover/action:text-on-surface-variant transition-colors whitespace-nowrap">
                  {t(labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Secondary actions */}
        <div className="p-1.5 space-y-0.5">
          <button
            type="button"
            onClick={handleSeo}
            disabled={!!loading || !currentTitle}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-body-sm text-on-surface-variant"
          >
            {loading === 'seo' ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">search</span>}
            <span>{t('common.seo')}</span>
          </button>
          <button
            type="button"
            onClick={handleTags}
            disabled={!!loading || !currentContent}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-body-sm text-on-surface-variant"
          >
            {loading === 'tags' ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">label</span>}
            <span>{t('common.tags')}</span>
          </button>
        </div>

        {onOpenFullTools && (
          <>
            <div className="border-t border-border" />
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); onOpenFullTools(); }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-body-sm text-on-surface"
              >
                <span className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                  <span>{t('common.openFullTools')}</span>
                </span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
