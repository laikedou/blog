'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslations();
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(username, password); router.push('/admin'); }
    catch (err: any) { setError(err.message || t('errors.generic')); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-margin-md relative overflow-hidden">
      {/* Ambient background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic login card */}
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <Card>
          <CardContent className="p-container-padding flex flex-col gap-margin-sm">
            {/* Header */}
            <div className="text-center mb-margin-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-unit tracking-tighter">
                {t('auth.login')}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('auth.login')}
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
              {/* Username field */}
              <div className="flex flex-col gap-unit">
                <label htmlFor="username" className="font-label-sm text-label-sm text-on-surface">
                  {t('auth.username')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={t('auth.username')}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-unit">
                <label htmlFor="password" className="font-label-sm text-label-sm text-on-surface">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.password')}
                    required
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
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  <>
                    {t('auth.login')}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </Button>
            </form>

            {/* Register link */}
            <div className="text-center mt-unit">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t('auth.noAccount')}{' '}
              </span>
              <Link
                href="/register"
                className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors"
              >
                {t('auth.register')}
              </Link>
            </div>

            {/* Demo accounts card */}
            <div className="mt-margin-sm bg-surface-container/50 border border-border rounded-lg p-margin-sm flex flex-col gap-unit">
              <h3 className="font-label-sm text-label-sm text-on-surface-variant">
                Demo accounts:
              </h3>
              <div className="font-label-sm text-label-sm text-on-surface-variant/70 flex flex-col gap-1">
                <p>Admin: admin / admin123</p>
                <p>User: demo / user123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
