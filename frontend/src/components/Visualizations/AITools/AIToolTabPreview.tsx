'use client';

import { useMemo } from 'react';
import { Eye } from 'lucide-react';

interface Props {
  content: string;
}

function renderMarkdown(md: string): string {
  let html = md
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold / italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines to <br />
    .replace(/\n/g, '<br />');

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br \/><\/p>/g, '');

  return html;
}

export default function AIToolTabPreview({ content }: Props) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  if (!content) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
        <Eye className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/25">Generate content to see preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div
        className="prose prose-invert max-w-none
          prose-headings:text-white/90 prose-headings:font-display
          prose-h1:text-2xl prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-white/[0.06]
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-cyan-300/80
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-violet-300/70
          prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
          prose-p:text-white/65 prose-p:leading-relaxed prose-p:mb-4
          prose-strong:text-white/85
          prose-code:text-cyan-300/80 prose-code:bg-white/[0.04] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
          prose-blockquote:border-l-2 prose-blockquote:border-cyan-400/20 prose-blockquote:pl-4 prose-blockquote:text-white/45 prose-blockquote:italic
          prose-li:text-white/60 prose-li:mb-1
          prose-hr:border-white/[0.06]
        "
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
