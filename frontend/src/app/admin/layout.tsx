'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { siteConfig as siteConfigApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Toaster } from '@/components/Toaster';
import NotificationBell from '@/components/NotificationBell';
import { NotificationProvider } from '@/lib/notification-context';
import { ConfirmProvider } from '@/lib/confirm-dialog';
import { LayoutDashboard, FileText, FolderTree, Tags, MessageSquare, Image, Globe, LogOut, ExternalLink, Menu, Layout, MessageCircle, BarChart3, Bug, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminTitle, setAdminTitle] = useState('Blog Admin');
  const [siteTitle, setSiteTitle] = useState('AI Blog');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    siteConfigApi.get().then(config => {
      if (config.adminTitle) setAdminTitle(config.adminTitle);
      if (config.siteTitle) setSiteTitle(config.siteTitle);
      if (config.logoUrl) setLogoUrl(config.logoUrl);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-clay border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/posts', label: 'Posts', icon: FileText },
    { href: '/admin/visualizations', label: 'Visualizations', icon: BarChart3 },
    { href: '/admin/banners', label: 'Banners', icon: Layout },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/tags', label: 'Tags', icon: Tags },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/chat-analytics', label: 'Chat Analytics', icon: MessageCircle },
    { href: '/admin/media', label: 'Media', icon: Image },
    { href: '/admin/seo', label: 'SEO', icon: BarChart3 },
    { href: '/admin/crawl', label: 'Crawl', icon: Globe },
    { href: '/admin/logs', label: 'Error Logs', icon: Bug },
    { href: '/admin/ai-usage', label: 'AI Usage', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-cream-200">
      {/* Sidebar */}
      <aside className={`bg-surface-tile text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
          {sidebarOpen && (
            <>
              <Link href="/admin" className="font-display text-display-sm tracking-tight">{logoUrl ? <img src={logoUrl} alt={siteTitle} className="h-7 w-auto inline" /> : siteTitle}</Link>
              <span className="text-caption-sm text-white/40 ml-auto uppercase tracking-wider">{adminTitle === 'Blog Admin' ? 'Admin' : adminTitle}</span>
            </>
          )}
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto min-h-0">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-editorial-sm text-body-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 shrink-0">
          {sidebarOpen && (
            <>
              <div className="flex items-center gap-3 mb-3 px-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-clay text-white text-body-sm">
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium truncate text-white/80">{user?.displayName}</p>
                  <p className="text-caption-sm text-white/40 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Link href="/" className="flex-1 text-center text-caption-sm text-white/40 hover:text-white py-1.5 rounded-editorial-xs hover:bg-white/10 transition-colors">
                  <ExternalLink className="h-3 w-3 inline mr-1" />Site
                </Link>
                <button onClick={logout} className="flex-1 text-center text-caption-sm text-clay/60 hover:text-clay py-1.5 rounded-editorial-xs hover:bg-white/10 transition-colors">
                  <LogOut className="h-3 w-3 inline mr-1" />Logout
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <NotificationProvider>
          <ConfirmProvider>
            {/* Top bar */}
          <div className="h-16 bg-cream-100 border-b border-border flex items-center px-6 gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-ink-soft hover:text-ink transition-colors p-1.5 rounded-editorial-xs hover:bg-cream-300">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-body-sm text-ink-muted uppercase tracking-wider">{adminTitle}</span>
            <div className="flex-1" />
            <NotificationBell />
          </div>

          <main className="flex-1 overflow-auto">
            <div className="section-container py-8">
              {children}
            </div>
          </main>
          <Toaster />
          </ConfirmProvider>
          </NotificationProvider>
        </div>
      </div>
  );
}
