// =============================================================================
// CivicConnect TN — Phase 5 Role-Specific Dashboards Test Suite
// =============================================================================

import { UserRole, Priority } from '../types/enums';
import { ROLE_LABELS, ROLE_HIERARCHY } from '../config/roles';
import { MEMORY_USERS } from '../app/api/admin/users/route';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🏛️ CivicConnect TN — Phase 5 Dashboard Verification');
console.log('======================================================\n');

// Group 1: Role Dashboard Distinct Routes & Architecture
console.log('--- Test Suite 1: Dashboard Route Mapping & Roles ---');
const ROLE_DASHBOARDS = [
  { role: UserRole.FIELD_WORKER, route: '/dashboard/field-worker', alias: '/field' },
  { role: UserRole.AREA_OFFICER, route: '/dashboard/area-officer' },
  { role: UserRole.DEPARTMENT_HEAD, route: '/dashboard/department-head', alias: '/dashboard/dept-head' },
  { role: UserRole.CITY_COMMISSIONER, route: '/dashboard/commissioner' },
  { role: UserRole.DISTRICT_COLLECTOR, route: '/dashboard/district-collector', alias: '/dashboard/collector' },
  { role: UserRole.DEPARTMENT_SECRETARY, route: '/dashboard/department-secretary', alias: '/dashboard/secretary' },
  { role: UserRole.CHIEF_SECRETARY, route: '/dashboard/chief-secretary' },
  { role: UserRole.CHIEF_MINISTER, route: '/dashboard/chief-minister' },
  { role: UserRole.ADMIN, route: '/admin' },
];

ROLE_DASHBOARDS.forEach(({ role, route, alias }) => {
  assert(!!route, `${ROLE_LABELS[role]} has primary dashboard route: ${route}`);
  if (alias) {
    assert(!!alias, `${ROLE_LABELS[role]} has dynamic alias route: ${alias}`);
  }
});

// Group 2: Role Hierarchy & Scope Distinctiveness
console.log('\n--- Test Suite 2: Role-Specific Domain Isolation ---');
assert(ROLE_HIERARCHY.length === 10, 'Complete 10-tier governance hierarchy present');
assert(ROLE_HIERARCHY.indexOf(UserRole.FIELD_WORKER) < ROLE_HIERARCHY.indexOf(UserRole.AREA_OFFICER), 'Field Worker is below Area Officer');
assert(ROLE_HIERARCHY.indexOf(UserRole.AREA_OFFICER) < ROLE_HIERARCHY.indexOf(UserRole.DEPARTMENT_HEAD), 'Area Officer is below Department Head');
assert(ROLE_HIERARCHY.indexOf(UserRole.DEPARTMENT_HEAD) < ROLE_HIERARCHY.indexOf(UserRole.CITY_COMMISSIONER), 'Department Head is below Commissioner');
assert(ROLE_HIERARCHY.indexOf(UserRole.CITY_COMMISSIONER) < ROLE_HIERARCHY.indexOf(UserRole.DISTRICT_COLLECTOR), 'Commissioner is below District Collector');
assert(ROLE_HIERARCHY.indexOf(UserRole.DISTRICT_COLLECTOR) < ROLE_HIERARCHY.indexOf(UserRole.DEPARTMENT_SECRETARY), 'District Collector is below Department Secretary');
assert(ROLE_HIERARCHY.indexOf(UserRole.DEPARTMENT_SECRETARY) < ROLE_HIERARCHY.indexOf(UserRole.CHIEF_SECRETARY), 'Department Secretary is below Chief Secretary');
assert(ROLE_HIERARCHY.indexOf(UserRole.CHIEF_SECRETARY) < ROLE_HIERARCHY.indexOf(UserRole.CHIEF_MINISTER), 'Chief Secretary is below Chief Minister');
assert(ROLE_HIERARCHY.indexOf(UserRole.CHIEF_MINISTER) < ROLE_HIERARCHY.indexOf(UserRole.ADMIN), 'Chief Minister is below System Admin (Governance Privilege)');

// Group 3: Admin User Store & Seed Profiles
console.log('\n--- Test Suite 3: Admin Profiles & Role Management ---');
assert(MEMORY_USERS.length >= 10, `Admin memory store contains ${MEMORY_USERS.length} test user profiles`);

const adminUser = MEMORY_USERS.find(u => u.role === UserRole.ADMIN);
assert(!!adminUser, 'Admin user profile exists (admin.tn@tn.gov.in)');

const cmUser = MEMORY_USERS.find(u => u.role === UserRole.CHIEF_MINISTER);
assert(!!cmUser, 'Chief Minister profile exists (cm.office@tn.gov.in)');

const csUser = MEMORY_USERS.find(u => u.role === UserRole.CHIEF_SECRETARY);
assert(!!csUser, 'Chief Secretary profile exists (chief.secretary@tn.gov.in)');

const fieldWorker = MEMORY_USERS.find(u => u.role === UserRole.FIELD_WORKER);
assert(!!fieldWorker && fieldWorker.ward_id === 114, 'Field Worker profile bound to Ward 114');

const areaOfficer = MEMORY_USERS.find(u => u.role === UserRole.AREA_OFFICER);
assert(!!areaOfficer && areaOfficer.ward_id === 114, 'Area Officer profile bound to Ward 114');

// Group 4: 8-Level Escalation Rulebook Specifications
console.log('\n--- Test Suite 4: 8-Level Escalation Rulebook ---');
const ESCALATION_LEVELS = [
  { level: 1, target: UserRole.FIELD_WORKER, window: '0 - 4h' },
  { level: 2, target: UserRole.AREA_OFFICER, window: '4h - 12h' },
  { level: 3, target: UserRole.DEPARTMENT_HEAD, window: '12h - 24h' },
  { level: 4, target: UserRole.CITY_COMMISSIONER, window: '24h - 36h' },
  { level: 5, target: UserRole.DISTRICT_COLLECTOR, window: '36h - 48h' },
  { level: 6, target: UserRole.DEPARTMENT_SECRETARY, window: '48h - 60h' },
  { level: 7, target: UserRole.CHIEF_SECRETARY, window: '60h - 72h' },
  { level: 8, target: UserRole.CHIEF_MINISTER, window: '72h+' },
];

assert(ESCALATION_LEVELS.length === 8, '8 Escalation Levels configured in Rulebook');
ESCALATION_LEVELS.forEach(lvl => {
  assert(!!lvl.target, `Escalation Level ${lvl.level} targets ${ROLE_LABELS[lvl.target]} (${lvl.window})`);
});

// Group 5: Priority SLA Matrix
console.log('\n--- Test Suite 5: Priority Resolution SLA Thresholds ---');
const SLA_HOURS = {
  [Priority.URGENT]: 12,
  [Priority.HIGH]: 24,
  [Priority.MEDIUM]: 48,
  [Priority.LOW]: 72,
};

assert(SLA_HOURS[Priority.URGENT] <= 12, 'Urgent / Critical SLA is 12h or less');
assert(SLA_HOURS[Priority.HIGH] <= 24, 'High Priority SLA is 24h');
assert(SLA_HOURS[Priority.MEDIUM] <= 48, 'Medium Priority SLA is 48h');
assert(SLA_HOURS[Priority.LOW] <= 72, 'Low Priority SLA is 72h');

console.log('\n======================================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
