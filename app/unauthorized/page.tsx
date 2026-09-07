'use client';

// =============================================================================
// CivicConnect TN — 403 Access Restricted (Unauthorized) Page
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getRoleHomePath, ROLE_LABELS } from '@/config/roles';

export default function UnauthorizedPage() {
  const { user, logout, isLoading } = useAuth();
  const homePath = user ? getRoleHomePath(user.role) : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/90 border border-rose-900/40 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800/40">
          403 Access Restricted
        </span>

        <h1 className="text-2xl font-bold text-white mt-4 mb-2">
          Insufficient Permissions
        </h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          You do not have the necessary security authorization or government clearance to access this department portal or route.
        </p>

        {user && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 mb-6 text-left">
            <div className="text-slate-500 text-[11px]">Current Session:</div>
            <div className="font-semibold text-slate-200">{user.display_name}</div>
            <div className="text-emerald-400">
              Assigned Role: {ROLE_LABELS[user.role]} ({user.role})
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={homePath}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all text-center shadow-lg shadow-emerald-950"
          >
            Go to My Authorized Portal
          </Link>

          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            Switch Account / Logout
          </button>
        </div>
      </div>
    </div>
  );
}
