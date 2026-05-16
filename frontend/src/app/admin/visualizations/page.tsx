'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { visualizations } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Plus, Sparkles, Edit3, Trash2, Eye, EyeOff, ExternalLink, Search, BarChart3, BookOpen, Atom, FunctionSquare,
} from 'lucide-react';
import { useConfirm } from '@/lib/confirm-dialog';

export default function AdminVisualizationsPage() {
  const { confirm } = useConfirm();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  const fetchList = () => {
    setLoading(true);
    visualizations.list({ search, subject: subjectFilter || undefined, limit: 50 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [subjectFilter]);
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleTogglePublish = async (id: number, currentStatus: string) => {
    await visualizations.publish(id, currentStatus === 'published' ? 'draft' : 'published');
    fetchList();
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Visualization', message: 'Delete this visualization permanently? This action cannot be undone.', confirmLabel: 'Delete', variant: 'destructive' });
    if (!ok) return;
    await visualizations.delete(id);
    fetchList();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-display-md text-ink">Visualizations</h1>
          <p className="text-body-sm text-ink-muted mt-1">AI-generated interactive math &amp; physics visualizations</p>
        </div>
        <Link href="/admin/visualizations/create">
          <Button size="lg">
            <Sparkles className="h-4 w-4 mr-2" /> Create with AI
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search visualizations..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {['', 'math', 'physics'].map(s => (
                <button
                  key={s}
                  onClick={() => setSubjectFilter(s)}
                  className={`px-3 py-1.5 rounded-editorial-xs text-caption-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                    subjectFilter === s
                      ? 'bg-ink text-white'
                      : 'bg-surface-warm text-ink-muted hover:bg-cream-300'
                  }`}
                >
                  {s === 'math' ? <FunctionSquare className="h-3.5 w-3.5" /> : s === 'physics' ? <Atom className="h-3.5 w-3.5" /> : null}
                  {s ? (s === 'math' ? 'Math' : 'Physics') : 'All'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-editorial" />)}
        </div>
      ) : data?.data?.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-ink-faint" />
            <p className="text-body text-ink-muted mb-4">No visualizations yet</p>
            <Link href="/admin/visualizations/create">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" /> Create Your First Visualization
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data?.data?.map((viz: any) => (
            <Card key={viz.id} className="border-border hover:shadow-card-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Thumbnail */}
                  {viz.featuredImage && (
                    <div className="w-24 h-16 shrink-0 rounded-editorial-xs overflow-hidden bg-cream-300">
                      <img
                        src={viz.featuredImage}
                        alt={viz.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={viz.subject === 'math' ? 'default' : 'secondary'} className="rounded-pill inline-flex items-center gap-1">
                        {viz.subject === 'math' ? <FunctionSquare className="h-3 w-3" /> : <Atom className="h-3 w-3" />}
                        {viz.subject === 'math' ? 'Math' : 'Physics'}
                      </Badge>
                      <Badge variant="outline" className={viz.status === 'published' ? 'text-teal border-teal/30' : ''}>
                        {viz.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-caption-sm text-ink-muted">v{viz.version}</span>
                    </div>
                    <h3 className="font-display text-display-sm text-ink truncate">{viz.title}</h3>
                    <p className="text-body-sm text-ink-muted mt-1 line-clamp-2">{viz.introduction || viz.description || viz.prompt}</p>
                    <div className="flex items-center gap-4 mt-2 text-caption-sm text-ink-muted">
                      <span>{viz.viewCount} views</span>
                      <span>{viz.interactCount} interactions</span>
                      <span>{new Date(viz.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/admin/visualizations/${viz.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(viz.id, viz.status)}
                      className="p-2 rounded-editorial-xs text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
                      title={viz.status === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {viz.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(viz.id)}
                      className="p-2 rounded-editorial-xs text-clay/60 hover:text-clay hover:bg-clay-subtle transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
