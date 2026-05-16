'use client';

import { useState, useEffect, useRef } from 'react';
import { media as mediaApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Search, Loader2 } from 'lucide-react';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export default function MediaPickerDialog({ open, onOpenChange, onSelect }: MediaPickerDialogProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = () => {
    setLoading(true);
    mediaApi.list({ page, limit: 20 })
      .then(res => { setMedia(res.data || res); setTotalPages(res.totalPages || 1); })
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open) fetchMedia(); }, [page, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { await mediaApi.upload(file); fetchMedia(); } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select from Media Library</DialogTitle>
        </DialogHeader>

        {/* Upload bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <label className="cursor-pointer">
            <Button variant="outline" disabled={uploading} type="button">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
          </label>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 ml-auto text-body-sm text-ink-muted">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} type="button">Prev</Button>
              <span>{page} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} type="button">Next</Button>
            </div>
          )}
        </div>

        {/* Media grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-clay animate-spin" />
          </div>
        ) : media.length === 0 ? (
          <p className="text-body-sm text-ink-muted text-center py-16">No media found. Upload some images to get started.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 pt-4">
            {media.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onSelect(item.url); onOpenChange(false); }}
                className="group relative aspect-square rounded-editorial-sm overflow-hidden border border-border bg-cream-100
                  hover:border-clay hover:shadow-card-hover transition-all duration-200"
              >
                <img
                  src={item.url}
                  alt={item.originalName || ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
