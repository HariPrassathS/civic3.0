'use client';

// =============================================================================
// CivicConnect TN — SLA Analytics & Turnaround Efficiency Visualizations
// =============================================================================

import React from 'react';
import { SLAMetric } from '@/lib/data-mining/types';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, Flame, Award } from 'lucide-react';

interface SLAChartProps {
  slaData: SLAMetric;
  totalComplaints: number;
}

export function SLAAnalyticsChart({ slaData, totalComplaints }: SLAChartProps) {
  const metPct = slaData.compliance_pct;
  const breachedPct = Math.max(0, 100 - metPct);

  const priorityTiers = [
    { label: '🚨 Urgent', slaTarget: 12, actual: slaData.avg_hours_urgent, color: 'text-rose-400', barColor: 'bg-rose-500' },
    { label: '🔥 High', slaTarget: 24, actual: slaData.avg_hours_high, color: 'text-amber-400', barColor: 'bg-amber-500' },
    { label: '⚡ Medium', slaTarget: 48, actual: slaData.avg_hours_medium, color: 'text-sky-400', barColor: 'bg-sky-500' },
    { label: '📋 Low', slaTarget: 72, actual: slaData.avg_hours_low, color: 'text-slate-400', barColor: 'bg-slate-500' },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SLA Compliance Performance & Target Latencies</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Citizen charter adherence, SLA breach analysis, and actual turnaround vs statutory SLA targets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800/50">
            {metPct}% Overall Compliance
          </span>
        </div>
      </div>

      {/* SLA Met vs Breached Visual Bar */}
      <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SLA Met: {slaData.sla_met_count} ({metPct}%)</span>
          </span>
          <span className="text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SLA Breached: {slaData.sla_breached_count} ({breachedPct}%)</span>
          </span>
        </div>

        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${metPct}%` }}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-l-full transition-all duration-700 ease-out"
          />
          <div
            style={{ width: `${breachedPct}%` }}
            className="bg-rose-500 h-full rounded-r-full transition-all duration-700 ease-out"
          />
        </div>

        {slaData.sla_approaching_count > 0 && (
          <div className="text-[11px] text-amber-300 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{slaData.sla_approaching_count} unresolved grievances approaching SLA deadline within 12h</span>
            </span>
            <span className="font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/40">
              Action Required
            </span>
          </div>
        )}
      </div>

      {/* Target vs Actual Resolution Time by Priority Tier */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200">
          Turnaround Velocity vs Statutory SLA Target (Hours)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {priorityTiers.map((tier) => {
            const isWithinTarget = tier.actual <= tier.slaTarget;
            const progressPct = Math.min(100, Math.round((tier.actual / (tier.slaTarget * 1.5)) * 100));

            return (
              <div
                key={tier.label}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${tier.color}`}>{tier.label}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">Target: {tier.slaTarget}h</span>
                    <span className={isWithinTarget ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      Actual: {tier.actual}h
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${progressPct}%` }}
                    className={`${isWithinTarget ? 'bg-emerald-500' : 'bg-rose-500'} h-full rounded-full transition-all duration-500`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Standard SLA Deadline: {tier.slaTarget} Hours</span>
                  <span>{isWithinTarget ? '✓ On Track' : '⚠ Latency Detected'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
