// =============================================================================
// CivicConnect TN — Admin SLA Configurations API Route (/api/admin/sla-configs)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { UserRole, Priority } from '@/types/enums';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  MEMORY_SLA_CONFIGS,
  DEFAULT_SLA_HOURS,
  setMemorySlaConfig,
} from '@/lib/sla/engine';
import { ESCALATION_TIERS } from '@/lib/sla/escalation';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin role required.' },
        { status: 403 }
      );
    }

    let slaConfigs = [...MEMORY_SLA_CONFIGS];

    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('sla_configs')
          .select('*')
          .order('priority', { ascending: true });
        if (!error && data && data.length > 0) {
          slaConfigs = data;
        }
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      data: {
        defaultSlaHours: DEFAULT_SLA_HOURS,
        slaConfigs,
        escalationTiers: Object.values(ESCALATION_TIERS),
      },
    });
  } catch (error) {
    console.error('[/api/admin/sla-configs GET error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve SLA configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { priority, resolution_hours, category_id, department_id, warning_threshold_pct } = body;

    if (!priority || !resolution_hours || resolution_hours <= 0) {
      return NextResponse.json(
        { success: false, error: 'Priority and a positive resolution_hours are required' },
        { status: 400 }
      );
    }

    // Update memory store
    const updated = setMemorySlaConfig({
      priority: priority as Priority,
      resolution_hours: Number(resolution_hours),
      category_id: category_id || null,
      department_id: department_id || null,
      warning_threshold_pct: warning_threshold_pct ? Number(warning_threshold_pct) : 80,
      is_active: true,
    });

    // Update Supabase
    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('sla_configs').upsert({
          priority,
          resolution_hours: Number(resolution_hours),
          category_id: category_id || null,
          department_id: department_id || null,
          warning_threshold_pct: warning_threshold_pct ? Number(warning_threshold_pct) : 80,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

        // Audit log
        await supabase.from('audit_logs').insert({
          actor_id: actor?.id || 'admin',
          action: 'sla_config.updated',
          entity_type: 'sla_configs',
          entity_id: updated.id,
          new_value: { priority, resolution_hours, category_id, department_id },
        });
      }
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      message: 'SLA rule configuration updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('[/api/admin/sla-configs POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SLA configuration' },
      { status: 500 }
    );
  }
}
