'use client';

import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight } from 'lucide-react';

interface Section {
  id: string;
  title: string;
}

interface Props {
  sections: Section[];
  activeSection: string;
  onSelect: (id: string) => void;
}

export default function TableOfContents({ sections, activeSection, onSelect }: Props) {
  const { t } = useTranslation();

  if (sections.length === 0) return null;

  return (
    <nav className="sticky top-20 bg-surface/80 backdrop-blur-md border border-border rounded-xl p-4">
      <h3 className="font-display text-display-xs text-ink mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-clay" />
        {t('viz.article.toc')}
      </h3>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => onSelect(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-body-sm transition-colors flex items-center gap-2 ${
                activeSection === section.id
                  ? 'bg-clay/10 text-clay font-medium'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-container-highest/50'
              }`}
            >
              <ChevronRight
                className={`h-3 w-3 shrink-0 transition-transform ${
                  activeSection === section.id ? 'rotate-90' : ''
                }`}
              />
              <span className="truncate">{section.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
