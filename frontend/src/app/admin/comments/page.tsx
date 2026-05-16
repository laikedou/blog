'use client';

import { useState, useEffect } from 'react';
import { comments as commentsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Check, Flag } from 'lucide-react';
import { useConfirm } from '@/lib/confirm-dialog';
import { toast } from 'sonner';

export default function AdminCommentsPage() {
  const { confirm } = useConfirm();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComments = () => {
    setLoading(true);
    commentsApi.list({ page, limit: 20 })
      .then(res => { setComments(res.data); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchComments(); }, [page]);

  const deleteComment = async (id: number) => {
    const ok = await confirm({ title: 'Delete Comment', message: 'Delete this comment permanently?', confirmLabel: 'Delete', variant: 'destructive' });
    if (!ok) return;
    await commentsApi.delete(id);
    toast.success('Comment deleted');
    fetchComments();
  };

  const updateStatus = async (id: number, status: string) => {
    await commentsApi.update(id, { status });
    toast.success(`Comment ${status === 'approved' ? 'approved' : 'marked as spam'}`);
    fetchComments();
  };

  const statusVariant = (s: string) => s === 'approved' ? 'default' as const : s === 'pending' ? 'secondary' as const : 'destructive' as const;

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">Comments</h1>
      <Card>
        {loading ? (
          <CardContent className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</CardContent>
        ) : comments.length === 0 ? (
          <CardContent className="p-10 text-center"><p className="text-body text-ink-muted">No comments yet</p></CardContent>
        ) : (
          comments.map((comment: any, i: number) => (
            <div key={comment.id} className={`p-6 hover:bg-cream-200/50 transition-colors ${i < comments.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-body-sm font-medium text-ink">{comment.author?.displayName}</span>
                    <span className="text-body-sm text-ink-muted">{new Date(comment.createdAt).toLocaleString()}</span>
                    <Badge variant={statusVariant(comment.status)} className="text-caption-sm">{comment.status}</Badge>
                  </div>
                  <p className="text-body text-ink-soft mb-1">{comment.content}</p>
                  <p className="text-body-sm text-ink-muted">On: <span className="text-clay">{comment.post?.title || `Post #${comment.postId}`}</span></p>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  {comment.status !== 'approved' && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(comment.id, 'approved')}><Check className="h-4 w-4 text-teal" /></Button>
                  )}
                  {comment.status !== 'spam' && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(comment.id, 'spam')}><Flag className="h-4 w-4 text-ink-muted" /></Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteComment(comment.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Prev</Button>
            <span className="text-body-sm text-ink-muted self-center">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
