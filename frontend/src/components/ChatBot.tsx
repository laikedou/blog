'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { chat as chatApi } from '@/lib/api';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function makeSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function loadSessionId() {
  if (typeof window === 'undefined') return makeSessionId();
  let id = localStorage.getItem('chat_session_id');
  if (!id) {
    id = makeSessionId();
    localStorage.setItem('chat_session_id', id);
  }
  return id;
}

export default function ChatBot() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sessionId] = useState(loadSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Log user message
    chatApi.logMessage({ sessionId, role: 'user', content: content.substring(0, 500) }).catch(() => {});

    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(t('chat.feedbackError'));

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
          }
          return updated;
        });
      }

      // Log assistant message
      chatApi.logMessage({ sessionId, role: 'assistant', content: fullContent.substring(0, 500) }).catch(() => {});
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: t('chat.errorMessage') };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === '/feedback') {
      setShowFeedback(true);
      setInput('');
      return;
    }

    sendMessage(trimmed);
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await chatApi.submitFeedback({
        sessionId,
        name: feedbackForm.name || 'Anonymous',
        email: feedbackForm.email,
        message: feedbackForm.message,
        pageUrl: window.location.pathname,
      });
      setFeedbackSent(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSent(false);
        setFeedbackForm({ name: '', email: '', message: '' });
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || t('chat.feedbackError'));
    }
  };

  const renderContent = (content: string) => {
    const withLinks = content.replace(
      /\[\/([^\]]+)\]\(([^)]+)\)/g,
      '<a href="/$1" target="_blank" class="text-clay hover:underline font-medium">$2</a>',
    );
    const withBareLinks = withLinks.replace(
      /(\/posts\/[\w-]+)/g,
      '<a href="$1" target="_blank" class="text-clay hover:underline font-medium">$1</a>',
    );
    return <span dangerouslySetInnerHTML={{ __html: withBareLinks }} />;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-clay text-white shadow-elevated hover:bg-clay-dark transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
        aria-label={t('chat.title')}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-surface rounded-2xl border border-border shadow-elevated flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-clay text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-display text-body font-medium">{t('chat.title')}</h3>
              <p className="text-caption-sm text-white/70">{t('chat.subtitle')}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-cream-50">
            {messages.length === 0 && !showFeedback && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-clay/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-clay" />
                </div>
                <p className="text-body-sm text-ink-muted">
                  {t('chat.greeting')}
                </p>
                <p className="text-caption text-ink-muted mt-2">
                  {t('chat.suggestion')}
                </p>
                <p className="text-caption text-ink-muted mt-1">
                  {t('chat.feedbackHint', { key: '/feedback' })}
                </p>
              </div>
            )}

            {showFeedback ? (
              <div className="p-4">
                {feedbackSent ? (
                  <div className="text-center py-6">
                    <p className="text-body text-teal font-medium">{t('chat.thankYou')}</p>
                  </div>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-3">
                    <h4 className="font-display text-display-sm text-ink">{t('chat.submitFeedback')}</h4>
                    <p className="text-body-sm text-ink-muted">
                      {t('chat.feedbackDesc')}
                    </p>
                    <Input
                      value={feedbackForm.name}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('chat.nameOptional')}
                    />
                    <Input
                      value={feedbackForm.email}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('chat.emailOptional')}
                      type="email"
                    />
                    <Textarea
                      value={feedbackForm.message}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder={t('chat.messageRequired')}
                      required
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!feedbackForm.message.trim()}
                        className="flex-1"
                      >
                        {t('chat.submitFeedback')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setShowFeedback(false); setFeedbackForm({ name: '', email: '', message: '' }); }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-body-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-clay text-white rounded-br-md'
                        : 'bg-cream-200 text-ink rounded-bl-md'
                    }`}
                  >
                    {m.role === 'assistant' ? renderContent(m.content) : m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {!showFeedback && (
            <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('chat.inputPlaceholder')}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-10 w-10 shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
