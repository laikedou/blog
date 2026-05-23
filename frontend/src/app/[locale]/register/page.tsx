'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslations();
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
    <main className="min-h-screen bg-background flex items-center justify-center p-margin-md relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic register card */}
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <Card>
          <CardContent className="p-container-padding flex flex-col gap-margin-sm">
            {/* Header */}
            <div className="text-center mb-margin-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-unit tracking-tighter">
                {t('auth.register')}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('auth.register')}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-error-container/20 text-error text-body-sm rounded-lg p-3 border border-error/20 animate-slide-down">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-gutter">
              {/* Display name */}
              <div className="flex flex-col gap-unit">
                <label htmlFor="displayName" className="font-label-sm text-label-sm text-on-surface">
                  {t('auth.displayName')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">badge</span>
                  <Input
                    id="displayName"
                    value={form.displayName}
                    onChange={e => setForm({...form, displayName: e.target.value})}
                    placeholder={t('auth.displayName')}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-unit">
                <label htmlFor="email" className="font-label-sm text-label-sm text-on-surface">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">email</span>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder={t('common.youExample')}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-unit">
                <label htmlFor="username" className="font-label-sm text-label-sm text-on-surface">
                  {t('auth.username')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                    placeholder={t('auth.username')}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-unit">
                <label htmlFor="password" className="font-label-sm text-label-sm text-on-surface">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={t('auth.passwordLength')}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="mt-unit w-full"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    {t('auth.registering')}
                  </>
                ) : (
                  <>
                    {t('auth.register')}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </Button>
            </form>

            {/* Login link */}
            <div className="text-center mt-unit">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t('auth.hasAccount')}{' '}
              </span>
              <Link
                href="/login"
                className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors"
              >
                {t('auth.login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
