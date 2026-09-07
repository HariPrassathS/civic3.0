'use client';

// =============================================================================
// CivicConnect TN — Executive KPI Stat Card
// =============================================================================

import React from 'react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral' | { value: string; label: string; positive?: boolean };
  icon: React.ReactNode;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo' | 'teal';
}

const ACCENT_STYLES = {
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    iconBg: 'from-blue-600 to-indigo-600 text-white',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    iconBg: 'from-emerald-600 to-teal-600 text-white',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
    iconBg: 'from-amber-500 to-orange-600 text-white',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
    iconBg: 'from-purple-600 to-pink-600 text-white',
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
    iconBg: 'from-rose-600 to-red-600 text-white',
  },
  indigo: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
    iconBg: 'from-indigo-600 to-violet-600 text-white',
  },
  teal: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50',
    iconBg: 'from-teal-600 to-emerald-600 text-white',
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  change,
  trend,
  icon,
  accentColor = 'blue',
}: KpiCardProps) {
  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.blue;

  const isObjectTrend = typeof trend === 'object' && trend !== null;
  const trendDisplay = isObjectTrend ? `${trend.value} ${trend.label}` : change;
  const isPositive = isObjectTrend ? trend.positive : trend === 'up';
  const isNegative = isObjectTrend ? trend.positive === false : trend === 'down';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {trendDisplay && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  isPositive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : isNegative
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isPositive ? '↑' : isNegative ? '↓' : ''} {trendDisplay}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-700 dark:text-slate-300 pt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-linear-to-br ${styles.iconBg} flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Export both camelCase and UPPERCASE aliases for maximum developer ergonomics
export const KPICard = KpiCard;
