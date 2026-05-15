'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(username, password); router.push('/admin'); }
    catch (err: any) { setError(err.message || 'Login failed'); }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream-200 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-display-md">Welcome back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="bg-clay-subtle text-clay text-body-sm rounded-editorial-sm p-3 mb-4 border border-clay/20">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-body-sm text-ink-soft">Username</Label>
                  <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-body-sm text-ink-soft">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-5">
              <div className="divider-wave" />
              <p className="text-body-sm text-ink-muted">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-clay hover:text-clay-dark font-medium">Register</Link>
              </p>
              <div className="w-full p-4 bg-cream-200 rounded-editorial-sm text-body-sm text-ink-muted space-y-1">
                <p className="font-medium text-ink-soft">Demo accounts:</p>
                <p>Admin: admin / admin123</p>
                <p>User: demo / user123</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
