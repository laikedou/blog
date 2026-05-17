'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { chat as chatApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, TrendingUp, CheckCheck } from 'lucide-react';

export default function AdminChatAnalyticsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'feedback'>('stats');

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
      <Skeleton className="h-[34px] w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-editorial" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">{t('admin.chatAnalyticsTitle')}</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-cream-200 p-1 rounded-editorial-sm w-fit">
        <button
          onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all ${
            tab === 'stats' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <TrendingIcon className="h-4 w-4 inline mr-1.5" />{t('admin.chatAnalyticsStats')}
        </button>
        <button
          onClick={() => setTab('feedback')}
          className={`px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all ${
            tab === 'feedback' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <FeedbackIcon className="h-4 w-4 inline mr-1.5" />{t('admin.chatAnalyticsFeedback')}
          {feedback.length > 0 && (
            <Badge variant="default" className="ml-2">{feedback.filter(f => !f.isRead).length}</Badge>
          )}
        </button>
      </div>

      {tab === 'stats' && stats && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.chatAnalyticsTotalSessions')}</CardTitle>
                <MessageSquare className="h-5 w-5 text-clay opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.totalSessions ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.chatAnalyticsTotalMessages')}</CardTitle>
                <MessageSquare className="h-5 w-5 text-teal opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.totalMessages ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.chatAnalyticsMessages7d')}</CardTitle>
                <TrendingUp className="h-5 w-5 text-ink-soft opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.recentMessages ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.chatAnalyticsTotalFeedback')}</CardTitle>
                <FeedbackIcon className="h-5 w-5 text-ink-soft opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.totalFeedback ?? '—'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Frequently Asked Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-body-sm font-medium">{t('admin.chatAnalyticsFrequentQuestions')}</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.frequentQueries?.length > 0 ? (
                <div className="space-y-2">
                  {stats.frequentQueries.slice(0, 15).map((q: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-body-sm text-ink flex-1 mr-4 truncate">{q.query}</span>
                      <Badge variant="secondary" className="shrink-0">{t('admin.chatAnalyticsNTimes', { count: q.count })}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-ink-muted text-center py-8">{t('admin.chatAnalyticsNoData')}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'feedback' && (
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-body text-ink-muted">{t('admin.chatAnalyticsNoFeedback')}</p>
              </CardContent>
            </Card>
          ) : (
            feedback.map((item) => (
              <Card key={item.id} className={`border-border ${!item.isRead ? 'border-clay/30 bg-clay/[0.02]' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-ink">{item.name || t('admin.chatAnalyticsAnonymous')}</span>
                      {item.email && (
                        <span className="text-caption text-ink-muted">{item.email}</span>
                      )}
                      {!item.isRead && (
                        <Badge variant="default" className="text-caption-sm">{t('admin.chatAnalyticsNew')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-caption text-ink-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {!item.isRead && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="text-ink-muted hover:text-clay transition-colors"
                          title={t('admin.chatAnalyticsMarkRead')}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-body text-ink-soft">{item.message}</p>
                  {item.pageUrl && (
                    <p className="text-caption text-ink-muted mt-2">
                      {t('admin.chatAnalyticsFrom')} <span className="font-mono">{item.pageUrl}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {feedbackTotalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={() => setFeedbackPage(p => Math.max(1, p-1))} disabled={feedbackPage === 1}>
                {t('common.previous')}
              </Button>
              <span className="text-body-sm text-ink-muted self-center">{feedbackPage} / {feedbackTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setFeedbackPage(p => Math.min(feedbackTotalPages, p+1))} disabled={feedbackPage === feedbackTotalPages}>
                {t('common.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrendingIcon(props: any) { return <TrendingUp {...props} />; }
function FeedbackIcon(props: any) { return <MessageSquare {...props} />; }
