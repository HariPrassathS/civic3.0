'use client';

// =============================================================================
// CivicConnect TN — Predictive Role View Switcher Component
// =============================================================================
// Enables dynamic switching between Citizen, Area Officer, Dept Head, and
// Commissioner views to demonstrate role-based scoping and action dispatching.

import React from 'react';
import { User, Shield, Briefcase, Landmark, Info } from 'lucide-react';
import { RoleContext } from '@/lib/predictive/types';

interface RoleViewSwitcherProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  roleContext?: RoleContext;
}

export function RoleViewSwitcher({
  currentRole,
  onRoleChange,
  roleContext,
}: RoleViewSwitcherProps) {
  const roles = [
    {
      id: 'citizen',
      label: 'Citizen',
      badge: 'Public View',
      icon: User,
      desc: 'Public advisories & neighborhood precautions',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      activeBorder: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
    },
    {
      id: 'area_officer',
      label: 'Area Officer',
      badge: 'Ward Tactical',
      icon: Shield,
      desc: 'Ward inspection tasks & equipment lists',
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      activeBorder: 'border-blue-500 bg-blue-950/40 text-blue-300',
    },
    {
      id: 'department_head',
      label: 'Dept Head',
      badge: 'Operational',
      icon: Briefcase,
      desc: 'Department asset degradation & work order dispatch',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      activeBorder: 'border-purple-500 bg-purple-950/40 text-purple-300',
    },
    {
      id: 'district_collector',
      label: 'District Collector',
      badge: 'Executive',
      icon: Landmark,
      desc: 'Cross-agency disaster matrix & resource reallocation',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      activeBorder: 'border-amber-500 bg-amber-950/40 text-amber-300',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 shadow-md space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Role-Based Visibility Simulator
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {roleContext?.view_mode.toUpperCase() || 'PUBLIC'} MODE
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {roleContext?.scope_description || 'Showing role-scoped data visibility.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentRole.toLowerCase() === r.id.toLowerCase();

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRoleChange(r.id)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? `${r.activeBorder} shadow-md`
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-200">{r.label}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium">
                  {r.badge}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight">
                {r.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
