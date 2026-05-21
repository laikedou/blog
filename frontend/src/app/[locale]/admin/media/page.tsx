'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { media as mediaApi } from '@/lib/api';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ──────────────────────────────────────────────

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText: string;
  createdAt: string;
  uploader: { id: number; username: string };
  folder?: { id: number; name: string } | null;
}

interface MediaFolder {
  id: number;
  name: string;
  parentId: number | null;
  parent?: MediaFolder | null;
  children?: MediaFolder[];
  _count: { media: number };
  createdAt: string;
}

interface ListResponse {
  data: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'picture_as_pdf';
  if (mimeType.startsWith('video/')) return 'smart_display';
  return 'description';
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// ─── Main Component ─────────────────────────────────────

export default function AdminMediaPage() {
  const t = useTranslations();
  const { confirm } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  // Data
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // View
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [folderId, setFolderId] = useState<number | undefined>(undefined);
  const [uncategorized, setUncategorized] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterOpen, setFilterOpen] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lastClicked, setLastClicked] = useState<number | null>(null);

  // Folder dialog
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderParentId, setFolderParentId] = useState<number | undefined>(undefined);
  const [renamingFolder, setRenamingFolder] = useState<{ id: number; name: string } | null>(null);

  // ─── Fetch Data ───────────────────────────────────────

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 24 };
      if (search) params.search = search;
      if (mimeType) params.mimeType = mimeType;
      if (uncategorized === 'true') params.uncategorized = 'true';
      else if (folderId !== undefined) params.folderId = folderId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res: ListResponse = await mediaApi.list(params);
      setMedia(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, mimeType, folderId, uncategorized, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await mediaApi.folders.list();
      setFolders(Array.isArray(res) ? res : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);
  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, mimeType, folderId, uncategorized, dateFrom, dateTo]);

  // ─── Upload ───────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await mediaApi.upload(file);
      toast.success(t('admin.fileUploaded'));
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─── Single Delete ────────────────────────────────────

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: t('admin.deleteFile'),
      message: t('admin.confirmDeleteFile'),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await mediaApi.delete(id);
      toast.success(t('admin.fileDeleted'));
      fetchMedia();
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err: any) { toast.error(err.message); }
  };

  // ─── Batch Delete ─────────────────────────────────────

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    const ok = await confirm({
      title: t('admin.batchDeleteFiles'),
      message: t('admin.confirmBatchDelete', { count: selected.size }),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await mediaApi.batchDelete(Array.from(selected));
      toast.success(t('admin.filesDeleted', { count: selected.size }));
      setSelected(new Set());
      fetchMedia();
    } catch (err: any) { toast.error(err.message); }
  };

  // ─── Batch Download ───────────────────────────────────

  const handleBatchDownload = async () => {
    if (selected.size === 0) return;
    try {
      await mediaApi.batchDownload(Array.from(selected));
    } catch (err: any) { toast.error(err.message); }
  };

  // ─── Batch Move ───────────────────────────────────────

  const handleBatchMove = async (targetFolderId?: number | null) => {
    if (selected.size === 0) return;
    try {
      await mediaApi.batchMove(Array.from(selected), targetFolderId);
      toast.success(t('admin.filesMoved'));
      setSelected(new Set());
      fetchMedia();
    } catch (err: any) { toast.error(err.message); }
  };

  // ─── Copy URL ─────────────────────────────────────────

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${url}`,
    );
    toast.success(t('admin.urlCopied'));
  };

  // ─── Selection Logic ──────────────────────────────────

  const toggleSelect = (id: number, shift = false) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (shift && lastClicked !== null && lastClicked !== id) {
        const ids = media.map(m => m.id);
        const start = ids.indexOf(lastClicked);
        const end = ids.indexOf(id);
        const [from, to] = start < end ? [start, end] : [end, start];
        for (let i = from; i <= to; i++) {
          next.add(ids[i]);
        }
        return next;
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastClicked(id);
  };

  const selectAll = () => {
    if (selected.size === media.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(media.map(m => m.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // ─── Folder Management ────────────────────────────────

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await mediaApi.folders.create(folderName.trim(), folderParentId);
      toast.success(t('admin.folderCreated'));
      setFolderName('');
      setFolderParentId(undefined);
      setFolderDialogOpen(false);
      fetchFolders();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renamingFolder.name.trim()) return;
    try {
      await mediaApi.folders.update(renamingFolder.id, renamingFolder.name.trim());
      toast.success(t('admin.folderRenamed'));
      setRenamingFolder(null);
      fetchFolders();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteFolder = async (id: number) => {
    const ok = await confirm({
      title: t('admin.deleteFolder'),
      message: t('admin.confirmDeleteFolder'),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await mediaApi.folders.delete(id);
      toast.success(t('admin.folderDeleted'));
      if (folderId === id) setFolderId(undefined);
      fetchFolders();
      fetchMedia();
    } catch (err: any) { toast.error(err.message); }
  };

  // ─── Filter reset ─────────────────────────────────────

  const resetFilters = () => {
    setSearch('');
    setSearchInput('');
    setMimeType('');
    setFolderId(undefined);
    setUncategorized('');
    setDateFrom('');
    setDateTo('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = !!(
    search || mimeType || folderId !== undefined || uncategorized || dateFrom || dateTo
  );

  // ─── Render: Folder Sidebar ───────────────────────────

  const renderSidebar = () => (
    <div className="w-56 shrink-0 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-label-sm font-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
          {t('admin.folders')}
        </span>
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.newFolder')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder={t('admin.folderNamePlaceholder')}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <div>
                <label className="text-label-sm text-on-surface-variant mb-1 block">
                  {t('admin.parentFolder')} ({t('admin.vizOptional')})
                </label>
                <Select
                  value={folderParentId ? String(folderParentId) : '__none__'}
                  onValueChange={v => setFolderParentId(v === '__none__' ? undefined : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.none')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('admin.none')}</SelectItem>
                    {folders.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateFolder}>{t('common.create')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-0.5 pr-2">
          <button
            onClick={() => { setFolderId(undefined); setUncategorized(''); }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-body-sm transition-colors flex items-center justify-between ${
              folderId === undefined && uncategorized !== 'true'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">folder</span>
              {t('admin.allFiles')}
            </span>
            <span className="text-label-sm text-on-surface-variant/60">{total}</span>
          </button>
          <button
            onClick={() => { setFolderId(undefined); setUncategorized('true'); }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-body-sm transition-colors flex items-center justify-between ${
              uncategorized === 'true'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">inbox</span>
              {t('admin.uncategorized')}
            </span>
          </button>
          <Separator className="my-1" />
          {folders.map(folder => (
            <div key={folder.id}>
              <div
                className={`group w-full text-left px-3 py-1.5 rounded-lg text-body-sm transition-colors flex items-center justify-between cursor-pointer ${
                  folderId === folder.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                onClick={() => { setFolderId(folder.id); setUncategorized(''); }}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  {folder.name}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-label-sm text-on-surface-variant/60">{folder._count.media}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 flex items-center justify-center rounded hover:bg-white/10 transition-all"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenamingFolder({ id: folder.id, name: folder.name }); }}>
                        {t('common.rename')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-error"
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                      >
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // ─── Render: Filter Popover ───────────────────────────

  const renderFilters = () => (
    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={hasActiveFilters ? 'border-primary text-primary' : ''}>
          <span className="material-symbols-outlined text-[16px] mr-1">filter_list</span>
          {t('admin.filters')}
          {hasActiveFilters && <Badge variant="default" className="ml-1 h-4 px-1 text-caption-xs">!</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-body-sm">{t('admin.advancedFilters')}</h4>

          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">{t('admin.fileType')}</label>
            <Select value={mimeType || '__all__'} onValueChange={v => setMimeType(v === '__all__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('admin.allTypes')}</SelectItem>
                <SelectItem value="image">{t('admin.images')}</SelectItem>
                <SelectItem value="application/pdf">{t('admin.pdfs')}</SelectItem>
                <SelectItem value="application">{t('admin.documents')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-label-sm text-on-surface-variant mb-1 block">{t('admin.fromDate')}</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant mb-1 block">{t('admin.toDate')}</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-label-sm text-on-surface-variant mb-1 block">{t('admin.sortBy')}</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">{t('admin.date')}</SelectItem>
                  <SelectItem value="size">{t('admin.size')}</SelectItem>
                  <SelectItem value="originalName">{t('admin.name')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant mb-1 block">{t('admin.order')}</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t('admin.descending')}</SelectItem>
                  <SelectItem value="asc">{t('admin.ascending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
              {t('admin.resetFilters')}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  // ─── Render: Rename Dialog ────────────────────────────

  const renderRenameDialog = () => (
    <Dialog open={!!renamingFolder} onOpenChange={o => !o && setRenamingFolder(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.renameFolder')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={renamingFolder?.name || ''}
            onChange={e => setRenamingFolder(prev => prev ? { ...prev, name: e.target.value } : null)}
            onKeyDown={e => e.key === 'Enter' && handleRenameFolder()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleRenameFolder}>{t('common.save')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ─── Render: Grid View ────────────────────────────────

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {media.map((item) => {
        const isSelected = selected.has(item.id);
        return (
          <Card
            key={item.id}
            className={`overflow-hidden group cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary/40 ${
              isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => toggleSelect(item.id)}
          >
            <div className="relative h-28 bg-surface-container">
              {isImage(item.mimeType) ? (
                <img
                  src={item.url}
                  alt={item.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23171f33" width="100" height="100"/><text fill="%23c2c6d7" font-size="10" x="50" y="55" text-anchor="middle">${t('admin.brokenImage')}</text></svg>`;
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl">{getFileIcon(item.mimeType)}</span>
                </div>
              )}
              {/* Selection checkbox overlay */}
              <div
                className="absolute top-2 left-2 z-10"
                onClick={e => e.stopPropagation()}
              >
                <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} />
              </div>
              {/* Hover actions */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/10 text-white hover:bg-white/20 h-7 px-2"
                  onClick={() => copyUrl(item.url)}
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="bg-white/10 text-white hover:bg-white/20 h-7 px-2">
                      <span className="material-symbols-outlined text-[14px]">more_vert</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyUrl(item.url)}>
                      {t('admin.copyUrl')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-error"
                      onClick={() => handleDelete(item.id)}
                    >
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-2.5">
              <p className="text-body-xs text-on-surface truncate">{item.originalName}</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-caption-xs text-on-surface-variant">{formatSize(item.size)}</span>
                {item.folder && (
                  <Badge variant="outline" className="text-caption-xs h-4 px-1 max-w-[80px] truncate">
                    {item.folder.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // ─── Render: List View ────────────────────────────────

  const renderListView = () => (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={media.length > 0 && selected.size === media.length}
                onCheckedChange={selectAll}
              />
            </TableHead>
            <TableHead className="w-10">{t('admin.preview')}</TableHead>
            <TableHead className="min-w-[200px]">{t('admin.name')}</TableHead>
            <TableHead className="w-24">{t('admin.size')}</TableHead>
            <TableHead className="w-24">{t('admin.type')}</TableHead>
            <TableHead className="w-28">{t('admin.folder')}</TableHead>
            <TableHead className="w-32">{t('admin.date')}</TableHead>
            <TableHead className="w-16">{t('admin.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {media.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <TableRow
                key={item.id}
                className={`cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                onClick={() => toggleSelect(item.id, false)}
              >
                <TableCell onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(item.id)}
                  />
                </TableCell>
                <TableCell>
                  {isImage(item.mimeType) ? (
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-surface-container">
                      <img
                        src={item.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                        {getFileIcon(item.mimeType)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-body-sm text-on-surface truncate max-w-[300px]" title={item.originalName}>
                    {item.originalName}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="text-body-sm text-on-surface-variant">{formatSize(item.size)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-caption-xs font-mono">
                    {item.mimeType.split('/')[1] || item.mimeType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.folder ? (
                    <Badge variant="secondary" className="text-caption-xs">
                      {item.folder.name}
                    </Badge>
                  ) : (
                    <span className="text-body-sm text-on-surface-variant/50">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-body-sm text-on-surface-variant">{formatDate(item.createdAt)}</span>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyUrl(item.url)}>
                        {t('admin.copyUrl')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-error"
                        onClick={() => handleDelete(item.id)}
                      >
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // ─── Render: Batch Actions Bar ────────────────────────

  const renderBatchBar = () => {
    if (selected.size === 0) return null;
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
        <span className="text-body-sm text-primary font-medium mr-2">
          {t('admin.nSelected', { count: selected.size })}
        </span>
        <Button variant="outline" size="sm" onClick={clearSelection}>
          {t('admin.deselect')}
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="outline" size="sm" onClick={handleBatchDownload}>
          <span className="material-symbols-outlined text-[16px] mr-1">download</span>
          {t('admin.download')}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <span className="material-symbols-outlined text-[16px] mr-1">drive_file_move</span>
              {t('admin.moveTo')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              <button
                className="w-full text-left px-3 py-1.5 rounded-lg text-body-sm hover:bg-surface-container-high transition-colors"
                onClick={() => handleBatchMove(null)}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 align-middle">inbox</span>
                {t('admin.uncategorized')}
              </button>
              <Separator />
              {folders.map(f => (
                <button
                  key={f.id}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-body-sm hover:bg-surface-container-high transition-colors"
                  onClick={() => handleBatchMove(f.id)}
                >
                  <span className="material-symbols-outlined text-[16px] mr-2 align-middle">folder_open</span>
                  {f.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="outline" size="sm" className="text-error border-error/30 hover:bg-error/10" onClick={handleBatchDelete}>
          <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
          {t('common.delete')}
        </Button>
      </div>
    );
  };

  // ─── Render: Main ─────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.media')}</h1>
          <p className="font-body-sm text-on-surface-variant mt-1">
            {t('admin.totalFiles', { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <Button disabled={uploading} asChild>
              <span>
                <span className="material-symbols-outlined text-[20px]">upload</span>
                {uploading ? t('admin.uploading') : t('common.upload')}
              </span>
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept="image/*,.pdf,.doc,.docx"
            />
          </label>
        </div>
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
            placeholder={t('admin.searchMedia')}
            className="pl-9"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface"
              onClick={() => { setSearch(''); setSearchInput(''); }}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
        {renderFilters()}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">view_list</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Folder Sidebar */}
        {renderSidebar()}

        {/* Media Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Batch Actions */}
          {renderBatchBar()}

          {/* Loading */}
          {loading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="animate-pulse bg-surface-container-high h-28" />
                    <CardContent className="p-2.5 space-y-1.5">
                      <div className="animate-pulse bg-surface-container-high h-3 w-3/4 rounded" />
                      <div className="animate-pulse bg-surface-container-high h-3 w-1/2 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <TableHead key={i}>
                          <div className="animate-pulse bg-surface-container-high h-4 w-16 rounded" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="animate-pulse bg-surface-container-high h-4 w-full rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : media.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="p-16 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">perm_media</span>
                <p className="font-body-md text-on-surface-variant mb-1">{t('admin.noMediaYet')}</p>
                <p className="font-body-sm text-on-surface-variant/60 mb-4">{t('admin.mediaUploadHint')}</p>
                <label className="cursor-pointer inline-block">
                  <Button asChild>
                    <span>
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      {t('common.upload')}
                    </span>
                  </Button>
                  <input type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx" />
                </label>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'grid' ? renderGridView() : renderListView()}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-body-sm text-on-surface-variant">
                    {t('admin.showingOf', { page, totalPages, total })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      {t('common.previous')}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      {t('common.next')}
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rename Folder Dialog */}
      {renderRenameDialog()}
    </div>
  );
}
