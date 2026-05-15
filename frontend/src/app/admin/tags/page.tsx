'use client';

import { useState, useEffect } from 'react';
import { tags as tagsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2, Plus } from 'lucide-react';

export default function AdminTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

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
      setName(''); setEditing(null);
      fetchTags();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const handleEdit = (tag: any) => { setEditing(tag); setName(tag.name); };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tag?')) return;
    await tagsApi.delete(id);
    fetchTags();
  };

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">Tags</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{editing ? 'Edit Tag' : 'New Tag'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tag name" required />
              <Button type="submit" disabled={saving}>
                {saving ? '...' : editing ? 'Update' : <><Plus className="h-4 w-4 mr-1" /> Add</>}
              </Button>
              {editing && <Button variant="outline" onClick={() => { setEditing(null); setName(''); }}>Cancel</Button>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Tags</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="flex flex-wrap gap-2 p-6">
                {tags.map((tag: any) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
