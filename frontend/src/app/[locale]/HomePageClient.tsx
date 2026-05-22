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

function ScrollProgress() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return <div className="scroll-progress" style={{ width: `${width}%` }} />;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <button
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <span className="material-symbols-outlined text-[20px] text-clay">keyboard_arrow_up</span>
    </button>
  );
}

function SectionReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate(el, { opacity: [0, 1], translateY: [24, 0], easing: 'easeOutCubic', duration: 600 });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: 0 }}>{children}</div>;
}

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

      {/* Scroll Progress Bar */}
      <ScrollProgress />

      <BannerCarousel zone="hero" />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-cream-200 border-b border-border" aria-labelledby="hero-heading">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" aria-hidden="true" />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-clay/5 blur-[120px] pointer-events-none" aria-hidden="true" />

        <div className="section-container py-section-sm md:py-section relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-clay/10 border border-clay/20 text-clay text-body-sm mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clay opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-clay" />
                </span>
                <span>{t('home.role')}</span>
              </div>

              <h1 id="hero-heading" className="font-display text-hero text-ink mb-6 text-balance leading-[1.1]">
                {t.rich('home.heroTitle', {
                  clay: (chunks) => <span className="gradient-text">{chunks}</span>,
                  br: () => <br />
                })}
              </h1>

              <p className="text-lead text-ink-soft max-w-xl mb-10 lg:mb-12">
                {t('home.heroDescription')}
              </p>

              <nav className="flex items-center gap-4 justify-center lg:justify-start" aria-label="Homepage actions">
                <Link href="#posts">
                  <Button size="lg" className="group relative overflow-hidden">
                    <span className="relative z-10">{t('home.browseArticles')}</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-clay opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </Button>
                </Link>
                <Link href="/category/ai">
                  <Button variant="outline" size="lg" className="group">
                    {t('home.exploreAI')}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Right: 3D Wireframe Sphere */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0">
              <div className="wireframe-sphere animate-spin-slow" aria-hidden="true" />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center mt-16 lg:mt-20">
            <button
              onClick={() => document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-ink-muted hover:text-clay transition-colors animate-bounce"
              aria-label="Scroll to content"
            >
              <span className="text-caption-sm">{t('home.scrollDown')}</span>
              <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-200 to-transparent pointer-events-none" aria-hidden="true" />
      </section>

      {/* ── Topic Sections ── */}
      {TOPICS.map((topic, ti) => {
        const Icon = topic.icon;
        const postsForTopic = topicPosts[topic.slug] || [];
        const cat = categories.find((c: any) => c.slug === topic.slug);
        if (postsForTopic.length === 0 && !cat) return null;

        const isAI = topic.slug === 'ai';
        const isBlockchain = topic.slug === 'blockchain';

        return (
          <SectionReveal key={topic.slug}>
            <section
              className={`relative ${ti % 2 === 0 ? 'bg-cream-100' : 'bg-cream-200'} border-b border-border overflow-hidden`}
              aria-labelledby={`topic-heading-${topic.slug}`}
            >
              {/* Section-specific background */}
              {isAI && <div className="absolute inset-0 bg-circuit-pattern opacity-30 pointer-events-none" aria-hidden="true" />}
              {isBlockchain && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-clay/20 to-transparent pointer-events-none" aria-hidden="true" />
              )}

              <div className="section-container py-section-sm relative z-10">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center ${isAI ? 'animate-pulse-glow' : ''}`} aria-hidden="true">
                      <Icon className="h-7 w-7 text-ink" />
                    </div>
                    <div>
                      <h2 id={`topic-heading-${topic.slug}`} className="font-display text-display-md text-ink group">
                        <span className="relative">
                          {topic.label}
                          <span className="absolute -bottom-1 left-0 h-0.5 bg-clay w-0 group-hover:w-full transition-all duration-500" />
                        </span>
                      </h2>
                      <p className="text-body-sm text-ink-muted mt-1">{topic.desc}</p>
                    </div>
                  </div>
                  {cat && (
                    <Link href={`/category/${cat.slug}`}>
                      <Button variant="ghost" size="sm" className="group">
                        {t('common.viewAll')}
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Posts Grid */}
                {postsForTopic.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {postsForTopic.slice(0, 4).map((post: any, idx: number) => (
                      isAI && idx === 0 ? (
                        <div key={post.id} className="md:col-span-2 gradient-border-glow rounded-editorial">
                          <PostCard post={post} featured />
                        </div>
                      ) : (
                        <PostCard key={post.id} post={post} />
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-surface/30 rounded-editorial border border-border border-dashed">
                    <Icon className="h-10 w-10 mx-auto mb-3 text-ink-faint opacity-50" />
                    <p className="text-body text-ink-muted">{t('home.noArticlesTopic')}</p>
                  </div>
                )}
              </div>
            </section>
          </SectionReveal>
        );
      })}

      <BannerCarousel zone="inline" />

      {/* ── Latest Posts ── */}
      <section id="posts" className="bg-cream-200" aria-labelledby="latest-heading">
        <div className="section-container py-section-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="latest-heading" className="font-display text-display-md text-ink">{t('home.latestPosts')}</h2>
              <p className="text-body-sm text-ink-muted mt-1">{t('home.recentPostsDesc')}</p>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.filter((c: any) => ['ai','web3','blockchain'].includes(c.slug)).map((cat: any) => (
              <button
                key={cat.id}
                className="px-4 py-1.5 rounded-full text-label-sm border border-border text-ink-muted hover:text-clay hover:border-clay/30 transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] rounded-editorial shimmer" />
                  <Skeleton className="h-4 w-1/3 shimmer" />
                  <Skeleton className="h-6 w-full shimmer" />
                  <Skeleton className="h-4 w-2/3 shimmer" />
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
                {posts.map((post, idx) => (
                  <PostCard key={post.id} post={post} index={idx} />
                ))}
              </div>

              {totalPages > page && (
                <div className="flex justify-center mt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setPage(p => p + 1)}
                    className="group"
                  >
                    {t('common.loadMore')}
                    <span className="material-symbols-outlined text-[18px] ml-2 group-hover:translate-y-0.5 transition-transform">expand_more</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <BannerCarousel zone="sidebar" />

      {/* ── About Author ── */}
      <section className="bg-cream-100 border-t border-border" aria-labelledby="about-heading">
        <div className="section-container py-section-sm">
          <div className="max-w-content mx-auto text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-clay to-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-clay/20" aria-hidden="true">
              <span className="font-display text-display-md text-white">F</span>
            </div>
            <h2 id="about-heading" className="font-display text-display-md text-ink mb-3">{t('home.aboutAuthor')}</h2>
            <p className="text-body text-ink-soft max-w-2xl mx-auto leading-relaxed">
              {t('home.aboutDesc')}
            </p>
          </div>

          {/* Skill timeline */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-body-sm text-ink-muted mb-10">
            {[
              { label: t('home.topicFrontend'), icon: Cpu, color: 'text-clay' },
              { label: t('home.topicAI'), icon: Sparkles, color: 'text-primary' },
              { label: t('home.topicWeb3'), icon: Globe, color: 'text-secondary' },
              { label: t('home.topicBlockchain'), icon: Database, color: 'text-tertiary' },
            ].map((skill, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface/50 border border-border hover:border-clay/30 transition-colors">
                <skill.icon className={`h-4 w-4 ${skill.color}`} aria-hidden="true" />
                <span>{skill.label}</span>
              </div>
            ))}
          </div>

          {/* Quote card */}
          <div className="max-w-xl mx-auto text-center p-6 rounded-editorial bg-surface/30 border border-border">
            <p className="text-body text-ink-soft italic">
              &ldquo;{t('home.aboutQuote')}&rdquo;
            </p>
          </div>
        </div>
      </section>

      <BannerCarousel zone="footer" />

      <BackToTop />
      <Footer />
    </>
  );
}
