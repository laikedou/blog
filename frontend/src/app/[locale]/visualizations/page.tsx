'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { Search, BarChart3, BookOpen, Atom, Play, Clock, User, Eye, Sparkles, TrendingUp, Plus, ArrowRight, Layers, Zap } from 'lucide-react';

export default function PublicVisualizationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<string>('');

  const fetchList = (qs?: string) => {
    setLoading(true);
    visualizations.listPublished({ search: qs || search || undefined, subject: subject || undefined, limit: 30 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [subject]);
  useEffect(() => {
    const timer = setTimeout(() => fetchList(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const items = data?.data || [];
  const mathCount = items.filter((v: any) => v.subject === 'math').length;
  const physicsCount = items.filter((v: any) => v.subject === 'physics').length;

  return (
    <div className="min-h-screen bg-cream-200">
      {/* Hero with animated particle background */}
      <div className="relative bg-surface-tile text-white py-16 sm:py-20 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${3 + Math.random() * 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.15 + Math.random() * 0.35,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
              }}
            />
          ))}
        </div>

        {/* Grid lines decoration */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden="true"
        />

        <div className="max-w-grid mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-clay/10 border border-clay/20 text-clay text-caption-sm mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t('viz.interactiveLearning')}</span>
              </div>
              <h1 className="font-display text-display-xl mb-3">
                <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  {t('viz.interactiveLearning')}
                </span>
              </h1>
              <p className="text-lead text-white/50 max-w-reading">
                {t('viz.subtitle')}
              </p>
            </div>

            {/* Decorative abstract shape */}
            <div className="hidden lg:block shrink-0" aria-hidden="true">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-clay/20 to-tertiary/20 border border-white/10 rotate-12 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-tertiary/15 to-clay/15 border border-white/10 -rotate-6 animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-clay/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Search & filter */}
          <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="relative flex-1 min-w-[240px] max-w-md group/search">
              <div className="absolute inset-0 rounded-editorial-xs ring-1 ring-transparent group-focus-within/search:ring-clay/30 group-focus-within/search:shadow-[0_0_20px_rgba(76,215,246,0.15)] transition-all duration-300" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within/search:text-clay/60 transition-colors z-10" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('viz.searchPlaceholder')}
                className="pl-9 pr-12 bg-white/[0.07] border-white/[0.08] text-white placeholder:text-white/30 rounded-editorial-xs h-11 relative z-10 focus:bg-white/[0.12] transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20 border border-white/10 rounded px-1.5 py-0.5 z-10 hidden sm:block">
                /
              </kbd>
            </div>
            <div className="flex gap-1.5 p-0.5 bg-white/[0.06] rounded-editorial-xs">
              {[
                { value: '', label: t('viz.allSubjects'), icon: Layers },
                { value: 'math', label: t('viz.mathematics'), icon: BookOpen },
                { value: 'physics', label: t('viz.physicsLabel'), icon: Atom },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setSubject(s.value)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all duration-200 ${
                    subject === s.value
                      ? 'bg-clay text-surface shadow-lg shadow-clay/20 scale-[0.97]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="max-w-grid mx-auto px-6 -mt-6 relative z-20">
        <div className="glass-card p-5 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, label: t('viz.totalVisualizations'), value: items.length, color: 'text-clay' },
              { icon: BookOpen, label: t('viz.mathematics'), value: mathCount, color: 'text-blue-400' },
              { icon: Atom, label: t('viz.physicsLabel'), value: physicsCount, color: 'text-green-400' },
              { icon: TrendingUp, label: t('viz.popular'), value: items.filter((v: any) => v.viewCount > 100).length, color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 group/stat cursor-default">
                <div className={`w-10 h-10 rounded-editorial-xs flex items-center justify-center bg-surface-container-high ${stat.color} group-hover/stat:scale-110 transition-transform duration-200`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-display-xs text-on-surface font-bold tabular-nums">{stat.value}</div>
                  <div className="text-caption-sm text-on-surface-variant">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-grid mx-auto px-6 py-section-sm">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-editorial overflow-hidden bg-surface-container-high border border-outline-variant">
                <Skeleton className="h-48 rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 animate-fade-up">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-clay/10 to-tertiary/10 rounded-[2rem] blur-2xl" />
              <div className="relative w-28 h-28 rounded-[2rem] bg-surface-container-high border border-outline-variant flex items-center justify-center">
                <BarChart3 className="h-14 w-14 text-ink-faint" />
              </div>
            </div>
            <h2 className="font-display text-display-md text-on-surface mb-2">{t('viz.noViz')}</h2>
            <p className="text-body text-on-surface-variant mb-6 max-w-md mx-auto">{t('viz.noVizDesc')}</p>
            <Link href="/admin/visualizations/create">
              <Button className="gap-2 rounded-editorial-xs">
                <Plus className="h-4 w-4" />
                {t('viz.createFirst')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {items.map((viz: any, idx: number) => (
              <Link
                key={viz.id}
                href={`/visualizations/${viz.id}`}
                className="group block animate-fade-up"
                style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
              >
                <Card className="relative border-0 bg-surface-container-high hover:bg-surface-container-highest shadow-card hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 h-full overflow-hidden hover:-translate-y-1">
                  {/* Image area with grid-line texture */}
                  <div className="aspect-video relative overflow-hidden">
                    {/* Grid-line texture overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.04] z-0"
                      style={{
                        backgroundImage: 'linear-gradient(rgba(175,198,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(175,198,255,0.3) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                      aria-hidden="true"
                    />
                    {viz.featuredImage ? (
                      <img
                        src={viz.featuredImage}
                        alt={viz.title}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-out relative z-10"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest z-10">
                        {viz.subject === 'math' ? (
                          <BookOpen className="h-14 w-14 text-on-surface-variant/20" />
                        ) : (
                          <Atom className="h-14 w-14 text-on-surface-variant/20" />
                        )}
                      </div>
                    )}
                    {/* Hover play overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 z-20">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-clay text-surface text-body-sm font-medium shadow-lg shadow-clay/20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Play className="h-4 w-4 fill-current" />
                        {t('viz.viewInteract')}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5 relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-caption-sm font-medium px-2.5 py-1 rounded-pill ${
                        viz.subject === 'math'
                          ? 'bg-blue-400/10 text-blue-300 border border-blue-400/20'
                          : 'bg-green-400/10 text-green-300 border border-green-400/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${viz.subject === 'math' ? 'bg-blue-400' : 'bg-green-400'}`} />
                        {viz.subject === 'math' ? t('viz.mathematics') : t('viz.physicsLabel')}
                      </span>
                      {viz.aiGenerated && (
                        <span className="inline-flex items-center gap-1 text-caption-sm text-clay/70">
                          <Sparkles className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-display-xs text-on-surface group-hover:text-clay transition-colors duration-200 line-clamp-2 mb-2">
                      {viz.title}
                    </h3>

                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                      {viz.introduction || viz.description || viz.prompt}
                    </p>

                    <div className="flex items-center gap-4 text-caption-sm text-on-surface-variant/60 pt-3 border-t border-outline-variant/50">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{viz.viewCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[80px]">{viz.author?.displayName || viz.author?.username}</span>
                      </span>
                      <span className="flex items-center gap-1.5 ml-auto">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{new Date(viz.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="max-w-grid mx-auto px-6 pb-section">
        <div className="relative overflow-hidden rounded-editorial bg-gradient-to-br from-clay-dark via-clay to-tertiary p-8 sm:p-12 text-surface animate-fade-up" style={{ animationDelay: '0.6s' }}>
          {/* Floating geometric shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20" aria-hidden="true">
            <div className="absolute top-8 right-12 w-24 h-24 border-2 border-white/20 rounded-2xl rotate-12 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-20 right-32 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute top-4 right-40 w-8 h-8 border border-white/15 rotate-45 animate-pulse" style={{ animationDuration: '10s' }} />
          </div>
          <div className="absolute bottom-0 left-0 w-48 h-48 opacity-15" aria-hidden="true">
            <div className="absolute bottom-6 left-8 w-20 h-20 border-2 border-white/20 rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
            <div className="absolute bottom-16 left-20 w-12 h-12 bg-white/10 rounded-xl -rotate-12 animate-pulse" style={{ animationDuration: '9s' }} />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-lg">
              <h2 className="font-display text-display-sm mb-2 flex items-center gap-2">
                <Zap className="h-6 w-6" />
                {t('viz.createYourOwn')}
              </h2>
              <p className="text-body text-surface/70">
                {t('viz.createYourOwnDesc')}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/visualizations">
                <Button variant="outline" size="lg" className="gap-2 rounded-editorial-xs border-white/20 text-surface hover:bg-white/10">
                  {t('viz.browseAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/visualizations/create">
                <Button size="lg" className="gap-2 rounded-editorial-xs bg-white text-clay-dark hover:bg-white/90 shadow-lg">
                  <Plus className="h-4 w-4" />
                  {t('viz.startCreating')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Inject floating particle keyframes */}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          25% { transform: translateY(-10px) translateX(5px); opacity: 0.4; }
          50% { transform: translateY(-5px) translateX(-3px); opacity: 0.25; }
          75% { transform: translateY(-15px) translateX(8px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
