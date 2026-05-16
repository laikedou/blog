'use client';

import { useState, useEffect, useCallback } from 'react';
import { logs as logsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Bug, AlertTriangle, RefreshCw, Trash2, Search, ChevronLeft, ChevronRight,
  Eye, BarChart3, TrendingUp, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

function StatusBadge({ code }: { code: number }) {
  const color = code >= 500 ? 'bg-red-100 text-red-700 border-red-300'
    : code >= 400 ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
    : 'bg-green-100 text-green-700 border-green-300';
  return <Badge className={color}>{code}</Badge>;
}

function MethodBadge({ method }: { method: string }) {
  const color = method === 'GET' ? 'bg-blue-100 text-blue-700 border-blue-300'
    : method === 'POST' ? 'bg-green-100 text-green-700 border-green-300'
    : method === 'PUT' || method === 'PATCH' ? 'bg-orange-100 text-orange-700 border-orange-300'
    : 'bg-red-100 text-red-700 border-red-300';
  return <Badge className={color}>{method}</Badge>;
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
      title: 'Clear All Logs',
      message: `Are you sure you want to delete all ${total} error logs? This action cannot be undone.`,
      confirmLabel: 'Clear All',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await logsApi.clear();
      toast.success('All logs cleared');
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
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-editorial" />)}
        </div>
        <Skeleton className="h-64 rounded-editorial" />
      </div>
    );
  }

  const overview = stats?.overview || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-display-md text-ink">Error Logs</h1>
          <p className="text-body-sm text-ink-muted mt-1">Monitor and debug API errors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData(page)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="destructive" onClick={handleClearLogs} disabled={total === 0}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear All
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">Total Errors</CardTitle>
            <Bug className="h-5 w-5 text-red-500 opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-ink">{overview.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">Today</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500 opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-orange-600">{overview.today ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">Last 7 Days</CardTitle>
            <TrendingUp className="h-5 w-5 text-clay opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-ink">{overview.last7Days ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">5xx Errors</CardTitle>
            <BarChart3 className="h-5 w-5 text-red-600 opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-red-600">{overview.serverErrors ?? 0}</p>
            <p className="text-caption-sm text-ink-muted">
              {overview.clientErrors ?? 0} client (4xx) errors
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs"><Bug className="h-4 w-4 mr-2" />Logs</TabsTrigger>
          <TabsTrigger value="charts"><BarChart3 className="h-4 w-4 mr-2" />Charts</TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search */}
                  <div className="flex-1 min-w-[200px] max-w-sm">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                      <Input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search error messages..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {/* Method filter */}
                  <select
                    value={methodFilter}
                    onChange={e => { setMethodFilter(e.target.value); handleFilterChange(); }}
                    className="h-9 rounded-editorial-sm border border-border bg-surface px-3 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); handleFilterChange(); }}
                    className="h-9 rounded-editorial-sm border border-border bg-surface px-3 text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay"
                  >
                    <option value="">All Status</option>
                    <option value="400">400 Bad Request</option>
                    <option value="401">401 Unauthorized</option>
                    <option value="403">403 Forbidden</option>
                    <option value="404">404 Not Found</option>
                    <option value="409">409 Conflict</option>
                    <option value="422">422 Validation</option>
                    <option value="429">429 Rate Limit</option>
                    <option value="500">500 Server Error</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => { setSearchInput(''); setSearchQuery(''); setMethodFilter(''); setStatusFilter(''); setPage(1); fetchData(1); }}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
                <div className="text-body-sm text-ink-muted">
                  {total} error{total !== 1 ? 's' : ''} found
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <p className="text-body-sm text-ink-muted">Failed to load logs: {error}</p>
                  <Button variant="outline" onClick={() => fetchData(page)} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" /> Retry
                  </Button>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Bug className="h-8 w-8 text-ink-muted mx-auto mb-3" />
                  <p className="text-body-sm text-ink-muted">No errors found{searchQuery || methodFilter || statusFilter ? ' matching your filters' : ' — everything looks good!'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead className="w-20">Method</TableHead>
                          <TableHead className="w-20">Status</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead className="w-40">Time</TableHead>
                          <TableHead className="w-16">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="text-caption-sm text-ink-muted font-mono">{log.id}</TableCell>
                            <TableCell><MethodBadge method={log.method} /></TableCell>
                            <TableCell><StatusBadge code={log.statusCode} /></TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="truncate font-mono text-body-sm" title={log.url}>{log.url}</p>
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                              <p className="truncate text-body-sm" title={log.message}>{log.message}</p>
                            </TableCell>
                            <TableCell className="text-caption-sm text-ink-muted whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetail(log.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <p className="text-caption-sm text-ink-muted">
                        Page {page} of {totalPages} ({total} total)
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => fetchData(page - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => fetchData(page + 1)}
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          {!stats ? (
            <div className="text-center py-12">
              <Skeleton className="h-64 w-full rounded-editorial" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Timeline */}
              {stats.timeline?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-body-sm font-medium">Error Timeline (30 days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={stats.timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d8" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#8a8478" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#8a8478" allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Total Errors" dot={false} />
                        <Line type="monotone" dataKey="serverErrors" stroke="#f97316" strokeWidth={2} name="5xx" dot={false} />
                        <Line type="monotone" dataKey="clientErrors" stroke="#eab308" strokeWidth={2} name="4xx" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Code Distribution */}
                {stats.statusCodeDistribution?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-body-sm font-medium">By Status Code</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Top Error Endpoints */}
                {stats.topEndpoints?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-body-sm font-medium">Top Error Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={stats.topEndpoints.map((e: any) => ({
                            ...e,
                            label: `${e.method} ${e.url.length > 30 ? e.url.substring(0, 30) + '...' : e.url}`,
                          }))}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d8" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8a8478" />
                          <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} stroke="#8a8478" width={200} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedLog(null)}>
          <div className="bg-surface rounded-editorial border border-border shadow-card-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display text-display-sm text-ink">Error Detail #{selectedLog.id}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-caption-sm text-ink-muted block">Method</span>
                  <MethodBadge method={selectedLog.method} />
                </div>
                <div>
                  <span className="text-caption-sm text-ink-muted block">Status</span>
                  <StatusBadge code={selectedLog.statusCode} />
                </div>
                <div className="col-span-2">
                  <span className="text-caption-sm text-ink-muted block">URL</span>
                  <p className="text-body-sm font-mono text-ink break-all">{selectedLog.url}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-caption-sm text-ink-muted block">Message</span>
                  <p className="text-body-sm text-ink break-all">{selectedLog.message}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-caption-sm text-ink-muted block">Time</span>
                  <p className="text-body-sm text-ink">{formatDate(selectedLog.createdAt)}</p>
                </div>
                {selectedLog.userId && (
                  <div className="col-span-2">
                    <span className="text-caption-sm text-ink-muted block">User ID</span>
                    <p className="text-body-sm text-ink">{selectedLog.userId}</p>
                  </div>
                )}
              </div>
              {selectedLog.body && selectedLog.body !== '{}' && (
                <div>
                  <span className="text-caption-sm text-ink-muted block mb-1">Request Body</span>
                  <pre className="bg-cream-200 rounded-editorial-sm p-3 text-caption-sm font-mono text-ink overflow-x-auto max-h-40">
                    {(() => {
                      try { return JSON.stringify(JSON.parse(selectedLog.body), null, 2); }
                      catch { return selectedLog.body; }
                    })()}
                  </pre>
                </div>
              )}
              {selectedLog.stack && (
                <div>
                  <span className="text-caption-sm text-ink-muted block mb-1">Stack Trace</span>
                  <pre className="bg-cream-200 rounded-editorial-sm p-3 text-caption-sm font-mono text-ink overflow-x-auto max-h-60 whitespace-pre-wrap">
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
