'use client';

// =============================================================================
// CivicConnect TN — Prediction Guard & Methodology Notice
// =============================================================================
// Explicitly informs officials and citizens of probabilistic modeling and
// maintains clear architectural decoupling from historical DBSCAN clustering.

import React, { useState } from 'react';
import { AlertTriangle, Info, ShieldCheck, ChevronDown, ChevronUp, Sparkles, Layers } from 'lucide-react';
import { MethodologyNotes } from '@/lib/predictive/types';

interface PredictionGuardNoticeProps {
  notes?: MethodologyNotes;
}

export function PredictionGuardNotice({ notes }: PredictionGuardNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-950/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-amber-950/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROBABILISTIC RISK MODEL
              </span>
              <span className="text-xs font-semibold text-slate-400">
                CivicPredict TN Engine v3.2
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 mt-1">
              Early Warning & Forward-Looking Municipal Risk Assessment
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Predictions in this module are calculated from statistical recurrence, complaint velocity ($dN/dt$), and Tamil Nadu seasonal climate calendars. Predictions represent <strong className="text-amber-300">probabilistic likelihoods</strong> for proactive preventative maintenance — not deterministic certainties.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 text-xs font-medium transition-all flex-shrink-0 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Details' : 'Methodology'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Layers className="w-4 h-4" />
              <span>Decoupling from Phase 12 DBSCAN</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              DBSCAN (Density-Based Spatial Clustering) identifies <em>past spatial density clusters</em>. This Predictive layer executes <em>forward failure forecasting</em>, combining spatial repeat persistence, weekly growth velocity, and climate multipliers to guide preventative resource pre-positioning.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Climate & Civic Calendar Calibration</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Trained on Tamil Nadu meteorological patterns including Northeast Monsoon flood surges (Oct–Dec), Summer grid & water deficits (Mar–May), and festival market accumulation to deliver actionable directives before critical breakdown.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
