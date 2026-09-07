// =============================================================================
// CivicConnect TN — Common Issues Relationship API (/api/community/common-issues)
// =============================================================================
// Returns grouped spatial clusters of common civic failures reported by multiple citizens.

import { NextRequest, NextResponse } from 'next/server';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { buildCommonIssueClusters } from '@/lib/community/common-issues';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const district = searchParams.get('district');

    let publicComplaints = MEMORY_COMPLAINTS.filter((c) => c.is_public);

    if (district && district !== 'all' && district !== 'All Districts') {
      publicComplaints = publicComplaints.filter(
        (c) => c.district?.toLowerCase() === district.toLowerCase()
      );
    }

    const { clusters } = buildCommonIssueClusters(publicComplaints);

    return NextResponse.json({
      success: true,
      data: {
        total_clusters: clusters.length,
        clusters,
      },
    });
  } catch (error) {
    console.error('[/api/community/common-issues error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build common issue clusters' },
      { status: 500 }
    );
  }
}
