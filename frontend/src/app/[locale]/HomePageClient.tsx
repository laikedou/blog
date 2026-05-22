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
import { ArrowRight, Sparkles, Cpu, Globe, Database, ChevronRight, ChevronDown } from 'lucide-react';

const TOPIC_SLUGS = [
  { slug: 'ai', icon: Sparkles, color: 'from-violet-500/20 to-fuchsia-500/10' },
  { slug: 'web3', icon: Globe, color: 'from-blue-500/20 to-cyan-500/10' },
  { slug: 'blockchain', icon: Database, color: 'from-amber-500/20 to-orange-500/10' },
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
    TOPIC_SLUGS.forEach(topic => {
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

  const topicMeta: Record<string, { label: string; desc: string }> = {
    ai: { label: t('home.sectionAiLabel'), desc: t('home.sectionAiDesc') },
    web3: { label: t('home.sectionWeb3Label'), desc: t('home.sectionWeb3Desc') },
    blockchain: { label: t('home.sectionBlockchainLabel'), desc: t('home.sectionBlockchainDesc') },
  };

  return (
    <>
      <Header />

      {/* Scroll Progress Bar */}
      <ScrollProgress />

      <BannerCarousel zone="hero" />
      <div className="h-8 md:h-12" />

      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden bg-cream-200 border-b border-border min-h-[85vh] flex items-center"
        aria-labelledby="hero-heading"
        onMouseMove={(e) => {
          const glow = document.getElementById('hero-cursor-glow');
          if (glow) {
            const rect = e.currentTarget.getBoundingClientRect();
            glow.style.left = `${e.clientX - rect.left}px`;
            glow.style.top = `${e.clientY - rect.top}px`;
            glow.style.opacity = '1';
          }
        }}
        onMouseLeave={() => {
          const glow = document.getElementById('hero-cursor-glow');
          if (glow) glow.style.opacity = '0';
        }}
      >
        {/* Particle field */}
        <div className="particle-field" aria-hidden="true">
          <div className="particle-dot fast" style={{ width: 4, height: 4, background: 'rgba(76,215,246,0.4)', top: '15%', left: '10%', animationDelay: '0s', boxShadow: '0 0 8px rgba(76,215,246,0.3)' }} />
          <div className="particle-dot slow" style={{ width: 3, height: 3, background: 'rgba(175,198,255,0.45)', top: '25%', left: '75%', animationDelay: '1s' }} />
          <div className="particle-dot fast" style={{ width: 5, height: 5, background: 'rgba(76,215,246,0.2)', top: '60%', left: '18%', animationDelay: '2s', boxShadow: '0 0 10px rgba(76,215,246,0.15)' }} />
          <div className="particle-dot slow" style={{ width: 3, height: 3, background: 'rgba(221,183,255,0.4)', top: '40%', left: '85%', animationDelay: '0.5s' }} />
          <div className="particle-dot fast" style={{ width: 4, height: 4, background: 'rgba(175,198,255,0.3)', top: '70%', left: '50%', animationDelay: '1.5s', boxShadow: '0 0 6px rgba(175,198,255,0.2)' }} />
          <div className="particle-dot slow" style={{ width: 6, height: 6, background: 'rgba(76,215,246,0.12)', top: '8%', left: '45%', animationDelay: '3s' }} />
          <div className="particle-dot fast" style={{ width: 2, height: 2, background: 'rgba(221,183,255,0.5)', top: '80%', left: '65%', animationDelay: '0.8s' }} />
          <div className="particle-dot slow" style={{ width: 3, height: 3, background: 'rgba(76,215,246,0.3)', top: '35%', left: '32%', animationDelay: '2.5s' }} />
          <div className="particle-dot fast" style={{ width: 5, height: 5, background: 'rgba(175,198,255,0.18)', top: '55%', left: '55%', animationDelay: '1.2s', boxShadow: '0 0 8px rgba(175,198,255,0.12)' }} />
          <div className="particle-dot slow" style={{ width: 2, height: 2, background: 'rgba(76,215,246,0.35)', top: '90%', left: '15%', animationDelay: '3.5s' }} />
        </div>

        {/* Orbiting rings — right side on desktop */}
        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 hidden lg:block" aria-hidden="true">
          <div className="orbit-ring" style={{ width: 480, height: 480, marginLeft: -240, marginTop: -240 }} />
          <div className="orbit-ring" style={{ width: 360, height: 360, marginLeft: -180, marginTop: -180, animationDuration: '45s', animationDirection: 'reverse' }} />
          <div className="orbit-ring" style={{ width: 240, height: 240, marginLeft: -120, marginTop: -120, animationDuration: '38s' }} />
        </div>

        {/* Cursor glow — positioned inside hero */}
        <div id="hero-cursor-glow" className="cursor-glow" style={{ opacity: 0 }} aria-hidden="true" />

        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" aria-hidden="true" />
        {/* Radial ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-clay/4 via-primary/2 to-transparent blur-[150px] pointer-events-none" aria-hidden="true" />

        <div className="section-container py-16 md:py-28 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clay opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-clay" />
                </span>
                <span className="text-ink-muted text-body-sm">{t('home.role')}</span>
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
                  <Button size="lg" className="magnetic-btn group relative overflow-hidden bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-primary">
                    <span className="relative z-10 text-primary-foreground">{t('home.browseArticles')}</span>
                  </Button>
                </Link>
                <Link href="/category/ai">
                  <Button variant="outline" size="lg" className="magnetic-btn group border-clay/20 hover:border-clay/40">
                    {t('home.exploreAI')}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Right: Wireframe sphere — enlarged */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0">
              <div className="wireframe-sphere animate-spin-slow" aria-hidden="true" style={{ width: 360, height: 360 }} />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center mt-16 lg:mt-24">
            <button
              onClick={() => document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-ink-muted hover:text-clay transition-colors animate-bounce"
              aria-label="Scroll to content"
            >
              <span className="text-caption-sm">{t('home.scrollDown')}</span>
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-200 to-transparent pointer-events-none" aria-hidden="true" />
      </section>

      {/* ── Topic Sections ── */}
      {TOPIC_SLUGS.map((topic, ti) => {
        const Icon = topic.icon;
        const postsForTopic = topicPosts[topic.slug] || [];
        const cat = categories.find((c: any) => c.slug === topic.slug);
        if (postsForTopic.length === 0 && !cat) return null;

        const isAI = topic.slug === 'ai';
        const isWeb3 = topic.slug === 'web3';
        const isBlockchain = topic.slug === 'blockchain';
        const bgClass = isAI ? 'topic-bg-ai' : isWeb3 ? 'topic-bg-web3' : 'topic-bg-blockchain';

        return (
          <SectionReveal key={topic.slug}>
            <section
              className={`relative ${ti % 2 === 0 ? 'bg-cream-100' : 'bg-cream-200'} border-b border-border overflow-hidden`}
              aria-labelledby={`topic-heading-${topic.slug}`}
            >
              {/* Branded background pattern */}
              <div className={`absolute inset-0 ${bgClass} opacity-50 pointer-events-none`} aria-hidden="true" />
              {/* Corner accent glow */}
              <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br ${topic.color} blur-[120px] opacity-15 pointer-events-none`} aria-hidden="true" />

              <div className="section-container py-20 md:py-28 relative z-10">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center ${isAI ? 'animate-pulse-glow' : ''}`} aria-hidden="true">
                      <Icon className="h-7 w-7 text-ink" />
                    </div>
                    <div>
                      <h2 id={`topic-heading-${topic.slug}`} className="font-display text-display-md text-ink heading-underline">
                        {topicMeta[topic.slug].label}
                      </h2>
                      <p className="text-body-sm text-ink-muted mt-1">{topicMeta[topic.slug].desc}</p>
                    </div>
                  </div>
                  {cat && (
                    <Link href={`/category/${cat.slug}`}>
                      <Button variant="ghost" size="sm" className="group hover:text-clay">
                        {t('common.viewAll')}
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Posts Grid */}
                {postsForTopic.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {postsForTopic.slice(0, 4).map((post: any, idx: number) =>
                      isAI && idx === 0 ? (
                        <div key={post.id} className="md:col-span-2 gradient-border-glow rounded-editorial">
                          <PostCard post={post} featured />
                        </div>
                      ) : (
                        <PostCard key={post.id} post={post} index={idx} />
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 rounded-editorial border border-border border-dashed bg-surface/10">
                    <Icon className="h-10 w-10 mx-auto mb-3 text-ink-faint opacity-40 animate-breathe" />
                    <p className="text-body text-ink-muted">{t('home.noArticlesTopic')}</p>
                  </div>
                )}
              </div>
            </section>
          </SectionReveal>
        );
      })}

      <div className="py-8 md:py-12">
        <BannerCarousel zone="inline" />
      </div>

      {/* ── Latest Posts ── */}
      <section id="posts" className="relative bg-cream-200" aria-labelledby="latest-heading">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-clay/15 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="section-container py-20 md:py-28">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 id="latest-heading" className="font-display text-display-md text-ink">{t('home.latestPosts')}</h2>
              <p className="text-body-sm text-ink-muted mt-1">{t('home.recentPostsDesc')}</p>
            </div>
            {totalPages > page && (
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="group hidden md:inline-flex">
                {t('common.loadMore')}
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.filter((c: any) => ['ai','web3','blockchain'].includes(c.slug)).map((cat: any) => (
              <button key={cat.id} className="filter-pill">{cat.name}</button>
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
                <div className="flex justify-center mt-12 md:hidden">
                  <Button variant="outline" size="lg" onClick={() => setPage(p => p + 1)} className="group">
                    {t('common.loadMore')}
                    <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="py-8 md:py-12">
        <BannerCarousel zone="sidebar" />
      </div>

      {/* ── About Author ── */}
      <section className="relative bg-cream-100 border-t border-border overflow-hidden" aria-labelledby="about-heading">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full bg-clay/5 blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="section-container py-20 md:py-28 relative z-10">
          <div className="max-w-content mx-auto text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-clay to-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-clay/25 animate-pulse-glow" aria-hidden="true">
              <span className="font-display text-display-md text-white">F</span>
            </div>
            <h2 id="about-heading" className="font-display text-display-md text-ink mb-4">{t('home.aboutAuthor')}</h2>
            <p className="text-body text-ink-soft max-w-2xl mx-auto leading-relaxed">{t('home.aboutDesc')}</p>
          </div>

          {/* Stats counters */}
          <SectionReveal>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-10">
              <div className="text-center">
                <div className="stat-number text-clay">128+</div>
                <div className="text-caption-sm text-ink-muted mt-1">{t('home.topicFrontend')}</div>
              </div>
              <div className="text-center">
                <div className="stat-number text-primary">42K+</div>
                <div className="text-caption-sm text-ink-muted mt-1">{t('home.topicAI')}</div>
              </div>
              <div className="text-center">
                <div className="stat-number text-secondary">3</div>
                <div className="text-caption-sm text-ink-muted mt-1">{t('home.topicWeb3')}</div>
              </div>
            </div>
          </SectionReveal>

          {/* Skill chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
            {[
              { label: t('home.topicFrontend'), icon: Cpu, color: 'text-clay' },
              { label: t('home.topicAI'), icon: Sparkles, color: 'text-primary' },
              { label: t('home.topicWeb3'), icon: Globe, color: 'text-secondary' },
              { label: t('home.topicBlockchain'), icon: Database, color: 'text-tertiary' },
            ].map((skill, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:border-clay/25 transition-all duration-300">
                <skill.icon className={`h-4 w-4 ${skill.color}`} aria-hidden="true" />
                <span className="text-label-sm">{skill.label}</span>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="max-w-xl mx-auto text-center p-8 rounded-2xl glass-card">
            <p className="text-body text-ink-soft italic leading-relaxed">&ldquo;{t('home.aboutQuote')}&rdquo;</p>
          </div>
        </div>
      </section>

      <div className="py-8 md:py-12">
        <BannerCarousel zone="footer" />
      </div>

      <BackToTop />
      <Footer />
    </>
  );
}
