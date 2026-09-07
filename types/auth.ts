// =============================================================================
// CivicConnect TN — Auth Types
// =============================================================================

import type { UserRole } from './enums';

/** Authenticated user session data stored in cookies / JWT claims */
export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  department_id: string | null;
  ward_id: number | null;
  district: string | null;
  avatar_url: string | null;
  phone?: string | null;
}

/** Firebase token exchange request */
export interface LoginRequest {
  firebase_token: string;
}

/** Session response after successful login */
export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
