// =============================================================================
// CivicConnect TN — Complaints API Route (/api/complaints)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ComplaintEngine } from '@/lib/complaints/engine';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { ComplaintStatus, UserRole } from '@/types/enums';
import type { Complaint, ComplaintMedia, ComplaintUpdate } from '@/types/database';

interface ComplaintItem extends Complaint {
  category?: { name: string; code: string };
  department?: { name: string; code: string };
  media?: ComplaintMedia[];
  updates?: ComplaintUpdate[];
  latitude?: number;
  longitude?: number;
  upvotes_count?: number;
  comments_count?: number;
}

function parsePostGisLocation(loc: unknown): { latitude: number; longitude: number } | null {
  if (!loc) return null;
  if (typeof loc === 'object' && loc !== null && 'latitude' in (loc as any) && 'longitude' in (loc as any)) {
    return loc as { latitude: number; longitude: number };
  }
  if (typeof loc === 'string') {
    // Check if it's WKB hex representation from PostGIS
    if (/^[0-9a-fA-F]+$/.test(loc) && (loc.length === 50 || loc.length === 42)) {
      try {
        const buffer = Buffer.from(loc, 'hex');
        if (buffer.length === 25) {
          const lon = buffer.readDoubleLE(9);
          const lat = buffer.readDoubleLE(17);
          return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
        }
        if (buffer.length === 21) {
          const lon = buffer.readDoubleLE(5);
          const lat = buffer.readDoubleLE(13);
          return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
        }
      } catch {
        return null;
      }
    }
    // Check if it's "POINT(lng lat)"
    const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const requestedCitizenId = searchParams.get('citizen_id');
    const status = searchParams.get('status');
    const isPublic = searchParams.get('is_public');
    const search = searchParams.get('search')?.toLowerCase();
    const requestedWard = searchParams.get('ward');

    // Role-based scope variables
    let effectiveCitizenId: string | null = null;
    let enforcePublicOnly = false;
    let scopeWard: number | null = null;
    let scopeDept: string | null = null;
    let scopeDistrict: string | null = null;
    let assignedComplaintIds: string[] = [];

    if (!user) {
      // Unauthenticated callers can ONLY see public grievances
      enforcePublicOnly = true;
    } else if (user.role === UserRole.CITIZEN) {
      // IDOR protection: Citizens can only query their own complaints
      if (requestedCitizenId && requestedCitizenId !== user.id) {
        // Reject attempt to query another citizen's ID
        effectiveCitizenId = user.id;
      } else if (requestedCitizenId) {
        effectiveCitizenId = requestedCitizenId;
      } else if (isPublic !== 'true') {
        effectiveCitizenId = user.id;
      }
    } else if (user.role === UserRole.FIELD_WORKER) {
      // Field workers see:
      // 1. All complaints directly assigned to them
      // 2. All complaints in their assigned ward / department
      if (requestedWard === 'all') {
        scopeWard = null;
      } else if (requestedWard && !isNaN(parseInt(requestedWard))) {
        scopeWard = parseInt(requestedWard);
      } else if (user.ward_id) {
        scopeWard = user.ward_id;
      }
      if (user.department_id) scopeDept = user.department_id;
    } else if (user.role === UserRole.AREA_OFFICER) {
      if (requestedWard === 'all') {
        scopeWard = null;
      } else if (requestedWard && !isNaN(parseInt(requestedWard))) {
        scopeWard = parseInt(requestedWard);
      } else if (user.ward_id) {
        scopeWard = user.ward_id;
      }
    } else if (user.role === UserRole.DEPARTMENT_HEAD) {
      if (user.department_id) scopeDept = user.department_id;
    } else if (user.role === UserRole.DISTRICT_COLLECTOR) {
      if (user.district && user.district !== 'Tamil Nadu' && user.district !== 'Statewide') scopeDistrict = user.district;
    }

    let complaints: ComplaintItem[] = [];

    try {
      const supabase = createAdminClient();

      // For Field Workers: Look up direct task assignments
      if (user && user.role === UserRole.FIELD_WORKER) {
        const { data: assignments } = await supabase
          .from('complaint_assignments')
          .select('complaint_id')
          .eq('assigned_to', user.id);
        if (assignments && assignments.length > 0) {
          assignedComplaintIds = assignments.map((a) => a.complaint_id);
        }
      }

      let query = supabase
        .from('complaints')
        .select(`
          *,
          category:categories(name, code),
          department:departments(name, code),
          media:complaint_media(*)
        `)
        .order('created_at', { ascending: false });

      if (effectiveCitizenId) {
        query = query.eq('citizen_id', effectiveCitizenId);
      } else if (enforcePublicOnly || isPublic === 'true') {
        query = query.eq('is_public', true);
      } else if (user?.role === UserRole.FIELD_WORKER) {
        // Field worker query: Assigned directly OR in their designated ward
        if (assignedComplaintIds.length > 0 && scopeWard) {
          query = query.or(`id.in.(${assignedComplaintIds.join(',')}),ward.eq.${scopeWard}`);
        } else if (assignedComplaintIds.length > 0) {
          query = query.in('id', assignedComplaintIds);
        } else if (scopeWard) {
          query = query.eq('ward', scopeWard);
        }
        if (scopeDept) query = query.eq('department_id', scopeDept);
      } else {
        if (scopeWard) query = query.eq('ward', scopeWard);
        if (scopeDept) query = query.eq('department_id', scopeDept);
        if (scopeDistrict) query = query.ilike('district', scopeDistrict);
      }

      if (status && status !== 'all') query = query.eq('status', status as ComplaintStatus);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        complaints = data as unknown as ComplaintItem[];

        // Generate signed URLs for media from private bucket 'complaint-evidence'
        const signedUrlPromises: Promise<void>[] = [];
        for (const comp of complaints) {
          // Parse PostGIS coordinates if available
          if (comp.location) {
            const parsedLoc = parsePostGisLocation(comp.location);
            if (parsedLoc) {
              comp.latitude = parsedLoc.latitude;
              comp.longitude = parsedLoc.longitude;
              comp.location = parsedLoc as any;
            }
          }

          if (comp.media && Array.isArray(comp.media)) {
            for (const m of comp.media) {
              if (m.storage_path && (!m.url || !m.url.startsWith('http') || m.url.includes('supabase.co/storage/v1/object/sign/'))) {
                signedUrlPromises.push(
                  supabase.storage
                    .from('complaint-evidence')
                    .createSignedUrl(m.storage_path, 86400)
                    .then(({ data: sData }) => {
                      if (sData?.signedUrl) {
                        m.url = sData.signedUrl;
                      }
                    })
                    .catch(() => {})
                );
              }
            }
          }
        }
        if (signedUrlPromises.length > 0) {
          await Promise.all(signedUrlPromises);
        }
      } else if (error) {
        console.warn('[Supabase Complaints query warning]:', error.message);
      }
    } catch (dbErr) {
      console.warn('[Supabase Complaints error]:', dbErr);
    }

    // In-memory fallback filtering with identical security scoping
    if (complaints.length === 0) {
      complaints = (MEMORY_COMPLAINTS as unknown as ComplaintItem[]).filter((c) => {
        if (effectiveCitizenId && c.citizen_id !== effectiveCitizenId) return false;
        if (enforcePublicOnly && !c.is_public) return false;
        if (user?.role === UserRole.FIELD_WORKER && assignedComplaintIds.length > 0) {
          if (!assignedComplaintIds.includes(c.id) && scopeWard && c.ward !== scopeWard) return false;
        } else {
          if (scopeWard && c.ward !== scopeWard) return false;
        }
        if (scopeDept && c.department_id !== scopeDept) return false;
        if (scopeDistrict && c.district?.toLowerCase() !== scopeDistrict.toLowerCase()) return false;
        if (status && status !== 'all' && c.status !== status) return false;
        return true;
      });
    }

    if (search && complaints.length > 0) {
      complaints = complaints.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.tracking_id.toLowerCase().includes(search) ||
          (c.address && c.address.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      data: { complaints },
    });
  } catch (error) {
    console.error('[/api/complaints GET error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Strict RBAC: Only Citizens can raise public grievance reports
    if (user && user.role !== UserRole.CITIZEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only citizens are authorized to submit public grievances. Government officer accounts cannot submit citizen reports.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const actor = {
      id: user?.id || 'dev-user-citizen',
      role: UserRole.CITIZEN,
      email: user?.email,
      display_name: user?.display_name,
    };

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = await ComplaintEngine.createComplaint(body, actor, { ipAddress: clientIp });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0] || 'Validation failed',
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { complaint: result.complaint },
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('[/api/complaints POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
