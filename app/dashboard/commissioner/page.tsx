'use client';

// =============================================================================
// CivicConnect TN — City Commissioner Executive Dashboard (/dashboard/commissioner)
// =============================================================================
// City-wide executive command console for Municipal Commissioners (IAS).
// Features: Cross-department comparison matrix, 15-zone spatial analytics, city SLA index, GIS heatmaps, recurring problem detection.

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UserRole } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  Building2,
  CheckCircle2,
  Users,
  Compass,
  TrendingUp,
  Flame,
  Layers,
  Sparkles,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

export default function CommissionerDashboard() {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'zones' | 'heatmap' | 'predictive'>('benchmarks');

  // Cross-department comparison data
  const departmentBenchmarks = [
    { name: 'Sanitation & Solid Waste', total: 428, resolved: 412, compliance: 96, avgTime: '14.2h', status: 'Excellent', color: 'bg-emerald-500' },
    { name: 'Roads & Infrastructure', total: 312, resolved: 284, compliance: 91, avgTime: '22.6h', status: 'Good', color: 'bg-blue-500' },
    { name: 'Water Supply & Sewerage', total: 289, resolved: 265, compliance: 92, avgTime: '18.1h', status: 'Good', color: 'bg-cyan-500' },
    { name: 'Storm Water Drainage', total: 198, resolved: 172, compliance: 87, avgTime: '28.4h', status: 'Attention Needed', color: 'bg-amber-500' },
    { name: 'Street Lighting & Illumination', total: 164, resolved: 159, compliance: 97, avgTime: '11.5h', status: 'Top Performer', color: 'bg-teal-500' },
    { name: 'Public Health & Vector Control', total: 142, resolved: 135, compliance: 95, avgTime: '16.0h', status: 'Excellent', color: 'bg-indigo-500' },
  ];

  // 15 Zones Spatial Distribution
  const zonalData = [
    { zone: 'Zone 5 - Royapuram', complaints: 142, resolvedPct: 94, criticalCount: 1, officer: 'AE Sundaram' },
    { zone: 'Zone 9 - Teynampet', complaints: 188, resolvedPct: 92, criticalCount: 2, officer: 'AE Vijay' },
    { zone: 'Zone 10 - Kodambakkam / T. Nagar', complaints: 215, resolvedPct: 95, criticalCount: 0, officer: 'AE Selvi N' },
    { zone: 'Zone 13 - Adyar / Guindy', complaints: 164, resolvedPct: 93, criticalCount: 1, officer: 'AE Balaji' },
    { zone: 'Zone 14 - Perungudi', complaints: 129, resolvedPct: 88, criticalCount: 3, officer: 'AE Ramesh' },
    { zone: 'Zone 15 - Sholinganallur', complaints: 110, resolvedPct: 86, criticalCount: 2, officer: 'AE Priya' },
  ];

  // Recurring civic hotspots & predictive risk
  const recurringIssues = [
    { location: 'Velachery 100 Feet Road / Bypass', issue: 'Chronic Inundation during high-tide precipitation', department: 'Storm Water Drainage', riskScore: 88, recurringCount: 7, action: 'Construct inter-connecting underground micro-tunnel to Pallikaranai marsh.' },
    { location: 'T. Nagar Ranganathan Street', issue: 'Solid Waste Bin Overflow during festival shopping', department: 'Sanitation', riskScore: 74, recurringCount: 12, action: 'Double compacting truck frequency to every 3 hours.' },
    { location: 'Inner Ring Road (Kathipara Junction)', issue: 'Recurring Asphalt Fatigue & Pothole Formations', department: 'Highways & PWD', riskScore: 82, recurringCount: 5, action: 'Execute full bitumen milling and mastic asphalt resurfacing.' },
  ];

  // City sample geocoded complaints for heatmap
  const cityMapTasks = [
    { id: '1', tracking_id: 'CC-TN-2026-001', title: 'Royapuram Water Ingress', status: 'in_progress', priority: 'urgent', latitude: 13.1147, longitude: 80.2974, address: 'Royapuram Slum Area', ward: 48, sla_deadline: '2026-09-08', sla_breached: false },
    { id: '2', tracking_id: 'CC-TN-2026-002', title: 'T. Nagar Pothole Remediation', status: 'assigned', priority: 'high', latitude: 13.0418, longitude: 80.2341, address: 'Usman Road, T. Nagar', ward: 114, sla_deadline: '2026-09-08', sla_breached: false },
    { id: '3', tracking_id: 'CC-TN-2026-003', title: 'Velachery Sump Desilting', status: 'in_progress', priority: 'high', latitude: 12.9815, longitude: 80.2180, address: 'Velachery Main Road', ward: 175, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '4', tracking_id: 'CC-TN-2026-004', title: 'Anna Nagar Streetlight Outage', status: 'resolved', priority: 'medium', latitude: 13.0850, longitude: 80.2101, address: '2nd Avenue, Anna Nagar', ward: 105, sla_deadline: '2026-09-07', sla_breached: false },
    { id: '5', tracking_id: 'CC-TN-2026-005', title: 'Adyar Riverbank Debris Clearance', status: 'in_progress', priority: 'low', latitude: 13.0064, longitude: 80.2575, address: 'Kotturpuram Canal Bridge', ward: 173, sla_deadline: '2026-09-09', sla_breached: false },
  ];

  return (
    <DashboardShell
      role={UserRole.CITY_COMMISSIONER}
      title="City Commissioner Executive Command"
      subtitle="Greater Chennai Corporation — 15 Zones • 200 Wards • 8.5M Citizens"
      jurisdictionScope="Greater Chennai Corporation (Apex Municipal Scope)"
    >
      {/* Top City KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total City Grievances"
          value="1,533"
          subtitle="All 15 Zones (Month to Date)"
          icon={<Building2 className="w-6 h-6" />}
          accentColor="blue"
          change="+8.4% intake"
          trend="up"
        />
        <KpiCard
          title="City Resolution Rate"
          value="93.2%"
          subtitle="Target: 90% SLA Compliance"
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
          change="+1.8% vs last month"
          trend="up"
        />
        <KpiCard
          title="Avg City Turnaround"
          value="18.8h"
          subtitle="Target threshold: 24.0h"
          icon={<TrendingUp className="w-6 h-6" />}
          accentColor="indigo"
          change="5.2h faster"
          trend="up"
        />
        <KpiCard
          title="Public Trust Index"
          value="4.8 ★"
          subtitle="Civic Satisfaction Score"
          icon={<Users className="w-6 h-6" />}
          accentColor="amber"
          change="Top Urban Metro"
        />
      </div>

      {/* Control Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'benchmarks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Department Benchmarks</span>
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'zones'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>15 Zones Spatial Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'heatmap'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>🗺️ City-Wide GIS Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab('predictive')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'predictive'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Predictive & Recurring Issues</span>
        </button>
      </div>

      {/* TAB 1: BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cross-Department Efficiency & Performance Benchmarks
              </h3>
              <p className="text-xs text-slate-500">Comparative SLA compliance, turnaround times, and resolution rates</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold self-start sm:self-auto">
              Live Benchmarking
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentBenchmarks.map((dept) => (
              <div
                key={dept.name}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{dept.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.compliance >= 95
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : dept.compliance >= 90
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {dept.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>SLA Compliance: {dept.compliance}%</span>
                    <span>Avg: {dept.avgTime}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className={`${dept.color} h-full rounded-full`} style={{ width: `${dept.compliance}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>{dept.total} Grievances</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dept.resolved} Resolved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ZONES */}
      {activeTab === 'zones' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                15-Zone Resolution Rates & Critical Hotspots
              </h3>
            </div>
            <span className="text-xs text-slate-500">Greater Chennai Corporation Spatial Triage</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zonalData.map((zone) => (
              <div
                key={zone.zone}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 hover:border-emerald-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{zone.zone}</span>
                  {zone.criticalCount > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      <Flame className="w-3 h-3" />
                      {zone.criticalCount} Critical
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Clear
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>{zone.complaints} Grievances</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{zone.resolvedPct}% SLA</span>
                </div>

                <p className="text-[11px] text-slate-400">Zonal Nodal: {zone.officer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CITY-WIDE GIS HEATMAP */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={cityMapTasks}
            className="w-full h-[560px]"
          />
        </div>
      )}

      {/* TAB 4: PREDICTIVE & RECURRING ISSUES */}
      {activeTab === 'predictive' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  AI Recurring Problem Detector & Predictive Ward Risk
                </h3>
                <p className="text-xs text-slate-500">Autonomous pattern recognition on repetitive civic failures across seasons</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              AI Risk Engine Active
            </span>
          </div>

          <div className="space-y-3">
            {recurringIssues.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{item.location}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                      {item.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Recurring Failure: {item.recurringCount}x (Past 6 Months)
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Risk Score: {item.riskScore}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {item.issue}
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Commissioner Engineering Directive: </span>
                  {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
