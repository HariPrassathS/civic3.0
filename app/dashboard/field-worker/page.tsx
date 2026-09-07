'use client';

// =============================================================================
// CivicConnect TN — Field Worker Operations Dashboard (/dashboard/field-worker)
// =============================================================================
// Mobile-first operational console for field teams and contractors.
// Includes assigned task queues, SLA countdowns, GPS directions, and photo proof upload.

import React, { useState, useEffect, useTransition } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { ResolutionUploadModal } from '@/components/dashboard/resolution-upload-modal';
import { UserRole, ComplaintStatus, Priority } from '@/types/enums';
import { FieldWorkerMap } from '@/components/maps/field-worker-map';
import {
  Briefcase,
  PlayCircle,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Navigation,
  RefreshCw,
  Compass,
} from 'lucide-react';
import type { Complaint, ComplaintMedia, ComplaintUpdate } from '@/types/database';

interface TaskItem extends Complaint {
  category?: { name: string; code: string };
  department?: { name: string; code: string };
  media?: ComplaintMedia[];
  updates?: ComplaintUpdate[];
}

export default function FieldWorkerDashboard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'map' | 'in_progress' | 'urgent' | 'completed'>('active');
  const [selectedTaskForResolution, setSelectedTaskForResolution] = useState<TaskItem | null>(null);
  const [onDuty, setOnDuty] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [, startTransition] = useTransition();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTasks = React.useCallback(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.complaints) {
          setTasks(data.data.complaints);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data?.complaints) {
          setTasks(data.data.complaints);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle "Start Work" (ASSIGNED -> IN_PROGRESS)
  const handleStartWork = async (complaintId: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_status: ComplaintStatus.IN_PROGRESS,
          notes: 'Field crew arrived at location and commenced rectification work.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Work started! Status updated to In Progress.', 'success');
        startTransition(() => {
          fetchTasks();
        });
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Network error while updating status. Please try again.', 'error');
    }
  };

  // Handle "Submit Resolution" (IN_PROGRESS -> RESOLUTION_SUBMITTED)
  const handleSubmitResolution = async (complaintId: string, notes: string, mediaUrl?: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_status: ComplaintStatus.RESOLUTION_SUBMITTED,
          notes,
          media: mediaUrl ? [{ url: mediaUrl }] : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Resolution proof submitted successfully! Awaiting AE verification.', 'success');
        startTransition(() => {
          fetchTasks();
        });
      } else {
        showToast(data.error || 'Failed to submit resolution', 'error');
      }
    } catch {
      showToast('Network error while submitting resolution. Please try again.', 'error');
    }
  };

  // Metrics
  const assignedCount = tasks.filter((t) => t.status === ComplaintStatus.ASSIGNED).length;
  const inProgressCount = tasks.filter((t) => t.status === ComplaintStatus.IN_PROGRESS).length;
  const verificationCount = tasks.filter(
    (t) => t.status === ComplaintStatus.RESOLUTION_SUBMITTED || t.status === ComplaintStatus.OFFICER_VERIFICATION
  ).length;
  const resolvedCount = tasks.filter(
    (t) => t.status === ComplaintStatus.RESOLVED || t.status === ComplaintStatus.CLOSED
  ).length;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'in_progress') return task.status === ComplaintStatus.IN_PROGRESS;
    if (activeTab === 'urgent') return task.priority === Priority.URGENT || task.priority === Priority.HIGH;
    if (activeTab === 'completed') {
      return (
        task.status === ComplaintStatus.RESOLUTION_SUBMITTED ||
        task.status === ComplaintStatus.OFFICER_VERIFICATION ||
        task.status === ComplaintStatus.RESOLVED ||
        task.status === ComplaintStatus.CLOSED
      );
    }
    // Default active tasks
    return (
      task.status === ComplaintStatus.ASSIGNED ||
      task.status === ComplaintStatus.IN_PROGRESS ||
      task.status === ComplaintStatus.VALIDATED ||
      task.status === ComplaintStatus.REOPENED ||
      task.status === ComplaintStatus.ESCALATED
    );
  });

  return (
    <DashboardShell
      role={UserRole.FIELD_WORKER}
      title="Field Worker Operations Console"
      subtitle="On-ground civic work orders, priority triage, navigation, and proof submission."
      jurisdictionScope="Zone 10 • Ward 114 (T. Nagar)"
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

      {/* Worker Duty Status & Quick Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shadow-xs">
            FW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Murugan R — Road Maintenance Gang #3
              </h2>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  onDuty
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {onDuty ? '● Active On Duty' : '○ Standby'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department: Highways & Infrastructure • Ward 114 T. Nagar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOnDuty(!onDuty)}
            aria-label={onDuty ? "Go on Break" : "Resume Active Duty"}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[48px] touch-target-lg focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              onDuty
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-300 dark:border-slate-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950'
            }`}
          >
            {onDuty ? 'Go on Break' : 'Resume Active Duty'}
          </button>
          <button
            onClick={fetchTasks}
            title="Refresh Tasks"
            aria-label="Refresh Tasks"
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[48px] min-w-[48px] flex items-center justify-center touch-target-lg focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Assigned Tasks"
          value={assignedCount}
          subtitle="Ready to start"
          icon={<Briefcase className="w-6 h-6" />}
          accentColor="purple"
        />
        <KpiCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Work active at site"
          icon={<PlayCircle className="w-6 h-6" />}
          accentColor="amber"
        />
        <KpiCard
          title="Under Verification"
          value={verificationCount}
          subtitle="Awaiting AE sign-off"
          icon={<Clock className="w-6 h-6" />}
          accentColor="teal"
        />
        <KpiCard
          title="Completed"
          value={resolvedCount}
          subtitle="Resolved & closed"
          icon={<CheckCircle2 className="w-6 h-6" />}
          accentColor="emerald"
        />
      </div>

      {/* Tab Filter Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 table-scroll-container">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            activeTab === 'active'
              ? 'bg-purple-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          All Active Work Orders ({tasks.filter((t) => t.status !== ComplaintStatus.CLOSED && t.status !== ComplaintStatus.RESOLVED).length})
        </button>
        <button
          onClick={() => setActiveTab('urgent')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            activeTab === 'urgent'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          🚨 Urgent / High Priority ({tasks.filter((t) => (t.priority === Priority.URGENT || t.priority === Priority.HIGH) && t.status !== ComplaintStatus.CLOSED).length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            activeTab === 'in_progress'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          ⚡ Work in Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[44px] touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            activeTab === 'map'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>🗺️ GPS Route Map ({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] touch-target focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          ✅ Completed & Submitted ({resolvedCount + verificationCount})
        </button>
      </div>

      {/* GPS Task Map Rendering */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <FieldWorkerMap
            tasks={tasks.map((t, idx) => {
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
            className="w-full h-[520px]"
          />
        </div>
      )}

      {/* Task Queue List */}
      {activeTab !== 'map' && (
        loading ? (
          <div className="py-16 text-center text-slate-400">Loading assigned tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No tasks in this queue</h3>
          <p className="text-xs text-slate-500 mt-1">All assigned work orders are up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const isAssigned = task.status === ComplaintStatus.ASSIGNED || task.status === ComplaintStatus.VALIDATED || task.status === ComplaintStatus.REOPENED || task.status === ComplaintStatus.ESCALATED;
            const isInProgress = task.status === ComplaintStatus.IN_PROGRESS;
            const isSubmitted = task.status === ComplaintStatus.RESOLUTION_SUBMITTED || task.status === ComplaintStatus.OFFICER_VERIFICATION;
            const isResolved = task.status === ComplaintStatus.RESOLVED || task.status === ComplaintStatus.CLOSED;

            const isUrgent = task.priority === Priority.URGENT;
            const isHigh = task.priority === Priority.HIGH;

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isUrgent
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : isInProgress
                    ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar: Tracking ID, Priority, Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {task.tracking_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isHigh
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isInProgress
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : isAssigned
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : isSubmitted
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                    {task.description}
                  </p>

                  {/* AI Triage & Evidence Summary */}
                  <div className="mb-3 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-purple-800 dark:text-purple-300 font-medium flex items-center gap-1">
                      <span className="text-xs">🤖</span>
                      <span>AI Triage: <strong>{task.category?.name || 'Standard Civic Work Order'}</strong></span>
                    </span>
                    {task.media && task.media.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 shrink-0">
                        📷 {task.media.length} Evidence Photo{task.media.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Location & Navigation */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate">{task.address || `Ward ${task.ward}, Chennai`}</span>
                    </div>
                    {(() => {
                      let lat: number | null = (task as any).latitude || null;
                      let lng: number | null = (task as any).longitude || null;

                      if (!lat || !lng) {
                        const loc = task.location as any;
                        if (loc && typeof loc === 'object') {
                          lat = loc.latitude || (Array.isArray(loc.coordinates) ? loc.coordinates[1] : null);
                          lng = loc.longitude || (Array.isArray(loc.coordinates) ? loc.coordinates[0] : null);
                        }
                      }

                      // Intelligent navigation destination URL
                      let mapsUrl = '';
                      if (lat && lng && (lat !== 13.0827 || lng !== 80.2707 || !task.address)) {
                        mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      } else if (task.address) {
                        const destinationQuery = `${task.address}${task.district ? ', ' + task.district : ''}, Tamil Nadu`;
                        mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;
                      } else {
                        mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat || 13.0827},${lng || 80.2707}`;
                      }

                      return (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Directions to ${task.address || 'complaint location'}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[40px] touch-target focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </a>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>SLA: {task.sla_breached ? '⚠️ Breached' : 'Active (~18h left)'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <button
                        onClick={() => handleStartWork(task.id)}
                        aria-label={`Start work on task ${task.tracking_id}`}
                        className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-950/40 transition-all min-h-[48px] touch-target-lg focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => setSelectedTaskForResolution(task)}
                        aria-label={`Submit resolution proof for task ${task.tracking_id}`}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-950/40 transition-all min-h-[48px] touch-target-lg focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Submit Proof</span>
                      </button>
                    )}

                    {isSubmitted && (
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1.5 px-3 py-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                        <Clock className="w-4 h-4" />
                        <span>Pending AE Sign-off</span>
                      </span>
                    )}

                    {isResolved && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Resolution Proof Upload Modal */}
      {selectedTaskForResolution && (
        <ResolutionUploadModal
          complaint={selectedTaskForResolution}
          isOpen={!!selectedTaskForResolution}
          onClose={() => setSelectedTaskForResolution(null)}
          onSubmitResolution={handleSubmitResolution}
        />
      )}
    </DashboardShell>
  );
}
