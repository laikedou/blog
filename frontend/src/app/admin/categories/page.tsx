'use client';

import { useState, useEffect } from 'react';
import { categories as categoriesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Trash2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', color: '#c84b31' });
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    categoriesApi.list().then(setCategories).finally(() => setLoading(false));
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await categoriesApi.update(editing.id, form);
      else await categoriesApi.create(form);
      setForm({ name: '', description: '', color: '#c84b31' });
      setEditing(null);
      fetchCategories();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  const handleEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, color: cat.color || '#c84b31' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await categoriesApi.delete(id);
    fetchCategories();
  };

  return (
    <div>
      <h1 className="font-display text-display-md text-ink mb-8">Categories</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{editing ? 'Edit Category' : 'New Category'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Category name" required />
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" />
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-10 h-10 rounded-editorial-sm cursor-pointer border-0" />
                <span className="text-body-sm text-ink-muted">{form.color}</span>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
                {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({ name: '', description: '', color: '#c84b31' }); }}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Categories</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              categories.map((cat: any, i: number) => (
                <div key={cat.id} className={`px-6 py-4 flex items-center justify-between hover:bg-cream-200/50 transition-colors ${i < categories.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="text-body text-ink">{cat.name}</p>
                      <p className="text-body-sm text-ink-muted">{cat.postCount || 0} posts</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
