'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { animate, stagger } from 'animejs';
import { stats as statsApi } from '@/lib/api';
import { PostsTimelineChart, CategoryPieChart, TopPostsChart } from '@/components/DashboardCharts';
import { VisualizationStatsOverview } from '@/components/Visualizations/VisualizationStats';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    statsApi.dashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && cardsRef.current) {
      animate(cardsRef.current.children, {
        opacity: [0, 1],
        translateY: [15, 0],
        easing: 'easeOutCubic',
        duration: 500,
        delay: stagger(80),
      });
    }
  }, [loading]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-[34px] w-48 bg-surface-container-high animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-surface-container-high animate-pulse rounded" />
                  <div className="h-10 w-24 bg-surface-container-high animate-pulse rounded" />
                </div>
                <div className="h-10 w-10 bg-surface-container-high animate-pulse rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const overview = data?.overview || {};
  const statCards = [
    {
      label: t('admin.totalPosts'),
      value: overview.totalPosts,
      icon: 'description',
      href: '/admin/posts',
      iconBg: 'bg-primary/10 text-primary',
      svgClass: 'text-primary',
      path: 'M0,30 L0,15 C20,25 40,5 60,10 C80,15 90,5 100,0 L100,30 Z',
    },
    {
      label: t('admin.published'),
      value: overview.totalPublished,
      icon: 'publish',
      href: '/admin/posts?status=published',
      iconBg: 'bg-tertiary/10 text-tertiary',
      svgClass: 'text-tertiary',
      path: 'M0,30 L0,20 C20,20 40,10 60,15 C80,20 90,10 100,5 L100,30 Z',
    },
    {
      label: t('admin.comments'),
      value: overview.totalComments,
      icon: 'forum',
      href: '/admin/comments',
      iconBg: 'bg-secondary/10 text-secondary',
      svgClass: 'text-secondary',
      path: 'M0,30 L0,5 C20,15 40,10 60,20 C80,15 90,25 100,20 L100,30 Z',
    },
    {
      label: t('admin.totalViews'),
      value: overview.totalViews,
      icon: 'visibility',
      href: '/admin/posts',
      iconBg: 'bg-primary-container/10 text-primary-container',
      svgClass: 'text-primary-container',
      path: 'M0,30 L0,25 C20,15 40,25 60,10 C80,0 90,15 100,5 L100,30 Z',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.dashboard')}</h1>

      {/* Stats cards */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {statCards.map(card => (
          <Link key={card.label} href={card.href} className="block group">
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                    <h3 className="text-display-lg font-display-lg text-on-surface mt-2">{card.value ?? '—'}</h3>
                  </div>
                  <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                    <span className="material-symbols-outlined">{card.icon}</span>
                  </div>
                </div>
                {/* Decorative SVG chart */}
                <div className="absolute bottom-0 left-0 w-full h-16 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                  <svg className={`w-full h-full ${card.svgClass} fill-current stroke-current`} preserveAspectRatio="none" viewBox="0 0 100 30">
                    <path d={card.path} fillOpacity="0.2" strokeWidth="1" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts row 1: Posts Timeline + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <PostsTimelineChart data={data?.postsTimeline || []} />
        <CategoryPieChart data={data?.categoryDistribution || []} />
      </div>

      {/* Charts row 2: Top Posts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <TopPostsChart data={data?.topPosts || []} />
        <Card>
          <CardContent className="p-6">
            <h2 className="text-headline-md font-headline-md text-on-surface mb-6">{t('admin.recentActivity')}</h2>
            <div className="space-y-4">
              <p className="text-body-md text-on-surface">{t('admin.viewsLast30Days', { count: overview.recent30DaysViews || 0 })}</p>
              <p className="text-body-md text-on-surface-variant">{t('admin.registeredUsers', { count: overview.totalUsers || 0 })}</p>
              <p className="text-body-md text-on-surface-variant">{t('admin.draftsWaiting', { count: overview.totalDrafts || 0 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Analytics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-md font-headline-md text-on-surface">{t('admin.visualizationAnalytics')}</h2>
          <Link
            href="/admin/visualizations/stats"
            className="flex items-center gap-1 text-body-sm text-primary hover:text-primary/80 transition-colors"
          >
            {t('admin.viewDetails')}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <VisualizationStatsOverview />
      </div>
    </div>
  );
}
