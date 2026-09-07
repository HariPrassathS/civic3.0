// =============================================================================
// CivicConnect TN — Server-Side Authorization Helpers
// =============================================================================
// Use these helpers in Server Components, Server Actions, and Route Handlers
// to enforce backend authentication and role-based permissions.
// NEVER rely on client-side role checks for security.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from './session';
import { UserRole } from '@/types/enums';
import { hasRole, hasMinimumRole } from '@/config/roles';
import type { AuthUser } from '@/types/auth';

/**
 * Retrieves the current authenticated user from session cookies.
 * Returns null if unauthenticated or session has expired.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    return await verifySessionToken(sessionCookie);
  } catch {
    return null;
  }
}

/**
 * Ensures the user is authenticated.
 * If not authenticated, redirects to /login (or throws in API context).
 */
export async function requireAuth(returnUrl?: string): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    const loginPath = returnUrl ? `/login?redirect=${encodeURIComponent(returnUrl)}` : '/login';
    redirect(loginPath);
  }

  return user;
}

/**
 * Enforces that the authenticated user has one of the allowed roles.
 * If user does not have an allowed role, redirects to /unauthorized.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  returnUrl?: string
): Promise<AuthUser> {
  const user = await requireAuth(returnUrl);

  if (!hasRole(user.role, allowedRoles)) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Enforces that the user has at least the privilege level of the given role in the hierarchy.
 */
export async function requireMinimumRole(
  minRole: UserRole,
  returnUrl?: string
): Promise<AuthUser> {
  const user = await requireAuth(returnUrl);

  if (!hasMinimumRole(user.role, minRole)) {
    redirect('/unauthorized');
  }

  return user;
}
