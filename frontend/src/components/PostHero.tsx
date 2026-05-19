'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Calendar, Eye, MessageSquare, Share2, Clock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PostHeroProps {
  post: any;
}

function readingTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function PostHero({ post }: PostHeroProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [shared, setShared] = useState(false);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const readMin = readingTime(post.content || '');

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = post.title;
    try {
      await navigator.share({ title, url });
    } catch {
      await navigator.clipboard.writeText(url);
      setShared(true);
      toast.success(t('common.copied'));
      setTimeout(() => setShared(false), 2000);
    }
  }, [post.title, t]);

  return (
    <header className="relative mb-12">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 z-50 h-0.5 bg-gradient-to-r from-primary via-tertiary to-secondary" style={{ width: `${progress}%`, transition: 'width 0.15s linear' }} />

      {/* Featured image with dramatic overlay */}
      {post.featuredImage ? (
        <div className="relative -mx-3 sm:-mx-6 lg:-mx-0 mb-10 overflow-hidden rounded-none lg:rounded-2xl">
          <div className="relative aspect-[21/9] lg:aspect-[21/7]">
            <img
              src={post.featuredImage}
              alt={post.seoDescription || post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface/40 via-transparent to-surface/40" />
          </div>

          {/* Title overlay on image (desktop) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 hidden lg:block">
            <div className="max-w-reading mx-auto">
              {post.category && (
                <Link href={`/category/${post.category.slug}`} className="inline-block mb-4">
                  <Badge className="text-caption px-3 py-1 font-medium" style={{ background: post.category.color + '20', color: post.category.color, borderColor: post.category.color + '40' }}>
                    {post.category.name}
                  </Badge>
                </Link>
              )}
              <h1 className="font-display text-display-xl lg:text-hero text-white text-balance leading-tight mb-4 drop-shadow-lg">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-body-sm text-white/80">
                <span>{post.author?.displayName}</span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readMin} min read</span>
                <span className="opacity-40">·</span>
                <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{t('posts.views', { count: post.viewCount })}</span>
                {post.comments && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{t('posts.comments', { count: post.comments.length })}</span>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto text-white/80 hover:text-white hover:bg-white/10">
                  {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No image — text-only hero */
        <div className="mb-10 pt-8">
          {post.category && (
            <Link href={`/category/${post.category.slug}`} className="inline-block mb-4">
              <Badge className="text-caption px-3 py-1 font-medium" style={{ background: post.category.color + '20', color: post.category.color, borderColor: post.category.color + '40' }}>
                {post.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="font-display text-display-xl lg:text-hero text-ink text-balance leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-body-sm text-ink-muted">
            <span>{post.author?.displayName}</span>
            <span className="text-outline-variant">·</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readMin} min read</span>
            <span className="text-outline-variant">·</span>
            <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
            <span className="text-outline-variant">·</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{t('posts.views', { count: post.viewCount })}</span>
          </div>
        </div>
      )}

      {/* Mobile: title and meta below image */}
      {post.featuredImage && (
        <div className="lg:hidden">
          {post.category && (
            <Link href={`/category/${post.category.slug}`} className="inline-block mb-3">
              <Badge className="text-caption px-3 py-1 font-medium" style={{ background: post.category.color + '20', color: post.category.color, borderColor: post.category.color + '40' }}>
                {post.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="font-display text-display-md sm:text-display-lg text-ink text-balance leading-tight mb-3">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ink-muted">
            <span>{post.author?.displayName}</span>
            <span className="text-outline-variant">·</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readMin} min</span>
            <span className="text-outline-variant">·</span>
            <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
          </div>
        </div>
      )}
    </header>
  );
}
