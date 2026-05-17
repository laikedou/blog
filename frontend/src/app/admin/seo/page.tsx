'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { seo as seoApi, posts as postsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, TrendingUp, Globe, CheckCircle, XCircle, AlertTriangle, Lightbulb, Plus, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';

export default function AdminSeoPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [dashboard, setDashboard] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [indexStatus, setIndexStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newKeyword, setNewKeyword] = useState('');
  const [auditPostId, setAuditPostId] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      seoApi.dashboard(),
      seoApi.keywords.list(),
      seoApi.indexStatus.list(),
    ]).then(([dash, kw, idx]) => {
      setDashboard(dash);
      setKeywords(kw);
      setIndexStatus(idx);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      await seoApi.keywords.create({ keyword: newKeyword.trim(), source: 'manual' });
      setNewKeyword('');
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteKeyword = async (id: number) => {
    const ok = await confirm({ title: 'Delete Keyword', message: 'Delete this keyword and its ranking history?', confirmLabel: 'Delete', variant: 'destructive' });
    if (!ok) return;
    try {
      await seoApi.keywords.delete(id);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAuditPost = async () => {
    if (!auditPostId.trim()) return;
    const id = Number(auditPostId);
    if (isNaN(id)) { toast.error('Please enter a valid post ID'); return; }
    setAuditLoading(true);
    try {
      const result = await seoApi.auditPost(id);
      setAuditResult(result);
    } catch (err: any) { toast.error(err.message); }
    setAuditLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-editorial" />)}
        </div>
      </div>
    );
  }

  const overview = dashboard?.overview || {};

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">{t('admin.seoDashboard')}</h1>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" /> {t('common.refresh')}</Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.seoAvgScore')}</CardTitle>
            <BarChart3 className="h-5 w-5 text-clay opacity-60" />
          </CardHeader>
          <CardContent>
            <p className={`font-display text-display-lg ${scoreColor(overview.avgScore)}`}>
              {overview.avgScore ?? '—'}/100
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.seoTrackedKeywords')}</CardTitle>
            <TrendingUp className="h-5 w-5 text-teal opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-ink">{overview.keywordCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.seoGoogleIndexed')}</CardTitle>
            <Globe className="h-5 w-5 text-blue-500 opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-ink">
              {overview.googleIndexed ?? 0}
              <span className="text-body-sm text-ink-muted ml-2">/ {overview.totalTracked || 0}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-body-sm text-ink-muted font-normal">{t('admin.seoBaiduIndexed')}</CardTitle>
            <Search className="h-5 w-5 text-amber-500 opacity-60" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-display-lg text-ink">
              {overview.baiduIndexed ?? 0}
              <span className="text-body-sm text-ink-muted ml-2">/ {overview.totalTracked || 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-2" />{t('admin.seoTabDashboard')}</TabsTrigger>
          <TabsTrigger value="keywords"><TrendingUp className="h-4 w-4 mr-2" />{t('admin.seoTabKeywords')}</TabsTrigger>
          <TabsTrigger value="audit"><CheckCircle className="h-4 w-4 mr-2" />{t('admin.seoTabAudit')}</TabsTrigger>
          <TabsTrigger value="index"><Globe className="h-4 w-4 mr-2" />{t('admin.seoTabIndex')}</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Audits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-body-sm font-medium">{t('admin.seoRecentAudits')}</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.recentAudits?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recentAudits.map((audit: any) => (
                      <div key={audit.id} className="flex items-center justify-between p-3 bg-cream-200 rounded-editorial-sm">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-body-sm text-ink truncate">{audit.title || audit.pageUrl}</p>
                          <p className="text-caption-sm text-ink-muted">{new Date(audit.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge className={scoreBg(audit.score)}>
                          <span className={scoreColor(audit.score)}>{audit.score}/100</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-ink-muted text-center py-6">{t('admin.seoNoAudits')}</p>
                )}
              </CardContent>
            </Card>

            {/* Click Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-body-sm font-medium">{t('admin.seoTrafficSources')}</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.clickSources && Object.keys(dashboard.clickSources).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(dashboard.clickSources).map(([source, data]: [string, any]) => (
                      <div key={source} className="flex items-center justify-between p-3 bg-cream-200 rounded-editorial-sm">
                        <span className="text-body-sm text-ink font-medium capitalize">{source}</span>
                        <div className="text-right">
                          <span className="text-body-sm text-ink">{t('admin.seoClicks', { count: data.clicks })}</span>
                          <span className="text-caption-sm text-ink-muted ml-2">({t('admin.seoImpressions', { count: data.impressions })})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-ink-muted text-center py-6">{t('admin.seoNoClickData')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-body-sm font-medium">{t('admin.seoAddKeyword')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  placeholder={t('admin.seoKeywordPlaceholder')}
                  onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1"
                />
                <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                  <Plus className="h-4 w-4 mr-2" /> {t('admin.seoAdd')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-body-sm font-medium">{t('admin.seoTrackedKeywordsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {keywords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.seoKeyword')}</TableHead>
                      <TableHead>{t('admin.seoSource')}</TableHead>
                      <TableHead>{t('admin.seoVolume')}</TableHead>
                      <TableHead>{t('admin.seoDifficulty')}</TableHead>
                      <TableHead>{t('admin.seoLatestRanking')}</TableHead>
                      <TableHead>{t('admin.seoActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((kw: any) => {
                      const latestRanking = kw.rankings?.[0];
                      return (
                        <TableRow key={kw.id}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell><Badge variant="outline">{kw.source}</Badge></TableCell>
                          <TableCell>{kw.volume || '—'}</TableCell>
                          <TableCell>
                            {kw.difficulty ? (
                              <div className="flex items-center gap-1">
                                <div className="w-16 h-1.5 bg-cream-300 rounded-full">
                                  <div className="h-full rounded-full bg-clay" style={{ width: `${kw.difficulty}%` }} />
                                </div>
                                <span className="text-caption-sm">{kw.difficulty}%</span>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {latestRanking ? (
                              <Badge variant={latestRanking.position <= 3 ? 'default' : 'outline'}>
                                #{latestRanking.position} ({latestRanking.source})
                              </Badge>
                            ) : (
                              <span className="text-ink-muted text-body-sm">{t('admin.seoNotRanked')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteKeyword(kw.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-body-sm text-ink-muted text-center py-6">{t('admin.seoNoKeywords')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-body-sm font-medium">{t('admin.seoRunAudit')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={auditPostId}
                  onChange={e => setAuditPostId(e.target.value)}
                  placeholder={t('admin.seoAuditPlaceholder')}
                  className="flex-1"
                />
                <Button onClick={handleAuditPost} disabled={auditLoading}>
                  {auditLoading ? t('admin.seoAuditing') : <><Search className="h-4 w-4 mr-2" /> {t('admin.seoAuditBtn')}</>}
                </Button>
              </div>

              {auditResult && (
                <div className="space-y-4 mt-6 p-4 bg-cream-200 rounded-editorial">
                  <div className="flex items-center justify-between">
                    <h3 className="text-body font-medium text-ink">{t('admin.seoAuditResults')}</h3>
                    <span className={`font-display text-display-sm ${scoreColor(auditResult.score)}`}>
                      {auditResult.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-surface p-3 rounded-editorial-sm text-center">
                      <p className="text-display-sm text-ink">{auditResult.wordCount}</p>
                      <p className="text-caption-sm text-ink-muted">{t('admin.seoWords')}</p>
                    </div>
                    <div className="bg-surface p-3 rounded-editorial-sm text-center">
                      <p className="text-display-sm text-ink">{Object.keys(auditResult.checks).length}</p>
                      <p className="text-caption-sm text-ink-muted">{t('admin.seoChecks')}</p>
                    </div>
                    <div className="bg-surface p-3 rounded-editorial-sm text-center">
                      <p className="text-display-sm text-green-600">
                        {Object.values(auditResult.checks).filter((c: any) => c.pass).length}
                      </p>
                      <p className="text-caption-sm text-ink-muted">{t('admin.seoPassed')}</p>
                    </div>
                    <div className="bg-surface p-3 rounded-editorial-sm text-center">
                      <p className="text-display-sm text-red-600">
                        {Object.values(auditResult.checks).filter((c: any) => !c.pass).length}
                      </p>
                      <p className="text-caption-sm text-ink-muted">{t('admin.seoFailed')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(auditResult.checks).map(([key, check]: [string, any]) => (
                      <div key={key} className={`flex items-start gap-2 p-2 rounded ${check.pass ? 'bg-green-50' : 'bg-red-50'}`}>
                        {check.pass
                          ? <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                          : <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                        }
                        <div>
                          <p className={`text-body-sm ${check.pass ? 'text-green-800' : 'text-red-800'}`}>
                            {check.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {auditResult.suggestions?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-body-sm font-medium text-ink mb-2 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4 text-clay" /> {t('admin.seoSuggestions')}
                      </h4>
                      <ul className="space-y-1">
                        {auditResult.suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-body-sm text-ink-soft flex items-start gap-2">
                            <span className="text-clay mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Index Status Tab */}
        <TabsContent value="index">
          <Card>
            <CardHeader>
              <CardTitle className="text-body-sm font-medium">{t('admin.seoIndexStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {indexStatus.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.seoPageUrl')}</TableHead>
                      <TableHead>{t('admin.seoGoogle')}</TableHead>
                      <TableHead>{t('admin.seoBaidu')}</TableHead>
                      <TableHead>{t('admin.seoLastChecked')}</TableHead>
                      <TableHead>{t('admin.seoErrors')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indexStatus.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-body-sm">{item.pageUrl}</TableCell>
                        <TableCell>
                          {item.googleIndexed
                            ? <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> {t('admin.seoIndexed')}</Badge>
                            : <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> {t('admin.seoNotFound')}</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          {item.baiduIndexed
                            ? <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> {t('admin.seoIndexed')}</Badge>
                            : <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> {t('admin.seoNotFound')}</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-body-sm text-ink-muted">
                          {new Date(item.lastChecked).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-body-sm text-red-500">{item.errors !== '[]' ? item.errors : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-body-sm text-ink-muted text-center py-6">
                  {t('admin.seoNoIndexData')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
