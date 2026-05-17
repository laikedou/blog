'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { crawl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe, Plus, Play, Trash2, RefreshCw, ExternalLink,
  CheckCircle2, XCircle, Clock, Loader2, FileText,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

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
  const { t } = useTranslation();
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
  const [tab, setTab] = useState<'sources' | 'articles'>('sources');

  const loadSources = async () => {
    try {
      const s = await crawl.sources.list();
      setSources(s);
    } catch (e: any) {
      toast.error('Failed to load sources: ' + (e.message || 'Unknown error'));
    }
  };

  const loadArticles = async (page: number) => {
    try {
      const res = await crawl.articles.list({ page, limit: PER_PAGE });
      setArticles(res.data);
      setArticleTotal(res.total);
      setArticleTotalPages(res.totalPages);
    } catch (e: any) {
      toast.error('Failed to load articles: ' + (e.message || 'Unknown error'));
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
      toast.error(e.message || 'Failed to create source');
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
      toast.error(e.message || 'Failed to delete source');
    }
  };

  const runSource = async (id: number) => {
    setRunId(id);
    try {
      const result = await crawl.sources.run(id);
      toast.success(`Crawl complete: ${result.new} new, ${result.skipped} updated, ${result.errors} errors`);
      loadSources();
      if (tab === 'articles') loadArticles(articlePage);
    } catch (e: any) {
      toast.error(e.message || 'Crawl failed');
    } finally {
      setRunId(null);
    }
  };

  const publishArticle = async (id: number) => {
    setPubId(id);
    try {
      const result = await crawl.articles.publish(id);
      toast.success(`Published as draft: "${result.article?.title || result.title || 'Article'}"`);
      loadArticles(articlePage);
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish article');
    } finally {
      setPubId(null);
    }
  };

  const deleteArticle = async (id: number) => {
    try {
      await crawl.articles.delete(id);
      toast.success('Article deleted');
      if (articles.length <= 1 && articlePage > 1) {
        setArticlePage(p => p - 1);
      } else {
        loadArticles(articlePage);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete article');
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-md text-ink">{t('admin.crawlTitle')}</h1>
          <p className="text-body-sm text-ink-muted mt-1">{t('admin.crawlDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t('common.refresh')}
          </Button>
          {tab === 'sources' && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />{t('admin.crawlAddSource')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-300 rounded-pill p-1 w-fit">
        {(['sources', 'articles'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 text-caption-sm font-medium rounded-pill transition-colors ${
              tab === tabKey ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tabKey === 'sources' ? t('admin.crawlSources') : t('admin.crawlArticlesCount', { count: articleTotal })}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      ) : tab === 'sources' ? (
        <>
          {/* Add Source Form */}
          {showForm && (
            <Card className="border-border shadow-card">
              <CardHeader><CardTitle className="font-display text-display-sm">{t('admin.crawlNewSource')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-caption-sm text-ink-muted">{t('admin.crawlName')}</label>
                    <Input placeholder={t('admin.crawlName')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-caption-sm text-ink-muted">{t('admin.crawlUrl')}</label>
                    <Input placeholder={t('admin.crawlUrl')} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-caption-sm text-ink-muted">{t('admin.crawlIntervalMin')}</label>
                    <Input type="number" min={10} value={form.interval} onChange={e => setForm(f => ({ ...f, interval: +e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                  <Button size="sm" onClick={addSource} disabled={submitting}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                    {t('admin.crawlAddSource')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sources List */}
          {sources.length === 0 ? (
            <div className="text-center py-20 text-ink-muted">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-body">{t('admin.crawlNoSources')}</p>
              <p className="text-body-sm mt-1">{t('admin.crawlNoSourcesDesc')}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />{t('admin.crawlAddSource')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map(s => (
                <Card key={s.id} className="border-border shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-body font-medium text-ink truncate">{s.name}</h3>
                          <Badge variant="outline" className={`text-caption-sm ${s.status === 'active' ? 'text-teal border-teal/30' : 'text-ink-muted border-border'}`}>
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-body-sm text-ink-muted truncate mt-0.5">{s.url}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-caption-sm text-ink-muted">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('admin.crawlEveryNMin', { interval: s.interval })}</span>
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {t('admin.crawlNArticles', { count: s._count.articles })}</span>
                          <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> {t('admin.crawlLastRun', { date: formatDate(s.lastRunAt) })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => runSource(s.id)} disabled={runId === s.id} title="Run crawl now">
                          {runId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSource(s.id)} className="text-clay hover:text-clay-dark" title="Delete source">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Articles Tab */
        <>
          {articles.length === 0 ? (
            <div className="text-center py-20 text-ink-muted">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-body">{t('admin.crawlNoArticles')}</p>
              <p className="text-body-sm mt-1">{t('admin.crawlNoArticlesDesc')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {articles.map(a => (
                  <Card key={a.id} className="border-border shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-body font-medium text-ink truncate">{a.title}</h3>
                            {a.isPublished ? (
                              <Badge className="text-caption-sm bg-teal-pale text-teal border-none">{t('admin.crawlPublished')}</Badge>
                            ) : a.isProcessed ? (
                              <Badge className="text-caption-sm bg-cream-300 text-ink-soft border-none">{t('admin.crawlProcessed')}</Badge>
                            ) : (
                              <Badge className="text-caption-sm bg-clay-subtle text-clay border-none">{t('admin.crawlDraftStatus')}</Badge>
                            )}
                          </div>
                          <p className="text-body-sm text-ink-muted mt-0.5 line-clamp-1">{a.excerpt || t('admin.crawlNoExcerpt')}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-caption-sm text-ink-muted">
                            <span>{a.source.name}</span>
                            {a.authorName && <span>{t('admin.crawlByAuthor', { name: a.authorName })}</span>}
                            <span>{formatDate(a.publishedDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" title="Open original">
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </a>
                          {!a.isPublished && (
                            <Button variant="ghost" size="sm" onClick={() => publishArticle(a.id)} disabled={pubId === a.id} className="text-teal hover:text-teal-light" title="Publish as draft">
                              {pubId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteArticle(a.id)} className="text-clay hover:text-clay-dark" title="Delete article">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {articleTotalPages > 1 && (
                <nav className="flex items-center justify-center gap-3 mt-6" aria-label="Article pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                    disabled={articlePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> {t('common.previous')}
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
                          className="min-w-[36px]"
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
                    {t('common.next')} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </nav>
              )}
              <p className="text-center text-caption-sm text-ink-muted">
                {t('admin.crawlArticlesPagination', { page: articlePage, totalPages: articleTotalPages, total: articleTotal })}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
