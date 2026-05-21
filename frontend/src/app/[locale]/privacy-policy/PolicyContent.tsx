'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { useTranslations } from 'next-intl';

const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="font-display text-display-lg text-ink mt-12 mb-6 pb-3 border-b border-border" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="font-display text-display-md text-ink mt-10 mb-4" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="font-display text-display-sm text-ink mt-8 mb-3" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-body text-ink-soft leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-body text-ink-soft" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 text-body text-ink-soft" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-body text-ink-soft leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-ink" {...props}>
      {children}
    </strong>
  ),
  a: ({ children, href, ...props }) => (
    <a href={href} className="text-clay hover:text-clay-dark underline transition-colors" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-clay pl-4 italic text-ink-muted mb-4" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }) => (
    <code className="bg-cream-300 text-ink px-1.5 py-0.5 rounded text-body-sm font-mono" {...props}>
      {children}
    </code>
  ),
  hr: ({ ...props }) => <hr className="my-8 border-border" {...props} />,
};

interface PolicyContentProps {
  title: string;
  content: string;
  siteTitle: string;
}

export default function PolicyContent({ title, content, siteTitle }: PolicyContentProps) {
  const t = useTranslations();
  if (!content) {
    return (
      <div className="text-center py-16">
        <h1 className="font-display text-display-lg text-ink mb-4">{title}</h1>
        <p className="text-body text-ink-muted">{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <article className="prose-custom">
      <h1 className="font-display text-display-lg text-ink mb-8">{title}</h1>
      <div className="text-body text-ink-soft">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </article>
  );
}
