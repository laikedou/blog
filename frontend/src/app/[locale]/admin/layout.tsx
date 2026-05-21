'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { siteConfig as siteConfigApi } from '@/lib/api';
import LanguageSwitcher from '@/components/ui/language/LanguageSwitcher';
import { Toaster } from '@/components/Toaster';
import NotificationBell from '@/components/NotificationBell';
import { NotificationProvider } from '@/lib/notification-context';
import { ConfirmProvider } from '@/lib/confirm-dialog';

const navItems = [
  { href: '/admin', label: 'admin.dashboard', icon: 'grid_view' },
  { href: '/admin/posts', label: 'admin.posts', icon: 'description' },
  { href: '/admin/visualizations', label: 'admin.visualizations', icon: 'monitoring' },
  { href: '/admin/experiments', label: 'admin.experiments', icon: 'science' },
  { href: '/admin/banners', label: 'admin.banners', icon: 'view_carousel' },
  { href: '/admin/categories', label: 'admin.categories', icon: 'category' },
  { href: '/admin/tags', label: 'admin.tags', icon: 'label' },
  { href: '/admin/comments', label: 'admin.comments', icon: 'forum' },
  { href: '/admin/chat-analytics', label: 'admin.chatAnalytics', icon: 'bar_chart' },
  { href: '/admin/media', label: 'admin.media', icon: 'perm_media' },
  { href: '/admin/seo', label: 'admin.seo', icon: 'search' },
  { href: '/admin/crawl', label: 'admin.crawl', icon: 'bug_report' },
  { href: '/admin/logs', label: 'admin.logs', icon: 'settings' },
  { href: '/admin/ai-usage', label: 'admin.aiUsage', icon: 'spark' },
  { href: '/admin/settings', label: 'admin.settings', icon: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminTitle, setAdminTitle] = useState('Blog Admin');
  const [siteTitle, setSiteTitle] = useState('AI Blog');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    siteConfigApi.get().then(config => {
      if (config.adminTitle) setAdminTitle(config.adminTitle);
      if (config.siteTitle) setSiteTitle(config.siteTitle);
    }).catch(() => {});
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl animate-pulse">spark</span>
          <span className="text-on-surface-variant text-sm font-label-sm">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased flex overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen w-[260px] fixed left-0 top-0 border-r border-outline-variant/20 z-50 bg-surface/60 backdrop-blur-xl shadow-xl transition-all duration-300 ${sidebarOpen ? '' : '-ml-[260px]'}`}>
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-outline-variant/10">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center border border-primary/20 inner-glow shrink-0">
            <span className="material-symbols-outlined text-primary">token</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight truncate">{siteTitle}</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider truncate">{adminTitle}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-primary/10 text-primary border-l-[3px] border-primary shadow-[inset_1px_0_10px_rgba(175,198,255,0.05)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'fill' : ''}`}>{item.icon}</span>
                <span className={`font-body-md text-body-md ${active ? 'font-semibold' : 'font-medium'}`}>{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 px-3 pb-4 border-t border-outline-variant/10 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary-container p-[1px]">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-primary font-label-md text-sm">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-on-surface font-medium truncate leading-tight">{user?.displayName}</p>
              <p className="font-label-sm text-[11px] text-on-surface-variant truncate">{user?.email}</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            <span className="font-body-sm">View Site</span>
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-error/80 hover:text-error hover:bg-error/10 transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="font-body-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen relative ${sidebarOpen ? 'md:ml-[260px]' : ''}`}>
        <NotificationProvider>
          <ConfirmProvider>
            {/* Topbar */}
            <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 flex items-center justify-between px-6 sticky top-0 z-40 w-full">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 rounded-full p-2 transition-all"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="hidden md:flex items-center gap-2 text-on-surface-variant">
                  <span className="font-label-md text-label-md">{adminTitle}</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  <span className="font-label-md text-label-md text-primary font-bold">
                    {navItems.find(i => isActive(i.href)) ? t(navItems.find(i => isActive(i.href))!.label) : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher variant="icon" />
                <NotificationBell />
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto z-10">
              <div className="p-container-padding max-w-[1600px] w-full mx-auto">
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
