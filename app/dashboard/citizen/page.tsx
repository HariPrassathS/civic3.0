'use client';

// =============================================================================
// CivicConnect TN — Citizen Personal Dashboard (/dashboard/citizen)
// =============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Bell,
  LogOut,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { ComplaintCard } from '@/components/citizen/complaint-card';
import { useAuth } from '@/hooks/use-auth';
import type { Complaint } from '@/types/database';

interface CitizenComplaintItem extends Complaint {
  upvotes_count?: number;
  comments_count?: number;
  is_upvoted?: boolean;
  distance_km?: number;
  media?: { url: string; media_type?: string }[];
}

interface NotificationItem {
  id: string;
  user_id: string;
  complaint_id: string | null;
  type: string;
  title: string;
  body: string | null;
  channel: string;
  is_read: boolean;
  metadata?: { tracking_id?: string } | null;
  created_at: string;
}

export default function CitizenDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-complaints' | 'notifications'>('my-complaints');
  const [myComplaints, setMyComplaints] = useState<CitizenComplaintItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const cid = user?.id;
        const [compRes, notifRes] = await Promise.all([
          fetch(cid ? `/api/complaints?citizen_id=${encodeURIComponent(cid)}` : '/api/complaints'),
          fetch('/api/notifications'),
        ]);

        if (compRes.ok) {
          const cData = await compRes.json();
          if (!ignore && cData.success && cData.data?.complaints) {
            setMyComplaints(cData.data.complaints);
          }
        }

        if (notifRes.ok) {
          const nData = await notifRes.json();
          if (!ignore && nData.success && nData.data?.notifications) {
            setNotifications(nData.data.notifications);
          }
        }
      } catch (err) {
        console.error('Failed to load citizen dashboard data:', err);
      } finally {
        if (!ignore) setIsLoadingData(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [user]);

  const markNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Ignore
    }
  };

  const activeCount = myComplaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length;
  const resolvedCount = myComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  const latestComplaint = myComplaints[0];
  const effectiveDistrict = latestComplaint?.district || user?.district || 'Chennai';
  const effectiveWard = latestComplaint?.ward || user?.ward_id;
  const effectiveLocation = effectiveWard ? `${effectiveDistrict} (Ward ${effectiveWard})` : effectiveDistrict;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <CitizenHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* User Profile Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/30">
              <div className="w-full h-full bg-slate-100 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {user?.display_name?.charAt(0) || 'C'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {user?.display_name || 'Citizen Portal'}
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Citizen
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email || 'citizen@civicconnect.tn.gov.in'} • {effectiveLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/submit-issue"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Portal Feature Cards: Voice, Nearby, Community */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/submit-issue"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
              🎙️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Voice Assistant
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Speak in தமிழ் / English to report</p>
            </div>
          </Link>

          <Link
            href="/nearby"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
              📍
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Nearby Ward Issues
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Map view & neighborhood alerts</p>
            </div>
          </Link>

          <Link
            href="/community"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 shadow-xs transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
              👥
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Community Forum
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upvote & discuss civic issues</p>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Filed</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{myComplaints.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">In Progress</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{activeCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Resolved</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{resolvedCount}</div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('my-complaints')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'my-complaints'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Grievances ({myComplaints.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('notifications');
              markNotificationsRead();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Notifications</span>
            {unreadNotifs > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-400 text-slate-950 font-bold rounded-full text-[10px]">
                {unreadNotifs}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: MY COMPLAINTS */}
        {activeTab === 'my-complaints' && (
          <div className="space-y-4">
            {isLoadingData ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse border border-slate-300 dark:border-slate-800" />
                ))}
              </div>
            ) : myComplaints.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
                <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Complaints Filed Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Notice an issue with roads, street lighting, or water in your neighborhood? Report it in seconds!
                </p>
                <Link
                  href="/submit-issue"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Your First Grievance</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myComplaints.map((c) => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
                <Bell className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-900 dark:text-white">All caught up!</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">No new alerts or progress updates at this moment.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
                    !notif.is_read
                      ? 'bg-white dark:bg-slate-900 border-emerald-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-200">{notif.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(notif.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{notif.body}</p>
                  {notif.metadata?.tracking_id && (
                    <Link
                      href={`/track/${encodeURIComponent(notif.metadata.tracking_id)}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                    >
                      <span>Track {notif.metadata.tracking_id}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <CitizenBottomNav />
    </div>
  );
}
