'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';

interface CodePreviewProps {
  code: string;
  dark?: boolean;
  maxHeight?: string;
}

export default function CodePreview({ code, dark, maxHeight = '600px' }: CodePreviewProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code]);

  return (
    <pre
      className={`code-preview overflow-x-auto overflow-y-auto font-mono whitespace-pre-wrap p-5${
        dark
          ? ' is-dark bg-surface-tile text-cream-100 text-caption-sm'
          : ' text-body-sm text-ink-soft'
      }`}
      style={{ maxHeight }}
    >
      <code ref={codeRef} className="language-html">{code}</code>
    </pre>
  );
}
