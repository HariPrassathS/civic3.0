'use client';

// =============================================================================
// CivicConnect TN — Department Performance & Workload Comparative Chart
// =============================================================================

import React from 'react';
import { DepartmentMetric } from '@/lib/data-mining/types';
import { Building2, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DepartmentChartProps {
  departments: DepartmentMetric[];
  onSelectDepartment?: (deptId: string) => void;
  selectedDeptId?: string;
}

export function DepartmentPerformanceChart({
  departments,
  onSelectDepartment,
  selectedDeptId,
}: DepartmentChartProps) {
  if (!departments || departments.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
        <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
        <div className="text-xs font-semibold text-slate-400">No department performance records found.</div>
      </div>
    );
  }

  const maxAssigned = Math.max(...departments.map((d) => d.total_assigned), 1);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Department Workload & SLA Compliance Matrix</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Workload distribution, resolved cases, SLA compliance rate, and escalation count by department
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Pending</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>SLA Breached</span>
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {departments.map((dept) => {
          const isSelected = selectedDeptId === dept.department_id;
          const resolvedPct = dept.total_assigned > 0 ? (dept.resolved / maxAssigned) * 100 : 0;
          const pendingPct = dept.total_assigned > 0 ? (dept.pending / maxAssigned) * 100 : 0;
          const breachedPct = dept.total_assigned > 0 ? (dept.sla_breached / maxAssigned) * 100 : 0;

          const complianceColor =
            dept.sla_compliance_pct >= 85
              ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50'
              : dept.sla_compliance_pct >= 70
              ? 'text-amber-400 bg-amber-950/80 border-amber-800/50'
              : 'text-rose-400 bg-rose-950/80 border-rose-800/50';

          return (
            <div
              key={dept.department_id}
              onClick={() => onSelectDepartment?.(dept.department_id)}
              className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer space-y-2 ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {dept.code}
                  </span>
                  <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
                    {dept.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-white">{dept.total_assigned} Assigned</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${complianceColor}`}>
                    {dept.sla_compliance_pct}% SLA
                  </span>
                </div>
              </div>

              {/* Stacked Animated Progress Bar */}
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${resolvedPct}%` }}
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-700 ease-out"
                  title={`${dept.resolved} Resolved`}
                />
                <div
                  style={{ width: `${pendingPct}%` }}
                  className="bg-sky-500 h-full transition-all duration-700 ease-out"
                  title={`${dept.pending} Pending`}
                />
                <div
                  style={{ width: `${breachedPct}%` }}
                  className="bg-rose-500 h-full transition-all duration-700 ease-out"
                  title={`${dept.sla_breached} SLA Breached`}
                />
              </div>

              {/* Summary Bottom Info */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                <span>
                  {dept.resolved} Resolved • {dept.pending} In Progress • {dept.sla_breached} Breached
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Avg {dept.avg_resolution_hours.toFixed(1)} hrs</span>
                  {dept.escalated > 0 && (
                    <span className="text-rose-400 font-bold ml-1">({dept.escalated} Escalated)</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
