// =============================================================================
// CivicConnect TN — Login API Route Handler (Firebase → Supabase Profile Sync)
// =============================================================================
// Flow:
// 1. Receives Firebase ID token from client
// 2. Verifies ID token on server
// 3. Queries / upserts user in Supabase `profiles` table using Admin client
// 4. Retrieves assigned role & scope
// 5. Issues httpOnly session cookie and returns user profile

import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/auth/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth/session';
import { UserRole } from '@/types/enums';
import type { AuthUser } from '@/types/auth';
import type { Profile } from '@/types/database';

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { firebase_token } = body;

    if (!firebase_token) {
      return NextResponse.json(
        { success: false, error: 'Missing firebase_token in request body' },
        { status: 400 }
      );
    }

    // Step 1: Verify Firebase ID Token
    const firebaseUser = await verifyFirebaseIdToken(firebase_token);

    // Step 2: Supabase Profile Synchronization
    let userProfile: AuthUser;

    try {
      const supabaseAdmin = createAdminClient();

      // Check for existing profile by firebase_uid or email
      let query = supabaseAdmin.from('profiles').select('*');
      if (firebaseUser.email) {
        query = query.or(`firebase_uid.eq.${firebaseUser.uid},email.eq.${firebaseUser.email}`);
      } else {
        query = query.eq('firebase_uid', firebaseUser.uid);
      }

      const { data: existingData, error: fetchError } = await query.maybeSingle();
      const existingProfile = existingData as unknown as Profile | null;

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('[Supabase Profile Fetch Warning]:', fetchError.message);
      }

      if (existingProfile) {
        // If profile exists, update info if needed
        if (
          existingProfile.firebase_uid !== firebaseUser.uid ||
          (firebaseUser.picture && !existingProfile.avatar_url)
        ) {
          await supabaseAdmin
            .from('profiles')
            .update({
              firebase_uid: firebaseUser.uid,
              avatar_url: firebaseUser.picture || existingProfile.avatar_url,
              display_name: existingProfile.display_name || firebaseUser.name,
            } as unknown as never)
            .eq('id', existingProfile.id);
        }

        userProfile = {
          id: existingProfile.id,
          email: existingProfile.email,
          display_name: existingProfile.display_name || firebaseUser.name,
          role: existingProfile.role as UserRole,
          department_id: existingProfile.department_id || null,
          ward_id: existingProfile.ward_id || 114,
          district: existingProfile.district || 'Chennai',
          avatar_url: existingProfile.avatar_url || firebaseUser.picture || null,
        };
      } else {
        // Create new profile (default role: Citizen)
        const email = firebaseUser.email || `${firebaseUser.uid}@citizen.civicconnect.tn.gov.in`;
        const newProfileData = {
          firebase_uid: firebaseUser.uid,
          email: email,
          display_name: firebaseUser.name || 'Citizen',
          avatar_url: firebaseUser.picture || null,
          role: UserRole.CITIZEN,
          ward_id: 114,
          district: 'Chennai',
          is_active: true,
        };

        const { data: insertedData, error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert([newProfileData] as unknown as never[])
          .select('*')
          .single();

        const createdProfile = insertedData as unknown as Profile | null;

        if (insertError || !createdProfile) {
          console.warn('[Supabase Profile Insert Warning]:', insertError?.message);
          userProfile = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ae1b5808-1d92-4de3-8343-0becfa572857',
            email: email,
            display_name: firebaseUser.name || 'Citizen',
            role: UserRole.CITIZEN,
            department_id: null,
            ward_id: 114,
            district: 'Chennai',
            avatar_url: firebaseUser.picture || null,
          };
        } else {
          userProfile = {
            id: createdProfile.id,
            email: createdProfile.email,
            display_name: createdProfile.display_name,
            role: createdProfile.role as UserRole,
            department_id: createdProfile.department_id || null,
            ward_id: createdProfile.ward_id || 114,
            district: createdProfile.district || 'Chennai',
            avatar_url: createdProfile.avatar_url,
          };
        }
      }
    } catch (supabaseError) {
      console.warn('[Supabase Admin Client unavailable, fallback to token]:', supabaseError);
      userProfile = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ae1b5808-1d92-4de3-8343-0becfa572857',
        email: firebaseUser.email || `${firebaseUser.uid}@citizen.civicconnect.tn.gov.in`,
        display_name: firebaseUser.name || 'Citizen',
        role: UserRole.CITIZEN,
        department_id: null,
        ward_id: 114,
        district: 'Chennai',
        avatar_url: firebaseUser.picture || null,
      };
    }

    // Step 3: Issue signed session token
    const sessionToken = await createSessionToken(userProfile);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      data: {
        user: userProfile,
      },
    });

    // Set HTTP-only secure session cookie
    response.cookies.set({
      name: cookieOptions.name,
      value: sessionToken,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[Login Route Error]:', error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 401 });
  }
}

