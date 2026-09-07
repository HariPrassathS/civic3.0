'use client';

// =============================================================================
// CivicConnect TN — Citizen Zero-Login Voice-First Homepage (/)
// =============================================================================
// Designed for elderly, low-literacy, and mobile citizens.
// Immediate access to Voice Assistant and Voice Tracking without mandatory registration.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Mic,
  Compass,
  FileText,
  ArrowRight,
  CheckCircle2,
  Droplet,
  Truck,
  Trash2,
  Lightbulb,
  Building,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { ComplaintCard } from '@/components/citizen/complaint-card';
import { VoiceAssistantModal } from '@/components/voice/voice-assistant-modal';
import type { Complaint } from '@/types/database';

interface RecentComplaintItem extends Complaint {
  upvotes_count?: number;
  comments_count?: number;
  is_upvoted?: boolean;
  distance_km?: number;
  media?: { url: string; media_type?: string }[];
}

export default function HomePage() {
  const router = useRouter();
  const [trackingQuery, setTrackingQuery] = useState('');
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceModalMode, setVoiceModalMode] = useState<'register' | 'track'>('register');

  useEffect(() => {
    async function loadRecentIssues() {
      try {
        const res = await fetch('/api/community/issues?sort=recent');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.issues) {
            setRecentComplaints(data.data.issues.slice(0, 4));
          }
        }
      } catch (error) {
        console.error('Failed to load recent issues:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentIssues();
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingQuery.trim()) {
      router.push(`/track/${encodeURIComponent(trackingQuery.trim())}`);
    }
  };

  const handleOpenVoiceRegister = () => {
    setVoiceModalMode('register');
    setShowVoiceModal(true);
  };

  const handleOpenVoiceTrack = () => {
    setVoiceModalMode('track');
    setShowVoiceModal(true);
  };

  const quickCategories = [
    { name: 'Roads & Potholes', icon: Truck, color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400' },
    { name: 'Water & Sewage', icon: Droplet, color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400' },
    { name: 'Solid Waste / Garbage', icon: Trash2, color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400' },
    { name: 'Street Lights & Power', icon: Lightbulb, color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400' },
    { name: 'Drainage & Canals', icon: Building, color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white relative transition-colors">
      <CitizenHeader />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Government of Tamil Nadu • Civic Redressal
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            How can we <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300 bg-clip-text text-transparent">
              help you today?
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Zero mandatory login. Speak in Tamil, Tanglish, or English.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2 PRIMARY HERO VOICE ACTIONS (LARGE & ACCESSIBLE) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Action 1: REPORT A PROBLEM (VOICE) */}
          <button
            type="button"
            onClick={handleOpenVoiceRegister}
            className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/60 hover:border-emerald-500 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-950/60 transition-all flex flex-col justify-between text-left cursor-pointer active:scale-[0.99] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl group-hover:scale-125 transition-all" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 dark:shadow-emerald-950">
                  <Mic className="w-8 h-8 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Voice First</span>
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                  REPORT A PROBLEM
                </h2>
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  Speak about your problem
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                  No typing required. Just tap and tell us about potholes, water leaks, streetlights, or waste in your area.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Tap to Speak Now</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Action 2: TRACK A COMPLAINT (VOICE) */}
          <button
            type="button"
            onClick={handleOpenVoiceTrack}
            className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-blue-950 dark:via-slate-900 dark:to-slate-900 border-2 border-blue-500/40 dark:border-blue-600/60 hover:border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-950/60 transition-all flex flex-col justify-between text-left cursor-pointer active:scale-[0.99] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl group-hover:scale-125 transition-all" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 dark:shadow-blue-950">
                  <Search className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-bold bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>No Code Needed</span>
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                  TRACK A COMPLAINT
                </h2>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  Tell us about your complaint
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                  Forgot your reference number? Simply tell us your name, issue, or street to check real-time resolution progress.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Track with Voice</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Secondary Quick Access Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/submit-issue"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                Manual Form
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Type details & upload photos
              </div>
            </div>
          </Link>

          <Link
            href="/track"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300">
                Track by ID
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter CC-TN-2026 code
              </div>
            </div>
          </Link>

          <Link
            href="/nearby"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:text-amber-600 dark:group-hover:text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300">
                Nearby Issues
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Map view in your ward
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Search & Tracking Bar Fallback */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <form onSubmit={handleTrackSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Direct Reference Code Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Reference ID (e.g. CC-TN-2026-104821)..."
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
              >
                Track
              </button>
            </div>
          </form>
        </div>

        {/* Quick Categories Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Browse Common Civic Categories
            </h3>
            <Link href="/submit-issue" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              View All Categories →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {quickCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  href="/submit-issue"
                  className={`p-3 rounded-xl bg-gradient-to-br ${cat.color} border transition-all hover:scale-102 flex flex-col items-center text-center gap-2 group shadow-xs`}
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Grievances Feed Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Live Community Redressal Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Civic issues recently reported across Chennai and Tamil Nadu
              </p>
            </div>
            <Link
              href="/community"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
            >
              <span>View Full Community Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse border border-slate-300 dark:border-slate-800" />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-900 dark:text-white">No active grievances</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Be the first to report an infrastructure or civic issue in your ward!
              </p>
              <button
                type="button"
                onClick={handleOpenVoiceRegister}
                className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium cursor-pointer shadow-sm"
              >
                Speak to Report an Issue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentComplaints.map((cmp) => (
                <ComplaintCard key={cmp.id} complaint={cmp} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Voice Assistant Interactive Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        initialMode={voiceModalMode}
        onClose={() => setShowVoiceModal(false)}
        onSubmitted={() => {
          // Keep modal open on success screen or handle refresh
        }}
      />

      {/* Mobile Bottom Navigation */}
      <CitizenBottomNav />
    </div>
  );
}
