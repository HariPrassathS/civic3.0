'use client';

// =============================================================================
// CivicConnect TN — Citizen Track Grievance Page (/track)
// =============================================================================
// Supports: tracking ID search, voice-based tracking, authenticated quick access.

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  AlertCircle,
  Mic,
  Clock,
  ChevronRight,
  Clipboard,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { VoiceAssistantModal } from '@/components/voice/voice-assistant-modal';
import { useAuth } from '@/hooks/use-auth';

interface RecentComplaint {
  tracking_id: string;
  title: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Reported', color: 'text-amber-400' },
  validated: { label: 'Validated', color: 'text-blue-400' },
  assigned: { label: 'Assigned', color: 'text-indigo-400' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400' },
  resolution_submitted: { label: 'Fix Submitted', color: 'text-teal-400' },
  officer_verification: { label: 'Verifying', color: 'text-purple-400' },
  resolved: { label: 'Resolved', color: 'text-emerald-400' },
  closed: { label: 'Closed', color: 'text-slate-400' },
  rejected: { label: 'Rejected', color: 'text-rose-400' },
  reopened: { label: 'Reopened', color: 'text-orange-400' },
  escalated: { label: 'Escalated', color: 'text-rose-400' },
};

export default function TrackSearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch authenticated user's recent complaints
  useEffect(() => {
    if (!user?.id) return;
    let ignore = false;

    async function loadRecent() {
      setIsLoadingRecent(true);
      try {
        const res = await fetch(`/api/complaints?citizen_id=${encodeURIComponent(user!.id)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.success && data.data?.complaints) {
            setRecentComplaints(
              data.data.complaints.map((c: Record<string, unknown>) => ({
                tracking_id: c.tracking_id,
                title: c.title,
                status: c.status,
                created_at: c.created_at,
              }))
            );
          }
        }
      } catch {
        // Silently ignore
      } finally {
        if (!ignore) setIsLoadingRecent(false);
      }
    }

    loadRecent();
    return () => {
      ignore = true;
    };
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a Tracking ID (e.g. CC-TN-2026-123456).');
      return;
    }

    setIsSearching(true);
    setError(null);

    // Validate format loosely
    const looksLikeTrackingId = /^(CC[-\s]?TN[-\s]?\d{4}[-\s]?\d{4,6}|\d{6})$/i.test(trimmed);
    if (!looksLikeTrackingId && trimmed.length < 10) {
      setError('Please enter a valid Tracking ID. Format: CC-TN-2026-XXXXXX');
      setIsSearching(false);
      return;
    }

    router.push(`/track/${encodeURIComponent(trimmed)}`);
  };

  const copyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white transition-colors">
      <CitizenHeader />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Search className="w-3.5 h-3.5" />
            <span>Public Tracking System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Track Grievance Redressal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Check real-time stage progress, engineer assignments, and resolution photos with your Tracking ID.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Input Box */}
        <form
          onSubmit={handleSearch}
          className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl flex flex-col sm:flex-row gap-2 transition-colors"
        >
          <div className="flex-1 flex items-center gap-3 px-4 py-2">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="e.g. CC-TN-2026-123456"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-mono"
              aria-label="Tracking ID"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 dark:shadow-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isSearching ? 'Searching...' : 'Track Issue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Voice Track Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-xs shadow-lg shadow-violet-500/25 dark:shadow-violet-950/50 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm">Track by Voice</span>
              <span className="block text-[10px] text-white/80">
                Say your tracking ID or describe your complaint
              </span>
            </div>
          </button>
        </div>

        {/* Authenticated User's Recent Complaints */}
        {user && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                My Recent Complaints
              </span>
              {recentComplaints.length > 0 && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/citizen')}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline transition-colors cursor-pointer font-bold"
                >
                  View All →
                </button>
              )}
            </div>

            {isLoadingRecent ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
                ))}
              </div>
            ) : recentComplaints.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No complaints found. Submit your first grievance to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {recentComplaints.map((item) => {
                  const statusInfo = STATUS_LABELS[item.status] || {
                    label: item.status?.replace(/_/g, ' '),
                    color: 'text-slate-500 dark:text-slate-400',
                  };
                  return (
                    <div
                      key={item.tracking_id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/track/${encodeURIComponent(item.tracking_id)}`);
                        }
                      }}
                      onClick={() => router.push(`/track/${encodeURIComponent(item.tracking_id)}`)}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center justify-between text-left group transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300">
                            {item.tracking_id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTrackingId(item.tracking_id);
                            }}
                            className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Copy Tracking ID"
                          >
                            {copiedId === item.tracking_id ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Clipboard className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            )}
                          </button>
                          <span
                            className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block truncate">
                          {item.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Guest info card */}
        {!user && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-300">Tip:</strong> Sign in to see your recent complaints here for quick access.
            </p>
          </div>
        )}
      </main>

      <CitizenBottomNav />

      {/* Voice Assistant Modal (opens in track mode) */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        initialMode="track"
      />
    </div>
  );
}
