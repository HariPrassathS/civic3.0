'use client';

// =============================================================================
// CivicConnect TN — Data Mining Density & Trends Visual Charts
// =============================================================================

import React from 'react';
import {
  CategoryDistribution,
  WardTrend,
  DistrictTrend,
} from '@/lib/data-mining/types';
import { BarChart3, PieChart, TrendingUp, MapPin, Building2, Flame } from 'lucide-react';

interface DensityChartsProps {
  categoryDistribution: CategoryDistribution[];
  wardTrends: WardTrend[];
  districtTrends: DistrictTrend[];
}

export function DensityCharts({
  categoryDistribution,
  wardTrends,
  districtTrends,
}: DensityChartsProps) {
  const maxCategoryCount = Math.max(...categoryDistribution.map((c) => c.count), 1);
  const maxWardCount = Math.max(...wardTrends.map((w) => w.total_complaints), 1);
  const maxDistrictCount = Math.max(...districtTrends.map((d) => d.total_complaints), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. CATEGORY DISTRIBUTION & CLUSTERING RATIO */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Category Concentration & Clustering Ratio</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Proportion of civic issues grouped into dense clusters vs isolated reports
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800/50">
            {categoryDistribution.length} Categories
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {categoryDistribution.slice(0, 7).map((cat) => {
            const barWidth = Math.round((cat.count / maxCategoryCount) * 100);
            const clusterRatio = cat.count > 0 ? Math.round((cat.clustered_count / cat.count) * 100) : 0;

            return (
              <div key={cat.category_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                    {cat.category_name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-400 font-bold">{cat.count} total</span>
                    <span className="text-slate-500">({clusterRatio}% clustered)</span>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  {/* Clustered Portion */}
                  <div
                    style={{ width: `${(cat.clustered_count / maxCategoryCount) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    title={`${cat.clustered_count} clustered`}
                  />
                  {/* Noise Portion */}
                  <div
                    style={{ width: `${(cat.noise_count / maxCategoryCount) * 100}%` }}
                    className="bg-slate-700 h-full transition-all duration-500"
                    title={`${cat.noise_count} isolated noise`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Clustered in Epicenter</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span>Isolated Outlier</span>
          </span>
        </div>
      </div>

      {/* 2. TOP WARD DENSITY & EPICENTER BREAKDOWN */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Ward Density & Recurring Hotspot Index</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Wards exhibiting high spatial density and multiple recurring civic failures
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950 px-2.5 py-1 rounded-lg border border-sky-800/50">
            Top Wards
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {wardTrends.slice(0, 7).map((ward) => {
            const barWidth = Math.round((ward.total_complaints / maxWardCount) * 100);

            return (
              <div key={`${ward.district}-${ward.ward}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Ward {ward.ward} — <span className="text-slate-400 font-normal">{ward.district}</span>
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    {ward.active_clusters_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>{ward.active_clusters_count} Hotspots</span>
                      </span>
                    )}
                    <span className="font-mono font-bold text-white">{ward.total_complaints} reports</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${barWidth}%` }}
                    className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Dominant: {ward.dominant_category}</span>
                  <span>{ward.unresolved_count} Unresolved</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DISTRICT TRENDS COMPARATIVE MATRIX */}
      <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Tamil Nadu District Level Comparative Matrix</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Aggregated complaint density, detected DBSCAN clusters, and resolution performance across districts
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800/50 self-start sm:self-auto">
            {districtTrends.length} Districts Analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Total Volume</th>
                <th className="py-2.5 px-3">DBSCAN Clusters</th>
                <th className="py-2.5 px-3">Top Issue Pattern</th>
                <th className="py-2.5 px-3">Noise Outliers</th>
                <th className="py-2.5 px-3 text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {districtTrends.map((d) => (
                <tr key={d.district} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{d.district}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-200">
                    {d.total_complaints}
                  </td>
                  <td className="py-3 px-3">
                    {d.clusters_count > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                        {d.clusters_count} Clusters
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {d.dominant_category}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {d.noise_points_count}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold text-slate-200">{d.resolution_rate_pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
