// =============================================================================
// CivicConnect TN — Categories & Departments API Route (/api/categories)
// =============================================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Fallback seed categories if DB is initializing
const FALLBACK_CATEGORIES = [
  {
    department_name: 'Water Supply & Sewerage (CMWSSB/TWAD)',
    department_code: 'WATER',
    categories: [
      { id: 'cat-water-1', name: 'No Water Supply / Low Pressure', code: 'WATER_SUPPLY', default_priority: 'high', sla_hours: 24 },
      { id: 'cat-water-2', name: 'Contaminated / Muddy Water', code: 'WATER_QUALITY', default_priority: 'urgent', sla_hours: 12 },
      { id: 'cat-water-3', name: 'Pipeline Leakage / Main Burst', code: 'WATER_LEAKAGE', default_priority: 'urgent', sla_hours: 12 },
      { id: 'cat-water-4', name: 'Sewage Overflow on Street', code: 'SEWAGE_OVERFLOW', default_priority: 'urgent', sla_hours: 12 },
      { id: 'cat-water-5', name: 'Blocked Drain / Manhole Choked', code: 'SEWAGE_BLOCK', default_priority: 'high', sla_hours: 24 },
    ],
  },
  {
    department_name: 'Roads & Bridges (Highways / GCC)',
    department_code: 'ROADS',
    categories: [
      { id: 'cat-roads-1', name: 'Deep Potholes on Road', code: 'ROAD_POTHOLE', default_priority: 'high', sla_hours: 24 },
      { id: 'cat-roads-2', name: 'Damaged / Broken Road Surface', code: 'ROAD_DAMAGE', default_priority: 'medium', sla_hours: 48 },
      { id: 'cat-roads-3', name: 'Damaged Footpath / Missing Pavers', code: 'FOOTPATH_DAMAGE', default_priority: 'medium', sla_hours: 48 },
      { id: 'cat-roads-4', name: 'Missing / Broken Manhole Cover', code: 'MISSING_MANHOLE', default_priority: 'urgent', sla_hours: 12 },
      { id: 'cat-roads-5', name: 'Road Flooding / Waterlogging', code: 'WATERLOGGING', default_priority: 'urgent', sla_hours: 12 },
    ],
  },
  {
    department_name: 'Solid Waste Management (Sanitation)',
    department_code: 'SWM',
    categories: [
      { id: 'cat-swm-1', name: 'Garbage Dump Not Cleared', code: 'GARBAGE_UNCLEARED', default_priority: 'high', sla_hours: 24 },
      { id: 'cat-swm-2', name: 'Overflowing Public Dustbins', code: 'BIN_OVERFLOW', default_priority: 'medium', sla_hours: 24 },
      { id: 'cat-swm-3', name: 'Door-to-Door Waste Not Collected', code: 'DOOR_WASTE_MISSED', default_priority: 'medium', sla_hours: 48 },
      { id: 'cat-swm-4', name: 'Open Burning of Garbage / Plastic', code: 'GARBAGE_BURNING', default_priority: 'urgent', sla_hours: 12 },
      { id: 'cat-swm-5', name: 'Dead Animal Removal', code: 'DEAD_ANIMAL', default_priority: 'urgent', sla_hours: 12 },
    ],
  },
  {
    department_name: 'Electricity & Street Lighting (TANGEDCO)',
    department_code: 'ELEC',
    categories: [
      { id: 'cat-elec-1', name: 'Street Light Not Working / Dark Spot', code: 'STREETLIGHT_OUT', default_priority: 'medium', sla_hours: 24 },
      { id: 'cat-elec-2', name: 'Flickering / Dim Street Light', code: 'STREETLIGHT_FAULT', default_priority: 'low', sla_hours: 48 },
      { id: 'cat-elec-3', name: 'Hanging / Dangling Live Electric Wire', code: 'DANGLING_WIRE', default_priority: 'urgent', sla_hours: 12 },
      { id: 'cat-elec-4', name: 'Damaged Electric Pole / Transformer Issue', code: 'DAMAGED_POLE', default_priority: 'urgent', sla_hours: 12 },
    ],
  },
  {
    department_name: 'Stormwater Drains & Canals',
    department_code: 'SWD',
    categories: [
      { id: 'cat-swd-1', name: 'Blocked Stormwater Drain', code: 'DRAIN_BLOCKED', default_priority: 'high', sla_hours: 24 },
      { id: 'cat-swd-2', name: 'Broken Drain Slab / Cover', code: 'DRAIN_SLAB_BROKEN', default_priority: 'high', sla_hours: 24 },
      { id: 'cat-swd-3', name: 'Desilting Required Before Monsoons', code: 'DESILTING_REQUIRED', default_priority: 'medium', sla_hours: 72 },
    ],
  },
  {
    department_name: 'Public Health & Vector Control',
    department_code: 'HEALTH',
    categories: [
      { id: 'cat-health-1', name: 'Mosquito Breeding / Fogging Needed', code: 'MOSQUITO_BREEDING', default_priority: 'high', sla_hours: 24 },
      { id: 'cat-health-2', name: 'Stagnant Water in Vacant Plot', code: 'STAGNANT_WATER', default_priority: 'medium', sla_hours: 48 },
      { id: 'cat-health-3', name: 'Stray Dog Menace / Vaccination Need', code: 'STRAY_DOGS', default_priority: 'medium', sla_hours: 48 },
      { id: 'cat-health-4', name: 'Unhygienic Public Toilet', code: 'PUBLIC_TOILET_DIRTY', default_priority: 'high', sla_hours: 24 },
    ],
  },
];

interface RawDept {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface RawCat {
  id: string;
  department_id: string;
  name: string;
  code: string;
  default_priority: string;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, code, description')
      .eq('is_active', true);

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, department_id, name, code, default_priority')
      .eq('is_active', true);

    const deptList = (departments || []) as unknown as RawDept[];
    const catList = (categories || []) as unknown as RawCat[];

    if (deptError || catError || deptList.length === 0) {
      return NextResponse.json({
        success: true,
        data: { groups: FALLBACK_CATEGORIES },
      });
    }

    const groups = deptList.map((dept: RawDept) => {
      const deptCats = catList
        .filter((c: RawCat) => c.department_id === dept.id)
        .map((c: RawCat) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          default_priority: c.default_priority,
          sla_hours: c.default_priority === 'urgent' ? 12 : c.default_priority === 'high' ? 24 : 48,
        }));

      return {
        department_id: dept.id,
        department_name: dept.name,
        department_code: dept.code,
        categories: deptCats,
      };
    }).filter((g) => g.categories.length > 0);

    return NextResponse.json({
      success: true,
      data: { groups: groups.length > 0 ? groups : FALLBACK_CATEGORIES },
    });
  } catch (error) {
    console.error('[/api/categories error]:', error);
    return NextResponse.json({
      success: true,
      data: { groups: FALLBACK_CATEGORIES },
    });
  }
}
