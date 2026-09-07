import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { UserRole } from '@/types/enums';

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await props.params;

    let complaintData: any = null;

    // Primary: Try Supabase lookup by UUID or tracking ID
    try {
      const supabase = createAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase
        .from('complaints')
        .select(`
          *,
          category:categories(name, code),
          department:departments(name, code),
          media:complaint_media(*),
          updates:complaint_updates(*)
        `);

      if (isUuid) {
        query = query.or(`id.eq.${id},tracking_id.ilike.${id}`);
      } else {
        query = query.ilike('tracking_id', id);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        complaintData = data;
      }
    } catch {
      // Fall through to memory check
    }

    // Secondary fallback: in-memory store
    if (!complaintData) {
      const memFound = MEMORY_COMPLAINTS.find(
        (c) => c.id === id || c.tracking_id.toLowerCase() === id.toLowerCase()
      );
      if (memFound) {
        complaintData = memFound;
      }
    }

    if (!complaintData) {
      return NextResponse.json(
        { success: false, error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // IDOR & Privacy Authorization Enforcement
    if (!complaintData.is_public) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Sign in required to view private grievances.' },
          { status: 401 }
        );
      }

      if (user.role === UserRole.CITIZEN && complaintData.citizen_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to view this citizen grievance.' },
          { status: 403 }
        );
      }

      if (user.role === UserRole.FIELD_WORKER) {
        const matchesWard = user.ward_id && complaintData.ward === user.ward_id;
        const matchesDept = user.department_id && complaintData.department_id === user.department_id;
        if (!matchesWard && !matchesDept) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: Work order not in assigned field scope.' },
            { status: 403 }
          );
        }
      }

      if (user.role === UserRole.AREA_OFFICER && user.ward_id && complaintData.ward !== user.ward_id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Grievance outside your municipal ward jurisdiction.' },
          { status: 403 }
        );
      }

      if (user.role === UserRole.DEPARTMENT_HEAD && user.department_id && complaintData.department_id !== user.department_id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Grievance outside your department jurisdiction.' },
          { status: 403 }
        );
      }

      if (user.role === UserRole.DISTRICT_COLLECTOR && user.district && user.district !== 'Tamil Nadu' && complaintData.district?.toLowerCase() !== user.district.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Grievance outside your district jurisdiction.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { complaint: complaintData },
    });
  } catch (error) {
    console.error('[/api/complaints/[id] error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch complaint details' },
      { status: 500 }
    );
  }
}
