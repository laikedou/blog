'use client';

import { useState, useEffect, useRef } from 'react';
import { media as mediaApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Copy, Trash2, File } from 'lucide-react';

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = () => {
    setLoading(true);
    mediaApi.list({ page, limit: 20 })
      .then(res => { setMedia(res.data); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchMedia(); }, [page]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { await mediaApi.upload(file); fetchMedia(); } catch (err: any) { alert(err.message); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file?')) return;
    await mediaApi.delete(id); fetchMedia();
  };

  const copyUrl = async (url: string) => { await navigator.clipboard.writeText(url); alert('URL copied!'); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">Media Library</h1>
        <label className="cursor-pointer">
          <Button disabled={uploading}><Upload className="h-4 w-4 mr-2" />{uploading ? 'Uploading...' : 'Upload'}</Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx" />
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Card key={i}><Skeleton className="h-32 rounded-t-editorial rounded-b-none" /><CardContent className="p-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></CardContent></Card>)}
        </div>
      ) : media.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><p className="text-body text-ink-muted mb-1">No media uploaded yet</p><p className="text-body-sm text-ink-muted">Click upload to add files</p></CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((item: any) => (
              <Card key={item.id} className="overflow-hidden group shadow-card">
                <div className="h-32 bg-cream-200 relative overflow-hidden">
                  {item.mimeType?.startsWith('image/') ? (
                    <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-ink-muted"><File className="h-8 w-8" /></div>
                  )}
                  <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" className="h-8" onClick={() => copyUrl(item.url)}><Copy className="h-3 w-3 mr-1" />URL</Button>
                    <Button variant="destructive" size="sm" className="h-8" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-body-sm text-ink truncate">{item.originalName}</p>
                  <p className="text-caption-sm text-ink-muted">{(item.size / 1024).toFixed(1)} KB</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Prev</Button>
              <span className="text-body-sm text-ink-muted self-center">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
