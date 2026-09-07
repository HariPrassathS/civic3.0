'use client';

// =============================================================================
// CivicConnect TN — Animated Time-Series Complaint Trend Chart
// =============================================================================

import React, { useState } from 'react';
import { TimeSeriesPoint } from '@/lib/data-mining/types';
import { TrendingUp, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TrendChartProps {
  data: TimeSeriesPoint[];
  height?: number;
}

export function ComplaintTrendLineChart({ data, height = 240 }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
        <TrendingUp className="w-8 h-8 text-slate-600 mx-auto" />
        <div className="text-xs font-semibold text-slate-400">No time-series data available for this filter period.</div>
      </div>
    );
  }

  // Find max value for scaling
  const maxVal = Math.max(...data.map((d) => Math.max(d.total, d.resolved, d.sla_breached)), 5);
  const paddingX = 40;
  const paddingY = 25;
  const svgWidth = 800;
  const svgHeight = height;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Compute point coordinates
  const pointsTotal = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.total / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pointsResolved = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.resolved / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pointsBreached = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.sla_breached / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  // Construct SVG paths
  const totalPathStr = pointsTotal.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const resolvedPathStr = pointsResolved.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const breachedPathStr = pointsBreached.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  // Area under total curve
  const areaTotalPath = `${totalPathStr} L ${pointsTotal[pointsTotal.length - 1].x} ${paddingY + chartHeight} L ${pointsTotal[0].x} ${paddingY + chartHeight} Z`;

  const hoveredPoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : null;
  const hoveredCoord = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < pointsTotal.length ? pointsTotal[hoverIndex] : null;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Complaint Volume & Resolution Trends Over Time</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Chronological trend of incoming public complaints, resolved grievances, and SLA breaches
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Total Inflow</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Resolved</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>SLA Breached</span>
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = paddingY + chartHeight * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3, 3"
                  strokeWidth="0.75"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaTotalPath} fill="url(#totalAreaGrad)" />

          {/* Total Inflow Line */}
          <path
            d={totalPathStr}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* Resolved Line */}
          <path
            d={resolvedPathStr}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* SLA Breached Line */}
          <path
            d={breachedPathStr}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="4, 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* Data Point Circles & Hover Trigger Columns */}
          {pointsTotal.map((pt, i) => {
            const isHovered = hoverIndex === i;
            const colWidth = chartWidth / Math.max(1, data.length);

            return (
              <g key={i}>
                {/* Invisible hover capture rect */}
                <rect
                  x={pt.x - colWidth / 2}
                  y={paddingY}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />

                {/* Circles */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200 pointer-events-none"
                />

                {/* X-axis date labels */}
                {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                  <text
                    x={pt.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fill={isHovered ? '#38bdf8' : '#64748b'}
                    fontSize="10"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    className="pointer-events-none"
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Crosshair Vertical Line */}
          {hoveredCoord && (
            <line
              x1={hoveredCoord.x}
              y1={paddingY}
              x2={hoveredCoord.x}
              y2={paddingY + chartHeight}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="2, 2"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoveredCoord && (
          <div
            className="absolute top-2 pointer-events-none p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-1.5 z-20 backdrop-blur-md transition-all duration-150"
            style={{
              left: `${Math.min(75, Math.max(10, (hoveredCoord.x / svgWidth) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>{hoveredPoint.label}</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-4 text-sky-300">
                <span>Total Received:</span>
                <span className="font-mono font-bold">{hoveredPoint.total}</span>
              </div>
              <div className="flex justify-between gap-4 text-emerald-300">
                <span>Resolved:</span>
                <span className="font-mono font-bold">{hoveredPoint.resolved}</span>
              </div>
              <div className="flex justify-between gap-4 text-rose-300">
                <span>SLA Breached:</span>
                <span className="font-mono font-bold">{hoveredPoint.sla_breached}</span>
              </div>
              {hoveredPoint.urgent_count > 0 && (
                <div className="flex justify-between gap-4 text-amber-300">
                  <span>Urgent Priority:</span>
                  <span className="font-mono font-bold">{hoveredPoint.urgent_count}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
