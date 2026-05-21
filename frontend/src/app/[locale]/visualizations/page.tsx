'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { Search, BarChart3, BookOpen, Atom, Play, Clock, User, Eye } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-cream-200">
      {/* Hero */}
      <div className="bg-surface-tile text-white py-section">
        <div className="max-w-grid mx-auto px-6">
          <h1 className="font-display text-display-xl mb-4">{t('viz.interactiveLearning')}</h1>
          <p className="text-lead text-white/60 max-w-reading">{t('viz.subtitle')}</p>

          {/* Search & filter */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('viz.searchPlaceholder')}
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: '', label: t('viz.allSubjects') },
                { value: 'math', label: `📐 ${t('viz.mathematics')}` },
                { value: 'physics', label: `⚛️ ${t('viz.physicsLabel')}` },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setSubject(s.value)}
                  className={`px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all ${
                    subject === s.value
                      ? 'bg-white text-ink'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-grid mx-auto px-6 py-section-sm">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Skeleton key={i} className="h-64 rounded-editorial" />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-20">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-ink-faint" />
            <h2 className="font-display text-display-md text-ink mb-2">{t('viz.noViz')}</h2>
            <p className="text-body text-ink-muted">{t('viz.noVizDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((viz: any) => (
              <Link key={viz.id} href={`/visualizations/${viz.id}`} className="group block">
                <Card className="border-border shadow-card group-hover:shadow-card-hover transition-all h-full overflow-hidden">
                  <div className="aspect-video bg-cream-300 relative overflow-hidden">
                    {viz.featuredImage ? (
                      <img
                        src={viz.featuredImage}
                        alt={viz.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : viz.subject === 'math' ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-ink-faint" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Atom className="h-16 w-16 text-ink-faint" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-body-sm font-medium flex items-center gap-1">
                        <Play className="h-4 w-4" /> {t('viz.viewInteract')}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-caption-sm font-medium px-2 py-0.5 rounded-pill bg-cream-300 text-ink-muted">
                        {viz.subject === 'math' ? `📐 ${t('viz.mathematics')}` : `⚛️ ${t('viz.physicsLabel')}`}
                      </span>
                    </div>
                    <h3 className="font-display text-display-sm text-ink group-hover:text-clay transition-colors line-clamp-2">
                      {viz.title}
                    </h3>
                    <p className="text-body-sm text-ink-muted mt-2 line-clamp-2">
                      {viz.introduction || viz.description || viz.prompt}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-caption-sm text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {viz.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {viz.author?.displayName || viz.author?.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(viz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
