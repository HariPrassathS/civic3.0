'use client';

// =============================================================================
// CivicConnect TN — Notification Preferences Modal
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  NotificationPreferences,
  NotificationEventType,
  NotificationChannel,
} from '@/lib/notifications/types';
import {
  X,
  Bell,
  Smartphone,
  Mail,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
} from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPreferences() {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications/preferences');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setPrefs(json.data.preferences);
          }
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [isOpen]);

  const handleToggleChannel = (channel: keyof NotificationPreferences['channels']) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      channels: {
        ...prefs.channels,
        [channel]: !prefs.channels[channel],
      },
    });
  };

  const handleToggleEvent = (event: NotificationEventType) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      events: {
        ...prefs.events,
        [event]: !prefs.events[event],
      },
    });
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (res.ok) {
        setToastMessage('Preferences saved successfully!');
        setTimeout(() => {
          setToastMessage(null);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Notification & Alert Preferences</h3>
              <p className="text-xs text-slate-400">Configure delivery channels and event triggers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading || !prefs ? (
            <div className="py-12 text-center text-slate-500">Loading preferences...</div>
          ) : (
            <>
              {/* 1. Delivery Channels Matrix */}
              <div className="space-y-3">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                  Delivery Channels
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* In-App */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.channels.in_app}
                      onChange={() => handleToggleChannel('in_app')}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-200 block">In-App</span>
                      <span className="text-[10px] text-slate-400">Portal bell inbox</span>
                    </div>
                  </label>

                  {/* Realtime Broadcast */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.channels.realtime}
                      onChange={() => handleToggleChannel('realtime')}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-cyan-300 block">Realtime Live</span>
                      <span className="text-[10px] text-slate-400">Instant toast popup</span>
                    </div>
                  </label>

                  {/* Email */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.channels.email}
                      onChange={() => handleToggleChannel('email')}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-200 block">Email Digest</span>
                      <span className="text-[10px] text-slate-400">Case updates & receipts</span>
                    </div>
                  </label>

                  {/* SMS */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.channels.sms}
                      onChange={() => handleToggleChannel('sms')}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-200 block">SMS Alerts</span>
                      <span className="text-[10px] text-slate-400">OTP & urgent status</span>
                    </div>
                  </label>

                  {/* Push Notifications */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.channels.push}
                      onChange={() => handleToggleChannel('push')}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-200 block">Web Push</span>
                      <span className="text-[10px] text-slate-400">Browser notifications</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Lifecycle Event Subscriptions */}
              <div className="space-y-3">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                  Event Subscriptions (10 Lifecycle Events)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: NotificationEventType.COMPLAINT_SUBMITTED, label: 'Complaint Registered', desc: 'Acknowledgement with Tracking ID' },
                    { id: NotificationEventType.ASSIGNED, label: 'Task Assigned', desc: 'When assigned to field crew' },
                    { id: NotificationEventType.STATUS_CHANGED, label: 'Status Transitions', desc: 'In-progress, on-hold updates' },
                    { id: NotificationEventType.SLA_WARNING, label: 'SLA Approaching Warning', desc: 'Urgent deadline alerts' },
                    { id: NotificationEventType.SLA_BREACHED, label: 'SLA Breached', desc: 'Escalation trigger alert' },
                    { id: NotificationEventType.ESCALATED, label: 'Statutory Escalation', desc: 'Level 1–8 officer reassignments' },
                    { id: NotificationEventType.RESOLVED, label: 'Issue Resolved', desc: 'Fix submitted for review' },
                    { id: NotificationEventType.REOPENED, label: 'Issue Reopened', desc: 'When citizen requests rework' },
                    { id: NotificationEventType.VERIFIED, label: 'Resolution Verified', desc: 'Quality audit verification' },
                    { id: NotificationEventType.CLOSED, label: 'Case Closed', desc: 'Final case closure' },
                  ].map((evt) => (
                    <label
                      key={evt.id}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={prefs.events[evt.id as NotificationEventType] ?? true}
                        onChange={() => handleToggleEvent(evt.id as NotificationEventType)}
                        className="rounded accent-emerald-500 w-4 h-4 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-200 block text-xs">{evt.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{evt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Quiet Hours */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block text-xs">Quiet Hours (22:00 – 07:00)</span>
                  <span className="text-[10px] text-slate-400">Silence noisy SMS & Push alerts during night hours</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.quiet_hours?.enabled ?? false}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      quiet_hours: {
                        enabled: e.target.checked,
                        start: '22:00',
                        end: '07:00',
                      },
                    })
                  }
                  className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {toastMessage && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}
          {!toastMessage && <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
