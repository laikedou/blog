'use client';

import { useTranslations } from 'next-intl';
import { Download, Copy, Check, FileText, Code2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  content: string;
  title: string;
  accentColor: string;
  toolType?: string;
}

function renderMarkdownToHtml(md: string): string {
  return md
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');
}

export default function AIToolFooter({ content, title, accentColor, toolType }: Props) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const handleDownloadMd = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('viz.downloaded'));
  };

  const handleDownloadHtml = () => {
    const bodyHtml = renderMarkdownToHtml(content);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { max-width:800px; margin:0 auto; padding:2rem; font-family:system-ui; background:#0c1020; color:#e2e8f0; line-height:1.7; }
  h1 { border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem; }
  h2 { color:#67e8f9; margin-top:2rem; }
  h3 { color:#c4b5fd; }
  code { background:rgba(255,255,255,0.05); padding:0.2em 0.4em; border-radius:4px; font-size:0.9em; color:#67e8f9; }
  blockquote { border-left:2px solid rgba(103,232,249,0.3); padding-left:1rem; color:rgba(255,255,255,0.5); font-style:italic; }
  li { margin-bottom:0.25rem; }
  hr { border-color:rgba(255,255,255,0.06); }
</style></head>
<body>${bodyHtml}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('viz.downloaded'));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) return null;

  const isExamGen = toolType === 'examGen';

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t('common.copied') : t('common.copy')}
      </button>

      <div className="flex-1" />

      {isExamGen ? (
        <span className="text-[10px] text-white/20 italic">{t('viz.usePreviewToolbar')}</span>
      ) : (
        <>
          <button
            onClick={handleDownloadMd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Markdown
          </button>

          <button
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: accentColor, background: `${accentColor}10` }}
          >
            <Code2 className="h-3.5 w-3.5" />
            HTML
          </button>
        </>
      )}
    </div>
  );
}
