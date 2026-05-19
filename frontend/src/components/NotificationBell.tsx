'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useNotifications, CrawlNotification } from '@/lib/notification-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

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
      return (
        <svg className="animate-spin h-4 w-4 text-tertiary shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    case 'crawl:article':
      return <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0">language</span>;
    case 'crawl:complete':
      return <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0">check</span>;
    case 'comment:reply':
      return <span className="material-symbols-outlined text-[16px] text-primary shrink-0">chat_bubble</span>;
  }
}

function getBg(type: CrawlNotification['type'], read: boolean) {
  if (read) return 'bg-transparent';
  switch (type) {
    case 'crawl:article': return 'bg-tertiary/5';
    case 'crawl:complete': return 'bg-primary/5';
    case 'crawl:started': return 'bg-surface-container-low/50';
    case 'comment:reply': return 'bg-primary/5';
  }
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, soundEnabled, toggleSound, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleNotificationClick = (note: CrawlNotification) => {
    setOpen(false);
    if (note.type.startsWith('crawl:')) {
      router.push('/admin/crawl');
    } else if (note.type === 'comment:reply') {
      const data = note.data;
      if (data.postId) {
        router.push(`/posts/${data.postId}`);
      } else if (data.visualizationId) {
        router.push(`/visualizations/${data.visualizationId}`);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
          title={t('admin.notifications')}
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-error rounded-full leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-body-sm font-semibold text-on-surface">
            {t('admin.notifications')}
            {unreadCount > 0 && (
              <span className="ml-2 text-label-sm text-on-surface-variant font-normal">
                {t('admin.notificationsUnread', { count: unreadCount })}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition-colors ${
                soundEnabled
                  ? 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  : 'text-on-surface-variant/40 hover:text-on-surface-variant'
              }`}
              title={soundEnabled ? t('admin.muteSound') : t('admin.enableSound')}
            >
              <span className="material-symbols-outlined text-[16px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                title={t('admin.markAllRead')}
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                title={t('admin.clearAll')}
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-30">notifications</span>
            <p className="text-body-sm">{t('admin.noNotifications')}</p>
            <p className="text-label-sm">{t('admin.notificationsDesc')}</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[440px]">
            {notifications.map(note => (
              <button
                key={note.id}
                onClick={() => handleNotificationClick(note)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-white/5 ${getBg(note.type, note.read)}`}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <NotificationIcon type={note.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-body-sm font-medium text-on-surface truncate">{note.title}</span>
                      <span className="text-label-sm text-on-surface-variant shrink-0">{formatRelativeTime(t, note.timestamp)}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{note.message}</p>
                  </div>
                </div>
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); router.push('/admin/crawl'); }}
              className="w-full text-center py-2.5 text-label-sm text-primary hover:text-primary-fixed bg-white/5 hover:bg-white/10 transition-colors border-t border-border"
            >
              <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">open_in_new</span>
              {t('admin.viewCrawlPage')}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
