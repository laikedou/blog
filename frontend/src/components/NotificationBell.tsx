'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2, Globe, Volume2, VolumeX } from 'lucide-react';
import { useNotifications, CrawlNotification } from '@/lib/notification-context';

function formatRelativeTime(t: (key: string, opts?: any) => string, iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t('common.justNow');
  const min = Math.floor(sec / 60);
  if (min < 60) return t('common.minutesAgo', { count: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('common.hoursAgo', { count: hr });
  const day = Math.floor(hr / 24);
  return t('common.daysAgo', { count: day });
}

function NotificationIcon({ type }: { type: CrawlNotification['type'] }) {
  switch (type) {
    case 'crawl:started':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />;
    case 'crawl:article':
      return <Globe className="h-4 w-4 text-teal shrink-0" />;
    case 'crawl:complete':
      return <CheckCheck className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
}

function getBg(type: CrawlNotification['type'], read: boolean) {
  if (read) return 'bg-transparent';
  switch (type) {
    case 'crawl:article': return 'bg-teal-pale';
    case 'crawl:complete': return 'bg-cream-300/60';
    case 'crawl:started': return 'bg-cream-200/60';
  }
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, soundEnabled, toggleSound, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleNotificationClick = (note: CrawlNotification) => {
    setOpen(false);
    if (note.type.startsWith('crawl:')) {
      router.push('/admin/crawl');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-editorial-xs text-ink-soft hover:text-ink hover:bg-cream-300 transition-colors"
        title={t('admin.notifications')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-micro font-bold text-white bg-clay rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[400px] max-h-[520px] bg-surface shadow-xl border border-border rounded-editorial-sm overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-cream-100">
            <h3 className="text-body-sm font-semibold text-ink">
              {t('admin.notifications')}
              {unreadCount > 0 && (
                <span className="ml-2 text-caption-sm text-ink-muted font-normal">{t('admin.notificationsUnread', { count: unreadCount })}</span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded-editorial-xs transition-colors ${soundEnabled ? 'text-ink-muted hover:text-ink hover:bg-cream-300' : 'text-ink-faint hover:text-ink-muted'}`}
                title={soundEnabled ? t('admin.muteSound') : t('admin.enableSound')}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded-editorial-xs text-ink-muted hover:text-ink hover:bg-cream-300 transition-colors"
                  title={t('admin.markAllRead')}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-editorial-xs text-ink-muted hover:text-clay hover:bg-clay-subtle/20 transition-colors"
                  title={t('admin.clearAll')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-body-sm">{t('admin.noNotifications')}</p>
              <p className="text-caption-sm">{t('admin.notificationsDesc')}</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[440px]">
              {notifications.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleNotificationClick(note)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors hover:bg-cream-200/60 ${getBg(note.type, note.read)}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <NotificationIcon type={note.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-body-sm font-medium text-ink truncate">{note.title}</span>
                        <span className="text-micro text-ink-muted shrink-0">{formatRelativeTime(t, note.timestamp)}</span>
                      </div>
                      <p className="text-caption-sm text-ink-muted mt-0.5 line-clamp-2">{note.message}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setOpen(false); router.push('/admin/crawl'); }}
                className="w-full text-center py-2.5 text-caption-sm text-teal hover:text-teal-light bg-cream-100 hover:bg-cream-300 transition-colors border-t border-border"
              >
                <ExternalLink className="h-3 w-3 inline mr-1" />{t('admin.viewCrawlPage')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
