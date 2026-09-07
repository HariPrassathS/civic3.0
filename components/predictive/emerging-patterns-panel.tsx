'use client';

// =============================================================================
// CivicConnect TN — Emerging Patterns & Velocity Acceleration Panel
// =============================================================================

import React from 'react';
import { EmergingPattern } from '@/lib/predictive/types';
import { TrendingUp, Flame, ArrowUpRight, Activity, MapPin, Gauge } from 'lucide-react';

interface EmergingPatternsPanelProps {
  patterns: EmergingPattern[];
}

export function EmergingPatternsPanel({ patterns }: EmergingPatternsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Emerging Velocity Spikes & Accelerated Inflow
            </h3>
            <p className="text-xs text-slate-400">
              Week-over-week complaint surges ($dN/dt &gt; 25\%$) indicating emerging systemic strain
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {patterns.length} Active Surges
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {patterns.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-500">
            No sharp complaint velocity surges detected across active monitoring zones.
          </div>
        ) : (
          patterns.map((pattern) => {
            const isHighSurge = pattern.current_velocity_wow_pct >= 60;
            const maxWeekly = Math.max(...pattern.weekly_counts, 1);

            return (
              <div
                key={pattern.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-white leading-tight">
                      {pattern.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{pattern.locality}</span>
                      {pattern.ward && (
                        <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300">
                          Ward {pattern.ward}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 ${
                      isHighSurge
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    +{pattern.current_velocity_wow_pct}%
                  </span>
                </div>

                {/* 4-Week Sparkline / Velocity Histogram */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>4-Week Inflow Profile</span>
                    <span>Projected Next: ~{pattern.projected_count_next_period} issues</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-10 pt-1">
                    {pattern.weekly_counts.map((count, idx) => {
                      const heightPct = Math.max(15, Math.round((count / maxWeekly) * 100));
                      const isLatest = idx === pattern.weekly_counts.length - 1;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t transition-all ${
                              isLatest
                                ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                                : 'bg-slate-700'
                            }`}
                          />
                          <span className="text-[9px] text-slate-500">W{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-900 pt-2">
                  {pattern.summary}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
