// =============================================================================
// CivicConnect TN — User Notification Preferences API Route
// =============================================================================
// GET: Fetches channel & event notification preferences.
// PUT: Updates user preferences.

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getUserPreferences, updateUserPreferences } from '@/lib/notifications/preferences';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'dev-user-citizen';

    const preferences = await getUserPreferences(userId);

    return NextResponse.json({
      success: true,
      data: { preferences },
    });
  } catch (error: any) {
    console.error('[/api/notifications/preferences GET error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'dev-user-citizen';
    const body = await request.json();

    const updated = await updateUserPreferences(userId, body);

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { preferences: updated },
    });
  } catch (error: any) {
    console.error('[/api/notifications/preferences PUT error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
