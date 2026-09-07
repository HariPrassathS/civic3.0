// =============================================================================
// CivicConnect TN — Spatial Clusters API (/api/spatial/clusters)
// =============================================================================
// Aggregates complaints into clusters based on viewport bounding box and zoom.

import { NextRequest, NextResponse } from 'next/server';
import { querySpatialClusters, BoundingBox } from '@/lib/spatial/spatial-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const minLat = parseFloat(searchParams.get('minLat') || '8.0');
    const minLng = parseFloat(searchParams.get('minLng') || '76.0');
    const maxLat = parseFloat(searchParams.get('maxLat') || '14.0');
    const maxLng = parseFloat(searchParams.get('maxLng') || '81.0');
    const zoom = parseInt(searchParams.get('zoom') || '10', 10);

    const categoryId = searchParams.get('category_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const departmentId = searchParams.get('department_id') || undefined;
    const district = searchParams.get('district') || undefined;

    const bbox: BoundingBox = { minLat, minLng, maxLat, maxLng };

    const result = await querySpatialClusters({
      bbox,
      zoom,
      categoryId,
      status,
      departmentId,
      district,
      isPublicOnly: true,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[/api/spatial/clusters error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to aggregate spatial clusters.' },
      { status: 500 }
    );
  }
}
