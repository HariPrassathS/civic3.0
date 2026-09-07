// =============================================================================
// CivicConnect TN — Forward Geocoding API (/api/spatial/geocode)
// =============================================================================
// Search for places/landmarks in Tamil Nadu and return coordinates.

import { NextRequest, NextResponse } from 'next/server';
import { forwardGeocode } from '@/lib/spatial/spatial-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" must be at least 2 characters.' },
        { status: 400 }
      );
    }

    const results = await forwardGeocode(q.trim());

    return NextResponse.json({
      success: true,
      data: {
        query: q,
        results,
      },
    });
  } catch (error) {
    console.error('[/api/spatial/geocode error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to geocode location query.' },
      { status: 500 }
    );
  }
}
