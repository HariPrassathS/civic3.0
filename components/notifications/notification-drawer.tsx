'use client';

// =============================================================================
// CivicConnect TN — Real-Time Notification Center Drawer
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  NotificationRecord,
  NotificationEventType,
} from '@/lib/notifications/types';
import {
  X,
  Bell,
  Check,
  CheckCheck,
  Settings,
  Radio,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Zap,
} from 'lucide-react';
import { NotificationPreferencesModal } from './notification-preferences-modal';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationRecord[];
  unreadCount: number;
  isRealtimeConnected: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isRealtimeConnected,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
}: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'alerts' | 'updates'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [isTestDispatching, setIsTestDispatching] = useState(false);

  if (!isOpen) return null;

  // Filter notifications
  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'alerts') {
      return (
        n.type === NotificationEventType.SLA_WARNING ||
        n.type === NotificationEventType.SLA_BREACHED ||
        n.type === NotificationEventType.ESCALATED
      );
    }
    if (activeTab === 'updates') {
      return (
        n.type === NotificationEventType.STATUS_CHANGED ||
        n.type === NotificationEventType.RESOLVED ||
        n.type === NotificationEventType.ASSIGNED
      );
    }
    return true;
  });

  const triggerTestAlert = async (eventType: NotificationEventType) => {
    setIsTestDispatching(true);
    try {
      await fetch('/api/notifications/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType }),
      });
      await onRefresh();
    } catch (err) {
      console.error('Test dispatch error:', err);
    } finally {
      setIsTestDispatching(false);
    }
  };

  const getEventMeta = (type: NotificationEventType) => {
    switch (type) {
      case NotificationEventType.COMPLAINT_SUBMITTED:
        return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Registered' };
      case NotificationEventType.ASSIGNED:
        return { color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', label: 'Assigned' };
      case NotificationEventType.STATUS_CHANGED:
        return { color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', label: 'Status' };
      case NotificationEventType.SLA_WARNING:
        return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'SLA Warning' };
      case NotificationEventType.SLA_BREACHED:
      case NotificationEventType.ESCALATED:
        return { color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'Escalation' };
      case NotificationEventType.RESOLVED:
      case NotificationEventType.VERIFIED:
        return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Resolved' };
      case NotificationEventType.REOPENED:
        return { color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', label: 'Reopened' };
      case NotificationEventType.CLOSED:
      default:
        return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', label: 'Closed' };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm transition-opacity">
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Notifications & Alerts</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {isRealtimeConnected ? 'Realtime Connected' : 'Live Sync Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Notification Preferences"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 text-[11px]">
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800/80">
                {(['all', 'unread', 'alerts', 'updates'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Simulation Trigger Bar (For Demo & Testing) */}
            <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Trigger Live Realtime Event:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isTestDispatching}
                  onClick={() => triggerTestAlert(NotificationEventType.STATUS_CHANGED)}
                  className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold border border-sky-500/30 cursor-pointer disabled:opacity-50"
                >
                  Status
                </button>
                <button
                  type="button"
                  disabled={isTestDispatching}
                  onClick={() => triggerTestAlert(NotificationEventType.SLA_WARNING)}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 cursor-pointer disabled:opacity-50"
                >
                  SLA Alert
                </button>
                <button
                  type="button"
                  disabled={isTestDispatching}
                  onClick={() => triggerTestAlert(NotificationEventType.RESOLVED)}
                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 cursor-pointer disabled:opacity-50"
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filtered.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Bell className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">No notifications in this view.</p>
                </div>
              ) : (
                filtered.map((item) => {
                  const meta = getEventMeta(item.type);
                  const trackingId = (item.metadata?.tracking_id as string) || '';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onMarkAsRead(item.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        item.is_read
                          ? 'bg-slate-950/60 border-slate-800/60 opacity-80 hover:opacity-100'
                          : 'bg-slate-900 border-slate-700 shadow-md hover:border-emerald-500/50'
                      }`}
                    >
                      {!item.is_read && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}

                      <div className="flex items-start gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border flex-shrink-0 mt-0.5 ${meta.color}`}
                        >
                          {meta.label}
                        </span>

                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-xs text-slate-100 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {item.body}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {trackingId && (
                              <Link
                                href={`/track/${trackingId}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                }}
                                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                              >
                                <span>Track</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
}
