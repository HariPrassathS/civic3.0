// =============================================================================
// CivicConnect TN — Voice Complaint Tracking API (/api/voice/track)
// =============================================================================
// Accepts spoken text or tracking queries in Tamil, Tanglish, or English.
// Delegates to the multi-signal VoiceTrackingEngine for deterministic and semantic
// candidate ranking, ownership verification, and disambiguation.

import { NextResponse } from 'next/server';
import { VoiceTrackingEngine } from '@/lib/tracking/voice-tracking-engine';
import { getOrCreateCitizenProfile, attachCitizenSessionCookie } from '@/lib/citizen/citizen-identity';
import { safeLog } from '@/lib/ai/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, language = 'en', latitude, longitude, citizen_name, phone } = body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing or empty speech transcript' },
        { status: 400 }
      );
    }

    const cleanTranscript = transcript.trim();
    safeLog('info', 'Voice tracking request received', {
      transcriptSize: cleanTranscript.length,
      language,
    });

    // 1. Resolve or provision internal citizen identity
    const citizen = await getOrCreateCitizenProfile({
      name: citizen_name,
      phone,
    });

    // 2. Execute VoiceTrackingEngine
    const result = await VoiceTrackingEngine.trackComplaint({
      query: cleanTranscript,
      language,
      citizenId: citizen.citizenId,
      sessionToken: citizen.sessionToken,
      userLat: latitude ? Number(latitude) : null,
      userLng: longitude ? Number(longitude) : null,
    });

    // 3. Format response for frontend Voice Assistant Modal & Track Page
    const responsePayload = {
      success: true,
      data: {
        found: result.outcome === 'MATCHED',
        outcome: result.outcome,
        complaint: result.selectedComplaint,
        trackingId: result.selectedComplaint?.tracking_id,
        statusDescription: result.explanationEn,
        tamilResponse: result.explanationTa,
        clarificationQuestion: result.clarificationQuestion,
        nearbyCommunityCount: result.nearbyCommunityCount,
        extractedEntities: result.extractedEntities,
        diagnosticScores: result.diagnosticScores,
      },
    };

    const response = NextResponse.json(responsePayload);
    return attachCitizenSessionCookie(response, citizen.sessionToken);
  } catch (error) {
    console.error('[/api/voice/track error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process voice tracking request' },
      { status: 500 }
    );
  }
}
