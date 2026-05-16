'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiUsage as aiUsageApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RefreshCw, Search, ChevronLeft, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';

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

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    deepseek: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    openai: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    claude: 'bg-amber-100 text-amber-700 border-amber-300',
    gemini: 'bg-blue-100 text-blue-700 border-blue-300',
    grok: 'bg-rose-100 text-rose-700 border-rose-300',
  };
  return <Badge className={colors[provider] || 'bg-gray-100 text-gray-700 border-gray-300'}>{provider}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  return status === 'success'
    ? <Badge className="bg-green-100 text-green-700 border-green-300">success</Badge>
    : <Badge className="bg-red-100 text-red-700 border-red-300">error</Badge>;
}

export default function AdminAiUsagePage() {
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
      setError(err.message || 'Failed to load AI usage data');
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

  // ── Loading Skeleton ──
  if (loading && records.length === 0 && !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-sm font-display font-bold text-ink">AI Usage</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  // ── Error State ──
  if (error && records.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-sm font-display font-bold text-ink">AI Usage</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-body-sm text-ink-muted mb-4">{error}</p>
            <Button onClick={() => fetchData(page)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-heading-sm font-display font-bold text-ink">AI Usage</h1>
        <Button variant="outline" size="sm" onClick={() => fetchData(page)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">Total Tokens</p>
              <p className="text-heading-sm font-bold font-display">{formatTokens(stats.summary.totalTokens)}</p>
              <div className="flex gap-4 mt-2 text-caption-sm text-ink-muted">
                <span>P: {formatTokens(stats.summary.totalPromptTokens)}</span>
                <span>C: {formatTokens(stats.summary.totalCompletionTokens)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">Total Calls</p>
              <p className="text-heading-sm font-bold font-display">{stats.summary.totalCalls}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">Today's Tokens</p>
              <p className="text-heading-sm font-bold font-display">{formatTokens(stats.summary.todayTokens)}</p>
              <p className="text-caption-sm text-ink-muted mt-2">{stats.summary.todayCalls} calls today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-caption-sm text-ink-muted uppercase tracking-wider mb-1">Providers</p>
              <div className="space-y-1">
                {stats.byProvider.map((p: any) => (
                  <div key={p.provider} className="flex items-center justify-between text-body-sm">
                    <ProviderBadge provider={p.provider} />
                    <span className="text-ink-muted">{formatTokens(p.totalTokens)}</span>
                  </div>
                ))}
                {stats.byProvider.length === 0 && (
                  <p className="text-caption-sm text-ink-muted">No data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-caption-sm text-ink-muted">Provider</label>
              <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v === '__all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="grok">Grok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption-sm text-ink-muted">Status</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === '__all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-caption-sm text-ink-muted">Feature</label>
              <div className="flex gap-1">
                <Input
                  placeholder="Search feature..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-44"
                />
                <Button size="icon" variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Tokens (P/C/T)</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-ink-muted">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No AI usage records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-caption-sm">{r.id}</TableCell>
                    <TableCell><ProviderBadge provider={r.provider} /></TableCell>
                    <TableCell className="text-body-sm">{r.feature}</TableCell>
                    <TableCell className="text-caption-sm font-mono text-ink-muted">
                      {r.promptTokens}/{r.completionTokens}/{r.totalTokens}
                    </TableCell>
                    <TableCell className="text-caption-sm text-ink-muted">{formatDuration(r.durationMs)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-caption-sm text-ink-muted">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-body-sm text-ink-muted">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
