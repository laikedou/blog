'use client';

import { useState, useRef, useEffect } from 'react';
import { chat as chatApi } from '@/lib/api';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

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

      if (!res.ok) throw new Error('Failed to get response');

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
            updated[lastIdx] = { ...updated[lastIdx], content: 'Sorry, I encountered an error. Please try again.' };
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
      alert(err.message || 'Failed to submit feedback');
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
        aria-label="Chat with AI"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-surface rounded-2xl border border-border shadow-elevated flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-clay text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-display text-body font-medium">AI Assistant</h3>
              <p className="text-caption-sm text-white/70">Ask me about blog content</p>
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
                  Hello! I can help you find articles on this blog.
                </p>
                <p className="text-caption text-ink-muted mt-2">
                  Try asking about AI, Web3, blockchain, or frontend development.
                </p>
                <p className="text-caption text-ink-muted mt-1">
                  Type <kbd className="px-1.5 py-0.5 bg-cream-200 rounded text-body-sm font-mono">/feedback</kbd> to send feedback.
                </p>
              </div>
            )}

            {showFeedback ? (
              <div className="p-4">
                {feedbackSent ? (
                  <div className="text-center py-6">
                    <p className="text-body text-teal font-medium">Thank you for your feedback!</p>
                  </div>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-3">
                    <h4 className="font-display text-display-sm text-ink">Send Feedback</h4>
                    <p className="text-body-sm text-ink-muted">
                      Help me improve the blog! Share your thoughts or report an issue.
                    </p>
                    <input
                      value={feedbackForm.name}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name (optional)"
                      className="flex h-10 w-full rounded-editorial-sm border border-border bg-surface px-3 py-2 text-body-sm"
                    />
                    <input
                      value={feedbackForm.email}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Your email (optional)"
                      type="email"
                      className="flex h-10 w-full rounded-editorial-sm border border-border bg-surface px-3 py-2 text-body-sm"
                    />
                    <textarea
                      value={feedbackForm.message}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Your message..."
                      required
                      rows={4}
                      className="flex w-full rounded-editorial-sm border border-border bg-surface px-3 py-2 text-body-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!feedbackForm.message.trim()}
                        className="flex-1 h-10 bg-clay text-white rounded-editorial-sm text-body-sm font-medium hover:bg-clay-dark disabled:opacity-50 transition-colors"
                      >
                        Send Feedback
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowFeedback(false); setFeedbackForm({ name: '', email: '', message: '' }); }}
                        className="px-4 h-10 border border-border rounded-editorial-sm text-body-sm text-ink-soft hover:bg-cream-200 transition-colors"
                      >
                        Cancel
                      </button>
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
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about blog content..."
                  className="flex-1 h-10 rounded-editorial-sm border border-border bg-cream-50 px-4 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 rounded-full bg-clay text-white flex items-center justify-center hover:bg-clay-dark disabled:opacity-50 transition-colors shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
