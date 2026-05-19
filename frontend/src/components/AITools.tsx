'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ai } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AIToolsProps {
  onGenerate: (data: any) => void;
  currentContent?: string;
  currentTitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AITools({ onGenerate, currentContent, currentTitle, isOpen: controlledOpen, onClose }: AIToolsProps) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const currentLang = i18n.language;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (controlledOpen !== undefined) { onClose?.(); }
    else { setInternalOpen(v); }
  };
  const [loading, setLoading] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('professional');
  const [wordCount, setWordCount] = useState(800);
  const [error, setError] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);

  if (!isAuthenticated) return null;

  const handleGeneratePost = async () => {
    if (!topic.trim()) return;
    setLoading('generate'); setError('');
    try { const r = await ai.generatePost({ topic, style, wordCount }, currentLang); onGenerate(r); setIsOpen(false); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  const handleEnhance = async (mode: string) => {
    if (!currentContent) return;
    setLoading(mode); setError('');
    try { const r = await ai.enhanceContent({ content: currentContent, mode }, currentLang); onGenerate({ content: r.enhancedContent }); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  const handleGenerateSeo = async () => {
    if (!currentTitle) return;
    setLoading('seo'); setError('');
    try { const r = await ai.generateSeo({ title: currentTitle, content: currentContent }, currentLang); onGenerate(r); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  const handleSuggestTags = async () => {
    if (!currentContent) return;
    setLoading('tags'); setError('');
    try { const r = await ai.suggestTags({ content: currentContent }); onGenerate(r); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    setLoading('chat');
    const newHistory = [...chatHistory, { role: 'user', content: chatMessage }];
    setChatHistory(newHistory); setChatMessage('');
    try { const r = await ai.chat(newHistory); setChatHistory([...newHistory, { role: 'assistant', content: r.reply }]); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  return (
    <>
      {controlledOpen === undefined && (
        <button
          type="button"
          onClick={() => setInternalOpen(true)}
          className="py-2.5 px-4 rounded-lg text-label-md font-label-md font-medium transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
          style={{
            background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          {t('common.aiTools')}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl z-10"
            style={{
              background: 'rgba(23, 31, 51, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5" style={{ background: 'rgba(23, 31, 51, 0.95)' }}>
              <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                {t('common.aiAssistant')}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-error/10 text-error font-body-sm text-body-sm rounded-lg p-3 border border-error/20">
                  {error}
                </div>
              )}

              {/* Generate Post */}
              <div className="space-y-3">
                <h3 className="font-body-sm text-body-sm font-medium text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
                  {t('common.generatePost')}
                </h3>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={t('common.topicPlaceholder')}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <div className="flex gap-2">
                  <select
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-md text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="professional">{t('common.professional')}</option>
                    <option value="casual">{t('common.casual')}</option>
                    <option value="technical">{t('common.technical')}</option>
                    <option value="storytelling">{t('common.storytelling')}</option>
                  </select>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={e => setWordCount(Number(e.target.value))}
                    className="w-24 bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleGeneratePost}
                  disabled={loading === 'generate' || !topic.trim()}
                  className="w-full py-2.5 rounded-lg text-label-md font-label-md font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  {loading === 'generate' ? t('common.generating') : t('common.generatePost')}
                </button>
              </div>

              {/* Enhance */}
              <div className="border-t border-white/5 pt-5">
                <h3 className="font-body-sm text-body-sm font-medium text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
                  {t('common.enhance')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['improve-grammar', 'polish', 'rewrite', 'summarize', 'expand'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleEnhance(mode)}
                      disabled={!!loading}
                      className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all disabled:opacity-50"
                    >
                      {loading === mode ? '...' : t(`common.${mode === 'improve-grammar' ? 'grammar' : mode}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEO + Tags */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateSeo}
                  disabled={!!loading}
                  className="flex-1 bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-4 py-2 text-label-sm font-label-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  {loading === 'seo' ? '...' : t('common.seo')}
                </button>
                <button
                  onClick={handleSuggestTags}
                  disabled={!!loading}
                  className="flex-1 bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-4 py-2 text-label-sm font-label-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">label</span>
                  {loading === 'tags' ? '...' : t('common.tags')}
                </button>
              </div>

              {/* Chat */}
              <div className="border-t border-white/5 pt-5">
                <h3 className="font-body-sm text-body-sm font-medium text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">forum</span>
                  {t('common.chat')}
                </h3>
                <div className="h-48 overflow-y-auto mb-3 space-y-2.5 bg-surface-container-low rounded-lg p-4 border border-white/5">
                  {chatHistory.length === 0 && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-center pt-8">{t('common.writeAdvice')}</p>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`font-body-sm text-body-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <span className={`inline-block rounded-xl px-4 py-2 max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface border border-white/10'
                      }`}>{msg.content}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChat()}
                    placeholder={t('common.askAiPrompt')}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleChat}
                    disabled={loading === 'chat' || !chatMessage.trim()}
                    className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-2 transition-all disabled:opacity-50"
                  >
                    {loading === 'chat' ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
