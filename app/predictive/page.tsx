'use client';

// =============================================================================
// CivicConnect TN — Early Warning & Predictive Analytics Command Center
// =============================================================================
// Phase 13: Grounded in historical complaint recurrence, complaint velocity (dN/dt),
// and Tamil Nadu seasonal climate calendars. Decoupled from Phase 12 DBSCAN clustering.

import React, { useState, useEffect } from 'react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { PredictionGuardNotice } from '@/components/predictive/prediction-guard-notice';
import { RoleViewSwitcher } from '@/components/predictive/role-view-switcher';
import { PredictiveKPICards } from '@/components/predictive/predictive-kpi-cards';
import { RiskRadarMap } from '@/components/predictive/risk-radar-map';
import { PredictiveInsightsTable } from '@/components/predictive/predictive-insights-table';
import { EmergingPatternsPanel } from '@/components/predictive/emerging-patterns-panel';
import { SeasonalAdvisoryMatrix } from '@/components/predictive/seasonal-advisory-matrix';
import { UnifiedPredictiveResponse } from '@/lib/predictive/types';
import {
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Calendar,
  AlertTriangle,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function PredictiveAnalyticsPage() {
  const [data, setData] = useState<UnifiedPredictiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [currentRole, setCurrentRole] = useState<string>('citizen');
  const [timeHorizon, setTimeHorizon] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [district, setDistrict] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  const fetchPredictiveData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('role', currentRole);
      if (timeHorizon !== 'all') params.set('timeHorizon', timeHorizon);
      if (riskLevel !== 'all') params.set('riskLevel', riskLevel);
      if (category !== 'all') params.set('category', category);
      if (district !== 'all') params.set('district', district);
      if (selectedWard !== 'all') params.set('ward', selectedWard);

      const res = await fetch(`/api/predictive/risks?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load predictive analytics`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to load predictive data');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to connect to predictive analytics engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictiveData();
  }, [currentRole, timeHorizon, riskLevel, category, district, selectedWard]);

  const handleDispatchAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/predictive/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          status: 'DISPATCHED',
          dispatched_by: `${currentRole.toUpperCase()} Officer`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDispatchToast(`Preventative work order dispatched successfully!`);
        setTimeout(() => setDispatchToast(null), 4000);
        fetchPredictiveData();
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <CitizenHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Toast Notification */}
        {dispatchToast && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>{dispatchToast}</span>
          </div>
        )}

        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                PHASE 13 — PREDICTIVE ANALYTICS LAYER
              </span>
              <span className="text-xs text-slate-400">
                Tamil Nadu Municipal Governance Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
              Early Warning & Predictive Risk Radar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Synthesizes historical complaint recurrence, weekly growth velocity ($dN/dt$), and Tamil Nadu seasonal climate calendars to identify potential problem areas and generate actionable preventative directives for government officials.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchPredictiveData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Predictions</span>
            </button>
          </div>
        </div>

        {/* Methodology Guard & Disclaimer Notice */}
        <PredictionGuardNotice notes={data?.methodology_notes} />

        {/* Role View Switcher Simulator */}
        <RoleViewSwitcher
          currentRole={currentRole}
          onRoleChange={(role) => setCurrentRole(role)}
          roleContext={data?.role_context}
        />

        {/* Global Filters Bar */}
        <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Filters:</span>
          </div>

          {/* Time Horizon Filter */}
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Time Horizons</option>
            <option value="7_14_DAYS">Immediate (7 – 14 Days)</option>
            <option value="30_DAYS">Near-Term (30 Days)</option>
            <option value="SEASONAL_WINDOW">Seasonal Climate Window</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Risk Levels</option>
            <option value="CRITICAL">Critical Severity (&ge;75)</option>
            <option value="HIGH">High Severity (50 – 74)</option>
            <option value="MODERATE">Moderate Severity (32 – 49)</option>
            <option value="EARLY_SIGNAL">Early Signal (&lt;32)</option>
          </select>

          {/* District Filter */}
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Districts</option>
            <option value="Chennai">Chennai</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Madurai">Madurai</option>
            <option value="Tiruchirappalli">Tiruchirappalli</option>
            <option value="Salem">Salem</option>
          </select>

          {/* Ward Filter */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="all">All Wards</option>
            <option value="119">Ward 119 (T. Nagar)</option>
            <option value="178">Ward 178 (Velachery)</option>
            <option value="122">Ward 122 (Alwarpet)</option>
            <option value="74">Ward 74 (Anna Nagar)</option>
            <option value="65">Ward 65 (Kolathur)</option>
          </select>
        </div>

        {/* Loading / Error States */}
        {loading && !data && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Executing multi-factor predictive risk pipeline...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            {/* KPI Summary Cards */}
            <PredictiveKPICards summary={data.summary} />

            {/* Spatial Risk Radar Map */}
            <RiskRadarMap
              risks={data.risks}
              problemAreas={data.future_problem_areas}
              canDispatch={data.role_context.can_dispatch}
              onDispatchAction={handleDispatchAction}
            />

            {/* Predictive Insights & Actionable Directives Table */}
            <PredictiveInsightsTable
              risks={data.risks}
              canDispatch={data.role_context.can_dispatch}
              onDispatchAction={handleDispatchAction}
            />

            {/* Emerging Patterns & Velocity Spikes Panel */}
            <EmergingPatternsPanel patterns={data.emerging_patterns} />

            {/* Tamil Nadu Seasonal Advisory Matrix */}
            <SeasonalAdvisoryMatrix advisories={data.seasonal_advisories} />
          </>
        )}
      </main>
      <CitizenBottomNav />
    </div>
  );
}
