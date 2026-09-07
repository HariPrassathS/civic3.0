// =============================================================================
// CivicConnect TN — Voice Complaint Submission API (/api/voice/submit)
// =============================================================================
// Persists voice-submitted complaints into Supabase using the central ComplaintEngine.
// Automatically manages internal citizen profiles (zero-login) and attaches session tokens.

import { NextResponse } from 'next/server';
import { getOrCreateCitizenProfile, attachCitizenSessionCookie } from '@/lib/citizen/citizen-identity';
import { ComplaintEngine } from '@/lib/complaints/engine';
import { ComplaintSource, UserRole, MediaType, MediaPhase } from '@/types/enums';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      category_id,
      department_id,
      priority,
      latitude,
      longitude,
      address,
      ward_id,
      district,
      media,
      citizen_name,
      phone,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing title or description in complaint' },
        { status: 400 }
      );
    }

    // 1. Transparently resolve or provision authentic citizen profile
    const citizen = await getOrCreateCitizenProfile({
      name: citizen_name,
      phone,
    });

    const actor = {
      id: citizen.citizenId,
      role: UserRole.CITIZEN,
      email: citizen.email,
      display_name: citizen.displayName || citizen_name || 'Citizen (Voice)',
    };

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Format media attachments
    const formattedMedia = Array.isArray(media)
      ? media.map((m: { url: string; media_type?: string }) => ({
          url: m.url,
          media_type: m.media_type === 'video' ? MediaType.VIDEO : MediaType.IMAGE,
          phase: MediaPhase.COMPLAINT,
        }))
      : undefined;

    const complaintInput = {
      title,
      description,
      category_id,
      department_id,
      priority,
      source: ComplaintSource.VOICE,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      address: address || 'Location identified via CivicConnect Voice Assistant',
      ward_id: ward_id ? Number(ward_id) : 114,
      district: district || 'Chennai',
      media: formattedMedia,
    };

    const result = await ComplaintEngine.createComplaint(complaintInput, actor, {
      ipAddress: clientIp,
    });

    if (!result.success || !result.complaint) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0] || 'Failed to register voice complaint',
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        complaint: result.complaint,
        tracking_id: result.complaint.tracking_id,
        sla_deadline: result.complaint.sla_deadline,
        created_at: result.complaint.created_at,
        citizen_name: citizen.displayName,
      },
      warnings: result.warnings,
    });

    return attachCitizenSessionCookie(response, citizen.sessionToken);
  } catch (error) {
    console.error('[/api/voice/submit error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while registering voice complaint' },
      { status: 500 }
    );
  }
}
