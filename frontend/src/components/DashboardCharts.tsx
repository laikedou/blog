'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#c84b31', '#2d5a5a', '#d99a82', '#8a8478', '#5a5248', '#e8c4b5', '#3d7a7a', '#1c1814'];

interface TimelineItem {
  date: string;
  published: number;
  draft: number;
}

interface CategoryItem {
  name: string;
  color: string;
  count: number;
}

interface TopPost {
  title: string;
  viewCount: number;
  slug: string;
}

interface DashboardChartsProps {
  postsTimeline: TimelineItem[];
  categoryDistribution: CategoryItem[];
  topPosts: TopPost[];
}

export function PostsTimelineChart({ data }: { data: TimelineItem[] }) {
  const t = useTranslations();
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-surface rounded-editorial border border-border shadow-card p-6">
      <h3 className="text-body-sm font-medium text-ink mb-4">{t('common.postsTimeline')}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d8" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#8a8478" />
          <YAxis tick={{ fontSize: 11 }} stroke="#8a8478" allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="published" stroke="#c84b31" strokeWidth={2} name={t('common.published')} dot={false} />
          <Line type="monotone" dataKey="draft" stroke="#8a8478" strokeWidth={2} name={t('common.draftStatus')} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: CategoryItem[] }) {
  const t = useTranslations();
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-surface rounded-editorial border border-border shadow-card p-6">
      <h3 className="text-body-sm font-medium text-ink mb-4">{t('common.postsByCategory')}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={45}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopPostsChart({ data }: { data: TopPost[] }) {
  const t = useTranslations();
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-surface rounded-editorial border border-border shadow-card p-6">
      <h3 className="text-body-sm font-medium text-ink mb-4">{t('common.topPostsByViews')}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d8" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8a8478" />
          <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} stroke="#8a8478" width={180} />
          <Tooltip />
          <Bar dataKey="viewCount" fill="#c84b31" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
