'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import BannerCarousel from '@/components/BannerCarousel';
import { posts as postsApi, categories as categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { animate, stagger } from 'animejs';
import { ArrowRight, Sparkles, Cpu, Globe, Database, ChevronRight } from 'lucide-react';

const TOPICS = [
  { slug: 'ai', label: 'Artificial Intelligence', icon: Sparkles, desc: 'LLMs, AI agents, prompt engineering, and the future of intelligence', color: 'from-violet-500/20 to-fuchsia-500/10' },
  { slug: 'web3', label: 'Web3', icon: Globe, desc: 'Decentralized web, dApps, smart contracts, and the evolving internet', color: 'from-blue-500/20 to-cyan-500/10' },
  { slug: 'blockchain', label: 'Blockchain', icon: Database, desc: 'Distributed ledgers, consensus mechanisms, DeFi, and crypto infrastructure', color: 'from-amber-500/20 to-orange-500/10' },
];

export default function HomePageClient() {
  const t = useTranslations();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [topicPosts, setTopicPosts] = useState<Record<string, any[]>>({});
  const postsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      postsApi.list({ status: 'published', page, limit: 9 }),
      postsApi.list({ status: 'published', page: 1, limit: 3 }),
      categoriesApi.list(),
    ]).then(([postsRes, featuredRes, categoriesRes]) => {
      setPosts(postsRes.data);
      setTotalPages(postsRes.totalPages);
      setFeaturedPosts(featuredRes.data || []);
      setCategories(categoriesRes);
    }).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (categories.length === 0) return;
    TOPICS.forEach(topic => {
      const cat = categories.find((c: any) => c.slug === topic.slug);
      if (cat) {
        postsApi.list({ categoryId: cat.id, limit: 4, status: 'published' })
          .then(res => setTopicPosts(prev => ({ ...prev, [topic.slug]: res.data || [] })))
          .catch(() => {});
      }
    });
  }, [categories]);

  useEffect(() => {
    if (!loading && postsRef.current) {
      animate(postsRef.current.children, {
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutCubic',
        duration: 600,
        delay: stagger(80),
      });
    }
  }, [loading, page]);

  return (
    <>
      <Header />

      <BannerCarousel zone="hero" />

      {/* Hero section */}
      <section className="bg-cream-100 relative overflow-hidden border-b border-border" aria-labelledby="hero-heading">
        <div className="section-container py-section-sm md:py-section text-center relative z-10">
          <div className="max-w-content mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clay/10 text-clay rounded-full text-body-sm mb-6">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('home.role')}</span>
            </div>
            <h1 id="hero-heading" className="font-display text-hero text-ink mb-5 text-balance leading-[1.1]">
              {t.rich('home.heroTitle', { clay: (chunks) => <span className="text-clay">{chunks}</span>, br: () => <br /> })}
            </h1>
            <p className="text-lead text-ink-soft max-w-2xl mx-auto mb-10">
              {t('home.heroDescription')}
            </p>
            <nav className="flex items-center justify-center gap-4" aria-label="Homepage actions">
              <Link href="#posts"><Button size="lg">{t('home.browseArticles')}</Button></Link>
              <Link href="/category/ai"><Button variant="outline" size="lg">{t('home.exploreAI')} <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </nav>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-200 to-transparent pointer-events-none" aria-hidden="true" />
      </section>

      {/* Topic sections */}
      {TOPICS.map((topic, ti) => {
        const Icon = topic.icon;
        const postsForTopic = topicPosts[topic.slug] || [];
        const cat = categories.find((c: any) => c.slug === topic.slug);
        if (postsForTopic.length === 0 && !cat) return null;

        return (
          <section key={topic.slug} className={`${ti % 2 === 0 ? 'bg-cream-200' : 'bg-cream-100'} border-b border-border`} aria-labelledby={`topic-heading-${topic.slug}`}>
            <div className="section-container py-section-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center`} aria-hidden="true">
                    <Icon className="h-6 w-6 text-ink" />
                  </div>
                  <div>
                    <h2 id={`topic-heading-${topic.slug}`} className="font-display text-display-md text-ink">{topic.label}</h2>
                    <p className="text-body-sm text-ink-muted">{topic.desc}</p>
                  </div>
                </div>
                {cat && (
                  <Link href={`/category/${cat.slug}`}>
                    <Button variant="ghost" size="sm">
                      {t('common.viewAll')} <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>

              {postsForTopic.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {postsForTopic.slice(0, 4).map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-surface/50 rounded-editorial border border-border border-dashed">
                  <p className="text-body text-ink-muted">{t('home.noArticlesTopic')}</p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Inline banners between topics and posts */}
      <BannerCarousel zone="inline" />

      {/* Latest posts grid */}
      <section id="posts" className="bg-cream-200" aria-labelledby="latest-heading">
        <div className="section-container py-section-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="latest-heading" className="font-display text-display-md text-ink">{t('home.latestPosts')}</h2>
              <p className="text-body-sm text-ink-muted mt-1">{t('home.recentPostsDesc')}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] rounded-editorial" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <h2 className="font-display text-display-lg text-ink mb-3">{t('home.noPosts')}</h2>
              <p className="text-body text-ink-muted">{t('home.checkBackLater')}</p>
            </div>
          ) : (
            <>
              <div ref={postsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {posts.map(post => <PostCard key={post.id} post={post} />)}
              </div>

              {totalPages > 1 && (
                <nav className="flex justify-center items-center gap-3 mt-16" aria-label="Pagination">
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>{t('common.previous')}</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button key={p} variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)} className="min-w-[40px]" aria-current={p === page ? 'page' : undefined}>{p}</Button>
                  ))}
                  <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>{t('common.next')}</Button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      {/* Sidebar zone banner */}
      <BannerCarousel zone="sidebar" />

      {/* About the author */}
      <section className="bg-cream-100 border-t border-border" aria-labelledby="about-heading">
        <div className="section-container py-section-sm">
          <div className="max-w-content mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-clay to-teal flex items-center justify-center mx-auto mb-6" aria-hidden="true">
              <span className="font-display text-display-md text-white">F</span>
            </div>
            <h2 id="about-heading" className="font-display text-display-md text-ink mb-3">{t('home.aboutAuthor')}</h2>
            <p className="text-body text-ink-soft max-w-2xl mx-auto leading-relaxed">
              {t('home.aboutDesc')}
            </p>
            <div className="flex items-center justify-center gap-6 mt-8 text-body-sm text-ink-muted">
              <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4" aria-hidden="true" /> {t('home.topicFrontend')}</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" aria-hidden="true" /> {t('home.topicAI')}</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" aria-hidden="true" /> {t('home.topicWeb3')}</span>
              <span className="flex items-center gap-1.5"><Database className="h-4 w-4" aria-hidden="true" /> {t('home.topicBlockchain')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer zone banner */}
      <BannerCarousel zone="footer" />

      <Footer />
    </>
  );
}
