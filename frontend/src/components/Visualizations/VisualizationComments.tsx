'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { visualizations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { VisualizationComment } from '@/types';

interface Props {
  visualizationId: number;
}

export default function VisualizationComments({ visualizationId }: Props) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<VisualizationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchComments = () => {
    setLoading(true);
    visualizations.getComments(visualizationId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [visualizationId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await visualizations.createComment(visualizationId, { content: newComment.trim() });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success(t('viz.commentPosted'));
    } catch {
      toast.error(t('viz.commentFailed'));
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const comment = await visualizations.createComment(visualizationId, { content: replyContent.trim(), parentId });
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c
      ));
      setReplyContent('');
      setReplyTo(null);
      toast.success(t('viz.replyPosted'));
    } catch {
      toast.error(t('viz.replyFailed'));
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: number) => {
    setDeleting(commentId);
    try {
      await visualizations.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success(t('viz.commentDeleted'));
    } catch {
      toast.error(t('viz.commentDeleteFailed'));
    }
    setDeleting(null);
  };

  const canDelete = (authorId: number) => isAuthenticated && user?.id === authorId;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-ink-muted" />
        <h3 className="font-display text-display-sm text-ink">{t('viz.commentsTitle', { count: comments.length })}</h3>
      </div>

      {isAuthenticated ? (
        <div className="mb-8 space-y-3">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={t('viz.commentPlaceholder')}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()} size="sm">
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('viz.postComment')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-cream-100 rounded-editorial-xs text-center text-body-sm text-ink-muted border border-border">
          <a href="/login" className="text-clay hover:underline">{t('viz.signInToComment')}</a>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-8 w-8 rounded-full bg-cream-300 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-cream-300 rounded" />
                <div className="h-4 w-full bg-cream-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-ink-muted">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-body-sm">{t('viz.noComments')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="border-b border-border pb-5 last:border-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-caption-sm bg-clay text-white">
                    {comment.author.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body-sm font-medium text-ink">{comment.author.displayName}</span>
                    <span className="text-caption-sm text-ink-muted">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-body-sm text-ink-soft whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {isAuthenticated && (
                      <button
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="text-caption-sm text-ink-muted hover:text-clay transition-colors"
                      >
                        {t('viz.reply')}
                      </button>
                    )}
                    {canDelete(comment.authorId) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleting === comment.id}
                        className="text-caption-sm text-ink-muted hover:text-red-500 transition-colors"
                      >
                        {deleting === comment.id ? <Loader2 className="h-3 w-3 inline animate-spin" /> : <Trash2 className="h-3 w-3 inline" />}
                        {t('viz.deleteComment')}
                      </button>
                    )}
                  </div>

                  {replyTo === comment.id && (
                    <div className="mt-3 ml-4 space-y-2">
                      <Textarea
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        placeholder={t('viz.replyPlaceholder')}
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => { setReplyTo(null); setReplyContent(''); }}>{t('common.cancel')}</Button>
                        <Button size="sm" onClick={() => handleReply(comment.id)} disabled={submitting || !replyContent.trim()}>
                          {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {t('viz.reply')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-4 space-y-4 border-l-2 border-border pl-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-caption-sm bg-clay text-white text-[10px]">
                              {reply.author.displayName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-caption-sm font-medium text-ink">{reply.author.displayName}</span>
                              <span className="text-caption-sm text-ink-muted">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-body-sm text-ink-soft">{reply.content}</p>
                            {canDelete(reply.authorId) && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                className="text-caption-sm text-ink-muted hover:text-red-500 transition-colors mt-1"
                              >
                                {t('viz.deleteComment')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
