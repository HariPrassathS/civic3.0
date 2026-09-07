// =============================================================================
// CivicConnect TN — In-App Notifications API Route (/api/notifications)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NOTIFICATIONS_MEMORY_STORE } from '@/lib/notifications/providers/in-app';
import { NotificationRecord } from '@/lib/notifications/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'dev-user-citizen';

    let notifs: NotificationRecord[] = [];

    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          notifs = data as unknown as NotificationRecord[];
        }
      }
    } catch {
      // Memory fallback if DB offline
    }

    // Merge in-memory notifications not yet in DB
    const memoryUserNotifs = NOTIFICATIONS_MEMORY_STORE.filter((n) => n.user_id === userId);
    for (const memNotif of memoryUserNotifs) {
      if (!notifs.some((n) => n.id === memNotif.id)) {
        notifs.unshift(memNotif);
      }
    }

    const unreadCount = notifs.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifs,
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    console.error('[/api/notifications GET error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notification_id, mark_all_read } = body;
    const user = await getCurrentUser();
    const userId = user?.id || 'dev-user-citizen';

    if (mark_all_read) {
      NOTIFICATIONS_MEMORY_STORE.forEach((n) => {
        if (n.user_id === userId || n.user_id === 'dev-user-citizen') {
          n.is_read = true;
        }
      });

      try {
        const supabase = createAdminClient();
        if (supabase) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
        }
      } catch {
        // Memory fallback
      }
    } else if (notification_id) {
      const target = NOTIFICATIONS_MEMORY_STORE.find((n) => n.id === notification_id);
      if (target) target.is_read = true;

      try {
        const supabase = createAdminClient();
        if (supabase) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notification_id);
        }
      } catch {
        // Memory fallback
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications updated',
    });
  } catch (error) {
    console.error('[/api/notifications PATCH error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
