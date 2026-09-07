'use client';

// =============================================================================
// CivicConnect TN — Predictive Insights & Actionable Directives Table
// =============================================================================

import React, { useState } from 'react';
import {
  PredictiveRisk,
  PreventativeAction,
  RiskCategory,
  RiskLevel,
} from '@/lib/predictive/types';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  Zap,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

interface PredictiveInsightsTableProps {
  risks: PredictiveRisk[];
  onSelectRisk?: (risk: PredictiveRisk) => void;
  canDispatch?: boolean;
  onDispatchAction?: (actionId: string) => void;
}

export function PredictiveInsightsTable({
  risks,
  onSelectRisk,
  canDispatch = false,
  onDispatchAction,
}: PredictiveInsightsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<'risk_score' | 'confidence_pct'>('risk_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // Filter and search
  const filtered = risks.filter((r) => {
    if (selectedRiskLevel !== 'all' && r.risk_level !== selectedRiskLevel) return false;
    if (selectedCategory !== 'all' && r.risk_category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchLoc = r.locality.toLowerCase().includes(q);
      const matchDist = r.district.toLowerCase().includes(q);
      const matchWard = r.ward?.toString().includes(q);
      if (!matchTitle && !matchLoc && !matchDist && !matchWard) return false;
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'risk_score' | 'confidence_pct') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl space-y-4">
      {/* Table Header & Search Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Predictive Risk Matrix & Preventative Directives
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified municipal vulnerabilities with statistical drivers & actionable work orders
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 w-fit">
            Showing {filtered.length} of {risks.length} Risk Indicators
          </span>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by risk title, locality, or ward..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Severity Levels</option>
            <option value="CRITICAL">Critical Severity (75+)</option>
            <option value="HIGH">High Severity (50-74)</option>
            <option value="MODERATE">Moderate Severity (32-49)</option>
            <option value="EARLY_SIGNAL">Early Signal (&lt;32)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Risk Categories</option>
            <option value="DRAINAGE_FLOOD">Drainage & Inundation</option>
            <option value="ROAD_DETERIORATION">Road Deterioration</option>
            <option value="SANITATION_HEALTH">Sanitation Hazard</option>
            <option value="WATER_SUPPLY_FAILURE">Water Supply Failure</option>
            <option value="ELECTRICAL_GRID_STRESS">Electrical Grid Stress</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800/80 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Potential Risk & Locality</th>
              <th className="py-3 px-4">Category</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('risk_score')}
              >
                <div className="flex items-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort('confidence_pct')}
              >
                <div className="flex items-center gap-1">
                  <span>Confidence</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Projected Horizon</th>
              <th className="py-3 px-4">Preventative Directives</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No predictive risks match the specified filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((risk) => {
                const isExpanded = expandedRiskId === risk.id;
                const isCritical = risk.risk_level === 'CRITICAL';
                const isHigh = risk.risk_level === 'HIGH';

                return (
                  <React.Fragment key={risk.id}>
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isExpanded ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      {/* Title & Locality */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 hover:text-emerald-400 cursor-pointer"
                             onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}>
                          {risk.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{risk.locality}</span>
                          {risk.ward && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                              Ward {risk.ward}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {risk.risk_category.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                              isCritical
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {risk.risk_score}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-300">
                            {risk.risk_level}
                          </span>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-200 font-semibold">
                          {risk.confidence_pct}%
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {risk.confidence_tier}
                        </span>
                      </td>

                      {/* Horizon */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {risk.time_horizon_label}
                        </span>
                      </td>

                      {/* Directives Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">
                            {risk.preventative_actions.length} Action{risk.preventative_actions.length > 1 ? 's' : ''}
                          </span>
                          {risk.preventative_actions.some((a) => a.status === 'DISPATCHED') && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold">
                              DISPATCHED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                        >
                          {isExpanded ? 'Close' : 'Inspect Directives'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Drawer: Explainability & Actionable Directives */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90">
                        <td colSpan={7} className="p-4 sm:p-6 border-b border-slate-800/80">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* 1. Evidence & Scientific Drivers */}
                            <div className="space-y-3 lg:col-span-1 border-r border-slate-800/80 pr-4">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                Mathematical Evidence & Factors
                              </span>

                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <span className="text-slate-500 block text-[10px]">Repeat Recurrence</span>
                                  <span className="font-bold text-amber-400 text-sm">
                                    {risk.risk_drivers.recurrence_score}/100
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <span className="text-slate-500 block text-[10px]">Velocity Acceleration</span>
                                  <span className="font-bold text-cyan-400 text-sm">
                                    {risk.risk_drivers.velocity_score}/100
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <span className="text-slate-500 block text-[10px]">Seasonal Multiplier</span>
                                  <span className="font-bold text-purple-400 text-sm">
                                    {risk.risk_drivers.seasonal_multiplier}x
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                  <span className="text-slate-500 block text-[10px]">Unresolved Pressure</span>
                                  <span className="font-bold text-red-400 text-sm">
                                    {risk.risk_drivers.unresolved_pressure}%
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-xs">
                                <span className="font-bold text-slate-300">Failure Mode Analysis:</span>
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                  {risk.scientific_explanation}
                                </p>
                              </div>
                            </div>

                            {/* 2. Actionable Preventative Directives */}
                            <div className="space-y-3 lg:col-span-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                  Actionable Municipal Directives
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Target SLA: 2–5 Days Before Peak
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {risk.preventative_actions.map((act) => (
                                  <div
                                    key={act.id}
                                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-xs">
                                          {act.title}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                          {act.target_department}
                                        </span>
                                      </div>

                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                          act.status === 'DISPATCHED'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        {act.status}
                                      </span>
                                    </div>

                                    <p className="text-xs text-slate-300 leading-relaxed">
                                      {act.instructions}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                                      <div>
                                        <span className="text-slate-500">Recommended Crew: </span>
                                        <span className="text-slate-300 font-medium">{act.recommended_crew}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Equipment Needed: </span>
                                        <span className="text-slate-300 font-medium">
                                          {act.equipment_needed.join(', ')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action Trigger Buttons for Officials */}
                                    {canDispatch && act.status !== 'DISPATCHED' && (
                                      <div className="pt-2 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => onDispatchAction && onDispatchAction(act.id)}
                                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Dispatch Preventative Work Order</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
