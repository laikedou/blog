'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logs as logsApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

function StatusBadge({ code }: { code: number }) {
  const color = code >= 500
    ? 'bg-error/10 text-error border-error/30'
    : code >= 400
      ? 'bg-warning/10 text-warning border-warning/30'
      : 'bg-tertiary/10 text-tertiary border-tertiary/30';
  return (
    <Badge variant="outline" className={color}>
      {code}
    </Badge>
  );
}

function MethodBadge({ method }: { method: string }) {
  const color = method === 'GET'
    ? 'bg-primary/10 text-primary border-primary/30'
    : method === 'POST'
      ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
      : method === 'PUT' || method === 'PATCH'
        ? 'bg-warning/10 text-warning border-warning/30'
        : 'bg-error/10 text-error border-error/30';
  return (
    <Badge variant="outline" className={color}>
      {method}
    </Badge>
  );
}

interface LogDetail {
  id: number;
  method: string;
  url: string;
  statusCode: number;
  message: string;
  stack: string;
  body: string;
  userId: number | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [logs, setLogs] = useState<LogDetail[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('logs');

  // Filters
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<LogDetail | null>(null);

  const fetchLogs = useCallback(async (p: number) => {
    try {
      const params: Record<string, any> = { page: p, limit: 20 };
      if (methodFilter) params.method = methodFilter;
      if (statusFilter) params.statusCode = Number(statusFilter);
      if (searchQuery) params.search = searchQuery;
      const res = await logsApi.list(params);
      setLogs(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setPage(res.page);
    } catch (err: any) {
      setError(err.message);
    }
  }, [methodFilter, statusFilter, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await logsApi.stats();
      setStats(data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchLogs(p), fetchStats()]);
    setLoading(false);
  }, [fetchLogs, fetchStats]);

  useEffect(() => { fetchData(page); }, []);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
    fetchData(1);
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchData(1);
  };

  const handleClearLogs = async () => {
    const ok = await confirm({
      title: t('admin.logsClearConfirmTitle'),
      message: t('admin.logsClearConfirmMessage', { count: total }),
      confirmLabel: t('admin.logsClearAll'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await logsApi.clear();
      toast.success(t('admin.logsCleared'));
      fetchData(1);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const log = await logsApi.get(id);
      setSelectedLog(log);
    } catch (err: any) { toast.error(err.message); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-surface-container-high h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-surface-container-high h-24 rounded-xl" />
          ))}
        </div>
        <div className="animate-pulse bg-surface-container-high h-64 rounded-xl" />
      </div>
    );
  }

  const overview = stats?.overview || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.logsTitle')}</h1>
          <p className="font-body-sm text-on-surface-variant mt-1">{t('admin.logsDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchData(page)}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {t('common.refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLogs}
            disabled={total === 0}
            className="bg-error/10 text-error hover:bg-error/20"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            {t('admin.logsClearAll')}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Errors */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.logsTotalErrors')}</p>
              <div className="p-2 bg-error/10 text-error rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-[22px]">bug_report</span>
              </div>
            </div>
            <p className="font-display-lg text-display-lg text-on-surface">{overview.total ?? 0}</p>
          </CardContent>
        </Card>
        {/* Today */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.logsToday')}</p>
              <div className="p-2 bg-warning/10 text-warning rounded-lg border border-warning/20">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
            </div>
            <p className="font-display-lg text-display-lg text-warning">{overview.today ?? 0}</p>
          </CardContent>
        </Card>
        {/* Last 7 Days */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.logsLast7Days')}</p>
              <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
                <span className="material-symbols-outlined text-[22px]">trending_up</span>
              </div>
            </div>
            <p className="font-display-lg text-display-lg text-on-surface">{overview.last7Days ?? 0}</p>
          </CardContent>
        </Card>
        {/* Server Errors */}
        <Card className="relative overflow-hidden border-error/20 bg-error/5 group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-error/80 uppercase tracking-wider">{t('admin.logsServerErrors')}</p>
              <div className="p-2 bg-error/20 text-error rounded-lg border border-error/40">
                <span className="material-symbols-outlined text-[22px]">bar_chart</span>
              </div>
            </div>
            <p className="font-display-lg text-display-lg text-error">{overview.serverErrors ?? 0}</p>
            <p className="font-label-sm text-label-sm text-error/60 mt-1">
              {t('admin.logsClientErrors', { count: overview.clientErrors ?? 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="logs">
            <span className="material-symbols-outlined text-[18px]">bug_report</span>
            {t('admin.logsTabLogs')}
          </TabsTrigger>
          <TabsTrigger value="charts">
            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            {t('admin.logsTabCharts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card className="overflow-hidden">
            {/* Filters */}
            <div className="p-5 border-b border-border bg-surface-container/20">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 flex items-center gap-3 w-full flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                    <Input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder={t('admin.logsSearchPlaceholder')}
                      className="pl-10"
                    />
                  </div>
                  {/* Method filter */}
                  <select
                    value={methodFilter}
                    onChange={e => { setMethodFilter(e.target.value); handleFilterChange(); }}
                    className="bg-black/20 border border-border text-on-surface rounded-lg px-3 py-2 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    <option className="bg-surface-container text-on-surface" value="">{t('admin.logsAllMethods')}</option>
                    <option className="bg-surface-container text-on-surface" value="GET">GET</option>
                    <option className="bg-surface-container text-on-surface" value="POST">POST</option>
                    <option className="bg-surface-container text-on-surface" value="PUT">PUT</option>
                    <option className="bg-surface-container text-on-surface" value="DELETE">DELETE</option>
                    <option className="bg-surface-container text-on-surface" value="PATCH">PATCH</option>
                  </select>
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); handleFilterChange(); }}
                    className="bg-black/20 border border-border text-on-surface rounded-lg px-3 py-2 font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    <option className="bg-surface-container text-on-surface" value="">{t('admin.logsAllStatus')}</option>
                    <option className="bg-surface-container text-on-surface" value="400">400 Bad Request</option>
                    <option className="bg-surface-container text-on-surface" value="401">401 Unauthorized</option>
                    <option className="bg-surface-container text-on-surface" value="403">403 Forbidden</option>
                    <option className="bg-surface-container text-on-surface" value="404">404 Not Found</option>
                    <option className="bg-surface-container text-on-surface" value="409">409 Conflict</option>
                    <option className="bg-surface-container text-on-surface" value="422">422 Validation</option>
                    <option className="bg-surface-container text-on-surface" value="429">429 Rate Limit</option>
                    <option className="bg-surface-container text-on-surface" value="500">500 Server Error</option>
                  </select>
                  {/* Clear filters */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSearchInput(''); setSearchQuery(''); setMethodFilter(''); setStatusFilter(''); setPage(1); fetchData(1); }}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    {t('common.clear')}
                  </Button>
                </div>
              </div>
              <div className="mt-3 font-body-sm text-on-surface-variant">
                {t('admin.logsErrorsFound', { count: total })}
              </div>
            </div>

            {/* Content */}
            <div>
              {error ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-error/60 mx-auto block mb-4">warning</span>
                  <p className="font-body-sm text-on-surface-variant">{t('admin.logsFailedLoad', { error })}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(page)}
                    className="mt-4"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    {t('common.retry')}
                  </Button>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mx-auto block mb-4">bug_report</span>
                  <p className="font-body-sm text-on-surface-variant">{t('admin.logsNoErrors', { hasFilters: searchQuery || methodFilter || statusFilter ? 1 : 0 })}</p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t('admin.logsId')}</TableHead>
                          <TableHead className="w-20">{t('admin.logsMethod')}</TableHead>
                          <TableHead className="w-20">{t('admin.logsStatus')}</TableHead>
                          <TableHead>{t('admin.logsUrl')}</TableHead>
                          <TableHead>{t('admin.logsMessage')}</TableHead>
                          <TableHead className="w-40">{t('admin.logsTime')}</TableHead>
                          <TableHead className="w-16 text-right">{t('admin.logsActions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map(log => (
                          <TableRow key={log.id} className="group">
                            <TableCell className="font-mono">{log.id}</TableCell>
                            <TableCell><MethodBadge method={log.method} /></TableCell>
                            <TableCell><StatusBadge code={log.statusCode} /></TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="truncate font-mono text-on-surface/80" title={log.url}>{log.url}</p>
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                              <p className="truncate text-on-surface" title={log.message}>{log.message}</p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetail(log.id)}
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-container/10">
                      <p className="font-body-sm text-on-surface-variant">
                        {t('admin.logsPageOfTotal', { page, totalPages, total })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => fetchData(page - 1)}
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                          {t('common.prev')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => fetchData(page + 1)}
                        >
                          {t('common.next')}
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div>
            {!stats ? (
              <div className="animate-pulse bg-surface-container-high h-64 rounded-xl" />
            ) : (
              <div className="space-y-6">
                {/* Error Timeline */}
                {stats.timeline?.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                      <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Error Timeline (30 days)</h3>
                    </div>
                    <div className="p-6">
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={stats.timeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#c2c6d7' }} stroke="rgba(255,255,255,0.1)" />
                          <YAxis tick={{ fontSize: 11, fill: '#c2c6d7' }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#dae2fd' }}
                          />
                          <Legend wrapperStyle={{ color: '#dae2fd' }} />
                          <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Total Errors" dot={false} />
                          <Line type="monotone" dataKey="serverErrors" stroke="#f97316" strokeWidth={2} name="5xx" dot={false} />
                          <Line type="monotone" dataKey="clientErrors" stroke="#eab308" strokeWidth={2} name="4xx" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Code Distribution */}
                  {stats.statusCodeDistribution?.length > 0 && (
                    <Card className="overflow-hidden">
                      <div className="px-6 py-4 border-b border-border">
                        <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">By Status Code</h3>
                      </div>
                      <div className="p-6">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={stats.statusCodeDistribution}
                              dataKey="count"
                              nameKey="statusCode"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              innerRadius={50}
                              label={(entry: any) => `${entry.statusCode ?? ''} (${entry.count ?? 0})`}
                            >
                              {stats.statusCodeDistribution.map((_: any, i: number) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#dae2fd' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* Top Error Endpoints */}
                  {stats.topEndpoints?.length > 0 && (
                    <Card className="overflow-hidden">
                      <div className="px-6 py-4 border-b border-border">
                        <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Top Error Endpoints</h3>
                      </div>
                      <div className="p-6">
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart
                            data={stats.topEndpoints.map((e: any) => ({
                              ...e,
                              label: `${e.method} ${e.url.length > 30 ? e.url.substring(0, 30) + '...' : e.url}`,
                            }))}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#c2c6d7' }} stroke="rgba(255,255,255,0.1)" />
                            <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#c2c6d7' }} stroke="rgba(255,255,255,0.1)" width={200} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#dae2fd' }}
                            />
                            <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div
            className="bg-surface/60 backdrop-blur-xl rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                {t('admin.logsErrorDetail', { id: selectedLog.id })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLog(null)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{t('admin.logsMethod')}</span>
                  <MethodBadge method={selectedLog.method} />
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{t('admin.logsStatus')}</span>
                  <StatusBadge code={selectedLog.statusCode} />
                </div>
                <div className="col-span-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{t('admin.logsUrl')}</span>
                  <p className="font-body-sm font-mono text-on-surface break-all bg-surface-container/40 rounded-lg px-3 py-2 border border-border">{selectedLog.url}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{t('admin.logsMessage')}</span>
                  <p className="font-body-sm text-on-surface break-all bg-surface-container/40 rounded-lg px-3 py-2 border border-border">{selectedLog.message}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{t('admin.logsTime')}</span>
                  <p className="font-body-sm text-on-surface">{formatDate(selectedLog.createdAt)}</p>
                </div>
                {selectedLog.userId && (
                  <div className="col-span-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">{t('admin.logsUserId')}</span>
                    <p className="font-body-sm text-on-surface">{selectedLog.userId}</p>
                  </div>
                )}
              </div>

              {/* Request Body */}
              {selectedLog.body && selectedLog.body !== '{}' && (
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-2">{t('admin.logsRequestBody')}</span>
                  <pre className="bg-surface-container/60 rounded-lg p-4 font-label-sm text-label-sm text-on-surface font-mono overflow-x-auto max-h-40 border border-border">
                    {(() => {
                      try { return JSON.stringify(JSON.parse(selectedLog.body), null, 2); }
                      catch { return selectedLog.body; }
                    })()}
                  </pre>
                </div>
              )}

              {/* Stack Trace */}
              {selectedLog.stack && (
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-2">{t('admin.logsStackTrace')}</span>
                  <pre className="bg-surface-container/60 rounded-lg p-4 font-label-sm text-label-sm text-on-surface font-mono overflow-x-auto max-h-60 whitespace-pre-wrap border border-border">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
