// =============================================================================
// CivicConnect TN — Phase 6 SLA & Escalation Engine Test Suite
// =============================================================================

import { Priority, ComplaintStatus, UserRole, ComplaintSource } from '../types/enums';
import {
  DEFAULT_SLA_HOURS,
  getResolutionHours,
  computeSlaDeadline,
  isSlaBreached,
  isSlaNearBreach,
  setMemorySlaConfig,
} from '../lib/sla/engine';
import {
  ESCALATION_TIERS,
  escalateComplaint,
  processSlaBreaches,
  MEMORY_ESCALATION_LOGS,
  MEMORY_NOTIFICATIONS,
} from '../lib/sla/escalation';
import type { Complaint } from '../types/database';
import { MEMORY_COMPLAINTS } from '../lib/complaints/service';

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

async function runTests() {
  console.log('\n=============================================================================');
  console.log('🏛️ CivicConnect TN — Phase 6 SLA & Escalation Engine Test Suite');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // Test Suite 1: Priority SLA Defaults & Dynamic Calculation
  // ---------------------------------------------------------------------------
  console.log('--- Test Suite 1: Priority SLA Defaults & Calculations ---');
  assert(DEFAULT_SLA_HOURS[Priority.URGENT] === 12, 'URGENT default SLA is 12 hours');
  assert(DEFAULT_SLA_HOURS[Priority.HIGH] === 24, 'HIGH default SLA is 24 hours');
  assert(DEFAULT_SLA_HOURS[Priority.MEDIUM] === 48, 'MEDIUM default SLA is 48 hours');
  assert(DEFAULT_SLA_HOURS[Priority.LOW] === 72, 'LOW default SLA is 72 hours');

  const urgentHours = await getResolutionHours(Priority.URGENT);
  assert(urgentHours === 12, 'Resolves urgent priority resolution hours');

  const highHours = await getResolutionHours(Priority.HIGH);
  assert(highHours === 24, 'Resolves high priority resolution hours');

  const baseTime = new Date('2026-09-05T10:00:00.000Z');
  const deadline = await computeSlaDeadline(Priority.HIGH, null, null, baseTime);
  assert(
    deadline.toISOString() === new Date('2026-09-06T10:00:00.000Z').toISOString(),
    'HIGH deadline is exactly 24 hours from base time'
  );

  // ---------------------------------------------------------------------------
  // Test Suite 2: Configurable SLA Overrides & Category Specific Rules
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: Configurable SLA Overrides ---');
  // Water contamination category has 6h override in memory store
  const waterContamHours = await getResolutionHours(
    Priority.URGENT,
    'c0000001-0000-0000-0000-000000000006'
  );
  assert(waterContamHours === 6, 'Custom category override resolved (6h for water contamination)');

  // Dynamically set new SLA rule
  const customConfig = setMemorySlaConfig({
    priority: Priority.LOW,
    resolution_hours: 36,
    category_id: 'cat-custom-test',
  });
  assert(customConfig.resolution_hours === 36, 'Dynamically registered new SLA config');

  const updatedHours = await getResolutionHours(Priority.LOW, 'cat-custom-test');
  assert(updatedHours === 36, 'Dynamic category SLA rule immediately active');

  // Breach check utility
  const pastDeadline = new Date(Date.now() - 3600 * 1000).toISOString();
  const futureDeadline = new Date(Date.now() + 3600 * 1000).toISOString();
  assert(isSlaBreached(pastDeadline), 'Detects breached deadline in the past');
  assert(!isSlaBreached(futureDeadline), 'Future deadline is not breached');

  // Near-breach warning threshold (80%)
  const startIso = new Date(Date.now() - 9 * 3600 * 1000).toISOString(); // 9h elapsed
  const endIso = new Date(Date.now() + 1 * 3600 * 1000).toISOString(); // 10h total -> 90% elapsed
  assert(isSlaNearBreach(startIso, endIso, 80), 'Detects near breach at 90% elapsed (> 80% threshold)');

  // ---------------------------------------------------------------------------
  // Test Suite 3: 8-Level Statutory Escalation Rulebook
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: 8-Level Escalation Rulebook Verification ---');
  assert(Object.keys(ESCALATION_TIERS).length === 8, 'Exact 8 statutory escalation levels defined');
  assert(ESCALATION_TIERS[1].role === UserRole.FIELD_WORKER, 'Level 1 maps to Field Worker');
  assert(ESCALATION_TIERS[2].role === UserRole.AREA_OFFICER, 'Level 2 maps to Area Officer (AE)');
  assert(ESCALATION_TIERS[3].role === UserRole.DEPARTMENT_HEAD, 'Level 3 maps to Department Head (EE)');
  assert(ESCALATION_TIERS[4].role === UserRole.CITY_COMMISSIONER, 'Level 4 maps to City Commissioner');
  assert(ESCALATION_TIERS[5].role === UserRole.DISTRICT_COLLECTOR, 'Level 5 maps to District Collector');
  assert(ESCALATION_TIERS[6].role === UserRole.DEPARTMENT_SECRETARY, 'Level 6 maps to Department Secretary');
  assert(ESCALATION_TIERS[7].role === UserRole.CHIEF_SECRETARY, 'Level 7 maps to Chief Secretary');
  assert(ESCALATION_TIERS[8].role === UserRole.CHIEF_MINISTER, 'Level 8 maps to Chief Minister Special Cell');

  // ---------------------------------------------------------------------------
  // Test Suite 4: Single Complaint Escalation Execution & Audit Trail
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: Single Complaint Escalation Execution ---');
  const testComplaint: Complaint = {
    id: `test-cmp-sla-${Date.now()}`,
    tracking_id: 'CC-TN-2026-990011',
    citizen_id: 'dev-user-citizen',
    category_id: 'cat-roads-1',
    department_id: 'dept-roads',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Hazardous cave-in on Mount Road near Gemini Flyover',
    description: 'Extensive road collapse endangering motorists.',
    location: null,
    address: 'Mount Road, Chennai',
    ward: 114,
    district: 'Chennai',
    source: ComplaintSource.TEXT,
    language: 'en',
    is_public: true,
    sla_deadline: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    sla_breached: false,
    escalation_level: 0,
    ai_category_confidence: 0.95,
    ai_priority_confidence: 0.95,
    ai_sentiment: 'Urgent',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  };

  MEMORY_COMPLAINTS.push(testComplaint);

  const initialLogCount = MEMORY_ESCALATION_LOGS.length;
  const initialNotifCount = MEMORY_NOTIFICATIONS.length;

  const esc1 = await escalateComplaint(testComplaint, {
    reason: 'SLA breached after 24h road repair window.',
  });

  assert(esc1.success === true, 'Level 1 escalation succeeded');
  assert(esc1.previousLevel === 0, 'Previous level was 0');
  assert(esc1.newLevel === 1, 'New level is 1 (Field Worker)');
  assert(esc1.targetRole === UserRole.FIELD_WORKER, 'Target role is Field Worker');
  assert(new Date(esc1.newDeadline).getTime() > Date.now(), 'Generated new SLA deadline in the future');
  assert(MEMORY_ESCALATION_LOGS.length > initialLogCount, 'Escalation log record created');
  assert(MEMORY_NOTIFICATIONS.length > initialNotifCount, 'In-app notification created');

  // Verify complaint state updated
  const updatedComplaint = MEMORY_COMPLAINTS.find((c) => c.id === testComplaint.id);
  assert(updatedComplaint?.escalation_level === 1, 'Complaint in-memory escalation_level is 1');
  assert(updatedComplaint?.status === ComplaintStatus.ESCALATED, 'Complaint status updated to ESCALATED');
  assert(updatedComplaint?.sla_breached === true, 'Complaint sla_breached marked true');

  // ---------------------------------------------------------------------------
  // Test Suite 5: Multi-Tier Escalation Progression to Apex Level 8
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: Multi-Tier Escalation Progression ---');
  if (updatedComplaint) {
    // Elevate Level 1 -> Level 2 (Area Officer)
    const esc2 = await escalateComplaint(updatedComplaint);
    assert(esc2.newLevel === 2 && esc2.targetRole === UserRole.AREA_OFFICER, 'Elevated to Level 2 (Area Officer)');

    // Elevate Level 2 -> Level 3 (Department Head)
    const esc3 = await escalateComplaint(updatedComplaint);
    assert(esc3.newLevel === 3 && esc3.targetRole === UserRole.DEPARTMENT_HEAD, 'Elevated to Level 3 (Department Head)');

    // Elevate Level 3 -> Level 4 (Commissioner)
    const esc4 = await escalateComplaint(updatedComplaint);
    assert(esc4.newLevel === 4 && esc4.targetRole === UserRole.CITY_COMMISSIONER, 'Elevated to Level 4 (City Commissioner)');

    // Elevate Level 4 -> Level 5 (District Collector)
    const esc5 = await escalateComplaint(updatedComplaint);
    assert(esc5.newLevel === 5 && esc5.targetRole === UserRole.DISTRICT_COLLECTOR, 'Elevated to Level 5 (District Collector)');

    // Elevate Level 5 -> Level 6 (Department Secretary)
    const esc6 = await escalateComplaint(updatedComplaint);
    assert(esc6.newLevel === 6 && esc6.targetRole === UserRole.DEPARTMENT_SECRETARY, 'Elevated to Level 6 (Department Secretary)');

    // Elevate Level 6 -> Level 7 (Chief Secretary)
    const esc7 = await escalateComplaint(updatedComplaint);
    assert(esc7.newLevel === 7 && esc7.targetRole === UserRole.CHIEF_SECRETARY, 'Elevated to Level 7 (Chief Secretary)');

    // Elevate Level 7 -> Level 8 (Chief Minister)
    const esc8 = await escalateComplaint(updatedComplaint);
    assert(esc8.newLevel === 8 && esc8.targetRole === UserRole.CHIEF_MINISTER, 'Elevated to Level 8 (Chief Minister)');

    // Attempt to exceed Level 8 ceiling
    const escOver = await escalateComplaint(updatedComplaint);
    assert(escOver.success === false, 'Refuses to escalate past Level 8 ceiling');
    assert(escOver.newLevel === 8, 'Maintains Level 8 ceiling');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 6: Terminal Complaint Isolation (No Escalation on Resolved/Closed)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 6: Terminal Complaint Isolation ---');
  const resolvedComplaint: Complaint = {
    ...testComplaint,
    id: `test-cmp-resolved-${Date.now()}`,
    status: ComplaintStatus.RESOLVED,
    sla_deadline: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  };
  const escResolved = await escalateComplaint(resolvedComplaint);
  assert(escResolved.success === false, 'Cannot escalate RESOLVED complaint');

  const closedComplaint: Complaint = {
    ...testComplaint,
    id: `test-cmp-closed-${Date.now()}`,
    status: ComplaintStatus.CLOSED,
    sla_deadline: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  };
  const escClosed = await escalateComplaint(closedComplaint);
  assert(escClosed.success === false, 'Cannot escalate CLOSED complaint');

  const rejectedComplaint: Complaint = {
    ...testComplaint,
    id: `test-cmp-rejected-${Date.now()}`,
    status: ComplaintStatus.REJECTED,
    sla_deadline: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  };
  const escRejected = await escalateComplaint(rejectedComplaint);
  assert(escRejected.success === false, 'Cannot escalate REJECTED complaint');

  // ---------------------------------------------------------------------------
  // Test Suite 7: Batch SLA Sweep & Idempotency
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 7: Batch SLA Sweep & Idempotency ---');
  // Add a breached ticket ready for sweep
  const breachedTicket: Complaint = {
    ...testComplaint,
    id: `test-cmp-batch-${Date.now()}`,
    tracking_id: 'CC-TN-2026-778899',
    status: ComplaintStatus.ASSIGNED,
    escalation_level: 0,
    sla_deadline: new Date(Date.now() - 10000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 mins ago
  };
  MEMORY_COMPLAINTS.push(breachedTicket);

  const batchResult1 = await processSlaBreaches({ debounceMinutes: 5 });
  assert(batchResult1.scanned > 0, `Scanned ${batchResult1.scanned} candidates in batch`);
  assert(batchResult1.escalated >= 1, `Escalated ${batchResult1.escalated} breached ticket(s)`);

  // Immediate second run should skip recent ticket due to debounce guard (idempotency)
  const batchResult2 = await processSlaBreaches({ debounceMinutes: 5 });
  assert(batchResult2.skipped >= 1 || batchResult2.escalated === 0, 'Idempotent: Skips tickets within debounce window');

  console.log('\n=============================================================================');
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
  console.log('=============================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal error running Phase 6 tests:', err);
  process.exit(1);
});
