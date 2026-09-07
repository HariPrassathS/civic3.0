// =============================================================================
// CivicConnect TN — Supabase Realtime & Notification Engine Test Suite
// =============================================================================
// Run with: npx tsx scripts/test-notifications-realtime.ts

import {
  NotificationChannel,
  NotificationEventType,
  DeliveryStatus,
} from '../lib/notifications/types';
import { clearDedupCache } from '../lib/notifications/dedup';
import {
  getUserPreferences,
  updateUserPreferences,
  resetPreferencesStore,
} from '../lib/notifications/preferences';
import { dispatchNotification } from '../lib/notifications/dispatch';
import { NotificationHub } from '../lib/notifications/service';
import { subscribeToLocalRealtime } from '../lib/notifications/providers/realtime';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖\x1b[0m ${testName} ${details ? `— ${details}` : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('  CIVICCONNECT TN — PHASE 14 NOTIFICATION & REALTIME TEST SUITE');
  console.log('================================================================\n');

  clearDedupCache();
  resetPreferencesStore();

  const testUserId = 'test-citizen-user-001';
  const testComplaint = {
    id: 'cmp-test-notif-101',
    tracking_id: 'CC-TN-2026-991201',
    title: 'Severe Stormwater Backflow on Usman Road',
    citizen_id: testUserId,
    status: 'created',
    priority: 'urgent',
    ward: 119,
    district: 'Chennai',
    category_name: 'Drainage & Sewage',
    department_name: 'Drainage & Sewage',
    sla_deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  };

  // ---------------------------------------------------------------------------
  // 1. ALL 10 COMPLAINT LIFECYCLE EVENTS DISPATCH
  // ---------------------------------------------------------------------------
  console.log('[TEST GROUP 1] 10 Lifecycle Events Dispatch Verification');

  // 1. Complaint Submitted
  clearDedupCache();
  const subRes = await NotificationHub.onComplaintSubmitted(testComplaint);
  assert(subRes.success, 'Event 1: onComplaintSubmitted successfully dispatches');
  assert(subRes.notification?.type === NotificationEventType.COMPLAINT_SUBMITTED, 'Event 1: Sets correct COMPLAINT_SUBMITTED type');

  // 2. Complaint Assigned
  clearDedupCache();
  const assignRes = await NotificationHub.onComplaintAssigned({
    complaint: testComplaint,
    assigneeId: 'officer-user-002',
    assigneeName: 'GCC Drainage Division',
    assignedByRole: 'area_officer',
  });
  assert(assignRes.citizenResult.success && assignRes.officerResult.success, 'Event 2: onComplaintAssigned dispatches to both citizen & officer');

  // 3. Status Changed
  clearDedupCache();
  const statusRes = await NotificationHub.onStatusChanged({
    complaint: testComplaint,
    previousStatus: 'created',
    newStatus: 'in_progress',
    actorRole: 'field_worker',
    notes: 'Excavation crew deployed.',
  });
  assert(statusRes.success, 'Event 3: onStatusChanged successfully dispatches');

  // 4. SLA Approaching
  clearDedupCache();
  const slaWarnRes = await NotificationHub.onSlaApproaching({
    complaint: testComplaint,
    recipientUserId: 'officer-user-002',
    hoursRemaining: 3,
  });
  assert(slaWarnRes.success, 'Event 4: onSlaApproaching successfully dispatches');
  assert(slaWarnRes.notification?.type === NotificationEventType.SLA_WARNING, 'Event 4: Sets SLA_WARNING type');

  // 5. SLA Breached
  clearDedupCache();
  const slaBreachRes = await NotificationHub.onSlaBreached({
    complaint: testComplaint,
    recipientUserId: 'officer-user-002',
  });
  assert(slaBreachRes.success, 'Event 5: onSlaBreached successfully dispatches');

  // 6. Complaint Escalated
  clearDedupCache();
  const escRes = await NotificationHub.onComplaintEscalated({
    complaint: testComplaint,
    escalatedToUserId: 'dept-head-003',
    escalationLevel: 2,
    escalatedToRole: 'District Collector',
  });
  assert(escRes.success, 'Event 6: onComplaintEscalated successfully dispatches');

  // 7. Complaint Resolved
  clearDedupCache();
  const resolvedRes = await NotificationHub.onComplaintResolved({
    complaint: testComplaint,
    resolutionNotes: 'Micro-canal cleared and desilted.',
  });
  assert(resolvedRes.success, 'Event 7: onComplaintResolved successfully dispatches');

  // 8. Complaint Reopened
  clearDedupCache();
  const reopenRes = await NotificationHub.onComplaintReopened({
    complaint: testComplaint,
    recipientUserId: 'officer-user-002',
    reason: 'Water stagnation still visible.',
  });
  assert(reopenRes.success, 'Event 8: onComplaintReopened successfully dispatches');

  // 9. Complaint Verified
  clearDedupCache();
  const verifyRes = await NotificationHub.onComplaintVerified({
    complaint: testComplaint,
    verificationResult: 'Verified & Approved',
    verifiedByRole: 'Quality Audit Inspector',
  });
  assert(verifyRes.success, 'Event 9: onComplaintVerified successfully dispatches');

  // 10. Complaint Closed
  clearDedupCache();
  const closedRes = await NotificationHub.onComplaintClosed(testComplaint);
  assert(closedRes.success, 'Event 10: onComplaintClosed successfully dispatches');

  // ---------------------------------------------------------------------------
  // 2. 5 DELIVERY CHANNELS & OPTIONAL PROVIDER RESILIENCE
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 2] 5 Delivery Channels & Zero-Crash Resilience');

  clearDedupCache();
  const multiChannelRes = await dispatchNotification({
    userId: 'resilience-user-001',
    complaintId: testComplaint.id,
    type: NotificationEventType.STATUS_CHANGED,
    title: 'Multi-Channel Resilience Test',
    body: 'Testing all 5 delivery providers under missing config conditions.',
    channels: [
      NotificationChannel.IN_APP,
      NotificationChannel.REALTIME,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
      NotificationChannel.PUSH,
    ],
  });

  assert(multiChannelRes.success, 'Multi-channel dispatch completes without throwing errors');
  assert(
    multiChannelRes.deliveryResults[NotificationChannel.IN_APP]?.status === DeliveryStatus.DELIVERED,
    'In-App channel delivers reliably'
  );
  assert(
    multiChannelRes.deliveryResults[NotificationChannel.REALTIME]?.status === DeliveryStatus.DELIVERED,
    'Realtime channel broadcasts reliably'
  );
  assert(
    multiChannelRes.deliveryResults[NotificationChannel.EMAIL]?.status === DeliveryStatus.SIMULATED_NO_CONFIG ||
      multiChannelRes.deliveryResults[NotificationChannel.EMAIL]?.status === DeliveryStatus.SENT,
    'Email channel gracefully handles missing or active configuration'
  );
  assert(
    multiChannelRes.deliveryResults[NotificationChannel.SMS]?.status === DeliveryStatus.SIMULATED_NO_CONFIG ||
      multiChannelRes.deliveryResults[NotificationChannel.SMS]?.status === DeliveryStatus.SENT,
    'SMS channel gracefully handles missing or active configuration'
  );
  assert(
    multiChannelRes.deliveryResults[NotificationChannel.PUSH]?.status === DeliveryStatus.SIMULATED_NO_CONFIG ||
      multiChannelRes.deliveryResults[NotificationChannel.PUSH]?.status === DeliveryStatus.SENT,
    'Push channel gracefully handles missing or active configuration'
  );

  // ---------------------------------------------------------------------------
  // 3. DEDUPLICATION SLIDING WINDOW
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 3] Deduplication Sliding Window Suppression');

  clearDedupCache();
  const firstSend = await dispatchNotification({
    userId: 'dedup-test-user',
    complaintId: 'cmp-dedup-1',
    type: NotificationEventType.SLA_WARNING,
    title: 'SLA Warning Alert',
    body: 'First warning message.',
  });
  assert(firstSend.isDeduplicated === false, 'First notification dispatches normally');

  // Immediate second duplicate with identical attributes
  const secondSend = await dispatchNotification({
    userId: 'dedup-test-user',
    complaintId: 'cmp-dedup-1',
    type: NotificationEventType.SLA_WARNING,
    title: 'SLA Warning Alert',
    body: 'Duplicate warning message within cooldown window.',
  });
  assert(secondSend.isDeduplicated === true, 'Consecutive duplicate notification is suppressed');
  assert(
    secondSend.deliveryResults.all?.status === DeliveryStatus.SKIPPED_DEDUPLICATED,
    'Marks delivery result as SKIPPED_DEDUPLICATED'
  );

  // Different complaint ID should NOT be blocked
  const differentComplaintSend = await dispatchNotification({
    userId: 'dedup-test-user',
    complaintId: 'cmp-dedup-2',
    type: NotificationEventType.SLA_WARNING,
    title: 'SLA Warning Alert',
    body: 'Different complaint message.',
  });
  assert(differentComplaintSend.isDeduplicated === false, 'Different complaint ID is not blocked');

  // ---------------------------------------------------------------------------
  // 4. USER NOTIFICATION PREFERENCES
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 4] User Notification Preferences Enforcement');

  const prefUserId = 'pref-custom-user-001';
  clearDedupCache();

  // Disable SMS channel and disable SLA_WARNING event
  await updateUserPreferences(prefUserId, {
    channels: {
      in_app: true,
      realtime: true,
      email: true,
      sms: false, // Opted out of SMS
      push: true,
    },
    events: {
      [NotificationEventType.COMPLAINT_SUBMITTED]: true,
      [NotificationEventType.ASSIGNED]: true,
      [NotificationEventType.STATUS_CHANGED]: true,
      [NotificationEventType.SLA_WARNING]: false, // Opted out of SLA warnings
      [NotificationEventType.SLA_BREACHED]: true,
      [NotificationEventType.ESCALATED]: true,
      [NotificationEventType.RESOLVED]: true,
      [NotificationEventType.REOPENED]: true,
      [NotificationEventType.VERIFIED]: true,
      [NotificationEventType.CLOSED]: true,
    },
  });

  const updatedPrefs = await getUserPreferences(prefUserId);
  assert(updatedPrefs.channels.sms === false, 'User preference records SMS disabled');
  assert(updatedPrefs.events[NotificationEventType.SLA_WARNING] === false, 'User preference records SLA_WARNING disabled');

  // Dispatch SLA Warning to user who opted out of SLA_WARNING
  const optOutEventRes = await dispatchNotification({
    userId: prefUserId,
    complaintId: 'cmp-pref-1',
    type: NotificationEventType.SLA_WARNING,
    title: 'SLA Warning',
    body: 'Should be skipped due to event opt-out.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  });

  assert(
    optOutEventRes.deliveryResults[NotificationChannel.IN_APP]?.status === DeliveryStatus.SKIPPED_PREFERENCE,
    'Skips in-app delivery when user opted out of event type'
  );

  // Dispatch Status Changed (enabled event) with SMS channel requested (opted out channel)
  clearDedupCache();
  const optOutChannelRes = await dispatchNotification({
    userId: prefUserId,
    complaintId: 'cmp-pref-1',
    type: NotificationEventType.STATUS_CHANGED,
    title: 'Status Changed',
    body: 'Should deliver in-app but skip SMS.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
  });

  assert(
    optOutChannelRes.deliveryResults[NotificationChannel.IN_APP]?.status === DeliveryStatus.DELIVERED,
    'Delivers to enabled in-app channel'
  );
  assert(
    optOutChannelRes.deliveryResults[NotificationChannel.SMS]?.status === DeliveryStatus.SKIPPED_PREFERENCE,
    'Skips SMS channel when user opted out in preferences'
  );

  // ---------------------------------------------------------------------------
  // 5. REALTIME EVENT BUS RECEPTION
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 5] Realtime Event Bus Listener & Reception');

  clearDedupCache();
  let receivedRealtimeNotif: any = null;

  const unsubscribe = subscribeToLocalRealtime((notif) => {
    receivedRealtimeNotif = notif;
  });

  await dispatchNotification({
    userId: 'realtime-listener-user',
    complaintId: 'cmp-rt-1',
    type: NotificationEventType.RESOLVED,
    title: 'Realtime Live Pulse',
    body: 'Testing instant event reception on client subscriber.',
    channels: [NotificationChannel.REALTIME],
  });

  assert(receivedRealtimeNotif !== null, 'Realtime subscriber receives live notification');
  assert(receivedRealtimeNotif?.type === NotificationEventType.RESOLVED, 'Realtime payload contains correct event type');
  assert(receivedRealtimeNotif?.title === 'Realtime Live Pulse', 'Realtime payload contains title');

  unsubscribe();

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error in notification test suite:', err);
  process.exit(1);
});
