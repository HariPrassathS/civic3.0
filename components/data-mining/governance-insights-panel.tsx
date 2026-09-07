'use client';

// =============================================================================
// CivicConnect TN — Governance Intelligence & Administrative Insights Panel
// =============================================================================

import React from 'react';
import { GovernanceInsight } from '@/lib/data-mining/types';
import { Sparkles, AlertTriangle, ShieldCheck, Flame, Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface InsightsPanelProps {
  insights: GovernanceInsight[];
}

const INSIGHT_STYLES = {
  critical: {
    bg: 'bg-rose-950/25 border-rose-800/50',
    icon: AlertTriangle,
    iconColor: 'text-rose-400',
    badge: 'bg-rose-950 text-rose-300 border-rose-800/60',
  },
  warning: {
    bg: 'bg-amber-950/25 border-amber-800/50',
    icon: Flame,
    iconColor: 'text-amber-400',
    badge: 'bg-amber-950 text-amber-300 border-amber-800/60',
  },
  positive: {
    bg: 'bg-emerald-950/25 border-emerald-800/50',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
  },
  info: {
    bg: 'bg-sky-950/25 border-sky-800/50',
    icon: Info,
    iconColor: 'text-sky-400',
    badge: 'bg-sky-950 text-sky-300 border-sky-800/60',
  },
};

export function GovernanceInsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Automated Governance Insights & Actionable Directives</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time analytical findings synthesized from current filter metrics to guide field deployments
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800/50">
          {insights.length} Actionable Directives
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {insights.map((ins) => {
          const style = INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.info;
          const Icon = style.icon;

          return (
            <div
              key={ins.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 shadow-md ${style.bg}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`p-1.5 rounded-lg bg-slate-950/80 border ${style.badge}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${style.badge}`}>
                    {ins.metric_value}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white leading-snug">
                    {ins.title}
                  </h4>
                  <p className="text-[11px] text-slate-300/90 leading-relaxed">
                    {ins.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                <span className="font-bold text-slate-300 block mb-0.5">Directive Recommendation:</span>
                <span className="text-slate-300 leading-normal block">{ins.recommendation}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
