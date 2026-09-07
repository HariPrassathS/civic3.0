'use client';

// =============================================================================
// CivicConnect TN — Role Test Portal Shell
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS } from '@/config/roles';
import { UserRole } from '@/types/enums';

interface RoleTestPortalProps {
  title: string;
  expectedRole: UserRole;
  scopeDescription: string;
}

export function RoleTestPortal({
  title,
  expectedRole,
  scopeDescription,
}: RoleTestPortalProps) {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
            TN
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">CivicConnect TN</h1>
            <p className="text-[11px] text-slate-400">Government of Tamil Nadu</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200">{user.display_name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {ROLE_LABELS[user.role]} ({user.role})
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                Phase 2 Auth Verification Portal
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">{title}</h2>
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Expected Role: {expectedRole}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {scopeDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Authentication Status</div>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified & Authorized
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Session Role Claim</div>
              <div className="text-sm font-semibold text-white font-mono">
                {user?.role || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Route Navigation Links for Testing */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Role Navigation Matrix (Test All Routes)
          </h3>
          <p className="text-xs text-slate-500">
            Clicking a route outside your role privilege will trigger 403 Access Restriction.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            <Link
              href="/citizen"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /citizen
            </Link>
            <Link
              href="/field"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /field
            </Link>
            <Link
              href="/dashboard/area-officer"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/area-officer
            </Link>
            <Link
              href="/dashboard/dept-head"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/dept-head
            </Link>
            <Link
              href="/dashboard/commissioner"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/commissioner
            </Link>
            <Link
              href="/dashboard/collector"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/collector
            </Link>
            <Link
              href="/dashboard/secretary"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/secretary
            </Link>
            <Link
              href="/dashboard/chief-secretary"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/chief-secretary
            </Link>
            <Link
              href="/dashboard/chief-minister"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /dashboard/chief-minister
            </Link>
            <Link
              href="/admin"
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 text-center transition-all"
            >
              /admin
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
