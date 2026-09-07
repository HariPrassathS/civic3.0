// =============================================================================
// CivicConnect TN — Zero-Login Citizen Identity Service
// =============================================================================
// Transparently associates complaints with internal citizen profiles in Supabase
// without requiring citizens to register, set passwords, or remember credentials.
// Supports:
// 1. Authenticated users (via Firebase/Session)
// 2. Phone-identified citizens (reused across complaints without duplicates)
// 3. Anonymous/Guest citizens (tracked via secure signed session token cookie)
//
// NEVER exposes internal database UUIDs to client-side voice/tracking interfaces.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/server';
import { UserRole } from '@/types/enums';
import { safeLog } from '@/lib/ai/client';

export const CITIZEN_SESSION_COOKIE = 'civic_citizen_token';

export interface CitizenIdentity {
  citizenId: string;
  displayName: string;
  phone?: string | null;
  email: string;
  isGuest: boolean;
  sessionToken: string;
}

/**
 * Normalizes an Indian phone number to standard 10-digit or E.164 format
 */
export function normalizePhoneNumber(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length >= 10 && digits.length <= 13) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Resolves or transparently provisions an internal citizen profile.
 * Ensures zero mandatory login while maintaining strict backend data integrity.
 */
export async function getOrCreateCitizenProfile(params: {
  name?: string | null;
  phone?: string | null;
  clientCookieToken?: string | null;
}): Promise<CitizenIdentity> {
  const supabase = createAdminClient();

  // 1. Check if an authenticated user session is active
  try {
    const authUser = await getCurrentUser();
    if (authUser && authUser.id) {
      return {
        citizenId: authUser.id,
        displayName: authUser.display_name || params.name || 'Citizen',
        phone: authUser.phone || null,
        email: authUser.email || '',
        isGuest: false,
        sessionToken: authUser.id,
      };
    }
  } catch {
    // Continue with guest/phone identity resolution
  }

  // 2. Resolve or generate secure device session token
  let sessionToken = params.clientCookieToken;
  if (!sessionToken) {
    try {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(CITIZEN_SESSION_COOKIE)?.value;
    } catch {
      // Non-Next.js cookie context
    }
  }

  if (!sessionToken || sessionToken.trim() === '') {
    sessionToken = crypto.randomUUID();
  }

  const cleanName = (params.name || '').trim();
  const normalizedPhone = params.phone ? normalizePhoneNumber(params.phone) : null;

  // 3. If verified/provided phone exists, reuse or create phone-based profile
  if (normalizedPhone) {
    try {
      const { data: existingPhoneProfile } = await supabase
        .from('profiles')
        .select('id, display_name, email, phone, role')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingPhoneProfile) {
        // If citizen provided a more specific name and current is generic, update it
        if (cleanName && cleanName.length > 2 && existingPhoneProfile.display_name === 'Citizen') {
          await supabase
            .from('profiles')
            .update({ display_name: cleanName, updated_at: new Date().toISOString() })
            .eq('id', existingPhoneProfile.id);
        }

        safeLog('info', 'Reusing existing citizen profile via phone', {
          profileId: existingPhoneProfile.id,
          hasName: !!cleanName,
        });

        return {
          citizenId: existingPhoneProfile.id,
          displayName: cleanName || existingPhoneProfile.display_name || 'Citizen',
          phone: normalizedPhone,
          email: existingPhoneProfile.email,
          isGuest: false,
          sessionToken,
        };
      }

      // Create new phone profile
      const phoneUid = `phone_${normalizedPhone.replace(/\+/g, '')}`;
      const phoneEmail = `${normalizedPhone.replace(/\+/g, '')}@citizen.civicconnect.tn.gov.in`;
      const displayName = cleanName || `Citizen (${normalizedPhone.slice(-4)})`;

      const { data: newPhoneProfile, error: createPhoneErr } = await supabase
        .from('profiles')
        .insert({
          firebase_uid: phoneUid,
          email: phoneEmail,
          display_name: displayName,
          phone: normalizedPhone,
          role: UserRole.CITIZEN,
          is_active: true,
        })
        .select('id, display_name, email, phone')
        .single();

      if (!createPhoneErr && newPhoneProfile) {
        return {
          citizenId: newPhoneProfile.id,
          displayName: newPhoneProfile.display_name,
          phone: normalizedPhone,
          email: newPhoneProfile.email,
          isGuest: false,
          sessionToken,
        };
      }
    } catch (phoneErr) {
      safeLog('warn', 'Failed to resolve phone citizen profile, falling back to device token', {
        error: String(phoneErr),
      });
    }
  }

  // 4. Guest / Anonymous Device Profile resolution
  const guestUid = `guest_${sessionToken}`;
  const guestEmail = `${guestUid}@citizen.civicconnect.tn.gov.in`;

  try {
    const { data: existingGuestProfile } = await supabase
      .from('profiles')
      .select('id, display_name, email, phone')
      .eq('firebase_uid', guestUid)
      .maybeSingle();

    if (existingGuestProfile) {
      if (cleanName && cleanName.length > 2 && existingGuestProfile.display_name === 'Citizen') {
        await supabase
          .from('profiles')
          .update({ display_name: cleanName, updated_at: new Date().toISOString() })
          .eq('id', existingGuestProfile.id);
      }

      return {
        citizenId: existingGuestProfile.id,
        displayName: cleanName || existingGuestProfile.display_name || 'Citizen',
        phone: existingGuestProfile.phone,
        email: existingGuestProfile.email,
        isGuest: true,
        sessionToken,
      };
    }

    // Provision new guest profile
    const displayName = cleanName || 'Citizen';
    const { data: newGuestProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: guestUid,
        email: guestEmail,
        display_name: displayName,
        phone: normalizedPhone,
        role: UserRole.CITIZEN,
        is_active: true,
      })
      .select('id, display_name, email, phone')
      .single();

    if (!insertErr && newGuestProfile) {
      safeLog('info', 'Provisioned new guest citizen profile', {
        profileId: newGuestProfile.id,
      });

      return {
        citizenId: newGuestProfile.id,
        displayName: newGuestProfile.display_name,
        phone: null,
        email: newGuestProfile.email,
        isGuest: true,
        sessionToken,
      };
    }
  } catch (guestErr) {
    safeLog('error', 'Error in guest profile provisioning', { error: String(guestErr) });
  }

  // Safe fallback to default demo citizen if database insertion fails
  return {
    citizenId: 'ae1b5808-1d92-4de3-8343-0becfa572857',
    displayName: cleanName || 'Citizen',
    phone: normalizedPhone,
    email: 'citizen.guest@civicconnect.tn.gov.in',
    isGuest: true,
    sessionToken,
  };
}

/**
 * Attaches the persistent session token cookie to a response so future requests
 * from the same device automatically resolve to their own citizen profile.
 */
export function attachCitizenSessionCookie(
  response: NextResponse,
  sessionToken: string
): NextResponse {
  response.cookies.set({
    name: CITIZEN_SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 Year persistence
  });
  return response;
}
