'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { visualizations } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Eye, MousePointerClick, BookOpen, Atom } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#c84b31', '#2d5a5a', '#8a8478', '#e8c4b5', '#3d7a7a'];

export function VisualizationStatsOverview() {
  const t = useTranslations();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    visualizations.getAggregatedStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-editorial" />
        <Skeleton className="h-64 rounded-editorial" />
      </div>
    );
  }

  if (!stats) return null;

  const subjectData = (stats.bySubject || []).map((s: any) => ({
    name: s.subject === 'math' ? '📐 Math' : '⚛️ Physics',
    value: s._count,
  }));

  const timelineData = (stats.recent30Days || []).map((d: any) => ({
    date: d.date,
    events: Number(d.count),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('viz.totalVisualizations'), value: stats.totalVisualizations, icon: BarChart3, color: 'text-clay' },
          { label: t('viz.totalViewsCard'), value: stats.totalViews, icon: Eye, color: 'text-teal' },
          { label: t('viz.totalInteractions'), value: stats.totalInteracts, icon: MousePointerClick, color: 'text-ink-soft' },
          { label: t('viz.bySubject'), value: (subjectData.find((s: any) => s.name.includes('Math'))?.value || 0) + ' / ' + (subjectData.find((s: any) => s.name.includes('Physics'))?.value || 0), icon: BookOpen, color: 'text-ink-muted' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-caption-sm text-ink-muted font-normal">{item.label}</CardTitle>
                <Icon className={`h-4 w-4 ${item.color} opacity-60`} />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-md text-ink">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject distribution */}
        <Card className="border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-body-sm font-medium">{t('viz.bySubject')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {subjectData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-body-sm text-ink-muted text-center py-8">{t('viz.noDataYet')}</p>
            )}
          </CardContent>
        </Card>

        {/* 30-day timeline */}
        <Card className="border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-body-sm font-medium">{t('viz.last30DaysActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#8a8478" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#8a8478" />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#c84b31" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-body-sm text-ink-muted text-center py-8">{t('viz.noActivity')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
