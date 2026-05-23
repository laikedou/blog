'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Download, ExternalLink } from 'lucide-react';

interface Props {
  content: string;
}

interface GradingResult {
  analysis: string;
  gradedImageUrl: string;
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br \/><\/p>/g, '');
  return html;
}

export default function AIToolGradingPreview({ content }: Props) {
  const t = useTranslations('viz.tools');

  const result: GradingResult | null = useMemo(() => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.analysis === 'string') {
        return { analysis: parsed.analysis, gradedImageUrl: parsed.gradedImageUrl || '' };
      }
      return null;
    } catch {
      // Legacy: plain text content
      return { analysis: content, gradedImageUrl: '' };
    }
  }, [content]);

  const analysisHtml = useMemo(
    () => (result?.analysis ? renderMarkdown(result.analysis) : ''),
    [result],
  );

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
        <Eye className="h-8 w-8 text-white/10" />
        <p className="text-sm text-white/25">{t('noContent') || 'Generate content to see preview'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Graded result image */}
        {result.gradedImageUrl && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-white/[0.02]">
              <span className="text-xs font-medium text-white/40">
                {t('grading.gradedImage') || 'Graded Result'}
              </span>
              <a
                href={result.gradedImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {t('grading.openFull') || 'Open Full'}
              </a>
            </div>
            <div className="p-4 flex justify-center bg-black/10">
              <img
                src={result.gradedImageUrl}
                alt={t('common.gradedHomeworkResult')}
                className="max-h-96 max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        {/* Written analysis */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-white/50 mb-4">
            {t('grading.analysisTitle') || 'Detailed Analysis'}
          </h3>
          <div
            className="prose prose-invert max-w-none
              prose-headings:text-white/90 prose-headings:font-display
              prose-h1:text-xl prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-white/[0.06]
              prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-emerald-300/80
              prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-cyan-300/70
              prose-h4:text-sm prose-h4:mt-3 prose-h4:mb-2
              prose-p:text-white/65 prose-p:leading-relaxed prose-p:mb-3
              prose-strong:text-white/85
              prose-code:text-cyan-300/80 prose-code:bg-white/[0.04] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-blockquote:border-l-2 prose-blockquote:border-emerald-400/20 prose-blockquote:pl-4 prose-blockquote:text-white/45 prose-blockquote:italic
              prose-li:text-white/60 prose-li:mb-1
              prose-hr:border-white/[0.06]
            "
            dangerouslySetInnerHTML={{ __html: analysisHtml }}
          />
        </div>
      </div>
    </div>
  );
}
