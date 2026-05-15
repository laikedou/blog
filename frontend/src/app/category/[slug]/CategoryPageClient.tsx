'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import { posts as postsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { animate, stagger } from 'animejs';

export default function CategoryPageClient({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    postsApi.list({ status: 'published', page, limit: 12 })
      .then(res => { setPosts(res.data); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
  }, [slug, page]);

  useEffect(() => {
    if (!loading && postsRef.current) {
      animate(postsRef.current.children, {
        opacity: [0, 1], translateY: [20, 0],
        easing: 'easeOutCubic', duration: 500, delay: stagger(80),
      });
    }
  }, [loading]);

  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-surface-tile relative overflow-hidden" aria-labelledby="category-heading">
          <div className="grain-overlay absolute inset-0" aria-hidden="true" />
          <div className="content-container py-section-sm text-center relative z-10">
            <h1 id="category-heading" className="font-display text-display-xl text-white mb-3">{categoryName}</h1>
            <p className="text-lead text-cream-400">Posts in this category</p>
          </div>
        </section>

        <section className="bg-cream-200" aria-label="Category posts">
          <div className="section-container py-section-sm">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/3] rounded-editorial" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24">
                <h2 className="font-display text-display-lg text-ink mb-3">No posts in this category</h2>
                <Link href="/" className="text-clay hover:text-clay-dark text-body">Back to home</Link>
              </div>
            ) : (
              <>
                <div ref={postsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                  {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
                {totalPages > 1 && (
                  <nav className="flex justify-center gap-3 mt-16" aria-label="Pagination">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Previous</Button>
                    <span className="text-body-sm text-ink-muted self-center">Page {page} of {totalPages}</span>
                    <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</Button>
                  </nav>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
