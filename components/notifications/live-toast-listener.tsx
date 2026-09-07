'use client';

// =============================================================================
// CivicConnect TN — Global Live Realtime Notification Toast Listener
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { NotificationRecord } from '@/lib/notifications/types';
import { Bell, ArrowRight, X } from 'lucide-react';

interface LiveToastListenerProps {
  notification: NotificationRecord | null;
  onDismiss: () => void;
  onOpenDrawer: () => void;
}

export function LiveToastListener({
  notification,
  onDismiss,
  onOpenDrawer,
}: LiveToastListenerProps) {
  if (!notification) return null;

  const trackingId = (notification.metadata?.tracking_id as string) || '';

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl backdrop-blur-xl space-y-2 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              Live Realtime Update
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          <h4 className="font-bold text-white text-xs">{notification.title}</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{notification.body}</p>
        </div>

        <div className="pt-1 flex items-center justify-between border-t border-slate-800">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Open Notifications
          </button>
          {trackingId && (
            <Link
              href={`/track/${trackingId}`}
              onClick={onDismiss}
              className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>View Case</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
