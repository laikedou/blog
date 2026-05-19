'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { comments as commentsApi, visualizations } from '@/lib/api';
import { useConfirm } from '@/lib/confirm-dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/lib/markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminCommentsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [source, setSource] = useState<'posts' | 'visualizations'>('posts');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = () => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 20 };
    if (statusFilter !== 'all') params.status = statusFilter;

    const fetcher = source === 'posts'
      ? commentsApi.list(params)
      : visualizations.listVizComments(params);

    fetcher
      .then(res => { setComments(res.data); setTotalPages(res.totalPages); })
      .catch(() => toast.error(t('admin.failedLoadComments')))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchComments(); setSelectedIds(new Set()); }, [page, statusFilter, source]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === comments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments.map(c => c.id)));
    }
  };

  const deleteComment = async (id: number) => {
    const ok = await confirm({ title: t('admin.deleteComment'), message: t('admin.confirmDeleteComment'), confirmLabel: t('common.delete'), variant: 'destructive' });
    if (!ok) return;
    if (source === 'posts') await commentsApi.delete(id);
    else await visualizations.deleteVizComment(id);
    toast.success(t('admin.commentDeleted'));
    fetchComments();
  };

  const updateStatus = async (id: number, status: string) => {
    if (source === 'posts') await commentsApi.update(id, { status });
    else await visualizations.updateVizComment(id, { status });
    toast.success(status === 'approved' ? t('admin.commentApproved') : t('admin.commentMarkedSpam'));
    fetchComments();
  };

  const handleBulkUpdateStatus = async (status: string) => {
    const ids = Array.from(selectedIds);
    if (source === 'posts') await commentsApi.batchUpdateStatus(ids, status);
    else await visualizations.batchUpdateVizCommentStatus(ids, status);
    toast.success(t('admin.bulkActionComplete'));
    setSelectedIds(new Set());
    fetchComments();
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({ title: t('admin.bulkDelete'), message: t('admin.confirmBulkDelete', { count: selectedIds.size }), confirmLabel: t('common.delete'), variant: 'destructive' });
    if (!ok) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      if (source === 'posts') await commentsApi.delete(id);
      else await visualizations.deleteVizComment(id);
    }
    toast.success(t('admin.bulkActionComplete'));
    setSelectedIds(new Set());
    fetchComments();
  };

  const saveEdit = async (id: number) => {
    if (!editContent.trim()) return;
    if (source === 'posts') await commentsApi.update(id, { content: editContent });
    else await visualizations.updateVizComment(id, { content: editContent });
    toast.success(t('admin.commentUpdated'));
    setEditingId(null);
    fetchComments();
  };

  const statusVariant = (s: string) => {
    if (s === 'approved') return 'bg-white/5 text-on-surface-variant border border-border';
    if (s === 'pending') return 'bg-tertiary/10 text-tertiary border border-tertiary/20';
    return 'bg-error/10 text-error border border-error/20';
  };

  const pendingCount = comments.filter((c: any) => c.status === 'pending').length;
  const approvedCount = comments.filter((c: any) => c.status === 'approved').length;
  const spamCount = comments.filter((c: any) => c.status === 'spam').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface font-semibold tracking-tight mb-1">
            {t('admin.comments')}
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            Review, moderate, and engage with community feedback across your content.
          </p>
        </div>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setSource('posts'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
            source === 'posts' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-on-surface border border-transparent hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">article</span>
          {t('admin.postComments')}
        </button>
        <button
          onClick={() => { setSource('visualizations'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
            source === 'visualizations' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-on-surface border border-transparent hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">function</span>
          {t('admin.vizComments')}
        </button>
      </div>

      {/* Filters & Controls Panel */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'spam'].map(s => (
              <Badge
                key={s}
                variant="outline"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`cursor-pointer transition-colors ${
                  statusFilter === s
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                {s === 'all' ? t('admin.all') : s === 'pending' ? t('admin.pending') : s === 'approved' ? t('admin.approved') : t('admin.spam')}
                <span className={`px-1.5 rounded text-[10px] leading-none ml-1 ${
                  s === 'pending' ? 'bg-tertiary/20 text-tertiary' : s === 'spam' ? 'bg-error/20 text-error' : 'bg-white/10'
                }`}>
                  {s === 'all' ? comments.length : s === 'pending' ? pendingCount : s === 'approved' ? approvedCount : spamCount}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="sticky top-0 z-20 p-3 rounded-xl flex items-center justify-between"
          style={{
            background: 'rgba(34, 42, 61, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span className="font-label-md text-label-md text-on-surface">{t('admin.nSelected', { count: selectedIds.size })}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              {t('common.deselect')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkUpdateStatus('approved')}>
              <span className="material-symbols-outlined text-[14px] mr-1">check</span>
              {t('admin.approve')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkUpdateStatus('spam')}>
              <span className="material-symbols-outlined text-[14px] mr-1">block</span>
              {t('admin.markSpam')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-error hover:bg-error/10">
              <span className="material-symbols-outlined text-[14px] mr-1">delete</span>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      )}

      {/* Select All */}
      {comments.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            checked={selectedIds.size === comments.length && comments.length > 0}
            onChange={toggleSelectAll}
            className="appearance-none bg-black/20 border border-white/20 rounded w-[18px] h-[18px] checked:bg-primary checked:border-primary relative cursor-pointer
              checked:after:absolute checked:after:top-[2px] checked:after:left-[6px] checked:after:w-[4px] checked:after:h-[10px]
              checked:after:border-r-2 checked:after:border-b-2 checked:after:border-on-primary checked:after:rotate-45
              transition-colors duration-150"
          />
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {selectedIds.size > 0 ? t('admin.nSelected', { count: selectedIds.size }) : t('admin.selectAll')}
          </span>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="pt-1">
                    <div className="w-[18px] h-[18px] rounded bg-surface-container-high/50" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface-container-high/50 mt-1 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-surface-container-high/50 rounded w-1/3" />
                    <div className="h-3 bg-surface-container-high/50 rounded w-2/3" />
                    <div className="h-3 bg-surface-container-high/50 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">forum</span>
              <p className="text-body-md text-on-surface-variant">{t('admin.noCommentsYet')}</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment: any) => (
            <Card
              key={comment.id}
              className={`group relative overflow-hidden border-l-2 transition-all duration-300 ${
                comment.status === 'pending'
                  ? 'border-l-tertiary'
                  : comment.status === 'spam'
                    ? 'border-l-error'
                    : 'border-l-border'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <div className="pt-1 flex flex-col items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(comment.id)}
                      onChange={() => toggleSelect(comment.id)}
                      className="appearance-none bg-black/20 border border-white/20 rounded w-[18px] h-[18px] checked:bg-primary checked:border-primary relative cursor-pointer
                        checked:after:absolute checked:after:top-[2px] checked:after:left-[6px] checked:after:w-[4px] checked:after:h-[10px]
                        checked:after:border-r-2 checked:after:border-b-2 checked:after:border-on-primary checked:after:rotate-45
                        transition-colors duration-150"
                    />
                  </div>

                  {/* Avatar */}
                  {comment.status === 'spam' ? (
                    <div className="w-10 h-10 rounded-full border border-error/30 bg-error/10 flex items-center justify-center mt-1 shrink-0">
                      <span className="material-symbols-outlined text-error text-lg">person_off</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-border bg-surface-container-high flex items-center justify-center mt-1 shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-label-md text-on-surface font-semibold">
                            {comment.author?.displayName || 'Anonymous'}
                          </span>
                          <span className="text-label-sm text-on-surface-variant/60">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider ${statusVariant(comment.status)}`}>
                            {comment.status.toUpperCase()}
                          </span>
                        </div>
                        {/* Post / Visualization reference */}
                        <div className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] opacity-70">subdirectory_arrow_right</span>
                          {source === 'posts' ? (
                            <>{t('admin.onPost')}: <span className="text-primary hover:underline cursor-default">{comment.post?.title || `Post #${comment.postId}`}</span></>
                          ) : (
                            <>{t('admin.onVisualization')}: <span className="text-primary hover:underline cursor-default">{comment.visualization?.title || `Viz #${comment.visualizationId}`}</span></>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content text */}
                    {editingId === comment.id ? (
                      <div className="mb-4 pr-12 space-y-2">
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="w-full bg-black/20 border border-primary/30 rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(comment.id)}>
                            <span className="material-symbols-outlined text-[14px] mr-1">save</span>
                            {t('common.save')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`text-body-sm leading-relaxed mb-4 pr-12 ${
                          comment.status === 'spam'
                            ? 'text-on-surface-variant/70 italic line-through decoration-error/50'
                            : 'text-on-surface/90'
                        }`}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{comment.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* Hover-reveal action buttons */}
                    <div
                      className="opacity-0 translate-y-[10px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300
                        flex items-center gap-2 absolute bottom-5 right-5 bg-surface/80 backdrop-blur-md p-1.5 rounded-lg border border-border shadow-lg"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                        className="text-on-surface-variant hover:text-on-surface"
                        title={t('common.edit')}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </Button>
                      {comment.status !== 'approved' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatus(comment.id, 'approved')}
                          className="text-tertiary hover:bg-tertiary/20"
                          title={t('admin.approve') || 'Approve'}
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </Button>
                      )}
                      {comment.status !== 'spam' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatus(comment.id, 'spam')}
                          className="text-on-surface-variant hover:text-error hover:bg-error/20"
                          title={t('admin.markSpam') || 'Mark Spam'}
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </Button>
                      )}
                      <div className="w-px h-4 bg-border mx-0.5" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteComment(comment.id)}
                        className="text-on-surface-variant hover:text-error hover:bg-error/20"
                        title={t('common.delete')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-label-sm text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="!w-8 !h-8"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </Button>
            <Button variant="default" size="icon" className="!w-8 !h-8 !bg-primary/20 !text-primary !border-primary/30">
              {page}
            </Button>
            <span className="px-1 text-on-surface-variant/50 text-label-sm">/</span>
            <Button variant="outline" size="icon" className="!w-8 !h-8">
              {totalPages}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="!w-8 !h-8"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
