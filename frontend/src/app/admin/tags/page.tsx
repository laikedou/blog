'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tags as tagsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm-dialog';

export default function AdminTagsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTags = () => {
    tagsApi.list().then(setTags).finally(() => setLoading(false));
  };
  useEffect(() => { fetchTags(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) await tagsApi.update(editing.id, { name });
      else await tagsApi.create({ name });
      toast.success(editing ? t('admin.tagUpdated') : t('admin.tagCreated'));
      setName(''); setEditing(null);
      fetchTags();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleEdit = (tag: any) => { setEditing(tag); setName(tag.name); };
  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: t('admin.deleteTag'), message: t('admin.confirmDeleteTag'), confirmLabel: t('common.delete'), variant: 'destructive' });
    if (!ok) return;
    await tagsApi.delete(id);
    toast.success(t('admin.tagDeleted'));
    fetchTags();
  };

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">{t('admin.tags')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{editing ? t('admin.editTag') : t('admin.newTag')}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('admin.tagNamePlaceholder')} required />
              <Button type="submit" disabled={saving}>
                {saving ? '...' : editing ? t('admin.update') : <><Plus className="h-4 w-4 mr-1" /> {t('admin.add')}</>}
              </Button>
              {editing && <Button variant="outline" onClick={() => { setEditing(null); setName(''); }}>{t('common.cancel')}</Button>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('admin.allTags')}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <>
                {tags.length > 6 && (
                  <div className="px-6 pt-4 pb-2">
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t('admin.searchTagsPlaceholder')}
                      className="h-9"
                    />
                  </div>
                )}
                {tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-body-sm text-ink-muted">
                      {searchQuery ? t('admin.noTagsMatch', { query: searchQuery }) : t('admin.noTagsYet')}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-6">
                    {tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((tag: any) => (
                  <div key={tag.id} className="flex items-center gap-2 bg-cream-200 rounded-full px-4 py-2">
                    <span className="text-body-sm text-ink font-medium">#{tag.name}</span>
                    <span className="text-caption-sm text-ink-muted">({tag.postCount || 0})</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEdit(tag)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDelete(tag.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
