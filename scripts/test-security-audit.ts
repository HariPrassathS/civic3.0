/**
 * CivicConnect TN — Complete Security & Reliability Audit Test Suite
 * Tests authentication, RBAC authorization, RLS & IDOR protection,
 * file upload hardening, cron protection, secret isolation, rate limiting,
 * and duplicate debouncing.
 */

import { GlobalRateLimiter } from '../lib/security/rate-limiter';
import { ComplaintEngine } from '../lib/complaints/engine';
import { UserRole, ComplaintStatus, Priority, MediaType, ComplaintSource } from '../types/enums';
import { MEMORY_COMPLAINTS } from '../lib/complaints/service';
import * as fs from 'fs';
import * as path from 'path';

async function runSecurityAuditTests() {
  console.log('================================================================');
  console.log('🛡️  CIVICCONNECT TN — COMPREHENSIVE SECURITY & RELIABILITY AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. Admin Authorization Protection Tests
  // -------------------------------------------------------------------------
  console.log('1. Auditing Admin Route Protection & RBAC Guards:');
  const adminUsersRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/users/route.ts'), 'utf8');
  assert(
    adminUsersRoute.includes('if (!user || user.role !== UserRole.ADMIN)'),
    'GET /api/admin/users strictly requires authenticated ADMIN role'
  );
  assert(
    adminUsersRoute.includes('if (!actor || actor.role !== UserRole.ADMIN)'),
    'PATCH /api/admin/users strictly requires authenticated ADMIN role'
  );

  const adminSlaRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/sla-configs/route.ts'), 'utf8');
  assert(
    adminSlaRoute.includes('if (!user || user.role !== UserRole.ADMIN)'),
    'GET /api/admin/sla-configs strictly requires authenticated ADMIN role'
  );
  assert(
    adminSlaRoute.includes('if (!actor || actor.role !== UserRole.ADMIN)'),
    'POST /api/admin/sla-configs strictly requires authenticated ADMIN role'
  );

  const devLoginRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/auth/dev-login/route.ts'), 'utf8');
  assert(
    devLoginRoute.includes("process.env.NODE_ENV === 'production'"),
    'POST /api/auth/dev-login blocked in production'
  );

  // -------------------------------------------------------------------------
  // 2. Cron Endpoint Protection Tests
  // -------------------------------------------------------------------------
  console.log('\n2. Auditing Cron Endpoint Security:');
  const cronRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/cron/escalate/route.ts'), 'utf8');
  assert(
    !cronRoute.includes("url.searchParams.get('dev') === 'true'"),
    'Eliminated insecure ?dev=true query parameter bypass in cron route'
  );
  assert(
    cronRoute.includes('cronSecret'),
    'Cron route strictly enforces CRON_SECRET or Admin session'
  );

  // -------------------------------------------------------------------------
  // 3. IDOR & Citizen Privacy Isolation Tests
  // -------------------------------------------------------------------------
  console.log('\n3. Auditing IDOR & Private Grievance Isolation:');
  const complaintsRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/complaints/route.ts'), 'utf8');
  assert(
    complaintsRoute.includes('if (!user) {') && complaintsRoute.includes('enforcePublicOnly = true;'),
    'Unauthenticated callers are restricted exclusively to public grievances'
  );
  assert(
    complaintsRoute.includes('if (requestedCitizenId && requestedCitizenId !== user.id)'),
    'Citizens cannot query other citizens private complaint lists (IDOR mitigation)'
  );

  const complaintDetailRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/complaints/[id]/route.ts'), 'utf8');
  assert(
    complaintDetailRoute.includes('if (!complaintData.is_public) {') &&
      complaintDetailRoute.includes('user.role === UserRole.CITIZEN && complaintData.citizen_id !== user.id'),
    'Private complaints inaccessible to other citizens in GET /api/complaints/[id]'
  );

  // -------------------------------------------------------------------------
  // 4. File Upload Security Tests
  // -------------------------------------------------------------------------
  console.log('\n4. Auditing File Upload Hardening:');
  const uploadRoute = fs.readFileSync(path.join(process.cwd(), 'app/api/upload/route.ts'), 'utf8');
  assert(
    uploadRoute.includes('ALLOWED_IMAGE_EXTENSIONS') && uploadRoute.includes('ALLOWED_VIDEO_EXTENSIONS'),
    'Strict file extension whitelisting enforced'
  );
  assert(
    uploadRoute.includes("mimeType === 'image/svg+xml'"),
    'SVG XSS script uploads explicitly prohibited'
  );
  assert(
    uploadRoute.includes('crypto.randomUUID()'),
    'Cryptographic UUID storage keys generated (path traversal prevention)'
  );
  assert(
    uploadRoute.includes('GlobalRateLimiter.check'),
    'Upload rate limiting enforced'
  );

  // -------------------------------------------------------------------------
  // 5. Rate Limiting Engine Tests
  // -------------------------------------------------------------------------
  console.log('\n5. Testing Sliding-Window Rate Limiter:');
  const testKey = `test_ip_${Date.now()}`;
  const r1 = GlobalRateLimiter.check(testKey, { windowMs: 1000, maxRequests: 3 });
  assert(r1.allowed && r1.remaining === 2, 'Rate limiter allows initial request with correct remaining tokens');

  const r2 = GlobalRateLimiter.check(testKey, { windowMs: 1000, maxRequests: 3 });
  const r3 = GlobalRateLimiter.check(testKey, { windowMs: 1000, maxRequests: 3 });
  assert(r3.allowed && r3.remaining === 0, 'Rate limiter tracks up to max limit');

  const r4 = GlobalRateLimiter.check(testKey, { windowMs: 1000, maxRequests: 3 });
  assert(!r4.allowed && (r4.retryAfterSeconds ?? 0) > 0, 'Rate limiter blocks request when limit is exceeded (HTTP 429)');

  // -------------------------------------------------------------------------
  // 6. Duplicate Submission Debouncing & Idempotency Tests
  // -------------------------------------------------------------------------
  console.log('\n6. Testing Duplicate Submission Debouncing & Concurrency:');
  const uniqueTitle = `Security Pothole Audit Test ${Date.now()}`;
  const actor = {
    id: `citizen-audit-${Date.now()}`,
    role: UserRole.CITIZEN,
    email: 'citizen.audit@tn.gov.in',
  };

  const firstSubmission = await ComplaintEngine.createComplaint(
    {
      title: uniqueTitle,
      description: 'Audit test description for duplicate debouncing validation.',
      address: 'Anna Salai, Chennai',
      ward: 114,
      district: 'Chennai',
      priority: Priority.HIGH,
      is_public: true,
      media: [{ url: 'https://example.com/audit-evidence.jpg' }],
      source: ComplaintSource.TEXT,
    },
    actor
  );

  assert(firstSubmission.success && !!firstSubmission.complaint, 'Initial grievance created successfully');

  // Attempt duplicate submission with exact same parameters within 30 seconds
  const duplicateSubmission = await ComplaintEngine.createComplaint(
    {
      title: uniqueTitle,
      description: 'Audit test description for duplicate debouncing validation.',
      address: 'Anna Salai, Chennai',
      ward: 114,
      district: 'Chennai',
      priority: Priority.HIGH,
      is_public: true,
      media: [{ url: 'https://example.com/audit-evidence.jpg' }],
      source: ComplaintSource.TEXT,
    },
    actor
  );

  assert(
    duplicateSubmission.success &&
      duplicateSubmission.complaint?.id === firstSubmission.complaint?.id &&
      (duplicateSubmission.warnings?.length ?? 0) > 0,
    'Duplicate submission debounced and returned identical tracking ID idempotently'
  );

  // Status transition state machine & concurrency test
  if (firstSubmission.complaint) {
    // 1. Valid transition: FIELD_WORKER_ASSIGNED -> IN_PROGRESS
    const t1 = await ComplaintEngine.transitionStatus({
      complaintId: firstSubmission.complaint.id,
      newStatus: ComplaintStatus.IN_PROGRESS,
      actor: { id: 'test-worker', role: UserRole.FIELD_WORKER },
      notes: 'Field worker commenced site work',
    });
    assert(t1.success, 'Valid transition ASSIGNED -> IN_PROGRESS succeeded');

    // 2. Duplicate identical transition call (Idempotency check)
    const t2 = await ComplaintEngine.transitionStatus({
      complaintId: firstSubmission.complaint.id,
      newStatus: ComplaintStatus.IN_PROGRESS,
      actor: { id: 'test-worker', role: UserRole.FIELD_WORKER },
      notes: 'Duplicate transition call',
    });
    assert(
      t2.success && t2.complaint?.status === ComplaintStatus.IN_PROGRESS,
      'Idempotent status transition handled gracefully without race condition error'
    );

    // 3. Valid transition: IN_PROGRESS -> RESOLUTION_SUBMITTED (Field Worker completes site fix)
    const t3 = await ComplaintEngine.transitionStatus({
      complaintId: firstSubmission.complaint.id,
      newStatus: ComplaintStatus.RESOLUTION_SUBMITTED,
      actor: { id: 'test-worker', role: UserRole.FIELD_WORKER },
      notes: 'Field worker completed site fix and submitted completion evidence',
      media: [{ url: 'https://example.com/resolved-pothole-after.jpg' }],
    });
    assert(t3.success, 'Valid transition IN_PROGRESS -> RESOLUTION_SUBMITTED succeeded');

    // 4. Valid transition: RESOLUTION_SUBMITTED -> RESOLVED (Officer verifies & approves)
    const t4 = await ComplaintEngine.transitionStatus({
      complaintId: firstSubmission.complaint.id,
      newStatus: ComplaintStatus.RESOLVED,
      actor: { id: 'test-officer', role: UserRole.AREA_OFFICER },
      notes: 'Area officer verified and approved resolution',
    });
    assert(t4.success, 'Valid transition RESOLUTION_SUBMITTED -> RESOLVED succeeded');
  }

  // -------------------------------------------------------------------------
  // 7. Service Role Key Isolation Audit
  // -------------------------------------------------------------------------
  console.log('\n7. Auditing Service Role Secrets & Client Bundle Isolation:');
  const browserClient = fs.readFileSync(path.join(process.cwd(), 'lib/supabase/client.ts'), 'utf8');
  assert(
    !browserClient.includes('SUPABASE_SERVICE_ROLE_KEY') && !browserClient.includes('SERVICE_ROLE'),
    'Browser client (lib/supabase/client.ts) uses ONLY anon public key'
  );

  const envFiles = ['.env', '.env.local', '.env.example'];
  for (const envFile of envFiles) {
    const fullPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      assert(
        !content.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'),
        `Service role key is never prefixed with NEXT_PUBLIC_ in ${envFile}`
      );
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL SECURITY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Fatal Security Test Suite Error:', err);
  process.exit(1);
});
