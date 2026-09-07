import { NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole } from '@/types/enums';
import { ROLE_LABELS } from '@/config/roles';
import type { AuthUser } from '@/types/auth';
import type { Profile } from '@/types/database';

const DEMO_USERS: Record<UserRole, Partial<AuthUser>> = {
  [UserRole.CITIZEN]: {
    email: 'citizen.demo@civicconnect.tn.gov.in',
    display_name: 'Priya Sundaram (Citizen)',
    ward_id: 114,
    district: 'Chennai',
  },
  [UserRole.FIELD_WORKER]: {
    email: 'worker.murugan@tn.gov.in',
    display_name: 'Murugan K (Field Worker)',
    ward_id: 114,
    district: 'Chennai',
  },
  [UserRole.AREA_OFFICER]: {
    email: 'ae.ward114@chennaicorp.gov.in',
    display_name: 'Anand Kumar, AE (Area Officer)',
    ward_id: 114,
    district: 'Chennai',
  },
  [UserRole.DEPARTMENT_HEAD]: {
    email: 'ee.roads@chennaicorp.gov.in',
    display_name: 'Rajendran P, EE (Roads Dept Head)',
    district: 'Chennai',
  },
  [UserRole.CITY_COMMISSIONER]: {
    email: 'commissioner@chennaicorp.gov.in',
    display_name: 'J. Radhakrishnan, IAS (City Commissioner)',
    district: 'Chennai',
  },
  [UserRole.DISTRICT_COLLECTOR]: {
    email: 'collector.cni@tn.gov.in',
    display_name: 'Rashmi Siddharth, IAS (District Collector)',
    district: 'Chennai',
  },
  [UserRole.DEPARTMENT_SECRETARY]: {
    email: 'sec.maws@tn.gov.in',
    display_name: 'D. Karthikeyan, IAS (MAWS Secretary)',
    district: 'Tamil Nadu',
  },
  [UserRole.CHIEF_SECRETARY]: {
    email: 'cs@tn.gov.in',
    display_name: 'Shiv Das Meena, IAS (Chief Secretary)',
    district: 'Tamil Nadu',
  },
  [UserRole.CHIEF_MINISTER]: {
    email: 'cmcell@tn.gov.in',
    display_name: 'Hon. Chief Minister Office',
    district: 'Tamil Nadu',
  },
  [UserRole.ADMIN]: {
    email: 'admin@civicconnect.tn.gov.in',
    display_name: 'CivicConnect TN Administrator',
    district: 'Statewide',
  },
};

export async function POST(request: Request) {
  try {

    const body = await request.json();
    const rawRole = (body.role || UserRole.CITIZEN).toString().toLowerCase();
    const role = (Object.values(UserRole).find((r) => r.toLowerCase() === rawRole) ||
      (Object.keys(UserRole).find((k) => k.toLowerCase() === rawRole) ? UserRole[rawRole.toUpperCase() as keyof typeof UserRole] : null) ||
      UserRole.CITIZEN) as UserRole;
    const secretCode = body.secretCode || request.headers.get('x-official-secret') || '';

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role: ${role}` },
        { status: 400 }
      );
    }

    // Security Gate: All government/official roles require the secret authorization code '1927'
    if (role !== UserRole.CITIZEN && secretCode !== '1927') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied: Government official login requires the valid 4-digit secret authorization passcode.',
        },
        { status: 403 }
      );
    }

    const demoData = DEMO_USERS[role] || {};
    const email = demoData.email || `${role}@civicconnect.tn.gov.in`;
    const displayName = demoData.display_name || ROLE_LABELS[role];
    const firebaseUid = `demo_${role}_tn`;

    let realUserId = `dev-user-${role}`;
    let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${role}`;

    // Upsert into Supabase profiles table
    try {
      const supabaseAdmin = createAdminClient();

      // Check if profile exists by email or firebase_uid
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`email.eq.${email},firebase_uid.eq.${firebaseUid}`)
        .maybeSingle();

      const existingProfile = existing as unknown as Profile | null;

      if (existingProfile) {
        realUserId = existingProfile.id;
        avatarUrl = existingProfile.avatar_url || avatarUrl;
      } else {
        // Insert new profile
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('profiles')
          .insert([
            {
              firebase_uid: firebaseUid,
              email: email,
              display_name: displayName,
              avatar_url: avatarUrl,
              role: role,
              ward_id: demoData.ward_id || (role === UserRole.CITIZEN ? 114 : null),
              district: demoData.district || 'Chennai',
              is_active: true,
            },
          ] as unknown as never[])
          .select('*')
          .single();

        const createdProfile = inserted as unknown as Profile | null;
        if (createdProfile) {
          realUserId = createdProfile.id;
        } else if (insertErr) {
          console.warn('[Dev Login Profile Insert Warning]:', insertErr.message);
        }
      }
    } catch (dbErr) {
      console.warn('[Supabase DB Sync Warning in dev-login]:', dbErr);
    }

    const user: AuthUser = {
      id: realUserId,
      email: email,
      display_name: displayName,
      role,
      department_id: demoData.department_id || null,
      ward_id: demoData.ward_id || (role === UserRole.CITIZEN ? 114 : null),
      district: demoData.district || 'Chennai',
      avatar_url: avatarUrl,
    };

    const sessionToken = await createSessionToken(user);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      data: { user },
    });

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
  } catch (error) {
    console.error('[/api/auth/dev-login error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create dev session' },
      { status: 500 }
    );
  }
}
