'use client';

// =============================================================================
// CivicConnect TN — Community Grievance Hub & Discussion Page (/community)
// =============================================================================
// Mobile-first public forum where citizens discover nearby civic issues, upvote
// critical defects, post neighborhood updates, and view common issue clusters
// without leaking personal citizen information.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Search,
  Flame,
  Layers,
  Sparkles,
  MapPin,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { CommunityCard } from '@/components/community/community-card';
import { SanitizedPublicComplaint } from '@/lib/community/sanitizer';

const SORT_TABS = [
  { id: 'top', label: '🔥 Top Upvoted', icon: TrendingUp },
  { id: 'common', label: '🔗 Common Issues', icon: Layers },
  { id: 'urgent', label: '🚨 Urgent Priority', icon: AlertTriangle },
  { id: 'recent', label: '⏱️ Most Recent', icon: Clock },
  { id: 'resolved', label: '✅ Resolved', icon: CheckCircle2 },
];

const TN_DISTRICTS = [
  'All Districts',
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Tiruppur',
  'Erode',
  'Vellore',
  'Thoothukudi',
  'Chengalpattu',
  'Kancheepuram',
  'Thiruvallur',
  'Dindigul',
  'Thanjavur',
  'Nilgiris',
  'Cuddalore',
];

export default function CommunityPage() {
  const [activeSort, setActiveSort] = useState('top');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [searchQuery, setSearchQuery] = useState('');
  const [issues, setIssues] = useState<SanitizedPublicComplaint[]>([]);
  const [commonClustersCount, setCommonClustersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const url = new URL('/api/community/issues', window.location.origin);
        url.searchParams.set('sort', activeSort);
        if (districtFilter !== 'All Districts') {
          url.searchParams.set('district', districtFilter);
        }

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.success && data.data?.issues) {
            setIssues(data.data.issues);
            setCommonClustersCount(data.data.common_clusters_count || 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch community issues:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [activeSort, districtFilter, reloadKey]);

  const filteredIssues = issues.filter((issue) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      issue.title?.toLowerCase().includes(q) ||
      issue.description?.toLowerCase().includes(q) ||
      issue.tracking_id?.toLowerCase().includes(q) ||
      (issue.address && issue.address.toLowerCase().includes(q)) ||
      (issue.category_name && issue.category_name.toLowerCase().includes(q))
    );
  });

  const totalUpvotes = issues.reduce((acc, curr) => acc + (curr.upvotes_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white">
      <CitizenHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <Users className="w-3.5 h-3.5" />
              <span>Public Civic Forum & Grievance Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Community Issues Feed
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Discover, upvote, and discuss civic issues in your neighborhood. Help municipal officers prioritize widespread problems.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/submit-issue"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>
          </div>
        </div>

        {/* Civic Activity Stat Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-slate-400">Public Issues</span>
            <span className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              {issues.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Common Hubs</span>
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-300 mt-0.5">
              {commonClustersCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Total Upvotes</span>
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-300 mt-0.5">
              {totalUpvotes}
            </span>
          </div>
        </div>

        {/* Common Issue Explainer Banner when in 'common' sort */}
        {activeSort === 'common' && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex items-start gap-3 text-xs animate-in fade-in">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-200">Shared / Clustered Civic Problems</h4>
              <p className="text-amber-300/80 leading-relaxed">
                When multiple citizens report the same physical breakdown (e.g. water pipeline leaks, road cave-ins, transformer outages) within 350 meters, CivicConnect links them together. Each citizen keeps their distinct tracking ID for SMS/WhatsApp updates, while municipal teams can deploy a single unified crew.
              </p>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500 transition-colors">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Search issues by title, street, locality, or tracking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* District Dropdown */}
            <div className="sm:w-48">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {TN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto gap-1 scrollbar-none">
            {SORT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSort(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeSort === tab.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ISSUES LIST */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-2xl bg-slate-900 animate-pulse border border-slate-800"
                />
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Public Issues Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No public issues match "${searchQuery}". Try adjusting your search keyword or district.`
                  : activeSort === 'common'
                  ? 'No multi-report common issues found in this district at the moment.'
                  : 'There are currently no reported issues matching your selected filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <CommunityCard key={issue.id || issue.tracking_id} complaint={issue} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CitizenBottomNav />
    </div>
  );
}
