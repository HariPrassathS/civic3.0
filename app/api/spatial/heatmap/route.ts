// =============================================================================
// CivicConnect TN — Spatial Heatmap API (/api/spatial/heatmap)
// =============================================================================
// Returns priority-weighted geographic coordinates for density heatmap rendering.

import { NextRequest, NextResponse } from 'next/server';
import { queryHeatmapPoints, BoundingBox } from '@/lib/spatial/spatial-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const minLat = parseFloat(searchParams.get('minLat') || '8.0');
    const minLng = parseFloat(searchParams.get('minLng') || '76.0');
    const maxLat = parseFloat(searchParams.get('maxLat') || '14.0');
    const maxLng = parseFloat(searchParams.get('maxLng') || '81.0');
    const departmentId = searchParams.get('department_id') || undefined;
    const district = searchParams.get('district') || undefined;

    const bbox: BoundingBox = { minLat, minLng, maxLat, maxLng };

    const points = await queryHeatmapPoints({
      bbox,
      departmentId,
      district,
      isPublicOnly: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        points,
        count: points.length,
      },
    });
  } catch (error) {
    console.error('[/api/spatial/heatmap error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate heatmap points.' },
      { status: 500 }
    );
  }
}
