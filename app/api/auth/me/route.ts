// =============================================================================
// CivicConnect TN — Current User Session API Route Handler (/api/auth/me)
// =============================================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionUser = await verifySessionToken(token);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    let enrichedUser = sessionUser;
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (dbProfile) {
        enrichedUser = {
          id: dbProfile.id,
          email: dbProfile.email,
          display_name: dbProfile.display_name,
          role: dbProfile.role,
          department_id: dbProfile.department_id || null,
          ward_id: dbProfile.ward_id || sessionUser.ward_id,
          district: dbProfile.district || sessionUser.district,
          avatar_url: dbProfile.avatar_url || sessionUser.avatar_url,
        };
      }
    } catch {
      // Fallback to session user
    }

    return NextResponse.json({
      success: true,
      data: { user: enrichedUser },
    });
  } catch (error) {
    console.error('[/api/auth/me error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
