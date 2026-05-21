'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Share2, Copy, Check, MessageSquare, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TocItem { id: string; text: string; level: number }

interface PostSidebarProps {
  post: any;
  contentSelector?: string;
}

export default function PostSidebar({ post, contentSelector = '.prose-editorial' }: PostSidebarProps) {
  const t = useTranslations();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [shared, setShared] = useState(false);

  // Build TOC from content headings
  useEffect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    const headings = container.querySelectorAll('h2, h3');
    const items: TocItem[] = [];
    headings.forEach((h, i) => {
      const id = h.id || `section-${i}`;
      if (!h.id) h.id = id;
      items.push({ id, text: h.textContent || '', level: h.tagName === 'H2' ? 2 : 3 });
    });
    setToc(items);

    // Scroll-spy with IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [contentSelector, post.id]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.share({ title: post.title, url });
    } catch {
      await navigator.clipboard.writeText(url);
      setShared(true);
      toast.success(t('common.copied'));
      setTimeout(() => setShared(false), 2000);
    }
  }, [post.title, t]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (toc.length === 0 && !post.author) return null;

  return (
    <aside className="space-y-6">
      {/* Table of Contents */}
      {toc.length > 0 && (
        <nav className="bg-surface-container/50 border border-outline-variant/30 rounded-xl p-5" aria-label="Table of Contents">
          <h4 className="text-label-sm font-label-sm text-ink-muted uppercase tracking-wider mb-3">{t('posts.tableOfContents')}</h4>
          <ul className="space-y-1">
            {toc.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`block w-full text-left text-body-sm py-1.5 px-2 rounded-md transition-all duration-200 truncate ${
                    item.level === 3 ? 'pl-5' : ''
                  } ${
                    activeId === item.id
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-container-high/50'
                  }`}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Author card */}
      {post.author && (
        <div className="bg-surface-container/50 border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-tertiary/30 flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-label-md font-semibold text-primary">
                {(post.author.displayName || post.author.username || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">{post.author.displayName}</p>
              <p className="text-caption-sm text-ink-muted">@{post.author.username}</p>
            </div>
          </div>
          {post.author.bio && (
            <p className="text-body-sm text-ink-muted mb-3">{post.author.bio}</p>
          )}
          {post.author.website && (
            <a
              href={post.author.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-caption-sm text-primary hover:text-primary-container transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {post.author.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      )}

      {/* Share */}
      <div className="bg-surface-container/50 border border-outline-variant/30 rounded-xl p-5">
        <h4 className="text-label-sm font-label-sm text-ink-muted uppercase tracking-wider mb-3">{t('posts.share')}</h4>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 gap-1.5">
            {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {shared ? t('common.copied') : t('posts.share')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success(t('common.copied'));
            }}
            className="gap-1.5"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
