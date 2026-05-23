'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import { posts as postsApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useTranslations } from 'next-intl';

export default function TagPageClient({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    postsApi.list({ status: 'published', limit: 12 })
      .then(res => {
        const filtered = res.data.filter((p: any) => p.tags?.some((t: any) => t.slug === slug));
        setPosts(filtered);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-surface-tile relative overflow-hidden" aria-labelledby="tag-heading">
          <div className="grain-overlay absolute inset-0" aria-hidden="true" />
          <div className="content-container py-section-sm text-center relative z-10">
            <h1 id="tag-heading" className="font-display text-display-xl text-white mb-3">#{slug}</h1>
            <p className="text-lead text-cream-400">{t('tag.postsWith')}</p>
          </div>
        </section>

        <section className="bg-cream-200" aria-label={t('common.taggedPosts')}>
          <div className="section-container py-section-sm">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/3] rounded-editorial" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24">
                <h2 className="font-display text-display-lg text-ink mb-3">{t('tag.noPosts')}</h2>
                <Link href="/" className="text-clay hover:text-clay-dark text-body">{t('common.backToHome')}</Link>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
              >
                {posts.map(post => (
                  <motion.div key={post.id} variants={staggerItem}>
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
