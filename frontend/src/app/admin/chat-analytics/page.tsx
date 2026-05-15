'use client';

import { useState, useEffect } from 'react';
import { chat as chatApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, TrendingUp, CheckCheck } from 'lucide-react';

export default function AdminChatAnalyticsPage() {
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
      <h1 className="font-display text-display-md text-ink mb-8">Chat Analytics</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-cream-200 p-1 rounded-editorial-sm w-fit">
        <button
          onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all ${
            tab === 'stats' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <TrendingIcon className="h-4 w-4 inline mr-1.5" />Statistics
        </button>
        <button
          onClick={() => setTab('feedback')}
          className={`px-4 py-2 rounded-editorial-xs text-body-sm font-medium transition-all ${
            tab === 'feedback' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <FeedbackIcon className="h-4 w-4 inline mr-1.5" />Feedback
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
                <CardTitle className="text-body-sm text-ink-muted font-normal">Total Sessions</CardTitle>
                <MessageSquare className="h-5 w-5 text-clay opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.totalSessions ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">Total Messages</CardTitle>
                <MessageSquare className="h-5 w-5 text-teal opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.totalMessages ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">Messages (7d)</CardTitle>
                <TrendingUp className="h-5 w-5 text-ink-soft opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-display-lg text-ink">{stats.recentMessages ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-body-sm text-ink-muted font-normal">Total Feedback</CardTitle>
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
              <CardTitle className="text-body-sm font-medium">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.frequentQueries?.length > 0 ? (
                <div className="space-y-2">
                  {stats.frequentQueries.slice(0, 15).map((q: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-body-sm text-ink flex-1 mr-4 truncate">{q.query}</span>
                      <Badge variant="secondary" className="shrink-0">{q.count} times</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-ink-muted text-center py-8">No chat data yet.</p>
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
                <p className="text-body text-ink-muted">No feedback yet.</p>
              </CardContent>
            </Card>
          ) : (
            feedback.map((item) => (
              <Card key={item.id} className={`border-border ${!item.isRead ? 'border-clay/30 bg-clay/[0.02]' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-ink">{item.name || 'Anonymous'}</span>
                      {item.email && (
                        <span className="text-caption text-ink-muted">{item.email}</span>
                      )}
                      {!item.isRead && (
                        <Badge variant="default" className="text-caption-sm">New</Badge>
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
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-body text-ink-soft">{item.message}</p>
                  {item.pageUrl && (
                    <p className="text-caption text-ink-muted mt-2">
                      From: <span className="font-mono">{item.pageUrl}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {feedbackTotalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={() => setFeedbackPage(p => Math.max(1, p-1))} disabled={feedbackPage === 1}>
                Previous
              </Button>
              <span className="text-body-sm text-ink-muted self-center">{feedbackPage} / {feedbackTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setFeedbackPage(p => Math.min(feedbackTotalPages, p+1))} disabled={feedbackPage === feedbackTotalPages}>
                Next
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
