// =============================================================================
// CivicConnect TN — Developer Evidence Diagnostic API (/api/dev/evidence-diagnostic)
// =============================================================================

import { NextResponse } from 'next/server';
import { EvidenceEngine } from '@/lib/evidence/evidence-engine';
import { GROQ_MODELS } from '@/lib/ai/client';

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_DIAGNOSTICS !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Developer diagnostics are disabled in production environments.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mode, scenario, beforeInput, afterInput } = body;

    if (mode === 'before') {
      const result = await EvidenceEngine.analyzeCitizenEvidence(
        beforeInput || {
          title: 'Large Pothole on Anna Salai',
          description: 'Deep road damage causing traffic hazards near bus terminus.',
          category: 'Road Damage',
          address: 'Anna Salai, Chennai',
          mediaUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6',
        }
      );
      return NextResponse.json({
        success: true,
        mode: 'before',
        model_used: GROQ_MODELS.VISION,
        data: result,
      });
    }

    if (mode === 'after') {
      const result = await EvidenceEngine.analyzeResolutionEvidence(
        afterInput || {
          title: 'Large Pothole on Anna Salai',
          description: 'Deep road damage causing traffic hazards near bus terminus.',
          category: 'Road Damage',
          beforeMediaUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6',
          afterMediaUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
          resolutionNotes: 'Filled pothole with cold mix bitumen asphalt and compacted surface.',
        }
      );
      return NextResponse.json({
        success: true,
        mode: 'after',
        model_used: GROQ_MODELS.VISION,
        data: result,
      });
    }

    return NextResponse.json({
      success: true,
      diagnostic: {
        engine: 'EvidenceEngine',
        vision_model: GROQ_MODELS.VISION,
        cache_active: true,
        scenarios_supported: ['A_VALID_BEFORE', 'B_WRONG_BEFORE', 'C_UNCLEAR', 'D_VALID_AFTER', 'E_ISSUE_STILL_EXISTS', 'F_WRONG_LOCATION', 'G_PARTIAL_REPAIR', 'H_AI_FALLBACK'],
      },
    });
  } catch (error) {
    console.error('[/api/dev/evidence-diagnostic error]:', error);
    return NextResponse.json(
      { success: false, error: 'Diagnostic test execution failed.' },
      { status: 500 }
    );
  }
}
