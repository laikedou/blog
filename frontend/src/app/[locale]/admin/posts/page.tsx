'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { posts as postsApi } from '@/lib/api';
import { useConfirm } from '@/lib/confirm-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function AdminPostsPage() {
  const t = useTranslations();
  const { confirm } = useConfirm();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPosts = () => {
    setLoading(true);
    postsApi.list({ page, limit: 10, status: statusFilter || undefined })
      .then(res => { setPosts(res.data); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [page, statusFilter]);

  const deletePost = async (id: number) => {
    const ok = await confirm({ title: t('admin.deletePost'), message: t('admin.confirmDeletePost'), confirmLabel: t('common.delete'), variant: 'destructive' });
    if (!ok) return;
    await postsApi.delete(id);
    toast.success(t('admin.postDeleted'));
    fetchPosts();
  };

  return (
    <div className="relative">
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-margin-md gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight flex items-center gap-3">
              {t('admin.posts')}
              <Badge variant="outline" className="bg-primary-container/20 text-primary border-primary/20">
                {posts.length}
              </Badge>
            </h2>
          </div>
          <Link href="/admin/posts/new">
            <Button>
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t('admin.newPost')}
            </Button>
          </Link>
        </div>

        {/* Main Card Container */}
        <Card className="overflow-hidden">
          {/* Filter Tabs - Segmented Control */}
          <div className="p-5 border-b border-border bg-surface-container/30">
            <div className="flex bg-surface-container-highest/50 p-1 rounded-lg border border-border w-fit">
              {['', 'published', 'draft'].map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-4 py-1.5 rounded-md font-label-md text-label-md font-medium transition-all relative ${
                    statusFilter === s
                      ? 'bg-surface border border-border shadow-sm text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {statusFilter === s && (
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-primary/30" />
                  )}
                  {s ? t(`admin.${s}`) : t('admin.all')}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 w-full rounded-lg bg-surface-container-highest/30 animate-pulse" />
              ))}
            </div>
          ) : (
            /* Posts Table or Empty State */
            posts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-body-sm text-on-surface-variant">{t('admin.noPostsFound')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">{t('admin.tableTitle')}</TableHead>
                      <TableHead className="font-semibold">{t('admin.tableAuthor')}</TableHead>
                      <TableHead className="font-semibold">{t('admin.tableDate')}</TableHead>
                      <TableHead className="font-semibold">{t('admin.tableStatus')}</TableHead>
                      <TableHead className="font-semibold text-right">{t('admin.tableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post: any) => (
                      <TableRow key={post.id} className="group cursor-default">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-container border border-border flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-outline text-[16px]">article</span>
                            </div>
                            <div>
                              <Link
                                href={`/admin/posts/${post.id}/edit`}
                                className="font-medium text-on-surface hover:text-primary transition-colors truncate max-w-[250px] lg:max-w-[400px] block"
                              >
                                {post.title}
                              </Link>
                              {post.viewCount > 0 && (
                                <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant text-xs">
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">visibility</span>
                                    <span>{t('admin.views', { count: post.viewCount })}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-on-surface-variant">
                          {post.author?.displayName}
                        </TableCell>
                        <TableCell className="text-on-surface-variant">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {post.status === 'published' ? (
                            <Badge variant="outline" className="bg-tertiary-container/10 border-tertiary-fixed-dim/30 text-tertiary-fixed-dim">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim mr-1" />
                              {post.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-surface-variant border-outline-variant/30 text-outline">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline mr-1" />
                              {post.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/posts/${post.id}/edit`}>
                              <Button variant="ghost" size="icon" title={t('admin.edit')}>
                                <span className="material-symbols-outlined text-[18px]">edit_square</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePost(post.id)}
                              title={t('admin.delete')}
                              className="text-on-surface-variant hover:text-error"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}

          {/* Modern Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border bg-surface-container-lowest/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-body-sm font-body-sm text-on-surface-variant">
                Page <span className="text-on-surface font-medium">{page}</span> of <span className="text-on-surface font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page === 1}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  {t('common.previous')}
                </Button>
                <span className="flex items-center gap-1 px-3">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                    return start + i;
                  }).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md font-label-md text-label-md transition-colors ${
                        page === p
                          ? 'bg-primary/10 text-primary border border-primary/20 font-medium'
                          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
                  disabled={page === totalPages}
                >
                  {t('common.next')}
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
