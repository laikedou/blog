'use client';

import { useRef, useEffect } from 'react';
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
}

export default function PostCard({ post }: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    animate(el, {
      opacity: [0, 1],
      translateY: [16, 0],
      easing: 'easeOutCubic',
      duration: 600,
      delay: 100,
    });
  }, []);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Draft';

  return (
    <article ref={cardRef} className="opacity-0 group">
      <Link href={`/posts/${post.slug}`} className="block" aria-label={`Read ${post.title}`}>
        {post.featuredImage ? (
          <figure className="aspect-[4/3] bg-cream-200 overflow-hidden rounded-editorial mb-5 shadow-card group-hover:shadow-card-hover transition-shadow duration-500">
            <img
              src={post.featuredImage}
              alt={post.excerpt ? `${post.title} — ${post.excerpt.substring(0, 100)}` : post.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              loading="lazy"
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
          {post.excerpt || 'No excerpt available.'}
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
            <span>{post.viewCount} views</span>
            {post.commentCount !== undefined && <span>{post.commentCount} comments</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
