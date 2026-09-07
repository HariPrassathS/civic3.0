'use client';

// =============================================================================
// CivicConnect TN — District Collector Dashboard (/dashboard/district-collector)
// =============================================================================
// District administration & law-and-order/civic coordination console for District Collectors (IAS).
// Features: Revenue division tracking, Level 1-5 escalation oversight, disaster & monsoon alerts, statutory directives.

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UserRole, Priority } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  Shield,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Send,
  MapPin,
  Flame,
  Clock,
  Radio,
  Layers,
} from 'lucide-react';

export default function DistrictCollectorDashboard() {
  const [activeTab, setActiveTab] = useState<'escalations' | 'taluks' | 'map' | 'disaster'>('escalations');
  const [directiveText, setDirectiveText] = useState('');
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Critical Escalations data
  const escalations = [
    {
      id: 'ESC-CHN-001',
      tracking_id: 'CC-TN-2026-928104',
      level: 3,
      title: 'Drinking Water Contamination in 400 households near Royapuram Slum',
      department: 'Water Supply (CMWSSB)',
      location: 'Ward 48, Royapuram Taluk',
      sla_overdue_by: '18 hours',
      priority: Priority.URGENT,
      status: 'Escalated to Collector',
    },
    {
      id: 'ESC-CHN-002',
      tracking_id: 'CC-TN-2026-928190',
      level: 2,
      title: 'Major Road Cavity & Sewer Collapse on Inner Ring Road',
      department: 'Highways & Infrastructure',
      location: 'Ward 127, Guindy Taluk',
      sla_overdue_by: '6 hours',
      priority: Priority.HIGH,
      status: 'Escalated to DRO',
    },
    {
      id: 'ESC-CHN-003',
      tracking_id: 'CC-TN-2026-749201',
      level: 4,
      title: 'Monsoon Sump Wall Collapse Blocking Ambulances at Govt Peripheral Hospital',
      department: 'Highways & PWD',
      location: 'Perambur Taluk',
      sla_overdue_by: '12 hours',
      priority: Priority.URGENT,
      status: 'Escalated Level 4',
    },
  ];

  // Taluk Breakdown
  const talukPerformance = [
    { taluk: 'Egmore Taluk', rdo: 'Central Division', total: 142, resolvedPct: 96, openEscalations: 0 },
    { taluk: 'Mylapore Taluk', rdo: 'South Division', total: 188, resolvedPct: 94, openEscalations: 1 },
    { taluk: 'Guindy Taluk', rdo: 'South Division', total: 165, resolvedPct: 92, openEscalations: 1 },
    { taluk: 'Tondiarpet Taluk', rdo: 'North Division', total: 198, resolvedPct: 88, openEscalations: 2 },
    { taluk: 'Velachery Taluk', rdo: 'South Division', total: 134, resolvedPct: 91, openEscalations: 0 },
    { taluk: 'Sholinganallur Taluk', rdo: 'South Division', total: 112, resolvedPct: 87, openEscalations: 1 },
    { taluk: 'Ambattur Taluk', rdo: 'Central Division', total: 156, resolvedPct: 93, openEscalations: 0 },
    { taluk: 'Perambur Taluk', rdo: 'North Division', total: 172, resolvedPct: 89, openEscalations: 1 },
  ];

  // Disaster & Weather Alert Bulletins
  const disasterAlerts = [
    { id: 'ALT-01', level: 'ORANGE', title: 'Heavy Inflow Alert: Chembarambakkam Surplus Canal Sluice Gates', time: '1 hour ago', desc: 'Water Resources Department (WRD) discharged 1,500 cusecs. Low-lying hamlets in Kundrathur and Alandur notified.', authority: 'State Disaster Management Authority (TNSDMA)' },
    { id: 'ALT-02', level: 'YELLOW', title: 'Coastal Wind & High-Tide Surge: Royapuram to Ennore Belt', time: '3 hours ago', desc: 'Gale wind warnings up to 55 kmph. Fishermen cautioned; revenue relief centers on standby in Tondiarpet.', authority: 'Regional Meteorological Centre' },
  ];

  // Geocoded tasks for District Heatmap
  const districtMapTasks = [
    { id: '1', tracking_id: 'CC-TN-2026-928104', title: 'Royapuram Water Contamination', status: 'escalated', priority: 'urgent', latitude: 13.1147, longitude: 80.2974, address: 'Royapuram Taluk Slum Colony', ward: 48, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '2', tracking_id: 'CC-TN-2026-928190', title: 'Guindy Inner Ring Road Cavity', status: 'in_progress', priority: 'high', latitude: 13.0067, longitude: 80.2025, address: 'Guindy Industrial Estate', ward: 127, sla_deadline: '2026-09-08', sla_breached: false },
    { id: '3', tracking_id: 'CC-TN-2026-749201', title: 'Perambur Hospital Sump Collapse', status: 'escalated', priority: 'urgent', latitude: 13.1110, longitude: 80.2430, address: 'Govt Peripheral Hospital, Perambur', ward: 72, sla_deadline: '2026-09-08', sla_breached: true },
    { id: '4', tracking_id: 'CC-TN-2026-883901', title: 'Mylapore Canal Silt Block', status: 'assigned', priority: 'medium', latitude: 13.0339, longitude: 80.2678, address: 'Buckingham Canal, Mylapore', ward: 122, sla_deadline: '2026-09-09', sla_breached: false },
  ];

  const handleIssueDirective = (escalationId: string) => {
    if (!directiveText.trim()) {
      showToast('Please enter directive instructions before dispatching.', 'error');
      return;
    }
    showToast(`Collectorate Statutory Directive dispatched for ${escalationId}. Executive Engineer & RDO notified.`, 'success');
    setDirectiveText('');
    setSelectedEscalationId(null);
  };

  return (
    <DashboardShell
      role={UserRole.DISTRICT_COLLECTOR}
      title="District Collectorate Command Center"
      subtitle="Chennai Revenue District • 16 Taluks • 3 Revenue Divisions (North, Central, South)"
      jurisdictionScope="District Collectorate (Chennai District Magistrate Scope)"
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

      {/* Top District KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="District Grievances"
          value="2,140"
          subtitle="All Taluks & Municipalities (MTD)"
          icon={<Building2 className="w-6 h-6" />}
          accentColor="blue"
          change="+6.2%"
          trend="up"
        />
        <KpiCard
          title="Active Escalations"
          value={escalations.length}
          subtitle="Level 2-4 SLA Breaches"
          icon={<AlertTriangle className="w-6 h-6" />}
          accentColor="rose"
          change="Urgent Action"
        />
        <KpiCard
          title="District SLA Index"
          value="94.1%"
          subtitle="Revenue Div Compliance"
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
          change="Rank #2 in State"
          trend="up"
        />
        <KpiCard
          title="Critical Red Flags"
          value="3"
          subtitle="Hospital & School Hazards"
          icon={<Flame className="w-6 h-6" />}
          accentColor="amber"
          change="Active Response"
        />
      </div>

      {/* Control Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'escalations'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Critical Escalations & Directives ({escalations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('taluks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'taluks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Taluk Performance Matrix (16 Taluks)</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>🗺️ District GIS Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab('disaster')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'disaster'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Disaster & Monsoon Alerts ({disasterAlerts.length})</span>
        </button>
      </div>

      {/* TAB 1: CRITICAL ESCALATIONS & DIRECTIVES */}
      {activeTab === 'escalations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                District Escalations & Statutory Directives Console
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
              {escalations.length} Overdue Interventions
            </span>
          </div>

          <div className="space-y-3">
            {escalations.map((esc) => {
              const isSelected = selectedEscalationId === esc.id;
              return (
                <div
                  key={esc.id}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded">
                        Level {esc.level} Escalation
                      </span>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {esc.tracking_id}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        • {esc.department}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Overdue by {esc.sla_overdue_by}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {esc.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {esc.location}
                    </span>
                    <span className="text-amber-600 font-medium">
                      Jurisdiction: Revenue Divisional Officer (RDO)
                    </span>
                  </div>

                  {/* Directive Action Button / Expand Form */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-400">
                      Direct executive powers under Section 133 CrPC / Disaster Management Act
                    </p>

                    <button
                      onClick={() => setSelectedEscalationId(isSelected ? null : esc.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Cancel' : 'Issue Collectorate Directive'}</span>
                    </button>
                  </div>

                  {isSelected && (
                    <div className="pt-3 space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Collectorate Executive Order to {esc.department}
                      </label>
                      <textarea
                        rows={2}
                        value={directiveText}
                        onChange={(e) => setDirectiveText(e.target.value)}
                        placeholder="e.g. Order immediate deployment of emergency drainage suction unit within 2 hours..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleIssueDirective(esc.tracking_id)}
                          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Order</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TALUKS MATRIX */}
      {activeTab === 'taluks' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Taluk & Revenue Division Performance Matrix
              </h3>
            </div>
            <span className="text-xs text-slate-500">16 Taluks Reporting</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Taluk Name</th>
                  <th className="py-2.5 px-3">Revenue Division</th>
                  <th className="py-2.5 px-3 text-center">Total Volume</th>
                  <th className="py-2.5 px-3 text-center">SLA Compliance</th>
                  <th className="py-2.5 px-3 text-right">Escalations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {talukPerformance.map((t) => (
                  <tr key={t.taluk} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{t.taluk}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{t.rdo}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">{t.total}</td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {t.resolvedPct}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      {t.openEscalations > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                          {t.openEscalations} Active
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DISTRICT GIS HEATMAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={districtMapTasks}
            className="w-full h-[560px]"
          />
        </div>
      )}

      {/* TAB 4: DISASTER & MONSOON ALERTS */}
      {activeTab === 'disaster' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                District Disaster Management Authority (DDMA) Telemetry
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              Emergency Stream
            </span>
          </div>

          <div className="space-y-3">
            {disasterAlerts.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-amber-200 dark:border-amber-900/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      {alt.level} ALERT
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{alt.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500">{alt.time}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{alt.desc}</p>
                <div className="text-[10px] text-slate-400 font-medium pt-1">
                  Issued by: <strong>{alt.authority}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
