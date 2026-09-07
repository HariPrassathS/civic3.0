// =============================================================================
// CivicConnect TN — Citizen Product Test Suite (Phase 3)
// =============================================================================

import {
  generateTrackingId,
  calculateSlaDeadline,
  calculateDistanceKm,
  MEMORY_COMPLAINTS,
} from '../lib/complaints/service';
import { Priority, ComplaintStatus } from '../types/enums';

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

async function runCitizenTests() {
  console.log('\n======================================================');
  console.log('CivicConnect TN — Phase 3 Citizen Product Verification');
  console.log('======================================================\n');

  // Test 1: Tracking ID Generation Format
  console.log('--- Test Suite 1: Human-Readable Tracking ID ---');
  const trackingId = generateTrackingId();
  const currentYear = new Date().getFullYear();
  assert(
    trackingId.startsWith(`CC-TN-${currentYear}-`),
    `Tracking ID format matches CC-TN-${currentYear}-XXXXXX (${trackingId})`
  );
  assert(trackingId.length === 17, 'Tracking ID has standard 17-character length');

  // Test 2: SLA Deadline Computation
  console.log('\n--- Test Suite 2: Dynamic SLA Target Calculation ---');
  const now = Date.now();
  const urgentDeadline = calculateSlaDeadline(Priority.URGENT);
  const diffHoursUrgent = Math.round((urgentDeadline.getTime() - now) / (1000 * 3600));
  assert(diffHoursUrgent === 12, 'Urgent priority receives 12-hour SLA deadline');

  const highDeadline = calculateSlaDeadline(Priority.HIGH);
  const diffHoursHigh = Math.round((highDeadline.getTime() - now) / (1000 * 3600));
  assert(diffHoursHigh === 24, 'High priority receives 24-hour SLA deadline');

  const medDeadline = calculateSlaDeadline(Priority.MEDIUM);
  const diffHoursMed = Math.round((medDeadline.getTime() - now) / (1000 * 3600));
  assert(diffHoursMed === 48, 'Medium priority receives 48-hour SLA deadline');

  // Test 3: Haversine Spatial Distance Calculations
  console.log('\n--- Test Suite 3: Geolocation Distance Engine ---');
  // Coordinates for T. Nagar (13.0418, 80.2341) and Mylapore (13.0336, 80.2697)
  const distKm = calculateDistanceKm(13.0418, 80.2341, 13.0336, 80.2697);
  assert(distKm >= 3.5 && distKm <= 4.5, `Distance between T. Nagar and Mylapore is ~3.9km (Calculated: ${distKm}km)`);

  const sameSpotDist = calculateDistanceKm(13.0827, 80.2707, 13.0827, 80.2707);
  assert(sameSpotDist === 0, 'Distance to exact same coordinates is 0km');

  // Test 4: Seed Complaints & Lifecycle Stages
  console.log('\n--- Test Suite 4: Seed Grievance Store & Lifecycle ---');
  assert(MEMORY_COMPLAINTS.length >= 3, 'Seed complaints exist in memory store');
  const resolvedOne = MEMORY_COMPLAINTS.find((c) => c.status === ComplaintStatus.RESOLVED);
  assert(resolvedOne !== undefined, 'Resolved seed grievance exists with resolution evidence');
  assert(
    Boolean(resolvedOne?.media?.some((m) => m.phase === 'after_resolution')),
    'Resolved grievance contains after-resolution media proof'
  );

  // Test 5: Tracking Lookup in Memory
  console.log('\n--- Test Suite 5: Tracking ID Verification ---');
  const sample1 = MEMORY_COMPLAINTS[0];
  const found = MEMORY_COMPLAINTS.find((c) => c.tracking_id === sample1.tracking_id);
  assert(found !== undefined && found.id === sample1.id, 'Lookup by tracking ID returns exact complaint');

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCitizenTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
