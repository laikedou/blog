'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { seo as seoApi, posts as postsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
        <div className="animate-pulse bg-surface-container-high h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-surface-container-high h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const overview = dashboard?.overview || {};

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-tertiary';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-tertiary/10 text-tertiary border-tertiary/30';
    if (score >= 60) return 'bg-warning/10 text-warning border-warning/30';
    return 'bg-error/10 text-error border-error/30';
  };

  const tabs = [
    { key: 'dashboard', label: t('admin.seoTabDashboard'), icon: 'bar_chart' },
    { key: 'keywords', label: t('admin.seoTabKeywords'), icon: 'trending_up' },
    { key: 'audit', label: t('admin.seoTabAudit'), icon: 'check_circle' },
    { key: 'index', label: t('admin.seoTabIndex'), icon: 'globe' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.seoDashboard')}</h1>
          <p className="font-body-sm text-on-surface-variant mt-1">Monitor and optimize search engine performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {t('common.refresh')}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Score */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.seoAvgScore')}</p>
              <span className="material-symbols-outlined text-primary text-[22px]">bar_chart</span>
            </div>
            <p className={`font-display-lg text-display-lg ${scoreColor(overview.avgScore)}`}>
              {overview.avgScore ?? '—'}
              <span className="font-body-sm text-on-surface-variant ml-1">/100</span>
            </p>
          </CardContent>
        </Card>
        {/* Tracked Keywords */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.seoTrackedKeywords')}</p>
              <span className="material-symbols-outlined text-secondary text-[22px]">trending_up</span>
            </div>
            <p className="font-display-lg text-display-lg text-on-surface">{overview.keywordCount ?? 0}</p>
          </CardContent>
        </Card>
        {/* Google Indexed */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4285F4]/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.seoGoogleIndexed')}</p>
              <span className="material-symbols-outlined text-[#4285F4] text-[22px]">globe</span>
            </div>
            <p className="font-display-lg text-display-lg text-on-surface">
              {overview.googleIndexed ?? 0}
              <span className="font-body-sm text-on-surface-variant ml-2">/ {overview.totalTracked || 0}</span>
            </p>
          </CardContent>
        </Card>
        {/* Baidu Indexed */}
        <Card className="relative overflow-hidden group">
          <CardContent className="p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('admin.seoBaiduIndexed')}</p>
              <span className="material-symbols-outlined text-amber-500 text-[22px]">search</span>
            </div>
            <p className="font-display-lg text-display-lg text-on-surface">
              {overview.baiduIndexed ?? 0}
              <span className="font-body-sm text-on-surface-variant ml-2">/ {overview.totalTracked || 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key}>
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Audits */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{t('admin.seoRecentAudits')}</h3>
              </div>
              <div className="p-6">
                {dashboard?.recentAudits?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recentAudits.map((audit: any) => (
                      <div key={audit.id} className="flex items-center justify-between p-3 bg-surface-container/40 rounded-lg border border-border hover:bg-surface-container/60 transition-all">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-body-sm text-on-surface truncate">{audit.title || audit.pageUrl}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{new Date(audit.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className={scoreBg(audit.score)}>
                          {audit.score}/100
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-sm text-on-surface-variant text-center py-6">{t('admin.seoNoAudits')}</p>
                )}
              </div>
            </Card>

            {/* Click Stats */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{t('admin.seoTrafficSources')}</h3>
              </div>
              <div className="p-6">
                {dashboard?.clickSources && Object.keys(dashboard.clickSources).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(dashboard.clickSources).map(([source, data]: [string, any]) => (
                      <div key={source} className="flex items-center justify-between p-3 bg-surface-container/40 rounded-lg border border-border hover:bg-surface-container/60 transition-all">
                        <span className="font-body-sm text-on-surface font-medium capitalize">{source}</span>
                        <div className="text-right">
                          <span className="font-body-sm text-on-surface">{t('admin.seoClicks', { count: data.clicks })}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">({t('admin.seoImpressions', { count: data.impressions })})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-sm text-on-surface-variant text-center py-6">{t('admin.seoNoClickData')}</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keywords">
          <div className="space-y-6">
            {/* Add Keyword */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{t('admin.seoAddKeyword')}</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-3">
                  <Input
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    placeholder={t('admin.seoKeywordPlaceholder')}
                    onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t('admin.seoAdd')}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Keywords Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{t('admin.seoTrackedKeywordsTitle')}</h3>
              </div>
              {keywords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.seoKeyword')}</TableHead>
                        <TableHead>{t('admin.seoSource')}</TableHead>
                        <TableHead>{t('admin.seoVolume')}</TableHead>
                        <TableHead>{t('admin.seoDifficulty')}</TableHead>
                        <TableHead>{t('admin.seoLatestRanking')}</TableHead>
                        <TableHead className="text-right">{t('admin.seoActions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.map((kw: any) => {
                        const latestRanking = kw.rankings?.[0];
                        return (
                          <TableRow key={kw.id}>
                            <TableCell className="font-body-sm text-on-surface">{kw.keyword}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-on-surface-variant bg-surface-container-high/30">
                                {kw.source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-on-surface-variant">{kw.volume || '—'}</TableCell>
                            <TableCell>
                              {kw.difficulty ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${kw.difficulty}%` }} />
                                  </div>
                                  <span className="font-label-sm text-label-sm text-on-surface-variant">{kw.difficulty}%</span>
                                </div>
                              ) : (
                                <span className="font-body-sm text-on-surface-variant">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {latestRanking ? (
                                <Badge variant="outline" className={
                                  latestRanking.position <= 3
                                    ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
                                    : 'bg-surface-container-high/30 text-on-surface-variant border-border'
                                }>
                                  #{latestRanking.position} ({latestRanking.source})
                                </Badge>
                              ) : (
                                <span className="font-body-sm text-on-surface-variant">{t('admin.seoNotRanked')}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteKeyword(kw.id)}
                                className="text-on-surface-variant hover:text-error hover:bg-error/10"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-6">
                  <p className="font-body-sm text-on-surface-variant text-center py-6">{t('admin.seoNoKeywords')}</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{t('admin.seoRunAudit')}</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-3 mb-6">
                  <Input
                    value={auditPostId}
                    onChange={e => setAuditPostId(e.target.value)}
                    placeholder={t('admin.seoAuditPlaceholder')}
                    className="flex-1"
                  />
                  <Button onClick={handleAuditPost} disabled={auditLoading}>
                    {auditLoading ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        {t('admin.seoAuditing')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        {t('admin.seoAuditBtn')}
                      </>
                    )}
                  </Button>
                </div>

                {auditResult && (
                  <div className="space-y-6 p-5 bg-surface-container/40 rounded-xl border border-border">
                    {/* Score Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.seoAuditResults')}</h3>
                      <span className={`font-display-lg text-display-lg ${scoreColor(auditResult.score)}`}>
                        {auditResult.score}/100
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-surface-container/60 rounded-lg p-4 text-center border border-border">
                        <p className="font-display-lg text-display-lg text-on-surface">{auditResult.wordCount}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t('admin.seoWords')}</p>
                      </div>
                      <div className="bg-surface-container/60 rounded-lg p-4 text-center border border-border">
                        <p className="font-display-lg text-display-lg text-on-surface">{Object.keys(auditResult.checks).length}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t('admin.seoChecks')}</p>
                      </div>
                      <div className="bg-surface-container/60 rounded-lg p-4 text-center border border-border">
                        <p className="font-display-lg text-display-lg text-tertiary">
                          {Object.values(auditResult.checks).filter((c: any) => c.pass).length}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t('admin.seoPassed')}</p>
                      </div>
                      <div className="bg-surface-container/60 rounded-lg p-4 text-center border border-border">
                        <p className="font-display-lg text-display-lg text-error">
                          {Object.values(auditResult.checks).filter((c: any) => !c.pass).length}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t('admin.seoFailed')}</p>
                      </div>
                    </div>

                    {/* Checks List */}
                    <div className="space-y-2">
                      {Object.entries(auditResult.checks).map(([key, check]: [string, any]) => (
                        <div
                          key={key}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            check.pass ? 'bg-tertiary/5 border-tertiary/20' : 'bg-error/5 border-error/20'
                          }`}
                        >
                          {check.pass ? (
                            <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0 mt-0.5">check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">cancel</span>
                          )}
                          <div>
                            <p className={`font-body-sm ${check.pass ? 'text-tertiary' : 'text-error'}`}>
                              {check.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    {auditResult.suggestions?.length > 0 && (
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface mb-3 inline-flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-primary">lightbulb</span>
                          {t('admin.seoSuggestions')}
                        </h4>
                        <ul className="space-y-2">
                          {auditResult.suggestions.map((s: string, i: number) => (
                            <li key={i} className="font-body-sm text-on-surface-variant flex items-start gap-2">
                              <span className="text-primary mt-0.5 shrink-0">&#8226;</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="index">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">{t('admin.seoIndexStatus')}</h3>
            </div>
            {indexStatus.length > 0 ? (
              <div className="overflow-x-auto">
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
                        <TableCell className="font-mono">{item.pageUrl}</TableCell>
                        <TableCell>
                          {item.googleIndexed ? (
                            <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/30">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              {t('admin.seoIndexed')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-surface-container-high/30 text-on-surface-variant border-border">
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              {t('admin.seoNotFound')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.baiduIndexed ? (
                            <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/30">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              {t('admin.seoIndexed')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-surface-container-high/30 text-on-surface-variant border-border">
                              <span className="material-symbols-outlined text-[16px]">warning</span>
                              {t('admin.seoNotFound')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-on-surface-variant">
                          {new Date(item.lastChecked).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-error">{item.errors !== '[]' ? item.errors : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <p className="font-body-sm text-on-surface-variant text-center py-6">
                  {t('admin.seoNoIndexData')}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
