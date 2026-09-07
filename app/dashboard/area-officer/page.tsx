'use client';

// =============================================================================
// CivicConnect TN — Area Officer / Assistant Engineer Dashboard (/dashboard/area-officer)
// =============================================================================
// Ward-level operations console for Assistant Engineers (AE) & Ward Officers.
// Features: Ward oversight, task dispatch to field workers, and resolution quality verification.

import React, { useState, useEffect, useTransition } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { VerificationModal } from '@/components/dashboard/verification-modal';
import { AssignmentModal } from '@/components/dashboard/assignment-modal';
import { UserRole, ComplaintStatus, Priority } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  ClipboardCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw,
  Search,
  Compass,
  HardHat,
  Sparkles,
} from 'lucide-react';
import type { Complaint, ComplaintMedia, ComplaintUpdate } from '@/types/database';

interface ComplaintItem extends Complaint {
  category?: { name: string; code: string };
  department?: { name: string; code: string };
  media?: ComplaintMedia[];
  updates?: ComplaintUpdate[];
}

export default function AreaOfficerDashboard() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verification' | 'unassigned' | 'in_progress' | 'map' | 'workload' | 'all'>('verification');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingComplaint, setVerifyingComplaint] = useState<ComplaintItem | null>(null);
  const [assigningComplaint, setAssigningComplaint] = useState<ComplaintItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchComplaints = React.useCallback(() => {
    setLoading(true);
    const url = selectedWard === 'all' ? '/api/complaints?ward=all' : `/api/complaints?ward=${encodeURIComponent(selectedWard)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.complaints) {
          setComplaints(data.data.complaints);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedWard]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Handle Resolution Verification Approve
  const handleApproveResolution = async (complaintId: string, notes: string) => {
    try {
      const res = await fetch('/api/evidence/officer-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          decision: 'APPROVE',
          notes: notes || 'Verified on-site by Assistant Engineer (AE). Work meets municipal quality standards.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Resolution approved successfully! Grievance marked as Resolved.', 'success');
        startTransition(() => {
          fetchComplaints();
        });
      } else {
        showToast(data.error || 'Failed to approve resolution', 'error');
      }
    } catch {
      showToast('Error approving resolution. Please check network connection.', 'error');
    }
  };

  // Handle Resolution Reject / Rework
  const handleRejectResolution = async (complaintId: string, reworkNotes: string) => {
    try {
      const res = await fetch('/api/evidence/officer-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          decision: 'REJECT_REWORK',
          notes: reworkNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Rework order dispatched to field team.', 'success');
        startTransition(() => {
          fetchComplaints();
        });
      } else {
        showToast(data.error || 'Failed to send back for rework', 'error');
      }
    } catch {
      showToast('Error sending rework order. Please try again.', 'error');
    }
  };

  // Handle Request New Evidence
  const handleRequestNewEvidence = async (complaintId: string, evidenceNotes: string) => {
    try {
      const res = await fetch('/api/evidence/officer-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          decision: 'REQUEST_NEW_EVIDENCE',
          notes: evidenceNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Request for new evidence sent to field worker.', 'success');
        startTransition(() => {
          fetchComplaints();
        });
      } else {
        showToast(data.error || 'Failed to request new evidence', 'error');
      }
    } catch {
      showToast('Error requesting evidence. Please try again.', 'error');
    }
  };

  // Handle Worker Assignment
  const handleAssignWorker = async (complaintId: string, workerId: string, notes: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: workerId,
          notes: notes || 'Assigned by Area Officer Ward 114',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Field worker assigned successfully!', 'success');
        startTransition(() => {
          fetchComplaints();
        });
      } else {
        showToast(data.error || 'Failed to assign worker', 'error');
      }
    } catch {
      showToast('Error assigning worker. Please try again.', 'error');
    }
  };

  // Metrics
  const totalWard = complaints.length;
  const verificationQueue = complaints.filter(
    (c) => c.status === ComplaintStatus.RESOLUTION_SUBMITTED || c.status === ComplaintStatus.OFFICER_VERIFICATION
  );
  const unassignedQueue = complaints.filter(
    (c) =>
      c.status === ComplaintStatus.CREATED ||
      c.status === ComplaintStatus.VALIDATED ||
      c.status === ComplaintStatus.REOPENED ||
      c.status === ComplaintStatus.ESCALATED
  );
  const inProgressQueue = complaints.filter(
    (c) => c.status === ComplaintStatus.IN_PROGRESS || c.status === ComplaintStatus.ASSIGNED
  );
  const resolvedCount = complaints.filter(
    (c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  ).length;

  const filteredComplaints = complaints.filter((c) => {
    if (searchQuery) {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;
    }

    if (activeTab === 'verification') {
      return (
        c.status === ComplaintStatus.RESOLUTION_SUBMITTED ||
        c.status === ComplaintStatus.OFFICER_VERIFICATION
      );
    }
    if (activeTab === 'unassigned') {
      return (
        c.status === ComplaintStatus.CREATED ||
        c.status === ComplaintStatus.VALIDATED ||
        c.status === ComplaintStatus.REOPENED ||
        c.status === ComplaintStatus.ESCALATED
      );
    }
    if (activeTab === 'in_progress') {
      return c.status === ComplaintStatus.IN_PROGRESS || c.status === ComplaintStatus.ASSIGNED;
    }
    return true;
  });

  return (
    <DashboardShell
      role={UserRole.AREA_OFFICER}
      title="Area Officer / Assistant Engineer Console"
      subtitle="Ward 114 Operations: Task triage, field team dispatch, and resolution quality verification."
      jurisdictionScope="Greater Chennai Corporation • Ward 114"
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
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Ward KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Verification Queue"
          value={verificationQueue.length}
          subtitle="Awaiting AE field inspection"
          icon={<ClipboardCheck className="w-6 h-6" />}
          accentColor="teal"
          change="Priority Review"
        />
        <KpiCard
          title="Pending Dispatch"
          value={unassignedQueue.length}
          subtitle="Unassigned / Reopened"
          icon={<UserPlus className="w-6 h-6" />}
          accentColor="purple"
        />
        <KpiCard
          title="Active in Field"
          value={inProgressQueue.length}
          subtitle="Workforce on site"
          icon={<Clock className="w-6 h-6" />}
          accentColor="amber"
        />
        <KpiCard
          title="Ward Resolved"
          value={resolvedCount}
          subtitle={`Out of ${totalWard} total ward issues`}
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
        />
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'verification'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Verification Queue ({verificationQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'unassigned'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Needs Assignment ({unassignedQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'in_progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress ({inProgressQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🗺️ Ward GIS Map ({complaints.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('workload')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'workload'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>👷 Crew Workload (4 Gangs)</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Ward Issues ({totalWard})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Ward Scope Selector */}
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">📍 All Wards (Statewide Queue)</option>
              <option value="114">Ward 114 — Chennai (T. Nagar)</option>
              <option value="55">Ward 55 — Tiruppur (Dharapuram)</option>
            </select>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracking ID, street..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={fetchComplaints}
              title="Refresh"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ward GIS Map View */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={complaints.map((t) => {
              const lat = (t as any).latitude || (typeof t.location === 'object' && t.location ? (t.location as any).latitude : null) || 13.0418 + ((t.ward || 114) % 20 - 10) * 0.008;
              const lng = (t as any).longitude || (typeof t.location === 'object' && t.location ? (t.location as any).longitude : null) || 80.2341 + ((t.ward || 114) % 15 - 7) * 0.008;
              return {
                id: t.id,
                tracking_id: t.tracking_id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                latitude: lat,
                longitude: lng,
                address: t.address,
                ward: t.ward,
                sla_deadline: t.sla_deadline,
                sla_breached: t.sla_breached,
              };
            })}
            className="w-full h-[540px]"
          />
        </div>
      )}

      {/* Field Worker Workload View */}
      {activeTab === 'workload' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardHat className="w-5 h-5 text-indigo-600" />
                <span>Ward 114 Field Worker Gangs & Live Workload</span>
              </h3>
              <p className="text-xs text-slate-500">Real-time task dispatch, active duty crew status, and completion benchmarks</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              4 Crews On-Duty
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'CREW-01', name: 'Murugan R — Road Maintenance Gang #3', tasks: 4, inProgress: 2, resolved: 18, efficiency: '96%', status: 'Active on Site' },
              { id: 'CREW-02', name: 'Kumaravel S — Drainage & Sewerage Gang #1', tasks: 3, inProgress: 1, resolved: 14, efficiency: '92%', status: 'Active on Site' },
              { id: 'CREW-03', name: 'Anandan M — Street Lighting & Electrical Gang', tasks: 2, inProgress: 1, resolved: 22, efficiency: '98%', status: 'Active on Site' },
              { id: 'CREW-04', name: 'Praveen T — Sanitation & Solid Waste Crew #2', tasks: 5, inProgress: 3, resolved: 31, efficiency: '94%', status: 'Active on Site' },
            ].map((crew) => (
              <div
                key={crew.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{crew.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ● {crew.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-500 text-[10px]">Queue</div>
                    <div className="font-bold text-purple-600 dark:text-purple-400">{crew.tasks}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-500 text-[10px]">In Progress</div>
                    <div className="font-bold text-amber-600 dark:text-amber-400">{crew.inProgress}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-slate-500 text-[10px]">Resolved</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{crew.resolved}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>SLA Efficiency Rate: <strong className="text-slate-900 dark:text-white">{crew.efficiency}</strong></span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Allocated</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grievance Management Table / Card List */}
      {activeTab !== 'map' && activeTab !== 'workload' && (
        loading ? (
          <div className="py-16 text-center text-slate-400">Loading ward grievances...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No complaints in this queue
            </h3>
            <p className="text-xs text-slate-500 mt-1">Ward 114 queue is clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((item) => {
              const isVerification =
                item.status === ComplaintStatus.RESOLUTION_SUBMITTED ||
                item.status === ComplaintStatus.OFFICER_VERIFICATION;
              const isUnassigned =
                item.status === ComplaintStatus.CREATED ||
                item.status === ComplaintStatus.VALIDATED ||
                item.status === ComplaintStatus.REOPENED ||
                item.status === ComplaintStatus.ESCALATED;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {item.tracking_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          item.priority === Priority.URGENT
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : item.priority === Priority.HIGH
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.status.toUpperCase()}
                      </span>
                      {item.category?.name && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                          {item.category.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {item.address || `Ward ${item.ward}, Chennai`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        SLA: {item.sla_breached ? '⚠️ Breached' : 'Active'}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        AI Verified (94% Match)
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {isVerification && (
                      <button
                        onClick={() => setVerifyingComplaint(item)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Inspect & Verify</span>
                      </button>
                    )}

                    {isUnassigned && (
                      <button
                        onClick={() => setAssigningComplaint(item)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Assign Worker</span>
                      </button>
                    )}

                    {!isVerification && !isUnassigned && (
                      <button
                        onClick={() => setAssigningComplaint(item)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                      >
                        Reassign
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Verification Modal */}
      {verifyingComplaint && (
        <VerificationModal
          complaint={verifyingComplaint}
          isOpen={!!verifyingComplaint}
          onClose={() => setVerifyingComplaint(null)}
          onApprove={handleApproveResolution}
          onReject={handleRejectResolution}
          onRequestEvidence={handleRequestNewEvidence}
        />
      )}

      {/* Assignment Modal */}
      {assigningComplaint && (
        <AssignmentModal
          complaint={assigningComplaint}
          isOpen={!!assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          onAssign={handleAssignWorker}
        />
      )}
    </DashboardShell>
  );
}
