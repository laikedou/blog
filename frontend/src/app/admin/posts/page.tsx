'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { posts as postsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPosts = () => {
    setLoading(true);
    postsApi.list({ page, limit: 10, status: statusFilter || undefined })
      .then(res => { setPosts(res.data); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [page, statusFilter]);

  const deletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return;
    await postsApi.delete(id);
    fetchPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">Posts</h1>
        <Link href="/admin/posts/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Post</Button>
        </Link>
      </div>

      <div className="bg-surface rounded-editorial border border-border shadow-card">
        <div className="px-6 py-4 border-b border-border flex flex-wrap gap-2">
          {['', 'published', 'draft'].map(s => (
            <Badge
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s || 'All'}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <div>
            {posts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-body text-ink-muted">No posts found</p>
              </div>
            ) : (
              posts.map((post: any, i: number) => (
                <div key={post.id} className={`px-6 py-4 flex items-center justify-between hover:bg-cream-200/50 transition-colors ${i < posts.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex-1 min-w-0 mr-4">
                    <Link href={`/admin/posts/${post.id}/edit`} className="text-body text-ink hover:text-clay transition-colors block truncate font-medium">
                      {post.title}
                    </Link>
                    <p className="text-body-sm text-ink-muted mt-0.5">
                      {post.author?.displayName} &middot; {new Date(post.createdAt).toLocaleDateString()}
                      {post.viewCount > 0 && ` · ${post.viewCount} views`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>{post.status}</Badge>
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex justify-center items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
              Prev
            </Button>
            <span className="text-body-sm text-ink-muted">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
