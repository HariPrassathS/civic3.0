'use client';

// =============================================================================
// CivicConnect TN — Animated KPI Card Component
// =============================================================================

import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  colorTheme?: 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'slate';
  badgeText?: string;
}

const THEME_STYLES = {
  emerald: {
    bg: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400',
    iconBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    text: 'text-emerald-300',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
  },
  amber: {
    bg: 'bg-amber-950/20 border-amber-800/40 text-amber-400',
    iconBg: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    text: 'text-amber-300',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
  },
  rose: {
    bg: 'bg-rose-950/20 border-rose-800/40 text-rose-400',
    iconBg: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    text: 'text-rose-300',
    badge: 'bg-rose-950/80 text-rose-300 border-rose-800/50',
  },
  sky: {
    bg: 'bg-sky-950/20 border-sky-800/40 text-sky-400',
    iconBg: 'bg-sky-950/80 text-sky-400 border-sky-800/60',
    text: 'text-sky-300',
    badge: 'bg-sky-950/80 text-sky-300 border-sky-800/50',
  },
  purple: {
    bg: 'bg-purple-950/20 border-purple-800/40 text-purple-400',
    iconBg: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
    text: 'text-purple-300',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
  },
  slate: {
    bg: 'bg-slate-900/80 border-slate-800 text-slate-300',
    iconBg: 'bg-slate-950 text-slate-400 border-slate-800',
    text: 'text-white',
    badge: 'bg-slate-950 text-slate-400 border-slate-800',
  },
};

export function KPICard({
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  icon: Icon,
  subtext,
  trend,
  colorTheme = 'slate',
  badgeText,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const theme = THEME_STYLES[colorTheme] || THEME_STYLES.slate;

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // Smooth count-up animation lasting 600ms
    const startValue = displayValue;
    const endValue = value;
    const duration = 600;
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  const formattedNumber =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <div className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-lg ${theme.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-400 leading-snug">
          {label}
        </span>
        <div className={`p-2 rounded-xl border shrink-0 ${theme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-sm font-bold text-slate-400">{prefix}</span>}
          <span className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.text}`}>
            {formattedNumber}
          </span>
          {suffix && <span className="text-xs font-bold text-slate-400">{suffix}</span>}
        </div>

        {(subtext || trend || badgeText) && (
          <div className="flex items-center justify-between gap-1 pt-1 text-[10px]">
            {subtext && <span className="text-slate-400 truncate">{subtext}</span>}
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isNeutral
                    ? 'text-slate-400'
                    : trend.isPositive
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {trend.value}
              </span>
            )}
            {badgeText && (
              <span className={`px-2 py-0.5 rounded-md border font-semibold ml-auto ${theme.badge}`}>
                {badgeText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
