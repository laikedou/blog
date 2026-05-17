'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useConfirm } from '@/lib/confirm-dialog';
import { toast } from 'sonner';
import {
  Sparkles, Edit3, Trash2, Eye, EyeOff, Search, BarChart3, Atom, FunctionSquare,
  MoreHorizontal, ExternalLink, Clock, Activity, FileJson, Loader2, Plus,
} from 'lucide-react';

interface Visualization {
  id: number;
  title: string;
  subject: string;
  status: string;
  version: number;
  viewCount: number;
  interactCount: number;
  introduction: string | null;
  description: string | null;
  prompt: string | null;
  featuredImage: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: number; username: string; displayName: string };
}

interface ListResponse {
  data: Visualization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SUBJECT_CONFIG = {
  math: { label: 'Math', icon: FunctionSquare, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  physics: { label: 'Physics', icon: Atom, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
} as const;

export default function AdminVisualizationsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const router = useRouter();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await visualizations.list({
        search: search || undefined,
        subject: subjectFilter !== 'all' ? subjectFilter : undefined,
        page,
        limit: 15,
      });
      setData(result);
    } catch {
      toast.error(t('admin.vizFailedLoadList'));
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, page, t]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchList(); }, [subjectFilter, page]);

  const handleTogglePublish = async (id: number, currentStatus: string) => {
    setTogglingId(id);
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await visualizations.publish(id, newStatus);
      toast.success(newStatus === 'published' ? t('admin.vizToastPublished') : t('admin.vizToastUnpublished'));
      setData(prev => prev ? {
        ...prev,
        data: prev.data.map(v => v.id === id ? { ...v, status: newStatus } : v),
      } : prev);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    const ok = await confirm({
      title: t('admin.vizDeleteTitle'),
      message: t('admin.vizDeleteMessage', { title }),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await visualizations.delete(id);
      toast.success(t('admin.vizToastDeleted'));
      fetchList();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* ── Sticky Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-ink">{t('admin.visualizations')}</h1>
          <p className="text-body-sm text-ink-muted mt-1">{t('admin.vizListSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => router.refresh()} className="hidden sm:flex">
            <Clock className="h-4 w-4 mr-1.5" /> {t('common.refresh')}
          </Button>
          <Link href="/admin/visualizations/create">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-1.5" /> {t('admin.vizCreateWithAI')}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filters Card ── */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('admin.vizSearchPlaceholder')}
                className="pl-9 h-9 text-body-sm"
              />
            </div>
            <Tabs value={subjectFilter} onValueChange={v => { setSubjectFilter(v); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all" className="text-caption-sm gap-1.5">
                  {t('admin.all')}
                  {data && <span className="text-caption-xs text-ink-muted ml-0.5">({data.total})</span>}
                </TabsTrigger>
                <TabsTrigger value="math" className="text-caption-sm gap-1.5">
                  <FunctionSquare className="h-3.5 w-3.5" /> {t('admin.vizMathematics')}
                </TabsTrigger>
                <TabsTrigger value="physics" className="text-caption-sm gap-1.5">
                  <Atom className="h-3.5 w-3.5" /> {t('admin.vizPhysics')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* ── Content ── */}
      {loading ? (
        <Card className="border-border">
          <div className="p-5 space-y-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-editorial-xs" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </Card>
      ) : data?.data?.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cream-300 flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="h-8 w-8 text-ink-muted" />
            </div>
            <h3 className="font-display text-display-sm text-ink mb-2">{t('admin.vizNoVizYet')}</h3>
            <p className="text-body-sm text-ink-muted mb-6 max-w-sm mx-auto">
              {t('admin.vizListEmptyDesc')}
            </p>
            <Link href="/admin/visualizations/create">
              <Button size="lg">
                <Sparkles className="h-4 w-4 mr-2" /> {t('admin.vizCreateFirst')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Table ── */}
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-warm">
                  <TableHead className="w-[40%] pl-5 text-caption-sm font-semibold text-ink-muted uppercase tracking-wider">
                    {t('admin.vizTitle')}
                  </TableHead>
                  <TableHead className="text-caption-sm font-semibold text-ink-muted uppercase tracking-wider">
                    {t('admin.vizSubject')}
                  </TableHead>
                  <TableHead className="text-caption-sm font-semibold text-ink-muted uppercase tracking-wider">
                    {t('admin.vizColumnStatus')}
                  </TableHead>
                  <TableHead className="text-caption-sm font-semibold text-ink-muted uppercase tracking-wider">
                    {t('admin.vizColumnStats')}
                  </TableHead>
                  <TableHead className="text-caption-sm font-semibold text-ink-muted uppercase tracking-wider">
                    {t('admin.vizVersion')}
                  </TableHead>
                  <TableHead className="text-caption-sm font-semibold text-ink-muted uppercase tracking-wider">
                    {t('admin.vizColumnDate')}
                  </TableHead>
                  <TableHead className="w-[60px] pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.map((viz) => {
                  const subject = viz.subject as keyof typeof SUBJECT_CONFIG;
                  const subjectCfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.math;
                  const SubjectIcon = subjectCfg.icon;
                  const isPublished = viz.status === 'published';

                  return (
                    <TableRow
                      key={viz.id}
                      className="group cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/visualizations/${viz.id}/edit`)}
                    >
                      {/* Title */}
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          {viz.featuredImage ? (
                            <div className="w-10 h-10 shrink-0 rounded-editorial-xs overflow-hidden bg-cream-300 ring-1 ring-border">
                              <img
                                src={viz.featuredImage}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 shrink-0 rounded-editorial-xs bg-cream-300 flex items-center justify-center ring-1 ring-border">
                              <FileJson className="h-5 w-5 text-ink-faint" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-body-sm font-medium text-ink group-hover:text-clay transition-colors truncate block">
                              {viz.title}
                            </span>
                            {(viz.introduction || viz.description || viz.prompt) && (
                              <span className="text-caption-sm text-ink-muted truncate block max-w-[320px]">
                                {(viz.introduction || viz.description || viz.prompt || '').slice(0, 80)}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Subject */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`px-1.5 py-0.5 text-caption-xs font-medium gap-0.5 ${subjectCfg.color}`}
                        >
                          <SubjectIcon className="h-3 w-3" />
                          {subjectCfg.label}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={isPublished ? 'secondary' : 'outline'}
                          className={
                            isPublished
                              ? 'px-1.5 py-0.5 text-caption-xs font-medium'
                              : 'px-1.5 py-0.5 text-caption-xs font-medium'
                          }
                        >
                          {isPublished ? (
                            <><Eye className="h-3 w-3 mr-0.5" /> {t('admin.published')}</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-0.5" /> {t('admin.draft')}</>
                          )}
                        </Badge>
                      </TableCell>

                      {/* Stats */}
                      <TableCell>
                        <div className="flex items-center gap-3 text-caption-sm text-ink-muted">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <Eye className="h-3.5 w-3.5" />
                                  {viz.viewCount}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{t('admin.vizViews')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <Activity className="h-3.5 w-3.5" />
                                  {viz.interactCount}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{t('admin.vizInteractions')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>

                      {/* Version */}
                      <TableCell>
                        <span className="font-mono text-caption-sm text-ink-muted bg-cream-200/60 px-2 py-0.5 rounded-editorial-xs">
                          v{viz.version}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <span className="text-caption-sm text-ink-muted whitespace-nowrap">
                          {new Date(viz.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-5" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4 text-ink-muted" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => router.push(`/admin/visualizations/${viz.id}/edit`)}>
                              <Edit3 className="h-4 w-4 mr-2 text-ink-muted" /> {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(viz.id, viz.status)}
                              disabled={togglingId === viz.id}
                            >
                              {togglingId === viz.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin text-ink-muted" />
                              ) : isPublished ? (
                                <EyeOff className="h-4 w-4 mr-2 text-ink-muted" />
                              ) : (
                                <Eye className="h-4 w-4 mr-2 text-ink-muted" />
                              )}
                              {isPublished ? t('admin.vizUnpublish') : t('admin.vizPublish')}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/visualizations/${viz.id}/edit`} className="flex items-center">
                                <ExternalLink className="h-4 w-4 mr-2 text-ink-muted" /> {t('admin.viewDetails')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-clay focus:text-clay focus:bg-clay-pale"
                              onClick={() => handleDelete(viz.id, viz.title)}
                              disabled={deletingId === viz.id}
                            >
                              {deletingId === viz.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-caption-sm text-ink-muted">
                {t('common.pageOfTotal', { page, totalPages, total: data?.total || 0 })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  {t('common.previous')}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const startPage = Math.max(1, page - 2);
                    const p = startPage + i;
                    if (p > totalPages) return null;
                    return (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        className={`w-8 h-8 p-0 text-caption-sm ${
                          p === page ? 'bg-clay text-white' : ''
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
