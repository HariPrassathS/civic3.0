// =============================================================================
// CivicConnect TN — Administrative Spatial Map API (/api/spatial/admin-map)
// =============================================================================
// Comprehensive spatial query endpoint for administrative GIS console.
// Enforces role-based authorization and supports all multi-criteria filters.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import {
  isInBoundingBox,
  BoundingBox,
  SpatialComplaintItem,
  fetchAllSpatialComplaints,
} from '@/lib/spatial/spatial-engine';
import { UserRole } from '@/types/enums';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;

    const { searchParams } = request.nextUrl;

    const categoryId = searchParams.get('category_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const departmentId = searchParams.get('department_id') || undefined;
    const dateRange = searchParams.get('date_range') || 'all';
    const wardStr = searchParams.get('ward');
    const district = searchParams.get('district') || undefined;
    const ward = wardStr ? parseInt(wardStr, 10) : undefined;

    // Viewport bounding box (optional)
    const minLat = searchParams.get('minLat') ? parseFloat(searchParams.get('minLat')!) : undefined;
    const minLng = searchParams.get('minLng') ? parseFloat(searchParams.get('minLng')!) : undefined;
    const maxLat = searchParams.get('maxLat') ? parseFloat(searchParams.get('maxLat')!) : undefined;
    const maxLng = searchParams.get('maxLng') ? parseFloat(searchParams.get('maxLng')!) : undefined;

    const bbox: BoundingBox | null =
      minLat !== undefined && minLng !== undefined && maxLat !== undefined && maxLng !== undefined
        ? { minLat, minLng, maxLat, maxLng }
        : null;

    // Role-based scope enforcement
    const isOfficial =
      user &&
      [
        UserRole.AREA_OFFICER,
        UserRole.DEPARTMENT_HEAD,
        UserRole.DISTRICT_COLLECTOR,
        UserRole.CITY_COMMISSIONER,
        UserRole.DEPARTMENT_SECRETARY,
        UserRole.CHIEF_SECRETARY,
        UserRole.CHIEF_MINISTER,
        UserRole.ADMIN,
        UserRole.FIELD_WORKER,
      ].includes(user.role as UserRole);

    // Compute date cutoff
    let dateCutoff: Date | null = null;
    const now = new Date();
    if (dateRange === 'today') {
      dateCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === '7d') {
      dateCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '30d') {
      dateCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const items: SpatialComplaintItem[] = [];
    const stats = {
      total: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      slaBreached: 0,
      resolved: 0,
    };

    const allComplaints = await fetchAllSpatialComplaints(!isOfficial);

    for (const c of allComplaints) {
      // 1. Role Scope Filter
      if (!isOfficial && !c.is_public) continue;

      // Area Officer: only assigned ward
      if (user?.role === UserRole.AREA_OFFICER && (user as any).ward && c.ward !== (user as any).ward) {
        continue;
      }
      // Department Head: only assigned department
      if (
        user?.role === UserRole.DEPARTMENT_HEAD &&
        (user as any).department_id &&
        c.department_id !== (user as any).department_id
      ) {
        continue;
      }
      // District Collector: only assigned district
      if (
        user?.role === UserRole.DISTRICT_COLLECTOR &&
        (user as any).district &&
        c.district?.toLowerCase() !== (user as any).district.toLowerCase()
      ) {
        continue;
      }

      // 2. Query Filters
      if (categoryId && c.category_id !== categoryId) continue;
      if (status && c.status !== status) continue;
      if (priority && c.priority.toLowerCase() !== priority.toLowerCase()) continue;
      if (departmentId && c.department_id !== departmentId) continue;
      const isAllDist =
        !district ||
        district.toLowerCase() === 'all' ||
        district.toLowerCase() === 'all tamil nadu' ||
        district.toLowerCase() === 'statewide';
      if (!isAllDist && district && c.district?.toLowerCase() !== district.toLowerCase()) continue;

      if (dateCutoff && new Date(c.created_at) < dateCutoff) continue;

      if (bbox && !isInBoundingBox(c.latitude, c.longitude, bbox)) continue;

      // Collect item
      items.push(c);

      // Update stats
      stats.total++;
      const p = (c.priority || 'medium').toLowerCase();
      if (p === 'urgent') stats.urgent++;
      else if (p === 'high') stats.high++;
      else if (p === 'medium') stats.medium++;
      else stats.low++;

      if ((c as any).sla_breached) stats.slaBreached++;
      if (c.status === 'resolved' || c.status === 'closed') stats.resolved++;
    }

    return NextResponse.json({
      success: true,
      data: {
        role: user?.role || 'public',
        isOfficial: Boolean(isOfficial),
        stats,
        count: items.length,
        complaints: items.slice(0, 300), // Protect client DOM limit
      },
    });
  } catch (error) {
    console.error('[/api/spatial/admin-map error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query spatial complaints.' },
      { status: 500 }
    );
  }
}
