'use client';

// =============================================================================
// CivicConnect TN — Chief Secretary State Matrix Dashboard (/dashboard/chief-secretary)
// =============================================================================
// Apex civil administration & whole-of-government coordination matrix for the Chief Secretary of Tamil Nadu (IAS).
// Features: Cross-ministerial SLA index, inter-departmental bottleneck tracker, state civil scorecard, GIS state heatmap, AI governance risks.

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UserRole } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Activity,
  Layers,
  Sparkles,
  MapPin,
  Users,
} from 'lucide-react';

export default function ChiefSecretaryDashboard() {
  const [activeTab, setActiveTab] = useState<'bottlenecks' | 'scorecard' | 'heatmap' | 'ai_insights'>('bottlenecks');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Department Performance Matrix across Secretariat
  const departmentScorecard = [
    { department: 'Municipal Administration & Water Supply (MAWS)', leadSecretary: 'Principal Sec MAWS', total: 3240, compliance: 95.2, redFlags: 1 },
    { department: 'Highways & Minor Ports Department', leadSecretary: 'Principal Sec Highways', total: 2180, compliance: 92.4, redFlags: 2 },
    { department: 'Energy & Electricity (TANGEDCO)', leadSecretary: 'Principal Sec Energy', total: 1840, compliance: 96.1, redFlags: 0 },
    { department: 'Health & Family Welfare', leadSecretary: 'Principal Sec Health', total: 980, compliance: 96.8, redFlags: 0 },
    { department: 'Housing & Urban Development', leadSecretary: 'Principal Sec Housing', total: 840, compliance: 88.4, redFlags: 3 },
    { department: 'Rural Development & Panchayat Raj', leadSecretary: 'Principal Sec RDPR', total: 1420, compliance: 93.7, redFlags: 1 },
  ];

  // Inter-Departmental Bottlenecks requiring CS Intervention
  const bottlenecks = [
    {
      id: 'BOT-01',
      title: 'CMRL Metro Phase-2 excavation intersecting CMWSSB 900mm drinking water main pipeline',
      agencies: ['CMRL (Metro)', 'CMWSSB (Water)', 'Highways'],
      delay: '14 Days Overdue',
      status: 'Inter-Ministerial Standstill',
      action: 'Convene joint coordination meeting with MD CMRL and MD CMWSSB.',
    },
    {
      id: 'BOT-02',
      title: 'TANGEDCO 33kV Substation underground cabling delayed due to National Highways Authority (NHAI) ROW clearance',
      agencies: ['TANGEDCO (Energy)', 'NHAI', 'Revenue Dept'],
      delay: '8 Days Overdue',
      status: 'Awaiting State Clearance',
      action: 'Issue statutory ROW facilitation directive to District Collector.',
    },
    {
      id: 'BOT-03',
      title: 'Tambaram–Chengalpattu Stormwater Outfall Discharge blocked by Southern Railway culvert embankment',
      agencies: ['Southern Railway', 'MAWS', 'PWD'],
      delay: '11 Days Overdue',
      status: 'Railway Clearance Pending',
      action: 'Issue Chief Secretary Demi-Official (DO) letter to General Manager, Southern Railway.',
    },
  ];

  // AI Governance Insights
  const governanceInsights = [
    { title: 'Inter-Agency ROW Approvals Lagging by Avg 16 Days', risk: 'High', desc: 'Utility trenching permissions between Highways and TANGEDCO cause 38% of all road repair delays statewide. Recommended: Single-window digital dig clearance system.' },
    { title: 'District Collector Coordination Efficiency Benchmark', risk: 'Low', desc: 'Revenue Divisional Officer (RDO) weekly grievances review meetings increased Level 2 resolution velocity by 24% across Western Districts.' },
  ];

  // Sample tasks for State Map
  const stateMapTasks = [
    { id: '1', tracking_id: 'BOT-01', title: 'CMRL vs CMWSSB Metro Corridor', status: 'escalated', priority: 'urgent', latitude: 13.0418, longitude: 80.2341, address: 'Kodambakkam / T. Nagar Corridor', ward: 114, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '2', tracking_id: 'BOT-02', title: 'TANGEDCO 33kV Substation ROW', status: 'in_progress', priority: 'high', latitude: 12.9815, longitude: 80.2180, address: 'Velachery Inner Ring Road', ward: 175, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '3', tracking_id: 'BOT-03', title: 'Tambaram Railway Culvert Outfall', status: 'escalated', priority: 'urgent', latitude: 12.9249, longitude: 80.1000, address: 'Tambaram Railway Junction', ward: 84, sla_deadline: '2026-09-08', sla_breached: true },
  ];

  return (
    <DashboardShell
      role={UserRole.CHIEF_SECRETARY}
      title="Chief Secretary State Executive Matrix"
      subtitle="Government of Tamil Nadu • Whole-of-Government Civil Administration Command"
      jurisdictionScope="Secretariat Apex Civil Service Scope"
    >
      {/* Floating Action Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-950/60'
              : 'bg-rose-600 text-white shadow-rose-950/60'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* State Administration KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="State Grievances Load"
          value="14,890"
          subtitle="All 8 State Departments (MTD)"
          icon={<Building2 className="w-6 h-6" />}
          accentColor="blue"
          change="+5.1% Intake"
          trend="up"
        />
        <KpiCard
          title="Statewide SLA Index"
          value="94.6%"
          subtitle="Target: 93.0% Cabinet Benchmark"
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
          change="+1.9% MoM"
          trend="up"
        />
        <KpiCard
          title="Inter-Agency Bottlenecks"
          value={bottlenecks.length}
          subtitle="Cross-Departmental Blockers"
          icon={<AlertTriangle className="w-6 h-6" />}
          accentColor="rose"
          change="Requires CS Action"
        />
        <KpiCard
          title="Good Governance Index"
          value="98.2"
          subtitle="State Accountability Score"
          icon={<Activity className="w-6 h-6" />}
          accentColor="indigo"
          change="Rank #1 in India"
          trend="up"
        />
      </div>

      {/* Control Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('bottlenecks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'bottlenecks'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Inter-Departmental Bottlenecks ({bottlenecks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'scorecard'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Secretariat Scorecard (6 Ministries)</span>
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
          <span>🗺️ State Strategic Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_insights')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ai_insights'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Governance Risk Engine</span>
        </button>
      </div>

      {/* TAB 1: INTER-AGENCY BOTTLENECKS */}
      {activeTab === 'bottlenecks' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Inter-Departmental Blockers & Cabinet Escalations
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
              {bottlenecks.length} Critical Issues
            </span>
          </div>

          <div className="space-y-3">
            {bottlenecks.map((bot) => (
              <div
                key={bot.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-rose-200 dark:border-rose-900/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 rounded">
                      {bot.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Inter-Agency Bottleneck
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {bot.delay}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                  {bot.title}
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Involved Departments:</span>
                  {bot.agencies.map((agency) => (
                    <span
                      key={agency}
                      className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
                    >
                      {agency}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">Chief Secretary Directive: </span>
                    {bot.action}
                  </p>
                  <button
                    type="button"
                    onClick={() => showToast(`Joint Secretary Audit & Review summoned for ${bot.id}`, 'success')}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 cursor-pointer touch-target shadow-xs"
                  >
                    Summon Joint Secretary Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SECRETARIAT SCORECARD */}
      {activeTab === 'scorecard' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Secretariat Department Performance Matrix
              </h3>
            </div>
            <span className="text-xs text-slate-500">Cabinet Performance Review</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Lead Secretary</th>
                  <th className="py-2.5 px-3 text-center">Grievances</th>
                  <th className="py-2.5 px-3 text-center">SLA Compliance</th>
                  <th className="py-2.5 px-3 text-right">Red Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departmentScorecard.map((dept) => (
                  <tr key={dept.department} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{dept.department}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{dept.leadSecretary}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">{dept.total}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {dept.compliance}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      {dept.redFlags > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                          {dept.redFlags} Bottlenecks
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">0 None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STATE STRATEGIC MAP */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={stateMapTasks}
            className="w-full h-[560px]"
          />
        </div>
      )}

      {/* TAB 4: AI GOVERNANCE RISK ENGINE */}
      {activeTab === 'ai_insights' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                AI Statewide Civil Administration Risk Predictor
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              Autonomous Governance Telemetry
            </span>
          </div>

          <div className="space-y-3">
            {governanceInsights.map((g, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{g.title}</h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${g.risk === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                    Risk: {g.risk}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
