'use client';

// =============================================================================
// CivicConnect TN — Supabase Realtime Notifications Hook
// =============================================================================
// Subscribes to live Postgres changes and broadcast events on Supabase Realtime
// with smooth fallback to local event bus and polling.

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NotificationRecord } from '@/lib/notifications/types';
import { subscribeToLocalRealtime } from '@/lib/notifications/providers/realtime';
import { useAuth } from '@/hooks/use-auth';

export interface UseRealtimeNotificationsReturn {
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  latestNotification: NotificationRecord | null;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { user } = useAuth();
  const userId = user?.id || 'dev-user-citizen';

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [latestNotification, setLatestNotification] = useState<NotificationRecord | null>(null);

  const channelRef = useRef<any>(null);

  // 1. Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.notifications)) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.unread_count || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
    } catch {
      // Ignore background error
    }
  }, []);

  // 3. Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });
    } catch {
      // Ignore background error
    }
  }, []);

  // 4. Handle incoming realtime notification
  const handleIncomingNotification = useCallback((newNotif: NotificationRecord) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
    setLatestNotification(newNotif);

    // Auto clear latest toast after 6 seconds
    setTimeout(() => {
      setLatestNotification((current) => (current?.id === newNotif.id ? null : current));
    }, 6000);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // 5. Connect to Supabase Realtime Channel
    let supabase: any = null;
    try {
      supabase = createClient();
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const channel = supabase
          .channel(`user-notifications:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              if (payload.new) {
                handleIncomingNotification(payload.new as NotificationRecord);
              }
            }
          )
          .on('broadcast', { event: 'notification' }, (payload: any) => {
            if (payload.payload) {
              handleIncomingNotification(payload.payload as NotificationRecord);
            }
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setIsRealtimeConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsRealtimeConnected(false);
            }
          });

        channelRef.current = channel;
      }
    } catch {
      setIsRealtimeConnected(false);
    }

    // 6. Connect to Local Realtime Bus fallback
    const unsubscribeLocal = subscribeToLocalRealtime((notif) => {
      if (notif.user_id === userId || notif.user_id === 'dev-user-citizen') {
        handleIncomingNotification(notif);
        setIsRealtimeConnected(true);
      }
    });

    // 7. Lightweight polling fallback every 8 seconds
    const pollTimer = setInterval(() => {
      fetchNotifications();
    }, 8000);

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
      }
      unsubscribeLocal();
      clearInterval(pollTimer);
    };
  }, [userId, fetchNotifications, handleIncomingNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isRealtimeConnected,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    latestNotification,
  };
}
