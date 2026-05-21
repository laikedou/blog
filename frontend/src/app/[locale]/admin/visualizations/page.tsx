'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { useConfirm } from '@/lib/confirm-dialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

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

const SUBJECT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  math: { label: 'Math', icon: 'calculate', color: 'bg-primary/10 text-primary border-primary/20' },
  physics: { label: 'Physics', icon: 'science', color: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
};

export default function AdminVisualizationsPage() {
  const t = useTranslations();
  const { confirm } = useConfirm();
  const router = useRouter();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Close dropdown on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenuId]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await visualizations.list({
        search: search || undefined,
        subject: subjectFilter !== 'all' ? subjectFilter : undefined,
        page,
        limit: 15,
        sortBy,
        sortOrder,
      });
      setData(result);
    } catch {
      toast.error(t('admin.vizFailedLoadList'));
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, page, sortBy, sortOrder, t]);

  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchList(); setSelectedIds(new Set()); }, [subjectFilter, page, sortBy, sortOrder]);

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

  const toggleSelect = (id: number, shiftKey = false) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (shiftKey && lastClickedId !== null && data) {
        const ids = data.data.map(v => v.id);
        const startIdx = ids.indexOf(lastClickedId);
        const endIdx = ids.indexOf(id);
        if (startIdx !== -1 && endIdx !== -1) {
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
          for (let i = from; i <= to; i++) next.add(ids[i]);
          return next;
        }
      }
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLastClickedId(id);
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map(v => v.id)));
    }
  };

  const handleBulkPublish = async (status: string) => {
    try {
      await visualizations.batchUpdateStatus(Array.from(selectedIds), status);
      toast.success(status === 'published' ? t('admin.vizToastPublished') : t('admin.vizToastUnpublished'));
      setSelectedIds(new Set());
      fetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: t('admin.vizBulkDeleteTitle'),
      message: t('admin.vizBulkDeleteMessage', { count: selectedIds.size }),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await visualizations.batchDelete(Array.from(selectedIds));
      toast.success(t('admin.vizToastDeleted'));
      setSelectedIds(new Set());
      fetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const totalPages = data?.totalPages || 1;

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.visualizations')}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t('admin.vizListSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.refresh()}
            className="hidden sm:flex bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            {t('common.refresh')}
          </button>
          <Link href="/admin/visualizations/create">
            <button
              className="py-1.5 px-3 rounded-lg text-label-sm font-label-sm font-medium transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              {t('admin.vizCreateWithAI')}
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(34, 42, 61, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('admin.vizSearchPlaceholder')}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-surface-container-highest/50 p-1 rounded-lg">
            {[
              { value: 'all', label: t('admin.all'), icon: null },
              { value: 'math', label: t('admin.vizMathematics'), icon: 'calculate' },
              { value: 'physics', label: t('admin.vizPhysics'), icon: 'science' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setSubjectFilter(tab.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-label-sm transition-all flex items-center gap-1 ${
                  subjectFilter === tab.value
                    ? 'bg-surface border border-white/10 text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.icon && <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>}
                {tab.label}
                {data && tab.value === 'all' && (
                  <span className="text-[11px] text-on-surface-variant ml-0.5">({data.total})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(34, 42, 61, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="p-5 space-y-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-surface-container-highest/30 animate-pulse rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-surface-container-highest/30 animate-pulse rounded" />
                  <div className="h-3 w-32 bg-surface-container-highest/30 animate-pulse rounded" />
                </div>
                <div className="h-8 w-24 bg-surface-container-highest/30 animate-pulse rounded-lg" />
                <div className="h-8 w-20 bg-surface-container-highest/30 animate-pulse rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : data?.data?.length === 0 ? (
        <div
          className="rounded-xl py-16 text-center border-2 border-dashed border-white/10"
          style={{
            background: 'rgba(34, 42, 61, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">monitoring</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{t('admin.vizNoVizYet')}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
            {t('admin.vizListEmptyDesc')}
          </p>
          <Link href="/admin/visualizations/create">
            <button
              className="py-2.5 px-5 rounded-lg text-label-md font-label-md font-medium transition-all duration-200 active:scale-[0.98] flex items-center gap-2 mx-auto"
              style={{
                background: 'linear-gradient(180deg, #548dff 0%, #0058c9 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {t('admin.vizCreateFirst')}
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div
              className="sticky top-0 z-20 rounded-xl p-3 flex items-center justify-between"
              style={{
                background: 'rgba(34, 42, 61, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span className="font-label-md text-label-md text-on-surface">{t('admin.nSelected', { count: selectedIds.size })}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds(new Set())} className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all">
                  {t('common.deselect')}
                </button>
                <button onClick={() => handleBulkPublish('published')} className="bg-transparent border border-tertiary/30 text-tertiary hover:bg-tertiary/10 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  {t('admin.vizPublish')}
                </button>
                <button onClick={() => handleBulkPublish('draft')} className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                  {t('admin.vizUnpublish')}
                </button>
                <button onClick={handleBulkDelete} className="bg-transparent border border-error/30 text-error hover:bg-error/10 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(34, 42, 61, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="w-[40px] pl-5 py-3">
                    <Checkbox
                      checked={data ? selectedIds.size === data.data.length && data.data.length > 0 : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="w-[40%] py-3 text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider cursor-pointer select-none hover:text-on-surface transition-colors" onClick={() => handleSort('title')}>
                    {t('admin.vizTitle')}
                    {sortIcon('title') && <span className="material-symbols-outlined text-[14px] align-text-bottom ml-1">{sortIcon('title')}</span>}
                  </th>
                  <th className="py-3 text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.vizSubject')}</th>
                  <th className="py-3 text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{t('admin.vizColumnStatus')}</th>
                  <th className="py-3 text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider cursor-pointer select-none hover:text-on-surface transition-colors" onClick={() => handleSort('viewCount')}>
                    {t('admin.vizColumnStats')}
                    {sortIcon('viewCount') && <span className="material-symbols-outlined text-[14px] align-text-bottom ml-1">{sortIcon('viewCount')}</span>}
                  </th>
                  <th className="py-3 text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider cursor-pointer select-none hover:text-on-surface transition-colors" onClick={() => handleSort('version')}>
                    {t('admin.vizVersion')}
                    {sortIcon('version') && <span className="material-symbols-outlined text-[14px] align-text-bottom ml-1">{sortIcon('version')}</span>}
                  </th>
                  <th className="py-3 text-left font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider cursor-pointer select-none hover:text-on-surface transition-colors" onClick={() => handleSort('createdAt')}>
                    {t('admin.vizColumnDate')}
                    {sortIcon('createdAt') && <span className="material-symbols-outlined text-[14px] align-text-bottom ml-1">{sortIcon('createdAt')}</span>}
                  </th>
                  <th className="w-[60px] pr-5" />
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((viz) => {
                  const subject = viz.subject as keyof typeof SUBJECT_CONFIG;
                  const subjectCfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.math;
                  const isPublished = viz.status === 'published';
                  const menuOpen = openMenuId === viz.id;

                  return (
                    <tr
                      key={viz.id}
                      className={`group cursor-pointer transition-colors border-t border-white/5 hover:bg-white/[0.02] ${selectedIds.has(viz.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => router.push(`/admin/visualizations/${viz.id}/edit`)}
                    >
                      {/* Checkbox */}
                      <td className="pl-5 py-4" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(viz.id)}
                          onCheckedChange={() => toggleSelect(viz.id)}
                        />
                      </td>

                      {/* Title */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {viz.featuredImage ? (
                            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-surface-container-low ring-1 ring-white/10">
                              <img src={viz.featuredImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-low flex items-center justify-center ring-1 ring-white/10">
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">code</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-body-sm text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate block">
                              {viz.title}
                            </span>
                            {(viz.introduction || viz.description || viz.prompt) && (
                              <span className="font-body-sm text-body-sm text-on-surface-variant truncate block max-w-[320px]">
                                {(viz.introduction || viz.description || viz.prompt || '').slice(0, 80)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-label-sm ${subjectCfg.color}`}>
                          <span className="material-symbols-outlined text-[14px]">{subjectCfg.icon}</span>
                          {subjectCfg.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${
                          isPublished
                            ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                            : 'bg-surface-variant/50 text-on-surface-variant border border-white/10'
                        }`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {isPublished ? 'visibility' : 'visibility_off'}
                          </span>
                          {isPublished ? t('admin.published') : t('admin.draft')}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="py-4">
                        <div className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                          <span className="inline-flex items-center gap-1" title={t('admin.vizViews')}>
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            {viz.viewCount}
                          </span>
                          <span className="inline-flex items-center gap-1" title={t('admin.vizInteractions')}>
                            <span className="material-symbols-outlined text-[14px]">touch_app</span>
                            {viz.interactCount}
                          </span>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="py-4">
                        <span className="font-mono font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low/50 px-2 py-0.5 rounded-lg">
                          v{viz.version}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4">
                        <span className="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                          {new Date(viz.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="pr-5 py-4 relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(menuOpen ? null : viz.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                        </button>

                        {menuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-44 z-50 rounded-xl overflow-hidden shadow-2xl"
                            style={{
                              background: 'rgba(34, 42, 61, 0.95)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <button
                              onClick={() => { router.push(`/admin/visualizations/${viz.id}/edit`); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={() => { handleTogglePublish(viz.id, viz.status); setOpenMenuId(null); }}
                              disabled={togglingId === viz.id}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                              {togglingId === viz.id ? <Spinner /> : (
                                <span className="material-symbols-outlined text-[16px]">
                                  {isPublished ? 'visibility_off' : 'visibility'}
                                </span>
                              )}
                              {isPublished ? t('admin.vizUnpublish') : t('admin.vizPublish')}
                            </button>
                            <button
                              onClick={() => { router.push(`/admin/visualizations/${viz.id}/edit`); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              {t('admin.viewDetails')}
                            </button>
                            <div className="border-t border-white/5" />
                            <button
                              onClick={() => { handleDelete(viz.id, viz.title); setOpenMenuId(null); }}
                              disabled={deletingId === viz.id}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-body-sm text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                            >
                              {deletingId === viz.id ? <Spinner /> : (
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              )}
                              {t('common.delete')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('common.pageOfTotal', { page, totalPages, total: data?.total || 0 })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all disabled:opacity-30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  {t('common.previous')}
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const startPage = Math.max(1, page - 2);
                    const p = startPage + i;
                    if (p > totalPages) return null;
                    const isActive = p === page;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-label-sm font-label-sm transition-all ${
                          isActive
                            ? 'bg-primary text-on-primary'
                            : 'bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="bg-transparent border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg px-3 py-1.5 text-label-sm font-label-sm transition-all disabled:opacity-30 flex items-center gap-1"
                >
                  {t('common.next')}
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
