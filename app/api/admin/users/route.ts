// =============================================================================
// CivicConnect TN — Admin User & Role Management API Route (/api/admin/users)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole } from '@/types/enums';
import type { Profile } from '@/types/database';

export const MEMORY_USERS: Profile[] = [
  {
    id: 'usr-admin-01',
    firebase_uid: 'fb-admin-01',
    email: 'admin.tn@tn.gov.in',
    display_name: 'Administrator (e-Governance TN)',
    phone: '9840011223',
    avatar_url: null,
    role: UserRole.ADMIN,
    department_id: null,
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-cm-01',
    firebase_uid: 'fb-cm-01',
    email: 'cm.office@tn.gov.in',
    display_name: 'Chief Minister Secretariat',
    phone: '9840099887',
    avatar_url: null,
    role: UserRole.CHIEF_MINISTER,
    department_id: null,
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-cs-01',
    firebase_uid: 'fb-cs-01',
    email: 'chief.secretary@tn.gov.in',
    display_name: 'Chief Secretary IAS',
    phone: '9840077665',
    avatar_url: null,
    role: UserRole.CHIEF_SECRETARY,
    department_id: null,
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-sec-maws',
    firebase_uid: 'fb-sec-maws',
    email: 'secretary.maws@tn.gov.in',
    display_name: 'Principal Secretary MAWS',
    phone: '9840055443',
    avatar_url: null,
    role: UserRole.DEPARTMENT_SECRETARY,
    department_id: 'd0000001-0000-0000-0000-000000000001',
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-collector-chn',
    firebase_uid: 'fb-collector-chn',
    email: 'collector.chennai@tn.gov.in',
    display_name: 'District Collector Chennai IAS',
    phone: '9840033221',
    avatar_url: null,
    role: UserRole.DISTRICT_COLLECTOR,
    department_id: null,
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-comm-gcc',
    firebase_uid: 'fb-comm-gcc',
    email: 'commissioner.gcc@tn.gov.in',
    display_name: 'Commissioner GCC IAS',
    phone: '9840022110',
    avatar_url: null,
    role: UserRole.CITY_COMMISSIONER,
    department_id: null,
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-ee-roads',
    firebase_uid: 'fb-ee-roads',
    email: 'ee.roads@tn.gov.in',
    display_name: 'Ramesh P (Executive Engineer Highways)',
    phone: '9840044556',
    avatar_url: null,
    role: UserRole.DEPARTMENT_HEAD,
    department_id: 'd0000001-0000-0000-0000-000000000002',
    ward_id: null,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-ae-ward114',
    firebase_uid: 'fb-ae-ward114',
    email: 'ae.ward114@tn.gov.in',
    display_name: 'Selvi N (Assistant Engineer Ward 114)',
    phone: '9840066778',
    avatar_url: null,
    role: UserRole.AREA_OFFICER,
    department_id: 'd0000001-0000-0000-0000-000000000002',
    ward_id: 114,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-worker-murugan',
    firebase_uid: 'fb-worker-murugan',
    email: 'murugan.field@tn.gov.in',
    display_name: 'Murugan R (Road Maintenance Gang #3)',
    phone: '9840088990',
    avatar_url: null,
    role: UserRole.FIELD_WORKER,
    department_id: 'd0000001-0000-0000-0000-000000000002',
    ward_id: 114,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-user-citizen',
    firebase_uid: 'fb-citizen-01',
    email: 'citizen.karthik@gmail.com',
    display_name: 'Karthik Subramanian',
    phone: '9840012345',
    avatar_url: null,
    role: UserRole.CITIZEN,
    department_id: null,
    ward_id: 114,
    district: 'Chennai',
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    let users = [...MEMORY_USERS];

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        users = data as unknown as Profile[];
      }
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('[/api/admin/users GET error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to list users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, role, department_id, ward_id, is_active } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // Update memory store
    const memIdx = MEMORY_USERS.findIndex((u) => u.id === user_id || u.email === user_id);
    if (memIdx >= 0) {
      if (role) MEMORY_USERS[memIdx].role = role;
      if (department_id !== undefined) MEMORY_USERS[memIdx].department_id = department_id;
      if (ward_id !== undefined) MEMORY_USERS[memIdx].ward_id = ward_id ? Number(ward_id) : null;
      if (is_active !== undefined) MEMORY_USERS[memIdx].is_active = is_active;
      MEMORY_USERS[memIdx].updated_at = nowIso;
    }

    // Update Supabase
    try {
      const supabase = createAdminClient();
      await supabase
        .from('profiles')
        .update({
          ...(role && { role }),
          ...(department_id !== undefined && { department_id }),
          ...(ward_id !== undefined && { ward_id: ward_id ? Number(ward_id) : null }),
          ...(is_active !== undefined && { is_active }),
          updated_at: nowIso,
        })
        .eq('id', user_id);

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_id: actor?.id || 'admin',
        action: 'user.profile_updated',
        entity_type: 'profiles',
        entity_id: user_id,
        new_value: { role, department_id, ward_id, is_active },
      });
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
    });
  } catch (error) {
    console.error('[/api/admin/users PATCH error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
