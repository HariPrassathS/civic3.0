// =============================================================================
// CivicConnect TN — Session Management & JWT Token Handling (jose)
// =============================================================================
// Uses jose for fast, Edge-compatible JWT signing and verification.

import { SignJWT, jwtVerify } from 'jose';
import type { AuthUser } from '@/types/auth';

export const SESSION_COOKIE_NAME = 'civic_session';
export const DEFAULT_SESSION_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds

const SECRET_KEY_STR =
  process.env.SESSION_SECRET ||
  process.env.CRON_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'civicconnect-tn-secure-default-session-key-32chars!';

const SECRET_KEY = new TextEncoder().encode(SECRET_KEY_STR);

/**
 * Creates a signed JWT session token for an authenticated user.
 */
export async function createSessionToken(
  user: AuthUser,
  expiresInSeconds: number = DEFAULT_SESSION_EXPIRATION
): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    display_name: user.display_name?.slice(0, 50),
    role: user.role,
    department_id: user.department_id,
    ward_id: user.ward_id,
    district: user.district,
    avatar_url: user.avatar_url && user.avatar_url.length < 100 ? user.avatar_url : undefined,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .setSubject(user.id)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verifies and decodes a signed JWT session token.
 * Returns null if token is invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });

    return {
      id: (payload.id as string) || (payload.sub as string),
      email: payload.email as string,
      display_name: payload.display_name as string,
      role: payload.role as AuthUser['role'],
      department_id: (payload.department_id as string) || null,
      ward_id: (payload.ward_id as number) || null,
      district: (payload.district as string) || null,
      avatar_url: (payload.avatar_url as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Returns standard cookie configuration for session storage.
 */
export function getSessionCookieOptions(maxAge: number = DEFAULT_SESSION_EXPIRATION) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
