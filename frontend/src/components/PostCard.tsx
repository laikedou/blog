'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { animate } from 'animejs';
import { Badge } from '@/components/ui/badge';

interface PostCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    publishedAt: string | null;
    author: { displayName: string; avatar: string };
    category: { name: string; slug: string; color: string } | null;
    tags: { id: number; name: string; slug: string }[];
    viewCount: number;
    commentCount?: number;
  };
  featured?: boolean;
  index?: number;
}

export default function PostCard({ post, featured, index }: PostCardProps) {
  const t = useTranslations();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    animate(el, {
      opacity: [0, 1],
      translateY: [16, 0],
      easing: 'easeOutCubic',
      duration: 600,
      delay: index !== undefined ? index * 80 : 100,
    });
  }, [index]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({
      transform: `perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`,
      transition: 'transform 0.1s ease-out',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
    });
  }, []);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : t('common.draftStatus');

  if (featured) {
    return (
      <article ref={cardRef} className="opacity-0 group" style={tiltStyle} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <Link href={`/posts/${post.slug}`} className="block" aria-label={`Read ${post.title}`}>
          <figure className="aspect-[16/9] bg-cream-200 overflow-hidden rounded-editorial mb-5 shadow-card group-hover:shadow-card-hover transition-shadow duration-500">
            {post.featuredImage ? (
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                <span className="font-display text-display-lg text-cream-400">AI</span>
              </div>
            )}
          </figure>
        </Link>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {post.category && (
              <Link href={`/category/${post.category.slug}`}>
                <Badge variant="outline" className="text-caption-sm" style={{ color: post.category.color, borderColor: post.category.color + '40' }}>
                  {post.category.name}
                </Badge>
              </Link>
            )}
            <time dateTime={post.publishedAt || undefined} className="text-body-sm text-ink-muted">{date}</time>
          </div>
          <Link href={`/posts/${post.slug}`}>
            <h2 className="font-display text-display-sm md:text-display-md text-ink group-hover:text-clay transition-colors line-clamp-2 text-balance">
              {post.title}
            </h2>
          </Link>
          <p className="text-body text-ink-soft line-clamp-3">{post.excerpt || t('common.noExcerpt')}</p>
        </div>
      </article>
    );
  }

  return (
    <article ref={cardRef} className="opacity-0 group perspective-card" style={tiltStyle} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <Link href={`/posts/${post.slug}`} className="block" aria-label={`Read ${post.title}`}>
        {post.featuredImage ? (
          <figure className="aspect-[4/3] bg-cream-200 overflow-hidden rounded-editorial mb-5 shadow-card group-hover:shadow-card-hover transition-shadow duration-500">
            <img
              src={post.featuredImage}
              alt={post.excerpt ? `${post.title} — ${post.excerpt.substring(0, 100)}` : post.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </figure>
        ) : (
          <div className="aspect-[4/3] bg-cream-200 rounded-editorial mb-5 flex items-center justify-center" aria-hidden="true">
            <span className="font-display text-display-sm text-cream-400">AI</span>
          </div>
        )}
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {post.category && (
            <Link href={`/category/${post.category.slug}`} aria-label={`Category: ${post.category.name}`}>
              <Badge variant="outline" className="text-caption-sm" style={{ color: post.category.color, borderColor: post.category.color + '40' }}>
                {post.category.name}
              </Badge>
            </Link>
          )}
          <time dateTime={post.publishedAt || undefined} className="text-body-sm text-ink-muted">{date}</time>
        </div>

        <Link href={`/posts/${post.slug}`}>
          <h2 className="font-display text-display-sm text-ink group-hover:text-clay transition-colors line-clamp-2 text-balance">
            {post.title}
          </h2>
        </Link>

        <p className="text-body text-ink-soft line-clamp-2">
          {post.excerpt || t('common.noExcerpt')}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-cream-300 flex items-center justify-center" aria-hidden="true">
              <span className="text-caption-sm font-medium text-ink-muted">
                {post.author.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-body-sm text-ink-muted" itemProp="author">{post.author.displayName}</span>
          </div>
          <div className="flex items-center gap-3 text-body-sm text-ink-muted">
            <span>{t('common.viewCount', { count: post.viewCount })}</span>
            {post.commentCount !== undefined && <span>{t('common.commentCount', { count: post.commentCount })}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}