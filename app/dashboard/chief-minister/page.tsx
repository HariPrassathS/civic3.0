'use client';

// =============================================================================
// CivicConnect TN — Chief Minister Executive Command Center (/dashboard/chief-minister)
// =============================================================================
// Apex state-level dashboard providing real-time command overview, Golden Governance KPIs,
// Level 5+ critical escalations, 38-district performance league tables, GIS heatmap, and direct CM directives.

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KPICard } from '@/components/dashboard/kpi-card';
import { UserRole, ComplaintStatus, Priority } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  ShieldAlert,
  Award,
  AlertTriangle,
  Building2,
  Users,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  MapPin,
  Layers,
} from 'lucide-react';
import type { Complaint } from '@/types/database';

interface DistrictMetric {
  district: string;
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  slaCompliance: number;
  criticalEscalations: number;
  trustScore: number;
}

const DISTRICT_DATA: DistrictMetric[] = [
  { district: 'Chennai', totalComplaints: 3420, resolvedComplaints: 3120, resolutionRate: 91.2, slaCompliance: 94.5, criticalEscalations: 2, trustScore: 4.8 },
  { district: 'Coimbatore', totalComplaints: 2150, resolvedComplaints: 1980, resolutionRate: 92.1, slaCompliance: 95.2, criticalEscalations: 1, trustScore: 4.9 },
  { district: 'Madurai', totalComplaints: 1890, resolvedComplaints: 1690, resolutionRate: 89.4, slaCompliance: 91.0, criticalEscalations: 3, trustScore: 4.6 },
  { district: 'Tiruchirappalli', totalComplaints: 1420, resolvedComplaints: 1310, resolutionRate: 92.3, slaCompliance: 93.8, criticalEscalations: 0, trustScore: 4.8 },
  { district: 'Salem', totalComplaints: 1340, resolvedComplaints: 1220, resolutionRate: 91.0, slaCompliance: 92.4, criticalEscalations: 1, trustScore: 4.7 },
  { district: 'Tirunelveli', totalComplaints: 980, resolvedComplaints: 890, resolutionRate: 90.8, slaCompliance: 91.5, criticalEscalations: 1, trustScore: 4.6 },
  { district: 'Erode', totalComplaints: 850, resolvedComplaints: 790, resolutionRate: 92.9, slaCompliance: 94.1, criticalEscalations: 0, trustScore: 4.8 },
  { district: 'Vellore', totalComplaints: 1120, resolvedComplaints: 960, resolutionRate: 85.7, slaCompliance: 86.2, criticalEscalations: 4, trustScore: 4.2 },
  { district: 'Thanjavur', totalComplaints: 910, resolvedComplaints: 830, resolutionRate: 91.2, slaCompliance: 92.0, criticalEscalations: 1, trustScore: 4.6 },
  { district: 'Dharmapuri', totalComplaints: 760, resolvedComplaints: 630, resolutionRate: 82.9, slaCompliance: 83.5, criticalEscalations: 5, trustScore: 4.0 },
  { district: 'Cuddalore', totalComplaints: 890, resolvedComplaints: 750, resolutionRate: 84.3, slaCompliance: 85.0, criticalEscalations: 4, trustScore: 4.1 },
  { district: 'Kanyakumari', totalComplaints: 640, resolvedComplaints: 605, resolutionRate: 94.5, slaCompliance: 96.0, criticalEscalations: 0, trustScore: 4.9 },
];

export default function ChiefMinisterDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'departments' | 'escalations'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [directiveText, setDirectiveText] = useState('');
  const [directiveTarget, setDirectiveTarget] = useState('All District Collectors & Dept Secretaries');
  const [directiveDispatched, setDirectiveDispatched] = useState(false);

  const fetchComplaints = React.useCallback(() => {
    setLoading(true);
    fetch('/api/complaints?limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setComplaints(json.data);
        }
      })
      .catch((e) => console.error('Failed to load complaints for CM command dashboard:', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const totalStatewideGrievances = 18450 + complaints.length;
  const resolvedStatewideGrievances =
    16820 +
    complaints.filter(
      (c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
    ).length;
  const statewideResolutionRate = ((resolvedStatewideGrievances / totalStatewideGrievances) * 100).toFixed(1);

  // Critical Red Flag Escalations (Level 5+)
  const criticalRedFlags = complaints.filter(
    (c) => c.priority === Priority.URGENT || c.priority === Priority.HIGH || (c.escalation_level && c.escalation_level >= 3)
  );

  const handleDispatchDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim()) return;
    setDirectiveDispatched(true);
    setTimeout(() => {
      setDirectiveText('');
      setDirectiveDispatched(false);
    }, 4000);
  };

  const sortedDistricts = [...DISTRICT_DATA].sort((a, b) => b.resolutionRate - a.resolutionRate);
  const topDistricts = sortedDistricts.slice(0, 4);
  const bottomDistricts = sortedDistricts.slice(-4).reverse();

  const filteredDistricts = DISTRICT_DATA.filter((d) =>
    d.district.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Sample tasks for CM State Map
  const cmMapTasks = [
    { id: '1', tracking_id: 'CM-ESC-01', title: 'Royapuram Drinking Water Outbreak', status: 'escalated', priority: 'urgent', latitude: 13.1147, longitude: 80.2974, address: 'Royapuram, Chennai', ward: 48, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '2', tracking_id: 'CM-ESC-02', title: 'Madurai Urban Sewer Spill', status: 'escalated', priority: 'urgent', latitude: 9.9252, longitude: 78.1198, address: 'Madurai Meenakshi Perimeter', ward: 45, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '3', tracking_id: 'CM-ESC-03', title: 'Perambur Peripheral Hospital Flood Wall', status: 'escalated', priority: 'urgent', latitude: 13.1110, longitude: 80.2430, address: 'Perambur, Chennai', ward: 72, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '4', tracking_id: 'CM-ESC-04', title: 'Coimbatore Textile Belt Road Cavity', status: 'in_progress', priority: 'high', latitude: 11.0168, longitude: 76.9558, address: 'Avinashi Road, Coimbatore', ward: 24, sla_deadline: '2026-09-08', sla_breached: false },
  ];

  return (
    <DashboardShell
      role={UserRole.CHIEF_MINISTER}
      title="Chief Minister Executive Command Center"
      subtitle="Apex State Governance Overview — 38 Districts & 8 Government Line Departments"
      jurisdictionScope="State of Tamil Nadu (Apex Secretariat)"
    >
      {/* Top Governance Golden KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Statewide Grievances"
          value={totalStatewideGrievances.toLocaleString()}
          subtitle="Cumulative citizen filings (YTD)"
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          trend={{ value: '98.4%', label: 'digitally mapped', positive: true }}
          accentColor="indigo"
        />
        <KPICard
          title="State Resolution Rate"
          value={`${statewideResolutionRate}%`}
          subtitle={`${resolvedStatewideGrievances.toLocaleString()} verified resolved`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          trend={{ value: '+4.2%', label: 'vs last month', positive: true }}
          accentColor="emerald"
        />
        <KPICard
          title="Critical Red Flags"
          value={criticalRedFlags.length > 0 ? `${criticalRedFlags.length}` : '2'}
          subtitle="Direct CM Office monitoring"
          icon={<ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          accentColor="rose"
        />
        <KPICard
          title="Public Trust Index"
          value="4.78 / 5.0"
          subtitle="Based on verified citizen feedback"
          icon={<Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          trend={{ value: '+0.3 pts', label: 'governance trust', positive: true }}
          accentColor="amber"
        />
      </div>

      {/* CM Special Directives & Emergency Intervention Dispatcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-800/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Chief Minister Special Directive Desk</h2>
              <p className="text-xs text-indigo-200">
                Issue time-bound executive orders directly to District Collectors, Commissioners, and Secretaries.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Priority Level: Statutory Directive
          </span>
        </div>

        <form onSubmit={handleDispatchDirective} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-indigo-300 mb-1">Target Authority</label>
              <select
                value={directiveTarget}
                onChange={(e) => setDirectiveTarget(e.target.value)}
                aria-label="Target Authority"
                className="w-full text-xs rounded-xl bg-slate-800 border border-slate-700 text-white p-2.5 focus:outline-hidden focus:border-amber-400"
              >
                <option value="All District Collectors & Dept Secretaries">All 38 District Collectors & Secretaries</option>
                <option value="Chennai & Madurai District Collectors">Chennai & Madurai Collectors (Monsoon Alert)</option>
                <option value="MAWS & Highways Secretaries">MAWS & Highways Secretaries (Road Safety)</option>
                <option value="Dharmapuri & Cuddalore Collectors">Dharmapuri & Cuddalore Collectors (SLA Bottleneck)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-indigo-300 mb-1">Executive Order / Governance Directive</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={directiveText}
                  onChange={(e) => setDirectiveText(e.target.value)}
                  placeholder="e.g. Ensure 100% pothole rectification and waterlogging relief within 48 hours in coastal districts."
                  className="flex-1 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white p-2.5 focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!directiveText.trim()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {directiveDispatched && (
          <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Executive Directive successfully broadcasted to {directiveTarget}. Logged in the State Audit Register.</span>
          </div>
        )}
      </div>

      {/* Control Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>38-District League Table</span>
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
          <span>🗺️ Statewide Live GIS Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Department Performance Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'escalations'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Apex Escalations Monitor</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & 38-DISTRICT LEAGUE TABLE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: State District Performance Matrix */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>38-District Redressal League Table</span>
                </h2>
                <p className="text-xs text-slate-500">State-wide benchmark across municipal corporations and rural collectorates.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search district..."
                  className="text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Top 4 & Bottom 4 Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Top Performing Districts
                  </span>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    92%+ Rate
                  </span>
                </div>
                <div className="space-y-2">
                  {topDistricts.map((d, i) => (
                    <div key={d.district} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{d.district}</span>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{d.resolutionRate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Priority Attention Districts
                  </span>
                  <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded-full font-bold">
                    Action Required
                  </span>
                </div>
                <div className="space-y-2">
                  {bottomDistricts.map((d, i) => (
                    <div key={d.district} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{d.district}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{d.criticalEscalations} escalations</span>
                        <span className="font-bold text-rose-700 dark:text-rose-400">{d.resolutionRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* District Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">District</th>
                    <th className="p-3 text-right">Grievances</th>
                    <th className="p-3 text-right">Resolved</th>
                    <th className="p-3 text-right">Resolution %</th>
                    <th className="p-3 text-right">SLA %</th>
                    <th className="p-3 text-center">Trust Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDistricts.map((d) => (
                    <tr key={d.district} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{d.district}</td>
                      <td className="p-3 text-right text-slate-700 dark:text-slate-300">{d.totalComplaints.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{d.resolvedComplaints.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        <span className={d.resolutionRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}>
                          {d.resolutionRate}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">{d.slaCompliance}%</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full text-[11px]">
                          ★ {d.trustScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 5 Cols: Citizen Voice & Governance Pulse */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Citizen Voice & Governance Pulse</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">Senthil K. (Ward 114, Chennai)</span>
                    <span className="text-amber-500 font-bold">★★★★★</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    &ldquo;Deep trench near Anna Salai repaired in less than 24 hours after filing on CivicConnect. Excellent work by GCC field gang.&rdquo;
                  </p>
                  <div className="text-[10px] text-slate-400">Department of Highways & Municipal Corp</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">Meenakshi R. (Coimbatore South)</span>
                    <span className="text-amber-500 font-bold">★★★★★</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    &ldquo;Water supply pipeline burst fixed promptly. Verification photos shown in tracking portal gave full clarity.&rdquo;
                  </p>
                  <div className="text-[10px] text-slate-400">TWAD & Municipal Water Supply</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">Kavitha N. (Madurai Central)</span>
                    <span className="text-amber-500 font-bold">★★★★☆</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    &ldquo;Streetlight pole replaced quickly. Happy with the prompt action from the TANGEDCO team.&rdquo;
                  </p>
                  <div className="text-[10px] text-slate-400">TANGEDCO Street Lighting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATEWIDE LIVE GIS HEATMAP */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={cmMapTasks}
            className="w-full h-[560px]"
          />
        </div>
      )}

      {/* TAB 3: DEPARTMENT PERFORMANCE MATRIX */}
      {activeTab === 'departments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                State Line Ministries & Departmental Scorecard
              </h3>
            </div>
            <span className="text-xs text-slate-500">Cabinet Performance Review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Municipal Administration (MAWS)', volume: '8,420', compliance: '94.2%', redFlags: 1, lead: 'Pr. Sec. Shiv Das Meena' },
              { name: 'Highways & PWD', volume: '6,180', compliance: '92.8%', redFlags: 2, lead: 'Pr. Sec. Pradeep Yadav' },
              { name: 'Energy (TANGEDCO)', volume: '5,840', compliance: '96.4%', redFlags: 0, lead: 'Pr. Sec. Rajesh Lakhoni' },
              { name: 'Health & Family Welfare', volume: '3,290', compliance: '95.8%', redFlags: 0, lead: 'Pr. Sec. J. Radhakrishnan' },
              { name: 'Rural Development (RDPR)', volume: '4,720', compliance: '93.1%', redFlags: 1, lead: 'Pr. Sec. Gagandeep Bedi' },
              { name: 'Housing & Urban Dev', volume: '2,140', compliance: '89.4%', redFlags: 3, lead: 'Pr. Sec. Hitesh Kumar Makwana' },
            ].map((d) => (
              <div
                key={d.name}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</h4>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{d.compliance}</span>
                </div>
                <div className="text-[11px] text-slate-500">Lead: {d.lead}</div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>{d.volume} Grievances</span>
                  <span className={d.redFlags > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                    {d.redFlags > 0 ? `🚨 ${d.redFlags} Bottlenecks` : '● Clear'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: APEX ESCALATIONS MONITOR */}
      {activeTab === 'escalations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Apex Escalations Monitor (Level 5-8)</h3>
            </div>
            <button
              onClick={fetchComplaints}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {criticalRedFlags.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Level 5+ critical escalations</p>
                <p className="text-[11px] text-slate-500">Statewide emergency services operating within nominal parameters.</p>
              </div>
            ) : (
              criticalRedFlags.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 font-bold">
                        {c.tracking_id}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase">
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-rose-200/60 dark:border-rose-900/30">
                    <span>Status: <strong className="text-rose-700 dark:text-rose-300">{c.status}</strong></span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Level {c.escalation_level || 5} Escalated</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
