'use client';

// =============================================================================
// CivicConnect TN — Governance Visual Analytics & DBSCAN Intelligence Hub
// =============================================================================
// Professional real-data governance analytics dashboard combining animated SVG
// charts, KPI count-up metrics, 4-layer GIS maps, and DBSCAN spatial intelligence.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Layers,
  Flame,
  BarChart3,
  Sliders,
  RefreshCw,
  Info,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PieChart,
  ShieldAlert,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { KPICard } from '@/components/data-mining/kpi-card';
import { AnalyticsFiltersBar } from '@/components/data-mining/analytics-filters-bar';
import { ComplaintTrendLineChart } from '@/components/data-mining/complaint-trend-line-chart';
import { CategoryBarChart } from '@/components/data-mining/category-bar-chart';
import { DepartmentPerformanceChart } from '@/components/data-mining/department-performance-chart';
import { SLAAnalyticsChart } from '@/components/data-mining/sla-analytics-chart';
import { StatusPriorityDonutCharts } from '@/components/data-mining/status-priority-donut-charts';
import { GovernanceInsightsPanel } from '@/components/data-mining/governance-insights-panel';
import { DBSCANClusterMap } from '@/components/data-mining/cluster-map';
import { DensityCharts } from '@/components/data-mining/density-charts';
import { HotspotTable } from '@/components/data-mining/hotspot-table';
import {
  UnifiedAnalyticsResponse,
  AnalyticsFilterState,
  DBSCANCluster,
} from '@/lib/data-mining/types';

export default function DataMiningPage() {
  // Global Shared Filter State
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    timeRange: '90d',
    departmentId: undefined,
    categoryId: undefined,
    priority: undefined,
    status: undefined,
    district: undefined,
    ward: undefined,
    epsilonKm: 0.5,
    minPts: 3,
  });

  // UI state
  const [activeViewTab, setActiveViewTab] = useState<'analytics' | 'map' | 'trends' | 'diagnostics'>('analytics');
  const [selectedCluster, setSelectedCluster] = useState<DBSCANCluster | null>(null);
  const [analyticsData, setAnalyticsData] = useState<UnifiedAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch unified real-data analytics
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const url = new URL('/api/data-mining/dbscan', window.location.origin);
        if (filters.epsilonKm) url.searchParams.set('epsilon', filters.epsilonKm.toString());
        if (filters.minPts) url.searchParams.set('min_pts', filters.minPts.toString());
        url.searchParams.set('time_range', filters.timeRange);
        if (filters.district && filters.district !== 'All Districts') url.searchParams.set('district', filters.district);
        if (filters.ward !== undefined) url.searchParams.set('ward', filters.ward.toString());
        if (filters.departmentId && filters.departmentId !== 'all') url.searchParams.set('department_id', filters.departmentId);
        if (filters.categoryId && filters.categoryId !== 'all') url.searchParams.set('category_id', filters.categoryId);
        if (filters.priority && filters.priority !== 'all') url.searchParams.set('priority', filters.priority);
        if (filters.status && filters.status !== 'all') url.searchParams.set('status', filters.status);

        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.success && json.data) {
            setAnalyticsData(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch unified analytics:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [filters, reloadKey]);

  const summary = analyticsData?.summary;
  const timeSeries = analyticsData?.time_series || [];
  const categories = analyticsData?.categories || [];
  const departments = analyticsData?.departments || [];
  const slaPerformance = analyticsData?.sla_performance;
  const statusDist = analyticsData?.status_distribution || [];
  const priorityDist = analyticsData?.priority_distribution || [];
  const insights = analyticsData?.governance_insights || [];
  const dbscan = analyticsData?.dbscan;
  const clusters = dbscan?.clusters || [];
  const noisePoints = dbscan?.noise_points || [];
  const hotspots = dbscan?.hotspots || [];
  const commonGroups = dbscan?.common_issue_groups || [];
  const heatmapPoints = analyticsData?.heatmap_points || [];
  const wardTrends = analyticsData?.ward_trends || [];
  const districtTrends = analyticsData?.district_trends || [];

  const handleResetFilters = () => {
    setFilters({
      timeRange: '90d',
      departmentId: undefined,
      categoryId: undefined,
      priority: undefined,
      status: undefined,
      district: undefined,
      ward: undefined,
      epsilonKm: 0.5,
      minPts: 3,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white">
      <CitizenHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <Cpu className="w-3.5 h-3.5" />
              <span>TN Civic Intelligence & Data Mining Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Governance Visual Analytics & Hotspot Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Real-time statistical aggregation, SLA compliance tracking, department workload metrics, and DBSCAN spatial density clustering on Tamil Nadu civic grievances.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title="Refresh dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Report</span>
            </button>

            <Link
              href="/map"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Spatial Map</span>
            </Link>
          </div>
        </div>

        {/* Prediction Boundary Guard */}
        <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-800/50 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-sky-200/90 leading-relaxed">
            <span className="font-bold text-sky-200">Governance Analytics Guarantee:</span> All metrics, SLA percentages, and DBSCAN clusters are computed dynamically from real complaint coordinates and timestamps. This dashboard provides historical density and performance characterization; future predictive forecasting is isolated in separate predictive modeling modules.
          </div>
        </div>

        {/* Global Shared Filter Bar */}
        <AnalyticsFiltersBar
          filters={filters}
          onChangeFilters={setFilters}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
        />

        {/* 8 TOP ANIMATED COUNT-UP KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KPICard
            label="Total Complaints"
            value={summary?.total_complaints ?? 0}
            icon={TrendingUp}
            colorTheme="slate"
            subtext="All Inflow"
          />
          <KPICard
            label="Open Pending"
            value={summary?.open_complaints ?? 0}
            icon={Clock}
            colorTheme="amber"
            subtext="In Resolution"
          />
          <KPICard
            label="Resolved"
            value={summary?.resolved_complaints ?? 0}
            icon={CheckCircle2}
            colorTheme="emerald"
            badgeText={`${summary?.resolution_rate_pct ?? 0}%`}
          />
          <KPICard
            label="SLA Breaches"
            value={summary?.sla_breaches ?? 0}
            icon={AlertTriangle}
            colorTheme="rose"
            badgeText={`${summary?.sla_compliance_pct ?? 100}% SLA`}
          />
          <KPICard
            label="High / Urgent"
            value={summary?.high_urgent_complaints ?? 0}
            icon={Flame}
            colorTheme="rose"
            subtext="Critical Priority"
          />
          <KPICard
            label="Avg Turnaround"
            value={summary?.avg_resolution_hours ?? 0}
            suffix="h"
            decimals={1}
            icon={Clock}
            colorTheme="sky"
            subtext="Hours to Fix"
          />
          <KPICard
            label="Escalated"
            value={summary?.escalated_complaints ?? 0}
            icon={ShieldAlert}
            colorTheme="purple"
            subtext="Senior Review"
          />
          <KPICard
            label="DBSCAN Hotspots"
            value={summary?.active_hotspots ?? 0}
            icon={Layers}
            colorTheme="emerald"
            subtext="Dense Epicenters"
          />
        </div>

        {/* View Navigation Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveViewTab('analytics')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeViewTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Governance Visual Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('map')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeViewTab === 'map'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>DBSCAN Cluster & Heatmap Explorer ({clusters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('trends')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeViewTab === 'trends'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Ward & District Trends Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('diagnostics')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeViewTab === 'diagnostics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Algorithm Tuning & Diagnostics</span>
          </button>
        </div>

        {/* TAB 1: GOVERNANCE VISUAL ANALYTICS */}
        {activeViewTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Row 1: Time Series Line Chart */}
            <ComplaintTrendLineChart data={timeSeries} />

            {/* Row 2: Status & Priority Donut Charts */}
            <StatusPriorityDonutCharts statusData={statusDist} priorityData={priorityDist} />

            {/* Row 3: Category Distribution Bar Chart + Department Performance Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBarChart
                categories={categories}
                selectedCategoryId={filters.categoryId}
                onSelectCategory={(cId) =>
                  setFilters({ ...filters, categoryId: filters.categoryId === cId ? undefined : cId })
                }
              />
              <DepartmentPerformanceChart
                departments={departments}
                selectedDeptId={filters.departmentId}
                onSelectDepartment={(dId) =>
                  setFilters({ ...filters, departmentId: filters.departmentId === dId ? undefined : dId })
                }
              />
            </div>

            {/* Row 4: SLA Performance Analytics */}
            {slaPerformance && (
              <SLAAnalyticsChart
                slaData={slaPerformance}
                totalComplaints={summary?.total_complaints || 0}
              />
            )}

            {/* Row 5: Calculated Real Governance Insights */}
            <GovernanceInsightsPanel insights={insights} />
          </div>
        )}

        {/* TAB 2: DBSCAN CLUSTER & HEATMAP EXPLORER */}
        {activeViewTab === 'map' && (
          <div className="space-y-6 animate-in fade-in">
            <DBSCANClusterMap
              clusters={clusters}
              noisePoints={noisePoints}
              hotspots={hotspots}
              heatmapPoints={heatmapPoints}
              selectedClusterId={selectedCluster?.cluster_id}
              onSelectCluster={setSelectedCluster}
            />

            <HotspotTable hotspots={hotspots} commonIssueGroups={commonGroups} />
          </div>
        )}

        {/* TAB 3: WARD & DISTRICT TRENDS */}
        {activeViewTab === 'trends' && (
          <div className="space-y-6 animate-in fade-in">
            <DensityCharts
              categoryDistribution={categories}
              wardTrends={wardTrends}
              districtTrends={districtTrends}
            />
          </div>
        )}

        {/* TAB 4: ALGORITHM TUNING & DIAGNOSTICS */}
        {activeViewTab === 'diagnostics' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 text-xs animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>DBSCAN Spatial-Temporal Clustering Tuning</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Adjust epsilon neighborhood radius and minimum density threshold with live recalculation
                </p>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Computed: {analyticsData ? new Date(analyticsData.computed_at).toLocaleTimeString() : ''}
              </span>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Epsilon Radius (ε):</span>
                  <span className="text-emerald-400 font-mono">{filters.epsilonKm ?? 0.5} km</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={filters.epsilonKm ?? 0.5}
                  onChange={(e) => setFilters({ ...filters, epsilonKm: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.1 km (Ultra-dense micro-pockets)</span>
                  <span>2.0 km (Wider municipal zones)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>MinPoints Threshold (minPts):</span>
                  <span className="text-emerald-400 font-mono">{filters.minPts ?? 3} complaints</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={filters.minPts ?? 3}
                  onChange={(e) => setFilters({ ...filters, minPts: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>2 (Permissive)</span>
                  <span>8 (High severity only)</span>
                </div>
              </div>
            </div>

            {/* Point Classification Diagnostics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Total Analyzed</span>
                <div className="text-xl font-bold text-white font-mono">{dbscan?.summary.total_analyzed ?? 0}</div>
                <div className="text-[10px] text-slate-500">Filtered complaint coordinates processed</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Clustering Ratio</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">{dbscan?.summary.clustering_coefficient ?? 0}%</div>
                <div className="text-[10px] text-slate-500">Points grouped into high-density epicenters</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Noise Outliers Filtered</span>
                <div className="text-xl font-bold text-slate-400 font-mono">{dbscan?.summary.noise_complaints ?? 0}</div>
                <div className="text-[10px] text-slate-500">Isolated singular grievances without spatial density</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <CitizenBottomNav />
    </div>
  );
}
