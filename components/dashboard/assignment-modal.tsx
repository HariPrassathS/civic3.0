'use client';

// =============================================================================
// CivicConnect TN — Task Assignment & Reassignment Modal
// =============================================================================

import React, { useState } from 'react';
import { UserCheck, X, HardHat } from 'lucide-react';
import type { Complaint } from '@/types/database';

interface FieldWorkerOption {
  id: string;
  name: string;
  department: string;
  ward: number;
  activeTasks: number;
}

const DEFAULT_WORKERS: FieldWorkerOption[] = [
  { id: 'worker-murugan-101', name: 'Murugan R (Asphalt & Pothole Crew)', department: 'Roads', ward: 114, activeTasks: 2 },
  { id: 'worker-selvam-102', name: 'Selvam K (CMWSSB Pipeline Unit)', department: 'Water Supply', ward: 114, activeTasks: 1 },
  { id: 'worker-velu-103', name: 'Velu M (Sanitation & Waste Crew #4)', department: 'Sanitation', ward: 114, activeTasks: 4 },
  { id: 'worker-arun-104', name: 'Arun Kumar (Drainage & Desilting Gang)', department: 'Drainage', ward: 114, activeTasks: 0 },
  { id: 'worker-dharma-105', name: 'Dharmalingam (TANGEDCO Lineman)', department: 'Electricity', ward: 114, activeTasks: 3 },
  { id: 'worker-suresh-106', name: 'Suresh Babu (Streetlight Maintenance)', department: 'Streetlight', ward: 114, activeTasks: 1 },
];

interface AssignmentModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (complaintId: string, workerId: string, notes: string) => Promise<void>;
}

export function AssignmentModal({
  complaint,
  isOpen,
  onClose,
  onAssign,
}: AssignmentModalProps) {
  const [selectedWorker, setSelectedWorker] = useState(DEFAULT_WORKERS[0].id);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedWorker) {
      setError('Please select a field worker unit.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAssign(complaint.id, selectedWorker, notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Assign Grievance to Field Team</h3>
              <p className="text-xs text-slate-300">
                Tracking ID: <span className="font-mono text-purple-300">{complaint.tracking_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Complaint Info */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Grievance Subject</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {complaint.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Location: {complaint.address || `Ward ${complaint.ward}, Chennai`}
            </p>
          </div>

          {/* Field Worker Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Field Worker / Maintenance Gang
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {DEFAULT_WORKERS.map((worker) => {
                const isSelected = selectedWorker === worker.id;
                return (
                  <label
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{worker.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {worker.department} • Ward {worker.ward}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {worker.activeTasks} active tasks
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Officer Instructions / Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Special Instructions for Field Crew (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inspect pipeline joint near junction, coordinate with traffic police..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>Confirm & Dispatch Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
