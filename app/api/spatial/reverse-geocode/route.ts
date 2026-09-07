// =============================================================================
// CivicConnect TN — Reverse Geocoding API (/api/spatial/reverse-geocode)
// =============================================================================
// Converts latitude/longitude to formatted address, ward, and Tamil Nadu district.

import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/spatial/spatial-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: 'Parameters "lat" and "lng" are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid numeric coordinates provided.' },
        { status: 400 }
      );
    }

    const result = await reverseGeocode(lat, lng);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[/api/spatial/reverse-geocode error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reverse geocode coordinates.' },
      { status: 500 }
    );
  }
}
