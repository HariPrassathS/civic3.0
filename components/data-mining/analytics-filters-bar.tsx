'use client';

// =============================================================================
// CivicConnect TN — Global Unified Analytics Filters Bar
// =============================================================================

import React from 'react';
import { Filter, Calendar, Building2, AlertTriangle, CheckCircle2, MapPin, RefreshCw, X } from 'lucide-react';
import { AnalyticsFilterState } from '@/lib/data-mining/types';

interface AnalyticsFiltersBarProps {
  filters: AnalyticsFilterState;
  onChangeFilters: (filters: AnalyticsFilterState) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

const TN_DISTRICTS = [
  'All Districts',
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Tiruppur',
  'Erode',
  'Vellore',
  'Chengalpattu',
  'Kancheepuram',
  'Thiruvallur',
  'Dindigul',
  'Thanjavur',
  'Nilgiris',
  'Cuddalore',
];

const DEPARTMENTS = [
  { id: 'all', name: 'All Departments' },
  { id: 'd0000001-0000-0000-0000-000000000001', name: 'Water Supply' },
  { id: 'd0000001-0000-0000-0000-000000000002', name: 'Roads & Infrastructure' },
  { id: 'd0000001-0000-0000-0000-000000000003', name: 'Sanitation & Waste' },
  { id: 'd0000001-0000-0000-0000-000000000004', name: 'Drainage & Sewage' },
  { id: 'd0000001-0000-0000-0000-000000000005', name: 'Street Lighting' },
  { id: 'd0000001-0000-0000-0000-000000000006', name: 'Electricity' },
  { id: 'd0000001-0000-0000-0000-000000000007', name: 'Public Health' },
  { id: 'd0000001-0000-0000-0000-000000000008', name: 'General Administration' },
];

const PRIORITIES = [
  { id: 'all', label: 'All Priorities' },
  { id: 'urgent', label: '🚨 Urgent' },
  { id: 'high', label: '🔥 High' },
  { id: 'medium', label: '⚡ Medium' },
  { id: 'low', label: '📋 Low' },
];

const STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'created', label: 'Reported' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolution_submitted', label: 'Fix Submitted' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
  { id: 'escalated', label: 'Escalated' },
];

const TIME_WINDOWS = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '1y', label: '1 Year' },
  { id: 'all', label: 'All History' },
];

export function AnalyticsFiltersBar({
  filters,
  onChangeFilters,
  onResetFilters,
  isLoading = false,
}: AnalyticsFiltersBarProps) {
  const hasActiveFilters =
    filters.timeRange !== '90d' ||
    (filters.departmentId && filters.departmentId !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.district && filters.district !== 'All Districts') ||
    filters.ward !== undefined;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Global Analytics Filters</span>
            <span className="text-[10px] text-slate-400 block">Synchronously drives all charts, KPIs, maps, and DBSCAN clusters</span>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Dropdown Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {/* Date Window */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>Time Window</span>
          </label>
          <select
            value={filters.timeRange}
            onChange={(e) => onChangeFilters({ ...filters, timeRange: e.target.value as any })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {TIME_WINDOWS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-sky-400" />
            <span>Department</span>
          </label>
          <select
            value={filters.departmentId || 'all'}
            onChange={(e) => onChangeFilters({ ...filters, departmentId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Priority</span>
          </label>
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onChangeFilters({ ...filters, priority: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-400" />
            <span>Status</span>
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-purple-400" />
            <span>District</span>
          </label>
          <select
            value={filters.district || 'All Districts'}
            onChange={(e) => onChangeFilters({ ...filters, district: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {TN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Ward Number */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>Ward No.</span>
          </label>
          <input
            type="number"
            placeholder="All Wards"
            value={filters.ward !== undefined ? filters.ward : ''}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                ward: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
