'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await register(form); router.push('/admin'); }
    catch (err: any) { setError(err.message || t('errors.generic')); }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream-200 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-display-md">{t('auth.register')}</CardTitle>
              <CardDescription>{t('auth.register')}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="bg-clay-subtle text-clay text-body-sm rounded-editorial-sm p-3 mb-4 border border-clay/20">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-body-sm text-ink-soft">{t('auth.displayName')}</Label>
                  <Input id="displayName" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} placeholder={t('auth.displayName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-body-sm text-ink-soft">{t('auth.email')}</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-body-sm text-ink-soft">{t('auth.username')}</Label>
                  <Input id="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder={t('auth.username')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-body-sm text-ink-soft">{t('auth.password')}</Label>
                  <Input id="password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={t('auth.passwordLength')} required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? t('auth.registering') : t('auth.register')}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-body-sm text-ink-muted">
                {t('auth.hasAccount')}{' '}
                <Link href="/login" className="text-clay hover:text-clay-dark font-medium">{t('auth.login')}</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
