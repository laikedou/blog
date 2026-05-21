'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { media as mediaApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export default function MediaPickerDialog({ open, onOpenChange, onSelect }: MediaPickerDialogProps) {
  const t = useTranslations();
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

  useEffect(() => { if (open) { setPage(1); fetchMedia(); } }, [open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { await mediaApi.upload(file); fetchMedia(); } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-on-surface">{t('admin.selectFromLibrary')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <label className="cursor-pointer">
              <Button variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                  )}
                  {uploading ? t('admin.uploading') : t('common.uploadLabel')}
                </span>
              </Button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
            </label>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 ml-auto text-body-sm text-on-surface-variant">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  {t('common.prev')}
                </Button>
                <span className="px-2">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  {t('common.next')}
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : media.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant text-center py-16">{t('admin.noMediaFound')}</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {media.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.url); onOpenChange(false); }}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-surface-container-low transition-all duration-200 hover:border-primary hover:shadow-lg"
                >
                  <img
                    src={item.url}
                    alt={item.originalName || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[11px] text-white truncate">{item.originalName || ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
