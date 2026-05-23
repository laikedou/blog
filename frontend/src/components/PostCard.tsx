'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 400, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 400, damping: 30 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [6, -6]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [-6, 6]);
  const shadowX = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const shadowY = useTransform(springY, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : t('common.draftStatus');

  if (featured) {
    return (
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.32, 0.72, 0, 1],
          delay: index !== undefined ? index * 0.08 : 0.1,
        }}
        className="group"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 1000,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Link href={`/posts/${post.slug}`} className="block" aria-label={t('common.readPost', { title: post.title })}>
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
              <Link href={`/category/${post.category.slug}`} aria-label={t('common.categoryLabel', { name: post.category.name })}>
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
      </motion.article>
    );
  }

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.32, 0.72, 0, 1],
        delay: index !== undefined ? index * 0.08 : 0.1,
      }}
      className="group perspective-card"
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/posts/${post.slug}`} className="block" aria-label={t('common.readPost', { title: post.title })}>
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
            <Link href={`/category/${post.category.slug}`} aria-label={t('common.categoryLabel', { name: post.category.name })}>
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
    </motion.article>
  );
}
