'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { animate, stagger } from 'animejs';
import { stats as statsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PostsTimelineChart, CategoryPieChart, TopPostsChart } from '@/components/DashboardCharts';
import { VisualizationStatsOverview } from '@/components/Visualizations/VisualizationStats';
import { ArrowRight, Eye, MessageSquare, FileText, Users, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
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
      <Skeleton className="h-[34px] w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-editorial" />)}
      </div>
    </div>
  );

  const overview = data?.overview || {};
  const cards = [
    { label: 'Total Posts', value: overview.totalPosts, icon: FileText, href: '/admin/posts', color: 'text-clay' },
    { label: 'Published', value: overview.totalPublished, icon: FileText, href: '/admin/posts?status=published', color: 'text-teal' },
    { label: 'Comments', value: overview.totalComments, icon: MessageSquare, href: '/admin/comments', color: 'text-ink-soft' },
    { label: 'Total Views', value: overview.totalViews, icon: Eye, href: '/admin/posts', color: 'text-ink' },
  ];

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="block group">
              <Card className="border-border shadow-card group-hover:shadow-card-hover transition-all">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-body-sm text-ink-muted font-normal">{card.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${card.color} opacity-60`} />
                </CardHeader>
                <CardContent>
                  <p className="font-display text-display-lg text-ink">{card.value ?? '—'}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PostsTimelineChart data={data?.postsTimeline || []} />
        <CategoryPieChart data={data?.categoryDistribution || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopPostsChart data={data?.topPosts || []} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle className="text-body-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center text-body-sm text-ink-muted">
            <p className="text-ink-soft">{overview.recent30DaysViews || 0} views in the last 30 days</p>
            <p className="mt-2 text-ink-muted">{overview.totalUsers || 0} registered users</p>
            <p className="text-ink-muted">{overview.totalDrafts || 0} drafts waiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Analytics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-display-sm text-ink">Visualization Analytics</h2>
          <Link href="/admin/visualizations/stats" className="text-body-sm text-clay hover:text-clay-dark transition-colors">
            View Details →
          </Link>
        </div>
        <VisualizationStatsOverview />
      </div>
    </div>
  );
}
