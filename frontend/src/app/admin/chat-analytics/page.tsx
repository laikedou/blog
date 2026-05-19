'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { chat as chatApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AdminChatAnalyticsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      chatApi.getStats(),
      chatApi.getFeedback(feedbackPage, 20),
    ]).then(([statsData, feedbackData]) => {
      setStats(statsData);
      setFeedback(feedbackData.data || []);
      setFeedbackTotalPages(feedbackData.totalPages || 1);
    }).catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [feedbackPage]);

  const markAsRead = async (id: number) => {
    await chatApi.markFeedbackRead(id);
    fetchData();
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-[34px] w-48 bg-surface-container-high/50 animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-container-high/50 animate-pulse rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-margin-md">{t('admin.chatAnalyticsTitle')}</h1>

      {/* Tab bar */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'stats' | 'feedback')}>
        <TabsList className="mb-6">
          <TabsTrigger value="stats">
            <span className="material-symbols-outlined text-[16px] mr-1">bar_chart</span>
            {t('admin.chatAnalyticsStats')}
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <span className="material-symbols-outlined text-[16px] mr-1">forum</span>
            {t('admin.chatAnalyticsFeedback')}
            {feedback.length > 0 && (
              <Badge variant="outline" className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                {feedback.filter(f => !f.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {stats && (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-margin-md">
                {[
                  { label: t('admin.chatAnalyticsTotalSessions'), value: stats.totalSessions, icon: 'forum', color: 'text-primary' },
                  { label: t('admin.chatAnalyticsTotalMessages'), value: stats.totalMessages, icon: 'forum', color: 'text-tertiary' },
                  { label: t('admin.chatAnalyticsMessages7d'), value: stats.recentMessages, icon: 'trending_up', color: 'text-on-surface-variant' },
                  { label: t('admin.chatAnalyticsTotalFeedback'), value: stats.totalFeedback, icon: 'rate_review', color: 'text-on-surface-variant' },
                ].map((card, i) => (
                  <Card key={i}>
                    <CardContent className="p-6 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{card.label}</span>
                        <span className={`material-symbols-outlined ${card.color} opacity-60`}>{card.icon}</span>
                      </div>
                      <p className="text-display-lg font-display-lg text-on-surface">{card.value ?? '—'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Frequently Asked Questions */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-4">{t('admin.chatAnalyticsFrequentQuestions')}</h2>
                  {stats.frequentQueries?.length > 0 ? (
                    <div className="space-y-2">
                      {stats.frequentQueries.slice(0, 15).map((q: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-body-sm text-on-surface flex-1 mr-4 truncate">{q.query}</span>
                          <Badge variant="outline" className="shrink-0">
                            {t('admin.chatAnalyticsNTimes', { count: q.count })}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body-sm text-on-surface-variant text-center py-8">{t('admin.chatAnalyticsNoData')}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-body-sm text-on-surface-variant">{t('admin.chatAnalyticsNoFeedback')}</p>
                </CardContent>
              </Card>
            ) : (
              feedback.map((item) => (
                <Card
                  key={item.id}
                  className={!item.isRead ? 'border-primary/30' : ''}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-medium text-on-surface">
                          {item.name || t('admin.chatAnalyticsAnonymous')}
                        </span>
                        {item.email && (
                          <span className="text-label-sm text-on-surface-variant">{item.email}</span>
                        )}
                        {!item.isRead && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {t('admin.chatAnalyticsNew')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm text-on-surface-variant">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {!item.isRead && (
                          <Button variant="ghost" size="icon" onClick={() => markAsRead(item.id)} title={t('admin.chatAnalyticsMarkRead')}>
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-body-md text-on-surface-variant">{item.message}</p>
                    {item.pageUrl && (
                      <p className="text-label-sm text-on-surface-variant mt-2">
                        {t('admin.chatAnalyticsFrom')} <span className="font-mono">{item.pageUrl}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}

            {feedbackTotalPages > 1 && (
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedbackPage(p => Math.max(1, p-1))}
                  disabled={feedbackPage === 1}
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  {t('common.previous')}
                </Button>
                <span className="text-body-sm text-on-surface-variant self-center">{feedbackPage} / {feedbackTotalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedbackPage(p => Math.min(feedbackTotalPages, p+1))}
                  disabled={feedbackPage === feedbackTotalPages}
                >
                  {t('common.next')}
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
