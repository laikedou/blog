'use client';

import { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function ArticleSection({ id, title, children, className }: Props) {
  return (
    <section
      id={id}
      data-article-section
      data-section-title={title}
      className={className}
    >
      {children}
    </section>
  );
}
