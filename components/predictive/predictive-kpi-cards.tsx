'use client';

// =============================================================================
// CivicConnect TN — Predictive KPI Count-Up Cards Component
// =============================================================================

import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Calendar,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { PredictiveSummary } from '@/lib/predictive/types';

interface PredictiveKPICardsProps {
  summary: PredictiveSummary;
}

function useCountUp(target: number, durationMs: number = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = target;
    if (start === end) {
      setCount(end);
      return;
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(easeOutQuad * end);
      setCount(current);
      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, durationMs]);

  return count;
}

export function PredictiveKPICards({ summary }: PredictiveKPICardsProps) {
  const totalRisksCount = useCountUp(summary.total_active_risks || 0);
  const criticalCount = useCountUp(summary.critical_risks_count || 0);
  const emergingCount = useCountUp(summary.emerging_patterns_count || 0);
  const problemAreasCount = useCountUp(summary.future_problem_areas_count || 0);
  const directivesCount = useCountUp(summary.preventative_actions_recommended || 0);
  const dispatchedCount = useCountUp(summary.preventative_actions_dispatched || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Potential Risks & Early Warnings */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-slate-900/60 to-slate-950/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Potential Risks Identified
          </span>
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {totalRisksCount}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            {criticalCount} Critical
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Statistical recurrence & chronic failure points
        </p>
      </div>

      {/* 2. Emerging Velocity Surges */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-950/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Emerging Patterns
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {emergingCount}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            Velocity Surges
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          WoW acceleration spikes ($dN/dt &gt; 25\%$)
        </p>
      </div>

      {/* 3. Potential Future Problem Areas */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-950/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Future Problem Areas
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {problemAreasCount}
          </span>
          {summary.highest_risk_ward && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 truncate max-w-[140px]">
              Ward {summary.highest_risk_ward.ward} Peak
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Compounded spatial vulnerability zones
        </p>
      </div>

      {/* 4. Actionable Preventative Directives */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-950/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Preventative Directives
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {directivesCount}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {dispatchedCount} Dispatched
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Actionable crew and machinery work-orders
        </p>
      </div>
    </div>
  );
}
