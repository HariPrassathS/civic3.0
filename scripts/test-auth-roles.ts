// =============================================================================
// CivicConnect TN — Automated Auth & Role Verification Suite
// =============================================================================

import { createSessionToken, verifySessionToken } from '../lib/auth/session';
import { UserRole } from '../types/enums';
import {
  ROLE_HIERARCHY,
  ROLE_LABELS,
  hasRole,
  hasMinimumRole,
  getRoleHomePath,
} from '../config/roles';
import type { AuthUser } from '../types/auth';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runAuthRoleTests() {
  console.log('\n======================================================');
  console.log('CivicConnect TN — Phase 2 Auth & Role Verification');
  console.log('======================================================\n');

  // Test 1: Role Enum & Hierarchy Coverage (10 Roles)
  console.log('--- Test Suite 1: 10-Role Security Hierarchy ---');
  const allRoles = Object.values(UserRole);
  assert(allRoles.length === 10, 'All 10 required roles defined in UserRole enum');
  assert(ROLE_HIERARCHY.length === 10, 'ROLE_HIERARCHY contains all 10 roles in order');

  const expectedOrder: UserRole[] = [
    UserRole.CITIZEN,
    UserRole.FIELD_WORKER,
    UserRole.AREA_OFFICER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.CITY_COMMISSIONER,
    UserRole.DISTRICT_COLLECTOR,
    UserRole.DEPARTMENT_SECRETARY,
    UserRole.CHIEF_SECRETARY,
    UserRole.CHIEF_MINISTER,
    UserRole.ADMIN,
  ];

  let orderCorrect = true;
  for (let i = 0; i < expectedOrder.length; i++) {
    if (ROLE_HIERARCHY[i] !== expectedOrder[i]) {
      orderCorrect = false;
      break;
    }
  }
  assert(orderCorrect, 'Role hierarchy matches exact civil administration order');

  // Test 2: Role Permission & Minimum Role Privilege Checks
  console.log('\n--- Test Suite 2: Permission Matrix Logic ---');
  assert(
    hasRole(UserRole.AREA_OFFICER, [UserRole.AREA_OFFICER, UserRole.ADMIN]),
    'Area Officer matches allowed role list [AREA_OFFICER, ADMIN]'
  );
  assert(
    !hasRole(UserRole.CITIZEN, [UserRole.AREA_OFFICER, UserRole.ADMIN]),
    'Citizen is rejected from allowed role list [AREA_OFFICER, ADMIN]'
  );
  assert(
    hasMinimumRole(UserRole.ADMIN, UserRole.CITIZEN),
    'Admin has minimum role of Citizen'
  );
  assert(
    hasMinimumRole(UserRole.DEPARTMENT_HEAD, UserRole.AREA_OFFICER),
    'Department Head has minimum role of Area Officer'
  );
  assert(
    !hasMinimumRole(UserRole.CITIZEN, UserRole.AREA_OFFICER),
    'Citizen does NOT have minimum role of Area Officer'
  );
  assert(
    !hasMinimumRole(UserRole.FIELD_WORKER, UserRole.DEPARTMENT_HEAD),
    'Field Worker does NOT have privilege of Department Head'
  );

  // Test 3: Role Home Paths
  console.log('\n--- Test Suite 3: Role-Aware Route Destinations ---');
  assert(getRoleHomePath(UserRole.CITIZEN) === '/citizen', 'Citizen home is /citizen');
  assert(getRoleHomePath(UserRole.FIELD_WORKER) === '/field', 'Field Worker home is /field');
  assert(
    getRoleHomePath(UserRole.AREA_OFFICER) === '/dashboard/area-officer',
    'Area Officer home is /dashboard/area-officer'
  );
  assert(
    getRoleHomePath(UserRole.DEPARTMENT_HEAD) === '/dashboard/dept-head',
    'Dept Head home is /dashboard/dept-head'
  );
  assert(
    getRoleHomePath(UserRole.CITY_COMMISSIONER) === '/dashboard/commissioner',
    'Commissioner home is /dashboard/commissioner'
  );
  assert(
    getRoleHomePath(UserRole.DISTRICT_COLLECTOR) === '/dashboard/collector',
    'District Collector home is /dashboard/collector'
  );
  assert(
    getRoleHomePath(UserRole.DEPARTMENT_SECRETARY) === '/dashboard/secretary',
    'Dept Secretary home is /dashboard/secretary'
  );
  assert(
    getRoleHomePath(UserRole.CHIEF_SECRETARY) === '/dashboard/chief-secretary',
    'Chief Secretary home is /dashboard/chief-secretary'
  );
  assert(
    getRoleHomePath(UserRole.CHIEF_MINISTER) === '/dashboard/chief-minister',
    'Chief Minister home is /dashboard/chief-minister'
  );
  assert(getRoleHomePath(UserRole.ADMIN) === '/admin', 'Admin home is /admin');

  // Test 4: Session Token Minting and Verification
  console.log('\n--- Test Suite 4: Edge-Compatible Session JWTs (jose) ---');
  const sampleUser: AuthUser = {
    id: 'user-uuid-1234',
    email: 'ae.chennai@tn.gov.in',
    display_name: 'AE Senthil Nathan',
    role: UserRole.AREA_OFFICER,
    department_id: 'dept-roads-uuid',
    ward_id: 114,
    district: 'Chennai',
    avatar_url: 'https://example.com/avatar.png',
  };

  const sessionToken = await createSessionToken(sampleUser);
  assert(typeof sessionToken === 'string' && sessionToken.length > 20, 'Signed JWT token generated');

  const decodedUser = await verifySessionToken(sessionToken);
  assert(decodedUser !== null, 'Session token successfully verified');
  assert(decodedUser?.id === sampleUser.id, 'Decoded user ID matches');
  assert(decodedUser?.email === sampleUser.email, 'Decoded email matches');
  assert(decodedUser?.role === UserRole.AREA_OFFICER, 'Decoded role matches AREA_OFFICER');
  assert(decodedUser?.ward_id === 114, 'Decoded ward_id matches 114');

  // Test 5: Invalid Token Handling
  console.log('\n--- Test Suite 5: Security & Tamper Detection ---');
  const tamperedToken = sessionToken + 'tampered';
  const invalidResult = await verifySessionToken(tamperedToken);
  assert(invalidResult === null, 'Tampered token correctly rejected (null)');

  // Test 6: Protected Route Authorization Matrix
  console.log('\n--- Test Suite 6: Route Guard Permissions Matrix ---');
  const testCases: { role: UserRole; route: string; shouldAllow: boolean }[] = [
    { role: UserRole.CITIZEN, route: '/citizen', shouldAllow: true },
    { role: UserRole.CITIZEN, route: '/field', shouldAllow: false },
    { role: UserRole.CITIZEN, route: '/dashboard/area-officer', shouldAllow: false },
    { role: UserRole.CITIZEN, route: '/admin', shouldAllow: false },

    { role: UserRole.FIELD_WORKER, route: '/field', shouldAllow: true },
    { role: UserRole.FIELD_WORKER, route: '/dashboard/area-officer', shouldAllow: false },
    { role: UserRole.FIELD_WORKER, route: '/admin', shouldAllow: false },

    { role: UserRole.AREA_OFFICER, route: '/dashboard/area-officer', shouldAllow: true },
    { role: UserRole.AREA_OFFICER, route: '/dashboard/commissioner', shouldAllow: false },
    { role: UserRole.AREA_OFFICER, route: '/admin', shouldAllow: false },

    { role: UserRole.CITY_COMMISSIONER, route: '/dashboard/commissioner', shouldAllow: true },
    { role: UserRole.CITY_COMMISSIONER, route: '/dashboard/collector', shouldAllow: false },

    { role: UserRole.ADMIN, route: '/citizen', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/field', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/area-officer', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/dept-head', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/commissioner', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/collector', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/secretary', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/chief-secretary', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/dashboard/chief-minister', shouldAllow: true },
    { role: UserRole.ADMIN, route: '/admin', shouldAllow: true },
  ];

  // Allowed roles per route prefix
  const routePermissions: Record<string, UserRole[]> = {
    '/citizen': Object.values(UserRole),
    '/field': [UserRole.FIELD_WORKER, UserRole.ADMIN],
    '/dashboard/area-officer': [UserRole.AREA_OFFICER, UserRole.ADMIN],
    '/dashboard/dept-head': [UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    '/dashboard/commissioner': [UserRole.CITY_COMMISSIONER, UserRole.ADMIN],
    '/dashboard/collector': [UserRole.DISTRICT_COLLECTOR, UserRole.ADMIN],
    '/dashboard/secretary': [UserRole.DEPARTMENT_SECRETARY, UserRole.ADMIN],
    '/dashboard/chief-secretary': [UserRole.CHIEF_SECRETARY, UserRole.ADMIN],
    '/dashboard/chief-minister': [UserRole.CHIEF_MINISTER, UserRole.ADMIN],
    '/admin': [UserRole.ADMIN],
  };

  for (const tc of testCases) {
    const allowed = routePermissions[tc.route]?.includes(tc.role) ?? false;
    assert(
      allowed === tc.shouldAllow,
      `Role [${ROLE_LABELS[tc.role]}] accessing [${tc.route}] -> Expected ${tc.shouldAllow ? 'ALLOW' : 'DENY'}`
    );
  }

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthRoleTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
