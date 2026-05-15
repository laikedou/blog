'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface CrawlNotification {
  id: string;
  type: 'crawl:started' | 'crawl:article' | 'crawl:complete';
  title: string;
  message: string;
  timestamp: string;
  data: Record<string, any>;
  read: boolean;
}

interface NotificationContextValue {
  notifications: CrawlNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  soundEnabled: true,
  toggleSound: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// Persist sound preference
const SOUND_KEY = 'crawl_notification_sound';

function getSoundPref(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SOUND_KEY) !== 'false';
}

/** Generate a notification chime via Web Audio API */
export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

/** Send a browser desktop notification (if permitted) */
function sendDesktopNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;
  // Only show when tab is not focused
  if (document.hasFocus?.()) return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : 'http://localhost:4000';

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<CrawlNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(getSoundPref);
  const socketRef = useRef<Socket | null>(null);

  const addNotification = useCallback((note: CrawlNotification, withSound: boolean) => {
    setNotifications(prev => [note, ...prev].slice(0, MAX_NOTIFICATIONS));
    if (withSound && soundEnabled) {
      playNotificationSound();
    }
    sendDesktopNotification(note.title, note.message);
  }, [soundEnabled]);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/notifications`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected to notification server');
    });

    socket.on('crawl:started', (data: { sourceName: string; startedAt: string }) => {
      const note: CrawlNotification = {
        id: `crawl-start-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'crawl:started',
        title: 'Crawl Started',
        message: `Started crawling "${data.sourceName}"`,
        timestamp: data.startedAt,
        data,
        read: false,
      };
      addNotification(note, false);
    });

    socket.on('crawl:article', (data: { title: string; sourceName: string; sourceUrl: string; crawledAt: string; status: 'new' | 'updated' }) => {
      const statusText = data.status === 'new' ? '📄 New article crawled' : '🔄 Article updated';
      const note: CrawlNotification = {
        id: `crawl-article-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'crawl:article',
        title: statusText,
        message: `"${data.title}" from ${data.sourceName}`,
        timestamp: data.crawledAt,
        data,
        read: false,
      };
      addNotification(note, true);
    });

    socket.on('crawl:complete', (data: { sourceName: string; results: { new: number; skipped: number; errors: number; autoPublished: number }; completedAt: string }) => {
      const { new: n, skipped: s, errors: e } = data.results;
      const note: CrawlNotification = {
        id: `crawl-complete-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'crawl:complete',
        title: '✅ Crawl Complete',
        message: `"${data.sourceName}" — ${n} new, ${s} updated, ${e} errors`,
        timestamp: data.completedAt,
        data,
        read: false,
      };
      addNotification(note, true);
    });

    return () => {
      socket.disconnect();
    };
  }, [addNotification]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, soundEnabled, toggleSound, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}
