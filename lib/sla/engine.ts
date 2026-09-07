// =============================================================================
// CivicConnect TN — Configurable SLA Engine
// =============================================================================
// Manages priority-based and category-specific SLA resolution timeframes,
// warning threshold notifications (e.g. 80% SLA elapsed), and deadline computation.

import { Priority } from '@/types/enums';
import type { SlaConfig } from '@/types/database';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Default statutory SLA resolution hours for Tamil Nadu civic services:
 * URGENT: 12 hours (Emergency hazards, burst water mains, exposed high-voltage cables)
 * HIGH: 24 hours (Potholes on arterial roads, sewage overflow)
 * MEDIUM: 48 hours (Residential streetlight faults, garbage clearance)
 * LOW: 72 hours (Routine maintenance, arboriculture, signage)
 */
export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  [Priority.URGENT]: 12,
  [Priority.HIGH]: 24,
  [Priority.MEDIUM]: 48,
  [Priority.LOW]: 72,
};

// Warning threshold percentage when nearing breach (default: 80% SLA elapsed)
export const DEFAULT_WARNING_THRESHOLD_PCT = 80;

// In-memory dynamic SLA overrides store (for offline/demo/testing flexibility)
export const MEMORY_SLA_CONFIGS: SlaConfig[] = [
  {
    id: 'sla-cfg-urgent-default',
    category_id: null,
    department_id: null,
    priority: Priority.URGENT,
    resolution_hours: 12,
    warning_threshold_pct: 80,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sla-cfg-high-default',
    category_id: null,
    department_id: null,
    priority: Priority.HIGH,
    resolution_hours: 24,
    warning_threshold_pct: 80,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sla-cfg-medium-default',
    category_id: null,
    department_id: null,
    priority: Priority.MEDIUM,
    resolution_hours: 48,
    warning_threshold_pct: 80,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sla-cfg-low-default',
    category_id: null,
    department_id: null,
    priority: Priority.LOW,
    resolution_hours: 72,
    warning_threshold_pct: 80,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Custom Category Override Examples:
  {
    id: 'sla-cfg-water-contamination',
    category_id: 'c0000001-0000-0000-0000-000000000006', // Water Contamination
    department_id: 'd0000001-0000-0000-0000-000000000001', // MAWS
    priority: Priority.URGENT,
    resolution_hours: 6, // 6h expedited turnaround for drinking water contamination
    warning_threshold_pct: 75,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getSafeAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Retrieves the effective SLA resolution hours for a given priority and optional category/department.
 */
export async function getResolutionHours(
  priority: Priority,
  categoryId?: string | null,
  departmentId?: string | null
): Promise<number> {
  // 1. Check in-memory specific config
  if (categoryId || departmentId) {
    const specificMem = MEMORY_SLA_CONFIGS.find(
      (cfg) =>
        cfg.is_active &&
        cfg.priority === priority &&
        (categoryId ? cfg.category_id === categoryId : true) &&
        (departmentId ? cfg.department_id === departmentId : true)
    );
    if (specificMem) {
      return specificMem.resolution_hours;
    }
  }

  // 2. Query Supabase sla_configs if available
  try {
    const supabase = getSafeAdminClient();
    if (supabase) {
      // Check category-specific
      if (categoryId) {
        const { data } = await supabase
          .from('sla_configs')
          .select('resolution_hours')
          .eq('category_id', categoryId)
          .eq('priority', priority)
          .eq('is_active', true)
          .single();
        if (data?.resolution_hours) {
          return data.resolution_hours;
        }
      }

      // Check global priority config
      const { data: globalData } = await supabase
        .from('sla_configs')
        .select('resolution_hours')
        .is('category_id', null)
        .eq('priority', priority)
        .eq('is_active', true)
        .single();
      if (globalData?.resolution_hours) {
        return globalData.resolution_hours;
      }
    }
  } catch {
    // Fall back to memory configs
  }

  // 3. Fall back to priority memory config or constant
  const memFallback = MEMORY_SLA_CONFIGS.find(
    (cfg) => cfg.is_active && !cfg.category_id && cfg.priority === priority
  );
  if (memFallback) {
    return memFallback.resolution_hours;
  }

  return DEFAULT_SLA_HOURS[priority] || 48;
}

/**
 * Computes the SLA deadline from a reference time (default: current time).
 */
export async function computeSlaDeadline(
  priority: Priority = Priority.MEDIUM,
  categoryId?: string | null,
  departmentId?: string | null,
  fromTime: Date = new Date()
): Promise<Date> {
  const hours = await getResolutionHours(priority, categoryId, departmentId);
  const deadline = new Date(fromTime.getTime() + hours * 3600 * 1000);
  return deadline;
}

/**
 * Checks whether a complaint has breached its SLA deadline.
 */
export function isSlaBreached(deadlineIso: string | null | undefined, referenceTime: Date = new Date()): boolean {
  if (!deadlineIso) return false;
  const deadlineTime = new Date(deadlineIso).getTime();
  return referenceTime.getTime() > deadlineTime;
}

/**
 * Checks whether a complaint has crossed its warning threshold (e.g. 80% SLA elapsed).
 */
export function isSlaNearBreach(
  createdAtIso: string,
  deadlineIso: string,
  thresholdPct: number = DEFAULT_WARNING_THRESHOLD_PCT,
  referenceTime: Date = new Date()
): boolean {
  const start = new Date(createdAtIso).getTime();
  const end = new Date(deadlineIso).getTime();
  const now = referenceTime.getTime();

  if (now >= end) return true; // Already breached
  if (now <= start) return false;

  const totalDuration = end - start;
  const elapsed = now - start;
  const elapsedPct = (elapsed / totalDuration) * 100;

  return elapsedPct >= thresholdPct;
}

/**
 * Adds or updates an SLA configuration rule (Admin action).
 */
export function setMemorySlaConfig(config: Partial<SlaConfig> & { priority: Priority; resolution_hours: number }): SlaConfig {
  const existingIndex = MEMORY_SLA_CONFIGS.findIndex(
    (c) => c.priority === config.priority && c.category_id === (config.category_id || null)
  );

  const updatedConfig: SlaConfig = {
    id: existingIndex >= 0 ? MEMORY_SLA_CONFIGS[existingIndex].id : `sla-cfg-${Date.now()}`,
    category_id: config.category_id || null,
    department_id: config.department_id || null,
    priority: config.priority,
    resolution_hours: config.resolution_hours,
    warning_threshold_pct: config.warning_threshold_pct || DEFAULT_WARNING_THRESHOLD_PCT,
    is_active: config.is_active !== undefined ? config.is_active : true,
    created_at: existingIndex >= 0 ? MEMORY_SLA_CONFIGS[existingIndex].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    MEMORY_SLA_CONFIGS[existingIndex] = updatedConfig;
  } else {
    MEMORY_SLA_CONFIGS.push(updatedConfig);
  }

  return updatedConfig;
}
