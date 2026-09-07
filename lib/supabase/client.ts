// =============================================================================
// CivicConnect TN — Supabase Browser Client
// =============================================================================
// Use this client in Client Components (browser-side).
// It uses the anon key and relies on the user's JWT for RLS enforcement.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
