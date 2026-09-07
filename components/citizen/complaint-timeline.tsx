'use client';

// =============================================================================
// CivicConnect TN — Complaint Visual Lifecycle Timeline Component
// =============================================================================

import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Wrench, ShieldCheck, CheckCheck } from 'lucide-react';
import { ComplaintStatus } from '@/types/enums';

interface TimelineProps {
  status: ComplaintStatus | string;
  updates?: {
    id: string;
    new_status: string | null;
    update_type: string;
    notes: string | null;
    created_at: string;
  }[];
}

const LIFECYCLE_STAGES = [
  { key: 'created', label: 'Reported', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: ShieldCheck },
  { key: 'in_progress', label: 'In Progress', icon: Wrench },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { key: 'closed', label: 'Closed', icon: CheckCheck },
];

function getStageIndex(status: string): number {
  switch (status) {
    case 'created':
    case 'ai_processing':
    case 'validated':
      return 0;
    case 'assigned':
      return 1;
    case 'in_progress':
      return 2;
    case 'resolution_submitted':
    case 'officer_verification':
      return 2.5;
    case 'resolved':
    case 'citizen_feedback':
      return 3;
    case 'closed':
      return 4;
    case 'reopened':
      return 1;
    case 'rejected':
      return -1;
    default:
      return 0;
  }
}

export function ComplaintTimeline({ status, updates = [] }: TimelineProps) {
  const currentIndex = getStageIndex(status);
  const isRejected = status === 'rejected';
  const isResolved = status === 'resolved';
  const isClosed = status === 'closed';

  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar (Desktop & Tablet) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Grievance Lifecycle Progress
          </h3>
          {isResolved && (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/60 animate-pulse">
              Awaiting Citizen Rating
            </span>
          )}
          {isClosed && (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
              ✓ 100% Complete & Closed
            </span>
          )}
        </div>

        {isRejected ? (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>This complaint was reviewed and marked as rejected / duplicate by municipal officers.</span>
          </div>
        ) : (
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 hidden sm:block -z-0" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-emerald-500 transition-all duration-500 hidden sm:block -z-0"
              style={{
                width: `${Math.min(100, Math.max(0, (currentIndex / (LIFECYCLE_STAGES.length - 1)) * 100))}%`,
              }}
            />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = currentIndex >= idx;
                const isCurrent = Math.floor(currentIndex) === idx;

                return (
                  <div
                    key={stage.key}
                    className={`flex sm:flex-col items-center gap-2.5 p-2 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                        : isPassed
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-600 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="text-xs font-semibold">{stage.label}</div>
                      <div className="text-[10px] text-slate-400">
                        {isCurrent ? 'Current Stage' : isPassed ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolution callout banner */}
        {isResolved && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border border-amber-500/40 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-200">
                  Officer Verified & Approved
                </div>
                <p className="text-[11px] text-slate-300">
                  Area municipal officer verified the field work. Click <strong className="text-amber-300">Rate Resolution</strong> above to confirm and complete closure.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Activity Log */}
      {sortedUpdates.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Official Activity & Update Log
          </h3>

          <div className="space-y-4 relative pl-4 border-l border-slate-800">
            {sortedUpdates.map((upd, idx) => (
              <div key={upd.id || idx} className="relative group">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-950" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-200 capitalize">
                      {upd.new_status ? upd.new_status.replace(/_/g, ' ') : 'Status Update'}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(upd.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {upd.notes && (
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {upd.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
