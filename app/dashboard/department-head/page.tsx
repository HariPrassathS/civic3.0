'use client';

// =============================================================================
// CivicConnect TN — Department Head / Executive Engineer Dashboard
// =============================================================================
// Operational & analytical command center for Executive Engineers (EE) and Department Heads.
// Features: Department switcher, departmental KPIs, category breakdown, ward performance leaderboards, SLA compliance, AI insights.

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UserRole, Priority, ComplaintStatus } from '@/types/enums';
import {
  Building2,
  CheckCircle2,
  Clock,
  Star,
  Layers,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Users,
  Search,
} from 'lucide-react';
import type { Complaint } from '@/types/database';

interface DeptConfig {
  id: string;
  name: string;
  code: string;
  leadOfficer: string;
  division: string;
  categories: { code: string; name: string; count: number; resolvedPct: number; avgHours: number }[];
  insights: { title: string; type: 'warning' | 'positive' | 'action'; desc: string }[];
}

const DEPARTMENTS: DeptConfig[] = [
  {
    id: 'roads',
    name: 'Highways & Road Infrastructure',
    code: 'HIGHWAYS_GCC',
    leadOfficer: 'Er. R. Soundararajan, EE (Roads)',
    division: 'Greater Chennai Corporation • Central Division',
    categories: [
      { code: 'ROADS_POTHOLE', name: 'Pothole Remediation', count: 18, resolvedPct: 94, avgHours: 16 },
      { code: 'ROADS_DAMAGE', name: 'Road Trench Restoration', count: 12, resolvedPct: 88, avgHours: 28 },
      { code: 'ROADS_BRIDGE', name: 'Flyover Joint Repair', count: 4, resolvedPct: 100, avgHours: 11 },
      { code: 'ROADS_FOOTPATH', name: 'Footpath & Paver Blocks', count: 9, resolvedPct: 82, avgHours: 42 },
    ],
    insights: [
      { title: 'Trench Restoration Bottleneck in Ward 175', type: 'warning', desc: 'Sewer line work by CMWSSB causing recurring road subsidence near Velachery Bypass.' },
      { title: 'Pothole Turnaround 24% Ahead of SLA', type: 'positive', desc: 'Cold-mix asphalt patch trucks resolved 18 grievances in average 16 hours.' },
    ],
  },
  {
    id: 'water',
    name: 'Water Supply & Sewerage (CMWSSB)',
    code: 'WATER_CMWSSB',
    leadOfficer: 'Er. K. Natarajan, EE (Metro Water)',
    division: 'Metro Water Area X • T. Nagar & Kodambakkam',
    categories: [
      { code: 'WATER_LEAK', name: 'Watermain Pipe Burst', count: 14, resolvedPct: 92, avgHours: 14 },
      { code: 'WATER_CONTAM', name: 'Drinking Water Quality', count: 6, resolvedPct: 90, avgHours: 12 },
      { code: 'SEWAGE_OVERFLOW', name: 'Sewer Manhole Overflow', count: 22, resolvedPct: 95, avgHours: 8 },
      { code: 'LOW_PRESSURE', name: 'Low Pressure in Tail-end', count: 8, resolvedPct: 84, avgHours: 36 },
    ],
    insights: [
      { title: 'Sewer Super-Sucker Unit Deployed in Zone 10', type: 'positive', desc: 'Heavy jetting machines cleared 22 manholes within 8 hours of filing.' },
      { title: 'Low Pressure Complaints in Slum Tenements', type: 'action', desc: 'Direct booster pumping station valve adjustments ordered for Ward 114.' },
    ],
  },
  {
    id: 'sanitation',
    name: 'Sanitation & Solid Waste Management',
    code: 'SANITATION_SWM',
    leadOfficer: 'Dr. V. Kavitha, SE (Solid Waste)',
    division: 'Greater Chennai Corporation • Solid Waste Wing',
    categories: [
      { code: 'GARBAGE_BIN', name: 'Overflowing Public Dustbins', count: 32, resolvedPct: 98, avgHours: 6 },
      { code: 'DOOR_COLLECT', name: 'Door-to-Door Waste Collection', count: 15, resolvedPct: 96, avgHours: 12 },
      { code: 'DEBRIS_REMOVAL', name: 'Construction Debris Dumping', count: 11, resolvedPct: 86, avgHours: 34 },
    ],
    insights: [
      { title: '98% SLA Compliance on Micro-Composting', type: 'positive', desc: 'Battery-operated vehicles (BOV) cleared 32 secondary collection points within 6h.' },
    ],
  },
  {
    id: 'lighting',
    name: 'Street Lighting & Illumination',
    code: 'LIGHTING_TANGEDCO',
    leadOfficer: 'Er. M. Senthil, EE (Electrical)',
    division: 'TANGEDCO & Corporation Electrical Wing',
    categories: [
      { code: 'LIGHT_OUTAGE', name: 'LED Streetlight Outage', count: 24, resolvedPct: 97, avgHours: 11 },
      { code: 'POLE_DAMAGE', name: 'Damaged Electric Lamp Post', count: 5, resolvedPct: 90, avgHours: 20 },
      { code: 'CABLE_HANGING', name: 'Hanging Low-Tension Wire', count: 8, resolvedPct: 100, avgHours: 4 },
    ],
    insights: [
      { title: 'Smart Feeder Telemetry Operational', type: 'positive', desc: 'Automated remote sensors flagged 8 low-hanging wires, rectifying in under 4 hours.' },
    ],
  },
  {
    id: 'stormwater',
    name: 'Stormwater & Flood Mitigation',
    code: 'SWD_GCC',
    leadOfficer: 'Er. S. Balasubramanian, EE (Stormwater)',
    division: 'Greater Chennai Corporation • Drainage Wing',
    categories: [
      { code: 'DRAIN_CLOG', name: 'Silt Block in SWD Grating', count: 16, resolvedPct: 91, avgHours: 18 },
      { code: 'WATERLOGGING', name: 'Street Water Inundation', count: 9, resolvedPct: 88, avgHours: 22 },
    ],
    insights: [
      { title: 'Monsoon Desilting Target 91% Achieved', type: 'positive', desc: 'High-capacity silt grabbers cleared 16 macro-drain inlets in Zone 10.' },
    ],
  },
  {
    id: 'electricity',
    name: 'Electricity & Power Distribution',
    code: 'POWER_TANGEDCO',
    leadOfficer: 'Er. P. Jayakumar, SE (Distribution)',
    division: 'TANGEDCO Chennai South EDC',
    categories: [
      { code: 'TRANSFORMER_TRIP', name: 'Distribution Transformer Tripping', count: 7, resolvedPct: 100, avgHours: 3 },
      { code: 'VOLTAGE_FLUCT', name: 'Low Voltage Fluctuation', count: 12, resolvedPct: 92, avgHours: 18 },
    ],
    insights: [
      { title: 'Thermal Imaging Inspection in Sub-Stations', type: 'positive', desc: 'Zero unannounced transformer burnouts recorded across T. Nagar substations.' },
    ],
  },
];

export default function DepartmentHeadDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('roads');
  const [activeTab, setActiveTab] = useState<'queue' | 'leaderboard' | 'insights' | 'escalations'>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.complaints) {
          setComplaints(data.data.complaints);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const currentDept = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];

  const total = complaints.length;
  const resolved = complaints.filter(
    (c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  ).length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 94;

  // Ward leaderboard
  const wardLeaderboard = [
    { ward: 114, name: 'T. Nagar', officer: 'AE Selvi N', resolved: 42, active: 4, compliance: '96%' },
    { ward: 105, name: 'Anna Nagar West', officer: 'AE Vijay M', resolved: 38, active: 2, compliance: '98%' },
    { ward: 122, name: 'Mylapore', officer: 'AE Sundaram S', resolved: 29, active: 6, compliance: '91%' },
    { ward: 173, name: 'Guindy / Adyar', officer: 'AE Balaji P', resolved: 34, active: 5, compliance: '93%' },
    { ward: 175, name: 'Velachery', officer: 'AE Ramesh K', resolved: 21, active: 8, compliance: '84%' },
  ];

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery) return true;
    return (
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <DashboardShell
      role={UserRole.DEPARTMENT_HEAD}
      title="Department Head & Executive Engineer Console"
      subtitle={`${currentDept.name} • ${currentDept.division}`}
      jurisdictionScope={currentDept.division}
    >
      {/* Department Selector Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {currentDept.leadOfficer}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {currentDept.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentDept.division}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Department:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Department KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Department Volume"
          value={total > 0 ? total : 43}
          subtitle={`${currentDept.name} (MTD)`}
          icon={<Building2 className="w-6 h-6" />}
          accentColor="blue"
          change="+14% MoM"
          trend="up"
        />
        <KpiCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          subtitle="Target: 90% SLA compliance"
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
          change="+3.2%"
          trend="up"
        />
        <KpiCard
          title="Avg Turnaround"
          value="16.4h"
          subtitle="State Average: 24h"
          icon={<Clock className="w-6 h-6" />}
          accentColor="indigo"
          change="-4.2h faster"
          trend="up"
        />
        <KpiCard
          title="Citizen Trust"
          value="4.8 / 5"
          subtitle="Based on verified citizen ratings"
          icon={<Star className="w-6 h-6" />}
          accentColor="amber"
          change="★ Top Tier"
        />
      </div>

      {/* Control Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Grievance Queue & Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Ward & AE Performance</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Insights & Hotspots ({currentDept.insights.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'escalations'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Level 3 Escalations (1)</span>
        </button>
      </div>

      {/* TAB 1: QUEUE & CATEGORIES */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Category Efficiency Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {currentDept.name} — Category Efficiency & SLA Matrix
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Auto-Refreshed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDept.categories.map((cat) => (
                <div
                  key={cat.code}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-slate-500">{cat.count} Grievances</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${cat.resolvedPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{cat.resolvedPct}% Resolved within SLA</span>
                    <span>Avg: {cat.avgHours} hours</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Department Grievances Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Live Division Grievance Queue
                </h3>
                <p className="text-xs text-slate-500">Live operational issue tracking across all division wards</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grievance..."
                  className="text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading complaints...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No active grievances in this filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Tracking ID</th>
                      <th className="py-2.5 px-3">Title & Location</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">SLA Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredComplaints.slice(0, 8).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {c.tracking_id}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{c.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{c.address || `Ward ${c.ward}`}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.priority === Priority.URGENT
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : c.priority === Priority.HIGH
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                          {c.sla_breached ? (
                            <span className="text-rose-600 font-bold">⚠️ Breached</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Active SLA</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WARD & AE LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ward & Assistant Engineer (AE) Performance Leaderboard
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
              GCC Zone 10 Division
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Nodal AE</th>
                  <th className="py-2.5 px-3 text-center">Resolved</th>
                  <th className="py-2.5 px-3 text-center">Active</th>
                  <th className="py-2.5 px-3 text-right">SLA %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wardLeaderboard.map((w, idx) => (
                  <tr key={w.ward} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      #{idx + 1} • W{w.ward}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">{w.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold">{w.officer}</td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {w.resolved}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                      {w.active}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {w.compliance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI INSIGHTS & HOTSPOTS */}
      {activeTab === 'insights' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              AI Operational Intelligence & Department Hotspots
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDept.insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-2 ${
                  insight.type === 'warning'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                    : insight.type === 'action'
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{insight.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      insight.type === 'warning'
                        ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                        : insight.type === 'action'
                        ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                        : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {insight.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ESCALATIONS */}
      {activeTab === 'escalations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Level 3 Departmental Escalations (Overdue Beyond 24 Hours)
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                CC-TN-2026-928104
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                OVERDUE 18H
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Drinking Water Contamination near Royapuram
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Cross-contamination reported in secondary supply line. Immediate super-chlorination and line flushing crew assigned.
            </p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
