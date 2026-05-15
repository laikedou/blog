'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Menu, X, LayoutDashboard, FileText, Home, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/category/ai', label: 'AI' },
  { href: '/category/web3', label: 'Web3' },
  { href: '/category/blockchain', label: 'Blockchain' },
  { href: '/category/programming', label: 'Dev' },
];

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-md border-b border-border" role="banner">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display text-display-sm text-ink tracking-tight hover:text-clay transition-colors" aria-label="AI Blog Home">
              AI Blog
            </Link>
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} className="text-body-sm text-ink-soft hover:text-ink transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-cream-200/70 transition-colors focus:outline-none" aria-label="User menu">
                    <Avatar className="h-8 w-8 ring-2 ring-clay/10">
                      <AvatarFallback className="bg-clay text-white text-body-sm">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-body-sm text-ink-soft">{user?.displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="px-3 py-2.5 border-b border-border mb-1">
                    <p className="text-body-sm font-medium text-ink">{user?.displayName || 'User'}</p>
                    <p className="text-caption text-ink-muted truncate">{user?.email || ''}</p>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/posts')}>
                    <FileText className="h-4 w-4 mr-2" />My Posts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Home className="h-4 w-4 mr-2" />View Site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-clay">
                    <LogOut className="h-4 w-4 mr-2" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href="/register"><Button size="sm">Get started</Button></Link>
              </div>
            )}
            <button className="md:hidden p-2 text-ink-soft hover:text-ink transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <nav className="md:hidden bg-cream-100 border-t border-border px-6 py-5 space-y-3" aria-label="Mobile navigation">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className="block text-body text-ink-soft hover:text-ink py-1.5" onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          <div className="divider-wave my-3" aria-hidden="true" />
          <div className="flex gap-2 pt-2">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-body text-clay hover:text-clay-dark py-1.5">Sign out</button>
            ) : (
              <>
                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Sign in</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Register</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
