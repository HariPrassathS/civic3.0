// =============================================================================
// CivicConnect TN — Predictive Time Trends & Velocity Analytics
// =============================================================================
// Analyzes complaint arrival rates, week-over-week acceleration, velocity surges,
// and short-term forecast trajectories.

import { TrendDirection } from './types';

export interface VelocityResult {
  current_period_count: number;
  prior_period_count: number;
  wow_velocity_pct: number;
  acceleration_rate: number;
  trend_direction: TrendDirection;
  is_surging: boolean;
  projected_next_period: number;
}

/**
 * Computes weekly velocity (dN/dt) and acceleration for a series of dated records.
 */
export function calculateComplaintVelocity(
  timestamps: (string | number | Date)[],
  referenceDateMs: number = Date.now()
): VelocityResult {
  const ONE_DAY_MS = 24 * 3600 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
  const FOURTEEN_DAYS_MS = 14 * ONE_DAY_MS;
  const TWENTY_ONE_DAYS_MS = 21 * ONE_DAY_MS;

  let currentWeek = 0; // Last 7 days [0 to 7d ago]
  let priorWeek = 0; // 7 to 14 days ago
  let prevPriorWeek = 0; // 14 to 21 days ago

  for (const ts of timestamps) {
    const timeMs = new Date(ts).getTime();
    if (isNaN(timeMs)) continue;
    const diff = referenceDateMs - timeMs;

    if (diff >= 0 && diff <= SEVEN_DAYS_MS) {
      currentWeek++;
    } else if (diff > SEVEN_DAYS_MS && diff <= FOURTEEN_DAYS_MS) {
      priorWeek++;
    } else if (diff > FOURTEEN_DAYS_MS && diff <= TWENTY_ONE_DAYS_MS) {
      prevPriorWeek++;
    }
  }

  // Velocity (WoW % growth)
  const basePrior = Math.max(priorWeek, 1);
  const wowVelocityPct = Math.round(((currentWeek - priorWeek) / basePrior) * 100);

  // Acceleration rate: Delta(Velocity_now - Velocity_prev)
  const basePrevPrior = Math.max(prevPriorWeek, 1);
  const prevVelocityPct = ((priorWeek - prevPriorWeek) / basePrevPrior) * 100;
  const accelerationRate = Math.round((wowVelocityPct - prevVelocityPct) * 10) / 10;

  // Trend direction
  let trendDirection: TrendDirection = 'STEADY';
  if (wowVelocityPct >= 50 && accelerationRate > 15) {
    trendDirection = 'ACCELERATING';
  } else if (wowVelocityPct > 15) {
    trendDirection = 'INCREASING';
  } else if (wowVelocityPct < -20) {
    trendDirection = 'DECLINING';
  }

  const isSurging = wowVelocityPct >= 60 && currentWeek >= 3;

  // Double exponential smoothing projection for next 7-day period
  const alpha = 0.4;
  const beta = 0.3;
  let level = prevPriorWeek;
  let trend = priorWeek - prevPriorWeek;

  // Step 1: prior week
  const oldLevel1 = level;
  level = alpha * priorWeek + (1 - alpha) * (level + trend);
  trend = beta * (level - oldLevel1) + (1 - beta) * trend;

  // Step 2: current week
  const oldLevel2 = level;
  level = alpha * currentWeek + (1 - alpha) * (level + trend);
  trend = beta * (level - oldLevel2) + (1 - beta) * trend;

  const projectedNextPeriod = Math.max(0, Math.round(level + trend));

  return {
    current_period_count: currentWeek,
    prior_period_count: priorWeek,
    wow_velocity_pct: wowVelocityPct,
    acceleration_rate: accelerationRate,
    trend_direction: trendDirection,
    is_surging: isSurging,
    projected_next_period: projectedNextPeriod,
  };
}

/**
 * Generates 4-week historical bucket counts for micro-charts and trend lines.
 */
export function getWeeklyHistogramBuckets(
  timestamps: (string | number | Date)[],
  referenceDateMs: number = Date.now(),
  numWeeks: number = 4
): number[] {
  const ONE_WEEK_MS = 7 * 24 * 3600 * 1000;
  const buckets = new Array(numWeeks).fill(0);

  for (const ts of timestamps) {
    const timeMs = new Date(ts).getTime();
    if (isNaN(timeMs)) continue;
    const diff = referenceDateMs - timeMs;
    if (diff < 0) continue;

    const weekIndex = Math.floor(diff / ONE_WEEK_MS);
    if (weekIndex < numWeeks) {
      // Index 0 is oldest, Index numWeeks-1 is most recent
      const bucketPosition = numWeeks - 1 - weekIndex;
      buckets[bucketPosition]++;
    }
  }

  return buckets;
}
