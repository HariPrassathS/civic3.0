'use client';

// =============================================================================
// CivicConnect TN — Animated Category Distribution Bar Chart
// =============================================================================

import React, { useState } from 'react';
import { CategoryDistribution } from '@/lib/data-mining/types';
import { PieChart, Clock, Layers, Filter } from 'lucide-react';

interface CategoryBarChartProps {
  categories: CategoryDistribution[];
  onSelectCategory?: (categoryId: string) => void;
  selectedCategoryId?: string;
}

export function CategoryBarChart({
  categories,
  onSelectCategory,
  selectedCategoryId,
}: CategoryBarChartProps) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
        <PieChart className="w-8 h-8 text-slate-600 mx-auto" />
        <div className="text-xs font-semibold text-slate-400">No category breakdown data available.</div>
      </div>
    );
  }

  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Complaints by Category & Turnaround Latency</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Ranked category volume with cluster concentration and average resolution duration
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800/50">
          {categories.length} Categories
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {categories.slice(0, 8).map((cat) => {
          const isSelected = selectedCategoryId === cat.category_id;
          const isHovered = hoveredCat === cat.category_id;
          const barWidth = Math.round((cat.count / maxCount) * 100);

          return (
            <div
              key={cat.category_id}
              onClick={() => onSelectCategory?.(cat.category_id)}
              onMouseEnter={() => setHoveredCat(cat.category_id)}
              onMouseLeave={() => setHoveredCat(null)}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-1.5 ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : isHovered
                  ? 'bg-slate-800/60 border-slate-700'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-[260px]">
                  {cat.category_name}
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono font-bold text-white">{cat.count}</span>
                  <span className="text-slate-400 font-medium">({cat.percentage}%)</span>
                </div>
              </div>

              {/* Progress Bar with Progressive Animation */}
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${barWidth}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 ease-out"
                />
              </div>

              {/* Metadata row */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>{cat.clustered_count} in dense clusters • {cat.noise_count} isolated</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Avg {cat.avg_resolution_hours} hrs</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
