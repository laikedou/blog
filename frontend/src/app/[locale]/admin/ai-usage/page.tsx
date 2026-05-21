'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { aiUsage as aiUsageApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}min`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

const providerColors: Record<string, string> = {
  deepseek: 'bg-tertiary/20 text-tertiary border-tertiary/30',
  openai: 'bg-primary/20 text-primary border-primary/30',
  claude: 'bg-warning/20 text-warning border-warning/30',
  gemini: 'bg-[#4fc3f7]/20 text-[#4fc3f7] border-[#4fc3f7]/30',
  grok: 'bg-secondary/20 text-secondary border-secondary/30',
};

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <Badge variant="outline" className={providerColors[provider] || 'bg-white/5 text-on-surface-variant border-white/10'}>
      {provider}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  return status === 'success' ? (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(175,198,255,0.8)]" />
      <span className="text-label-sm font-medium tracking-wider text-primary">{t('admin.aiUsageSuccess')}</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]" />
      <span className="text-label-sm font-medium tracking-wider text-error">{t('admin.aiUsageError')}</span>
    </div>
  );
}

export default function AdminAiUsagePage() {
  const t = useTranslations();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [featureSearch, setFeatureSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, limit: 20 };
      if (providerFilter) params.provider = providerFilter;
      if (statusFilter) params.status = statusFilter;
      if (featureSearch) params.feature = featureSearch;
      const [recordsRes, statsRes] = await Promise.all([
        aiUsageApi.list(params),
        aiUsageApi.stats(),
      ]);
      setRecords(recordsRes.data);
      setTotalPages(recordsRes.totalPages);
      setTotal(recordsRes.total);
      setStats(statsRes);
    } catch (err: any) {
      setError(err.message || t('admin.aiUsageFailedLoad'));
    } finally {
      setLoading(false);
    }
  }, [providerFilter, statusFilter, featureSearch]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const handleSearch = () => {
    setFeatureSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setProviderFilter('');
    setStatusFilter('');
    setFeatureSearch('');
    setSearchInput('');
    setPage(1);
  };

  const hasFilters = providerFilter || statusFilter || featureSearch;

  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.aiUsageTitle')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 w-full rounded-lg bg-surface-container-high/50 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-64 w-full rounded-lg bg-surface-container-high/50 animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.aiUsageTitle')}</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
          <p className="text-body-sm text-on-surface-variant mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchData(page)}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span className="text-label-sm font-medium">{t('common.retry')}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ── Loading Skeleton ──
  if (loading && records.length === 0 && !stats) return <LoadingSkeleton />;

  // ── Error State ──
  if (error && records.length === 0) return <ErrorState />;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          {t('admin.aiUsageTitle')}
        </h1>
        <Button variant="outline" size="sm" onClick={() => fetchData(page)} disabled={loading}>
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {t('common.refresh')}
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Tokens */}
          <Card>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('admin.aiUsageTotalTokens')}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">data_usage</span>
                </div>
              </div>
              <div>
                <div className="text-display-lg font-display-lg text-on-surface">
                  {formatTokens(stats.summary.totalTokens)}
                </div>
                <div className="flex gap-4 mt-2 text-label-sm text-on-surface-variant">
                  <span>P: {formatTokens(stats.summary.totalPromptTokens)}</span>
                  <span>C: {formatTokens(stats.summary.totalCompletionTokens)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Calls */}
          <Card>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('admin.aiUsageTotalCalls')}
                </span>
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">swap_calls</span>
                </div>
              </div>
              <div className="text-display-lg font-display-lg text-on-surface">{stats.summary.totalCalls}</div>
            </CardContent>
          </Card>

          {/* Today's Tokens */}
          <Card>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {t('admin.aiUsageTodayTokens')}
                </span>
                <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">today</span>
                </div>
              </div>
              <div>
                <div className="text-display-lg font-display-lg text-on-surface">
                  {formatTokens(stats.summary.todayTokens)}
                </div>
                <div className="mt-2 text-label-sm text-on-surface-variant">
                  {t('admin.aiUsageCallsToday', { count: stats.summary.todayCalls })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Providers */}
          <Card>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Providers</span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-3">
                {stats.byProvider.map((p: any) => (
                  <div key={p.provider} className="flex items-center justify-between">
                    <ProviderBadge provider={p.provider} />
                    <span className="text-label-sm text-on-surface-variant">
                      {formatTokens(p.totalTokens)}
                    </span>
                  </div>
                ))}
                {stats.byProvider.length === 0 && (
                  <span className="text-label-sm text-on-surface-variant">
                    {t('admin.aiUsageNoData')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Log Section ── */}
      <Card>
        {/* Filters */}
        <div className="p-6 border-b border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            {/* Provider Filter */}
            <div className="relative">
              <select
                value={providerFilter || '__all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setProviderFilter(v === '__all' ? '' : v);
                  setPage(1);
                }}
                className="appearance-none bg-surface-container px-4 py-2 pr-10 rounded-lg border border-white/10 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-w-[140px] cursor-pointer"
              >
                <option value="__all">{t('admin.aiUsageAll')}</option>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="grok">Grok</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
                expand_more
              </span>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter || '__all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatusFilter(v === '__all' ? '' : v);
                  setPage(1);
                }}
                className="appearance-none bg-surface-container px-4 py-2 pr-10 rounded-lg border border-white/10 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-w-[140px] cursor-pointer"
              >
                <option value="__all">{t('admin.aiUsageAll')}</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {/* Feature Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                search
              </span>
              <Input
                type="text"
                placeholder={t('admin.aiUsageSearchFeature')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-44"
              />
            </div>

            <Button variant="outline" size="icon" onClick={handleSearch}>
              <span className="material-symbols-outlined text-[18px]">search</span>
            </Button>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('admin.aiUsageClearFilters')}
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageId')}</TableHead>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageProvider')}</TableHead>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageFeature')}</TableHead>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageTokensBreakdown')}</TableHead>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageDuration')}</TableHead>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageStatus')}</TableHead>
                <TableHead className="text-label-sm uppercase tracking-wider">{t('admin.aiUsageTime')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-40">
                        monitoring
                      </span>
                      <span className="text-body-sm text-on-surface-variant">{t('admin.aiUsageNoRecords')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className={r.status === 'error' ? 'bg-error/5' : ''}
                  >
                    <TableCell className="text-label-sm font-mono text-on-surface-variant">{r.id}</TableCell>
                    <TableCell><ProviderBadge provider={r.provider} /></TableCell>
                    <TableCell className="text-body-sm text-on-surface">{r.feature}</TableCell>
                    <TableCell className="text-label-sm font-mono text-on-surface-variant">
                      <span className="text-tertiary">{r.promptTokens}</span>
                      <span className="text-on-surface-variant"> / </span>
                      <span className="text-primary">{r.completionTokens}</span>
                      <span className="text-on-surface-variant"> / </span>
                      <span>{r.totalTokens}</span>
                    </TableCell>
                    <TableCell className="text-label-sm font-mono text-on-surface-variant">
                      {formatDuration(r.durationMs)}
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-label-sm font-mono text-on-surface-variant">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-label-sm text-on-surface-variant">
            <span>{t('common.pageOfTotal', { page, totalPages, total })}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>{t('common.prev')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <span>{t('common.next')}</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
