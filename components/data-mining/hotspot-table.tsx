'use client';

// =============================================================================
// CivicConnect TN — Geographic Hotspots & Common Issue Groups Table
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GeographicHotspot,
  CommonIssueGroup,
} from '@/lib/data-mining/types';
import {
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HotspotTableProps {
  hotspots: GeographicHotspot[];
  commonIssueGroups: CommonIssueGroup[];
}

export function HotspotTable({ hotspots, commonIssueGroups }: HotspotTableProps) {
  const [expandedHotspotId, setExpandedHotspotId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedHotspotId(expandedHotspotId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Discovered Geographic Hotspots & Common Issue Hubs</span>
          </h3>
          <p className="text-xs text-slate-400">
            DBSCAN clusters scored by complaint density, recurrence rate, and resolution urgency
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-3 py-1 rounded-xl border border-amber-800/50 self-start sm:self-auto">
          {hotspots.length} Epicenters Detected
        </span>
      </div>

      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        {hotspots.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Spatial Hotspots Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              No dense geographical clusters meet the current DBSCAN threshold (minPts / epsilon). Try broadening the filter date range or tuning algorithm parameters in Diagnostics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Hotspot / Locality</th>
                  <th className="py-3 px-4">Dominant Category</th>
                  <th className="py-3 px-4">Density Score</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
              {hotspots.map((h, idx) => {
                const isExpanded = expandedHotspotId === h.hotspot_id;

                const urgencyBadge =
                  h.urgency_level === 'CRITICAL'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                    : h.urgency_level === 'HIGH'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';

                return (
                  <React.Fragment key={h.hotspot_id}>
                    <tr
                      onClick={() => toggleExpand(h.hotspot_id)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                            #{idx + 1}
                          </span>
                          <span className="truncate max-w-[220px]">{h.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[240px]">{h.locality}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {h.dominant_category}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              style={{ width: `${h.density_score}%` }}
                              className={`h-full ${
                                h.density_score >= 75
                                  ? 'bg-rose-500'
                                  : h.density_score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-white">
                            {h.density_score}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-white text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {h.complaint_count} reports
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${urgencyBadge}`}>
                          {h.urgency_level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Breakdown Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-slate-800">
                        <td colSpan={6} className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/80">
                            <span>Linked Grievances in this Epicenter ({h.sample_complaints.length} of {h.complaint_count})</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              Radius: {h.radius_km.toFixed(2)} km • Unresolved: {h.unresolved_rate_pct}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {h.sample_complaints.map((c) => (
                              <div
                                key={c.id || c.tracking_id}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[11px] font-bold text-emerald-400">
                                    {c.tracking_id}
                                  </span>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {c.status}
                                  </span>
                                </div>
                                <div className="font-semibold text-xs text-white truncate">{c.title}</div>
                                <div className="text-[11px] text-slate-400 truncate">{c.address}</div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(c.created_at).toLocaleDateString('en-IN')}
                                  </span>
                                  <Link
                                    href={`/track/${c.tracking_id}`}
                                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                  >
                                    <span>Track</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
