'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { crawl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Source {
  id: number;
  name: string;
  url: string;
  interval: number;
  status: string;
  lastRunAt: string | null;
  createdAt: string;
  _count: { articles: number };
}

interface Article {
  id: number;
  sourceId: number;
  sourceUrl: string;
  title: string;
  excerpt: string;
  authorName: string;
  publishedDate: string | null;
  imageUrl: string;
  isProcessed: boolean;
  isPublished: boolean;
  postId: number | null;
  createdAt: string;
  source: { name: string; url: string };
}

const PER_PAGE = 10;

export default function CrawlPage() {
  const t = useTranslations();
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTotal, setArticleTotal] = useState(0);
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [pubId, setPubId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', url: '', interval: 60 });
  const [tab, setTab] = useState('sources');

  const loadSources = async () => {
    try {
      const s = await crawl.sources.list();
      setSources(s);
    } catch (e: any) {
      toast.error(t('admin.crawlFailedLoad'));
    }
  };

  const loadArticles = async (page: number) => {
    try {
      const res = await crawl.articles.list({ page, limit: PER_PAGE });
      setArticles(res.data);
      setArticleTotal(res.total);
      setArticleTotalPages(res.totalPages);
    } catch (e: any) {
      toast.error(t('admin.crawlFailedLoadArticles'));
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadSources(), loadArticles(articlePage)]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadArticles(articlePage); }, [articlePage]);

  const addSource = async () => {
    if (!form.name || !form.url) {
      toast.warning(t('admin.crawlFillRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await crawl.sources.create(form);
      toast.success(t('admin.crawlSourceCreated'));
      setForm({ name: '', url: '', interval: 60 });
      setShowForm(false);
      loadSources();
    } catch (e: any) {
      toast.error(e.message || t('admin.crawlFailedCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSource = async (id: number) => {
    try {
      await crawl.sources.delete(id);
      toast.success(t('admin.crawlSourceDeleted'));
      loadSources();
    } catch (e: any) {
      toast.error(e.message || t('admin.crawlFailedDelete'));
    }
  };

  const runSource = async (id: number) => {
    setRunId(id);
    try {
      const result = await crawl.sources.run(id);
      toast.success(t('admin.crawlRunComplete', { new: result.new, skipped: result.skipped, errors: result.errors }));
      loadSources();
      if (tab === 'articles') loadArticles(articlePage);
    } catch (e: any) {
      toast.error(e.message || t('admin.crawlRunFailed'));
    } finally {
      setRunId(null);
    }
  };

  const publishArticle = async (id: number) => {
    setPubId(id);
    try {
      const result = await crawl.articles.publish(id);
      toast.success(t('admin.crawlPublishedAsDraft', { title: result.article?.title || result.title || '' }));
      loadArticles(articlePage);
    } catch (e: any) {
      toast.error(e.message || t('admin.crawlFailedPublish'));
    } finally {
      setPubId(null);
    }
  };

  const deleteArticle = async (id: number) => {
    try {
      await crawl.articles.delete(id);
      toast.success(t('admin.crawlArticleDeleted'));
      if (articles.length <= 1 && articlePage > 1) {
        setArticlePage(p => p - 1);
      } else {
        loadArticles(articlePage);
      }
    } catch (e: any) {
      toast.error(e.message || t('admin.crawlFailedDeleteArticle'));
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.crawlTitle')}</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{t('admin.crawlDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {t('common.refresh')}
          </Button>
          {tab === 'sources' && (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t('admin.crawlAddSource')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sources">{t('admin.crawlSources')}</TabsTrigger>
          <TabsTrigger value="articles">{t('admin.crawlArticlesCount', { count: articleTotal })}</TabsTrigger>
        </TabsList>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl animate-spin">progress_activity</span>
          </div>
        ) : (
          <>
            {/* Sources Tab */}
            <TabsContent value="sources" className="space-y-4">
              {/* Add Source Form */}
              {showForm && (
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-surface/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-headline-md text-headline-md text-on-surface">{t('admin.crawlNewSource')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">{t('admin.crawlName')}</label>
                        <Input
                          placeholder={t('admin.crawlName')}
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">{t('admin.crawlUrl')}</label>
                        <Input
                          placeholder={t('admin.crawlUrl')}
                          value={form.url}
                          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">{t('admin.crawlIntervalMin')}</label>
                        <Input
                          type="number"
                          min={10}
                          value={form.interval}
                          onChange={e => setForm(f => ({ ...f, interval: +e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowForm(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={addSource} disabled={submitting}>
                        {submitting ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        )}
                        {t('admin.crawlAddSource')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sources List */}
              {sources.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-40">public</span>
                  <p className="text-body-md">{t('admin.crawlNoSources')}</p>
                  <p className="text-body-sm mt-1">{t('admin.crawlNoSourcesDesc')}</p>
                  <Button onClick={() => setShowForm(true)} className="mt-6">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t('admin.crawlAddSource')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sources.map(s => (
                    <Card key={s.id} className="hover:bg-surface-container-high/40 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-body-md font-medium text-on-surface truncate">{s.name}</h3>
                              <Badge
                                variant="outline"
                                className={`border ${s.status === 'active' ? 'bg-tertiary/10 text-tertiary border-tertiary/30' : ''}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === 'active' ? 'bg-tertiary shadow-[0_0_5px_rgba(76,215,246,0.8)]' : 'bg-on-surface-variant'}`} />
                                {s.status}
                              </Badge>
                            </div>
                            <p className="text-body-sm text-on-surface-variant truncate mt-0.5">{s.url}</p>
                            <div className="flex items-center gap-4 mt-1.5 text-label-sm text-on-surface-variant">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                {t('admin.crawlEveryNMin', { interval: s.interval })}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">article</span>
                                {t('admin.crawlNArticles', { count: s._count.articles })}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                {t('admin.crawlLastRun', { date: formatDate(s.lastRunAt) })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => runSource(s.id)}
                              disabled={runId === s.id}
                              title={t('admin.crawlRunNow')}
                            >
                              {runId === s.id ? (
                                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSource(s.id)}
                              title={t('admin.crawlDeleteSource')}
                            >
                              <span className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-error">delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles" className="space-y-4">
              {articles.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-40">article</span>
                  <p className="text-body-md">{t('admin.crawlNoArticles')}</p>
                  <p className="text-body-sm mt-1">{t('admin.crawlNoArticlesDesc')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {articles.map(a => (
                      <Card key={a.id} className="hover:bg-surface-container-high/40 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-body-md font-medium text-on-surface truncate">{a.title}</h3>
                                {a.isPublished ? (
                                  <Badge variant="outline" className="bg-tertiary/10 text-tertiary border-tertiary/20 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_5px_rgba(76,215,246,0.8)] mr-1" />
                                    {t('admin.crawlPublished')}
                                  </Badge>
                                ) : a.isProcessed ? (
                                  <Badge variant="outline" className="shrink-0">
                                    {t('admin.crawlProcessed')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1" />
                                    {t('admin.crawlDraftStatus')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">{a.excerpt || t('admin.crawlNoExcerpt')}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-label-sm text-on-surface-variant">
                                <span>{a.source.name}</span>
                                {a.authorName && <span>{t('admin.crawlByAuthor', { name: a.authorName })}</span>}
                                <span>{formatDate(a.publishedDate)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" title={t('admin.crawlOpenOriginal')}>
                                <Button variant="ghost" size="icon">
                                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                </Button>
                              </a>
                              {!a.isPublished && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => publishArticle(a.id)}
                                  disabled={pubId === a.id}
                                  title={t('admin.crawlPublishAsDraft')}
                                >
                                  {pubId === a.id ? (
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteArticle(a.id)}
                                title={t('admin.crawlDeleteArticle')}
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {articleTotalPages > 1 && (
                    <nav className="flex items-center justify-center gap-3 mt-6" aria-label={t('common.articlePagination')}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                        disabled={articlePage === 1}
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        {t('common.previous')}
                      </Button>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: Math.min(articleTotalPages, 5) }, (_, i) => {
                          let pageNum: number;
                          if (articleTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (articlePage <= 3) {
                            pageNum = i + 1;
                          } else if (articlePage >= articleTotalPages - 2) {
                            pageNum = articleTotalPages - 4 + i;
                          } else {
                            pageNum = articlePage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === articlePage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setArticlePage(pageNum)}
                              className="w-8 h-8 min-w-0 p-0"
                              aria-current={pageNum === articlePage ? 'page' : undefined}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArticlePage(p => Math.min(articleTotalPages, p + 1))}
                        disabled={articlePage === articleTotalPages}
                      >
                        {t('common.next')}
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </Button>
                    </nav>
                  )}
                  <p className="text-center text-label-sm text-on-surface-variant">
                    {t('admin.crawlArticlesPagination', { page: articlePage, totalPages: articleTotalPages, total: articleTotal })}
                  </p>
                </>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
