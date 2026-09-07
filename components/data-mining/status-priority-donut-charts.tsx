'use client';

// =============================================================================
// CivicConnect TN — Animated Status & Priority Donut Charts
// =============================================================================

import React, { useState } from 'react';
import { StatusMetric, PriorityMetric } from '@/lib/data-mining/types';
import { CheckCircle2, AlertTriangle, PieChart } from 'lucide-react';

interface DonutChartsProps {
  statusData: StatusMetric[];
  priorityData: PriorityMetric[];
}

export function StatusPriorityDonutCharts({ statusData, priorityData }: DonutChartsProps) {
  const [hoveredStatus, setHoveredStatus] = useState<StatusMetric | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<PriorityMetric | null>(null);

  const totalStatus = statusData.reduce((acc, s) => acc + s.count, 0);
  const totalPriority = priorityData.reduce((acc, p) => acc + p.count, 0);

  // Helper to render SVG Donut arcs
  const renderDonutArcs = (
    items: { label: string; count: number; percentage: number; color: string }[],
    total: number,
    onHover: (item: any | null) => void,
    hoveredItem: any | null
  ) => {
    if (total === 0) {
      return (
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#334155"
          strokeWidth="14"
        />
      );
    }

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return items.map((item, idx) => {
      const arcLength = (item.count / total) * circumference;
      const strokeDasharray = `${arcLength} ${circumference - arcLength}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += arcLength;

      const isHovered = hoveredItem?.label === item.label;

      return (
        <circle
          key={item.label}
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={item.color}
          strokeWidth={isHovered ? 18 : 14}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 cursor-pointer"
          onMouseEnter={() => onHover(item)}
          onMouseLeave={() => onHover(null)}
        />
      );
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. STATUS DONUT CHART */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Grievance Status Pipeline</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Current operational lifecycle state of all registered civic complaints
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 transform">
              {renderDonutArcs(statusData, totalStatus, setHoveredStatus, hoveredStatus)}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs text-slate-400 font-semibold">
                {hoveredStatus ? hoveredStatus.label : 'Total'}
              </span>
              <span className="text-lg font-black text-white">
                {hoveredStatus ? hoveredStatus.count : totalStatus}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {hoveredStatus ? `${hoveredStatus.percentage}%` : 'Complaints'}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 text-xs w-full sm:w-auto">
            {statusData.map((s) => (
              <div
                key={s.status}
                onMouseEnter={() => setHoveredStatus(s)}
                onMouseLeave={() => setHoveredStatus(null)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-2 ${
                  hoveredStatus?.status === s.status
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="truncate">
                  <span className="text-slate-300 font-medium block truncate text-[11px]">{s.label}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{s.count} ({s.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. PRIORITY DONUT CHART */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Priority Severity Breakdown</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Triage severity weighting determining SLA windows and dispatch acceleration
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 transform">
              {renderDonutArcs(priorityData, totalPriority, setHoveredPriority, hoveredPriority)}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs text-slate-400 font-semibold">
                {hoveredPriority ? hoveredPriority.label : 'Severity'}
              </span>
              <span className="text-lg font-black text-white">
                {hoveredPriority ? hoveredPriority.count : totalPriority}
              </span>
              <span className="text-[10px] text-rose-400 font-bold">
                {hoveredPriority ? `${hoveredPriority.percentage}%` : 'Tickets'}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 text-xs w-full sm:w-auto">
            {priorityData.map((p) => (
              <div
                key={p.priority}
                onMouseEnter={() => setHoveredPriority(p)}
                onMouseLeave={() => setHoveredPriority(null)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-2 ${
                  hoveredPriority?.priority === p.priority
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <div className="truncate">
                  <span className="text-slate-300 font-medium block truncate text-[11px]">{p.label}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{p.count} ({p.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
