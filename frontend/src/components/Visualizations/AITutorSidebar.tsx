'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Send, Trash2, MessageCircle } from 'lucide-react';
import TutorChatBubble from './TutorChatBubble';

interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  messages: TutorMessage[];
  loading: boolean;
  onAskQuestion: (question: string) => void;
  onClearHistory: () => void;
  variant?: 'overlay' | 'inline';
}

export default function AITutorSidebar({ open, onClose, messages, loading, onAskQuestion, onClearHistory, variant = 'overlay' }: Props) {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (!open && variant === 'overlay') return null;

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onAskQuestion(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Inline variant — embedded in a grid column, always visible
  if (variant === 'inline') {
    return (
      <div className="h-full bg-surface/50 border border-outline-variant rounded-xl flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <h3 className="font-display text-display-xs text-on-surface flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-tertiary" />
            {t('viz.tutor.title')}
          </h3>
          <button onClick={onClearHistory} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors" title={t('viz.tutor.clear')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {renderMessages()}
        {renderInput()}
      </div>
    );
  }

  // Overlay variant — mobile sheet + desktop fixed sidebar
  return (
    <>
      {/* Mobile: Sheet from bottom */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative bg-surface border-t border-border rounded-t-2xl max-h-[80vh] flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-display text-display-xs text-ink flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-clay" />
                {t('viz.tutor.title')}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={onClearHistory} className="p-1.5 text-ink-muted hover:text-ink rounded-lg" title={t('viz.tutor.clear')}>
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {renderMessages()}
            {renderInput()}
          </div>
        </div>
      </div>

      {/* Desktop: Right sidebar panel */}
      <div className="hidden lg:block fixed right-0 top-0 h-full w-[360px] z-40">
        <div className="h-full bg-surface/95 backdrop-blur-xl border-l border-border flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-display text-display-xs text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-clay" />
              {t('viz.tutor.title')}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={onClearHistory} className="p-1.5 text-ink-muted hover:text-ink rounded-lg transition-colors" title={t('viz.tutor.clear')}>
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {renderMessages()}
          {renderInput()}
        </div>
      </div>
    </>
  );

  function renderMessages() {
    return (
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-ink-muted">
            <MessageCircle className="h-12 w-12 opacity-30" />
            <p className="text-body-sm">{t('viz.tutor.empty')}</p>
            <p className="text-caption-sm max-w-xs">{t('viz.tutor.hint')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <TutorChatBubble key={msg.id} role={msg.role} text={msg.text} timestamp={msg.timestamp} />
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-clay/20 flex items-center justify-center shrink-0 text-xs font-bold text-clay">AI</div>
            <div className="bg-surface-container-high rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-clay/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-clay/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-clay/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderInput() {
    return (
      <div className="px-4 py-3 border-t border-border bg-surface-container-lowest/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('viz.tutor.askQuestion')}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-body-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay/30 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-clay text-white hover:bg-clay/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
}
