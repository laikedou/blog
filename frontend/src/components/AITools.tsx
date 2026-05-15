'use client';

import { useState } from 'react';
import { ai } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Send, Wand2, Search, Tags, MessageSquare, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface AIToolsProps {
  onGenerate: (data: any) => void;
  currentContent?: string;
  currentTitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AITools({ onGenerate, currentContent, currentTitle, isOpen: controlledOpen, onClose }: AIToolsProps) {
  const { isAuthenticated } = useAuth();
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
    try { const r = await ai.generatePost({ topic, style, wordCount }); onGenerate(r); setIsOpen(false); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  const handleEnhance = async (mode: string) => {
    if (!currentContent) return;
    setLoading(mode); setError('');
    try { const r = await ai.enhanceContent({ content: currentContent, mode }); onGenerate({ content: r.enhancedContent }); }
    catch (err: any) { setError(err.message); }
    setLoading(null);
  };

  const handleGenerateSeo = async () => {
    if (!currentTitle) return;
    setLoading('seo'); setError('');
    try { const r = await ai.generateSeo({ title: currentTitle, content: currentContent }); onGenerate(r); }
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
        <Button type="button" onClick={() => setInternalOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" /> AI Tools
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { if (controlledOpen !== undefined) onClose?.(); else setInternalOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-editorial">
          <DialogHeader className="sticky top-0 bg-surface border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-display-sm text-ink flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-clay" /> AI Assistant
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {error && <div className="bg-clay-subtle text-clay text-body-sm rounded-editorial-sm p-3 border border-clay/20">{error}</div>}

            <div className="space-y-3">
              <h3 className="text-body-sm font-medium text-ink flex items-center gap-2"><Wand2 className="h-4 w-4 text-clay" /> Generate Post</h3>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter a topic..." />
              <div className="flex gap-2">
                <select value={style} onChange={e => setStyle(e.target.value)} className="flex h-11 flex-1 rounded-editorial-sm border border-border bg-surface px-4 py-2.5 text-body">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                  <option value="storytelling">Storytelling</option>
                </select>
                <Input type="number" value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-24" placeholder="Words" />
              </div>
              <Button onClick={handleGeneratePost} disabled={loading === 'generate' || !topic.trim()} className="w-full">
                {loading === 'generate' ? 'Generating...' : 'Generate Post'}
              </Button>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-body-sm font-medium text-ink mb-3 flex items-center gap-2"><Wand2 className="h-4 w-4 text-clay" /> Enhance</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEnhance('improve-grammar')} disabled={!!loading}>
                  {loading === 'improve-grammar' ? '...' : 'Grammar'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEnhance('polish')} disabled={!!loading}>
                  {loading === 'polish' ? '...' : 'Polish 润色'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEnhance('rewrite')} disabled={!!loading}>
                  {loading === 'rewrite' ? '...' : 'Rewrite 重写'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEnhance('summarize')} disabled={!!loading}>
                  {loading === 'summarize' ? '...' : 'Summarize'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEnhance('expand')} disabled={!!loading}>
                  {loading === 'expand' ? '...' : 'Expand'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerateSeo} disabled={!!loading} className="flex-1">
                <Search className="h-4 w-4 mr-2" />{loading === 'seo' ? '...' : 'SEO'}
              </Button>
              <Button variant="outline" onClick={handleSuggestTags} disabled={!!loading} className="flex-1">
                <Tags className="h-4 w-4 mr-2" />{loading === 'tags' ? '...' : 'Tags'}
              </Button>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-body-sm font-medium text-ink mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-clay" /> Chat</h3>
              <div className="h-48 overflow-y-auto mb-3 space-y-2.5 bg-cream-200 rounded-editorial-sm p-4">
                {chatHistory.length === 0 && <p className="text-body-sm text-ink-muted text-center pt-8">Ask for writing advice, ideas, or feedback</p>}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`text-body-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <span className={`inline-block rounded-pill px-4 py-2 max-w-[80%] ${
                      msg.role === 'user' ? 'bg-clay text-white' : 'bg-surface text-ink border border-border'
                    }`}>{msg.content}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Ask the AI..." />
                <Button onClick={handleChat} disabled={loading === 'chat' || !chatMessage.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
