// =============================================================================
// CivicConnect TN — Departments API Route (/api/departments)
// =============================================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Department } from '@/types/database';

export const FALLBACK_DEPARTMENTS: Department[] = [
  {
    id: 'd0000001-0000-0000-0000-000000000001',
    name: 'Water Supply & Sewerage (CMWSSB/TWAD)',
    code: 'WATER',
    description: 'Chennai Metropolitan Water Supply & Sewerage Board & TWAD Board',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000002',
    name: 'Roads, Bridges & Highways (Highways / GCC)',
    code: 'ROADS',
    description: 'State Highways Department & Greater Chennai Corporation Bus Routes',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000003',
    name: 'Solid Waste Management (Sanitation)',
    code: 'SWM',
    description: 'Municipal Solid Waste, Sweeping, Door-to-Door Collection & Landfills',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000004',
    name: 'Electricity & Street Lighting (TANGEDCO)',
    code: 'ELEC',
    description: 'Tamil Nadu Generation and Distribution Corporation & Street Light Network',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000005',
    name: 'Stormwater Drains & Canals',
    code: 'SWD',
    description: 'Integrated Stormwater Drain Network & Flood Prevention Infrastructure',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
  {
    id: 'd0000001-0000-0000-0000-000000000006',
    name: 'Public Health & Vector Control',
    code: 'HEALTH',
    description: 'Disease Surveillance, Mosquito Fogging, Public Toilets & Animal Control',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
];

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code, description, is_active, created_at')
      .eq('is_active', true)
      .order('name');

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: FALLBACK_DEPARTMENTS,
      });
    }

    return NextResponse.json({
      success: true,
      data: data as Department[],
    });
  } catch (error) {
    console.error('[/api/departments error]:', error);
    return NextResponse.json({
      success: true,
      data: FALLBACK_DEPARTMENTS,
    });
  }
}
