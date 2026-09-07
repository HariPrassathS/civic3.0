// =============================================================================
// CivicConnect TN — Status Transition API Route (/api/complaints/[id]/transition)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { ComplaintEngine } from '@/lib/complaints/engine';
import { ComplaintStatus, UserRole } from '@/types/enums';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await props.params;
    const body = await request.json();

    const { new_status, notes, metadata, media } = body;

    if (!new_status) {
      return NextResponse.json(
        { success: false, error: 'Target status (new_status) is required' },
        { status: 400 }
      );
    }

    const actor = {
      id: user?.id || 'dev-user-citizen',
      role: user?.role || UserRole.CITIZEN,
      email: user?.email,
      display_name: user?.display_name,
    };

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = await ComplaintEngine.transitionStatus({
      complaintId: id,
      newStatus: new_status as ComplaintStatus,
      actor,
      notes,
      metadata,
      media,
      ipAddress: clientIp,
    });

    if (!result.success) {
      const isAuthError = result.errors?.some((e) => e.toLowerCase().includes('unauthorized') || e.toLowerCase().includes('illegal'));
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Transition failed',
          errors: result.errors,
        },
        { status: isAuthError ? 403 : 400 }
      );
    }

    // Trigger AI resolution verification if After Evidence photo is submitted
    if (new_status === ComplaintStatus.RESOLUTION_SUBMITTED && Array.isArray(media) && media.length > 0 && media[0].url) {
      const afterUrl = media[0].url;
      const complaintRecord = result.complaint;
      if (complaintRecord) {
        import('@/lib/evidence/evidence-engine').then(({ EvidenceEngine }) => {
          EvidenceEngine.analyzeResolutionEvidence({
            afterMediaUrl: afterUrl,
            title: complaintRecord.title,
            description: complaintRecord.description,
            resolutionNotes: notes || 'Rectification work completed by field gang.',
          }).then((analysis) => {
            import('@/lib/supabase/admin').then(({ createAdminClient }) => {
              const supabase = createAdminClient();
              if (supabase) {
                supabase
                  .from('complaint_media')
                  .update({ ai_analysis: analysis as any })
                  .eq('complaint_id', id)
                  .eq('url', afterUrl)
                  .then(() => {});
              }
            });
          }).catch((err) => console.warn('[AI Resolution Background Warn]:', err));
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        complaint: result.complaint,
        update: result.updateRecord,
        audit: result.auditRecord,
      },
    });
  } catch (error) {
    console.error('[/api/complaints/[id]/transition PATCH error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transition complaint status' },
      { status: 500 }
    );
  }
}
