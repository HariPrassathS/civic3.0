// =============================================================================
// CivicConnect TN — Nearby Complaints Spatial API (/api/spatial/nearby)
// =============================================================================
// Returns public complaints within a specified radius (km) of coordinates.
// Server-side spatial filtering with distance calculation.

import { NextRequest, NextResponse } from 'next/server';
import { queryNearbyComplaints } from '@/lib/spatial/spatial-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius_km');
    const limitStr = searchParams.get('limit');
    const categoryId = searchParams.get('category_id') || undefined;
    const status = searchParams.get('status') || undefined;

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: 'Query parameters "lat" and "lng" are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radiusKm = radiusStr ? parseFloat(radiusStr) : 10;
    const limit = limitStr ? Math.min(parseInt(limitStr, 10), 100) : 50;

    if (isNaN(lat) || isNaN(lng) || lat < 8 || lat > 14 || lng < 76 || lng > 81) {
      // Validate bounds loosely around Tamil Nadu/South India
      // Proceed but clamp or warn if needed
    }

    const issues = await queryNearbyComplaints({
      lat,
      lng,
      radiusKm,
      limit,
      categoryId,
      status,
      isPublicOnly: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        center: { latitude: lat, longitude: lng },
        radius_km: radiusKm,
        count: issues.length,
        issues,
      },
    });
  } catch (error) {
    console.error('[/api/spatial/nearby error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while searching nearby issues.' },
      { status: 500 }
    );
  }
}
