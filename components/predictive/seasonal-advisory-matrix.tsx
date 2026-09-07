'use client';

// =============================================================================
// CivicConnect TN — Seasonal Advisory & Climate Vulnerability Timeline
// =============================================================================

import React, { useState } from 'react';
import { SeasonalAdvisory } from '@/lib/predictive/types';
import { Calendar, CloudRain, Sun, Wind, Sparkles, CheckCircle, ShieldAlert } from 'lucide-react';

interface SeasonalAdvisoryMatrixProps {
  advisories: SeasonalAdvisory[];
}

export function SeasonalAdvisoryMatrix({ advisories }: SeasonalAdvisoryMatrixProps) {
  const activeAdvisory = advisories.find((a) => a.is_active_now) || advisories[0];
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(activeAdvisory?.id || '');

  const current = advisories.find((a) => a.id === selectedSeasonId) || activeAdvisory;

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'NORTHEAST_MONSOON':
        return CloudRain;
      case 'SUMMER_PRE_MONSOON':
        return Sun;
      case 'WINTER_POST_MONSOON':
        return Sparkles;
      case 'SOUTHWEST_MONSOON':
      default:
        return Wind;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tamil Nadu Meteorological & Civic Risk Calendar
            </h3>
            <p className="text-xs text-slate-400">
              Correlated seasonal municipal vulnerabilities & proactive preparation windows
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit">
          Active Season: {activeAdvisory?.season_name.split('(')[0]}
        </span>
      </div>

      {/* Season Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {advisories.map((advisory) => {
          const Icon = getSeasonIcon(advisory.season);
          const isSelected = advisory.id === selectedSeasonId;

          return (
            <button
              key={advisory.id}
              type="button"
              onClick={() => setSelectedSeasonId(advisory.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300 shadow-md'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400'
              }`}
            >
              {advisory.is_active_now && (
                <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500 text-slate-950">
                  NOW
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-200 truncate">
                  {advisory.season.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">{advisory.active_months}</span>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Vulnerability:</span>
                <span className="font-bold text-amber-400">{advisory.vulnerability_index}/100</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Season Deep Dive */}
      {current && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white">{current.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{current.summary}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400">Impacted Depts:</span>
              <div className="flex gap-1 flex-wrap">
                {current.affected_departments.map((d) => (
                  <span key={d} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Proactive Admin Directives */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>Proactive Operational Measures for Officials</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                {current.proactive_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Public Advisory */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Public Safety & Citizen Guidance</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                {current.public_guidance.map((guide, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
