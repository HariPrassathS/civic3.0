'use client';

// =============================================================================
// CivicConnect TN — Department Secretary Dashboard (/dashboard/department-secretary)
// =============================================================================
// State-level policy & macro-analytics console for Principal Secretaries to Government (IAS).
// Features: Statewide 38-district departmental benchmarking, capital project issues, systemic trends, AI resource forecasting.

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UserRole } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  Building2,
  CheckCircle2,
  FileText,
  Layers,
  Award,
  Sparkles,
  MapPin,
  TrendingUp,
  Search,
} from 'lucide-react';

const STATE_DEPARTMENTS = [
  { id: 'maws', name: 'Municipal Administration & Water Supply (MAWS)', volume: '8,420', sla: '94.2%', capitalIssues: 184, topDistrict: 'Coimbatore (97.4%)' },
  { id: 'highways', name: 'Highways & Minor Ports Department', volume: '6,180', sla: '92.8%', capitalIssues: 142, topDistrict: 'Chennai (96.1%)' },
  { id: 'energy', name: 'Energy & Electricity (TANGEDCO)', volume: '5,840', sla: '96.4%', capitalIssues: 92, topDistrict: 'Erode (98.2%)' },
  { id: 'health', name: 'Health & Family Welfare (Public Health)', volume: '3,290', sla: '95.8%', capitalIssues: 45, topDistrict: 'Tiruchirappalli (97.1%)' },
  { id: 'rdpr', name: 'Rural Development & Panchayat Raj', volume: '4,720', sla: '93.1%', capitalIssues: 110, topDistrict: 'Salem (95.0%)' },
];

export default function DepartmentSecretaryDashboard() {
  const [selectedDeptId, setSelectedDeptId] = useState('maws');
  const [activeTab, setActiveTab] = useState<'league' | 'heatmap' | 'forecasting' | 'policy'>('league');
  const [districtSearch, setDistrictSearch] = useState('');

  const currentDept = STATE_DEPARTMENTS.find((d) => d.id === selectedDeptId) || STATE_DEPARTMENTS[0];

  // 38 Districts State League Table
  const districtRankings = [
    { rank: 1, district: 'Coimbatore', complaints: 842, resolvedPct: 97.4, avgHours: '14.2h', tier: 'Exemplary' },
    { rank: 2, district: 'Chennai', complaints: 2140, resolvedPct: 95.1, avgHours: '16.8h', tier: 'Exemplary' },
    { rank: 3, district: 'Tiruchirappalli', complaints: 612, resolvedPct: 94.8, avgHours: '17.4h', tier: 'Exemplary' },
    { rank: 4, district: 'Madurai', complaints: 789, resolvedPct: 93.6, avgHours: '19.2h', tier: 'Good' },
    { rank: 5, district: 'Salem', complaints: 540, resolvedPct: 92.8, avgHours: '20.1h', tier: 'Good' },
    { rank: 6, district: 'Erode', complaints: 420, resolvedPct: 92.1, avgHours: '20.8h', tier: 'Good' },
    { rank: 7, district: 'Tirunelveli', complaints: 389, resolvedPct: 89.4, avgHours: '25.6h', tier: 'Review Needed' },
    { rank: 8, district: 'Vellore', complaints: 412, resolvedPct: 87.2, avgHours: '28.1h', tier: 'Review Needed' },
    { rank: 9, district: 'Dharmapuri', complaints: 310, resolvedPct: 84.1, avgHours: '32.4h', tier: 'Review Needed' },
    { rank: 10, district: 'Cuddalore', complaints: 450, resolvedPct: 85.5, avgHours: '30.0h', tier: 'Review Needed' },
  ];

  // AI Resource Demand & Budget Forecasting
  const resourceForecasts = [
    { district: 'Dharmapuri & Krishnagiri Belt', deficiency: 'Pothole Cold-Mix Patching Trucks', demandScore: 92, recommendation: 'Allocate ₹2.4 Cr under Special Urban Infrastructure Fund for 4 dedicated jet-patching trucks.' },
    { district: 'Cuddalore & Nagapattinam Coastal Zone', deficiency: 'Saline Corrosion Pipe Replacement', demandScore: 88, recommendation: 'Procure 28km HDPE pipeline replacement stocks under TWAD Emergency Grant.' },
    { district: 'Madurai Urban Corporation', deficiency: 'Solid Waste Compacting Vehicles', demandScore: 79, recommendation: 'Deploy 12 electric battery-operated garbage collectors to decongest Meenakshi Temple perimeter.' },
  ];

  // Policy & Systemic Trends
  const systemicTrends = [
    {
      title: 'Underground Sewerage Scheme (UGSS) Road Restoration Gaps',
      scope: 'Statewide Urban Local Bodies',
      impact: 'High',
      recommendation: 'Mandate combined inter-agency restoration contracts before road digging approval.',
    },
    {
      title: 'Drinking Water Pipeline Age Degradation in Coastal Districts',
      scope: 'Cuddalore, Nagapattinam, Ramanathapuram',
      impact: 'Critical',
      recommendation: 'Prioritize TWAD special renewal fund allocation for saline corrosion replacement.',
    },
    {
      title: 'High-Density Smart LED Lighting Retrofit Discrepancies',
      scope: 'Tier-2 Municipalities',
      impact: 'Medium',
      recommendation: 'Enforce centralized remote monitoring telemetry with vendor penalty clauses.',
    },
  ];

  // Sample geocoded tasks across state for map
  const stateMapTasks = [
    { id: '1', tracking_id: 'CC-TN-2026-CHN', title: 'Chennai Arterial Resurfacing', status: 'in_progress', priority: 'high', latitude: 13.0827, longitude: 80.2707, address: 'Chennai District', ward: 114, sla_deadline: '2026-09-08', sla_breached: false },
    { id: '2', tracking_id: 'CC-TN-2026-CBE', title: 'Coimbatore Industrial Watermain', status: 'resolved', priority: 'urgent', latitude: 11.0168, longitude: 76.9558, address: 'Coimbatore District', ward: 24, sla_deadline: '2026-09-07', sla_breached: false },
    { id: '3', tracking_id: 'CC-TN-2026-MDU', title: 'Madurai Sewer Line Desilting', status: 'in_progress', priority: 'high', latitude: 9.9252, longitude: 78.1198, address: 'Madurai District', ward: 45, sla_deadline: '2026-09-08', sla_breached: false },
    { id: '4', tracking_id: 'CC-TN-2026-TRY', title: 'Tiruchirappalli Stormwater Sluice', status: 'resolved', priority: 'medium', latitude: 10.7905, longitude: 78.7047, address: 'Tiruchirappalli District', ward: 18, sla_deadline: '2026-09-07', sla_breached: false },
    { id: '5', tracking_id: 'CC-TN-2026-SLM', title: 'Salem Smart LED Retrofit', status: 'in_progress', priority: 'low', latitude: 11.6643, longitude: 78.1460, address: 'Salem District', ward: 32, sla_deadline: '2026-09-09', sla_breached: false },
  ];

  const filteredDistricts = districtRankings.filter((d) =>
    d.district.toLowerCase().includes(districtSearch.toLowerCase())
  );

  return (
    <DashboardShell
      role={UserRole.DEPARTMENT_SECRETARY}
      title="Department Secretary State Command"
      subtitle={`${currentDept.name} • Statewide Oversight Across 38 Districts`}
      jurisdictionScope="Government of Tamil Nadu (Secretariat State-Wide Policy Scope)"
    >
      {/* Department Selector Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            🏛️
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Principal Secretary to Government
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentDept.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Ministry:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {STATE_DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* State-Level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Statewide Volume"
          value={currentDept.volume}
          subtitle="All 38 Districts (MTD)"
          icon={<Building2 className="w-6 h-6" />}
          accentColor="blue"
          change="+4.8% YoY"
          trend="up"
        />
        <KpiCard
          title="State SLA Compliance"
          value={currentDept.sla}
          subtitle="Target: 92.0% State Benchmark"
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
          change="+2.4% vs Q1"
          trend="up"
        />
        <KpiCard
          title="Capital Scheme Issues"
          value={currentDept.capitalIssues.toString()}
          subtitle="Smart Cities / AMRUT Works"
          icon={<Layers className="w-6 h-6" />}
          accentColor="purple"
          change="Monitored"
        />
        <KpiCard
          title="Top Performer"
          value={currentDept.topDistrict.split(' ')[0]}
          subtitle={currentDept.topDistrict}
          icon={<Award className="w-6 h-6" />}
          accentColor="amber"
          change="Rank #1"
        />
      </div>

      {/* Control Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('league')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'league'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>38 Districts League Table</span>
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
          <span>🗺️ Statewide GIS Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab('forecasting')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'forecasting'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Resource Demand & Budget Forecaster</span>
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'policy'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Systemic Policy Directives</span>
        </button>
      </div>

      {/* TAB 1: 38 DISTRICTS LEAGUE TABLE */}
      {activeTab === 'league' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Statewide District Grievance Redressal League Table
              </h3>
              <p className="text-xs text-slate-500">Comparative performance across 38 Revenue Districts of Tamil Nadu</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                placeholder="Search district..."
                className="text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">State Rank</th>
                  <th className="py-2.5 px-3">District Name</th>
                  <th className="py-2.5 px-3 text-center">Volume</th>
                  <th className="py-2.5 px-3 text-center">SLA Compliance</th>
                  <th className="py-2.5 px-3 text-center">Avg Turnaround</th>
                  <th className="py-2.5 px-3 text-right">Performance Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDistricts.map((d) => (
                  <tr key={d.district} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      #{d.rank}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{d.district}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">{d.complaints}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {d.resolvedPct}%
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                      {d.avgHours}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.tier === 'Exemplary'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : d.tier === 'Good'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {d.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STATEWIDE GIS HEATMAP */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={stateMapTasks}
            className="w-full h-[560px]"
          />
        </div>
      )}

      {/* TAB 3: AI RESOURCE FORECASTING */}
      {activeTab === 'forecasting' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  AI Resource Demand & Infrastructure Deficit Predictor
                </h3>
                <p className="text-xs text-slate-500">Autonomous capacity forecasting to guide upcoming state budget allocations</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              AI Forecast Active
            </span>
          </div>

          <div className="space-y-3">
            {resourceForecasts.map((rf, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{rf.district}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    Deficit Score: {rf.demandScore}/100
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Identified Bottleneck: <strong>{rf.deficiency}</strong>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Secretariat Capital Recommendation: </span>
                  {rf.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEMIC POLICY TRENDS */}
      {activeTab === 'policy' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Systemic Policy Trends & Infrastructure Gaps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systemicTrends.map((trend) => (
              <div
                key={trend.title}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {trend.scope}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {trend.impact} Impact
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                    {trend.title}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Secretariat Recommendation: </span>
                  {trend.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
