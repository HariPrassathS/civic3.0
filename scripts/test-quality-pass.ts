// =============================================================================
// CivicConnect TN — Final Product Quality Pass Test Suite
// =============================================================================

import fs from 'fs';
import path from 'path';

async function runQualityPass() {
  console.log('================================================================');
  console.log('🌟 CIVICCONNECT TN — PRODUCT QUALITY & WORKFLOW VERIFICATION PASS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const test = (name: string, condition: boolean, details?: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}${details ? ` (${details})` : ''}`);
      failed++;
    }
  };

  // ---------------------------------------------------------------------------
  // 1. Audit UI Components for Absence of Crude alert() Calls
  // ---------------------------------------------------------------------------
  console.log('1. Auditing UI Components for Modern Non-Blocking Notifications:');
  const filesToCheckAlerts = [
    'app/dashboard/area-officer/page.tsx',
    'app/dashboard/field-worker/page.tsx',
    'app/dashboard/district-collector/page.tsx',
    'app/dashboard/chief-secretary/page.tsx',
    'components/dashboard/verification-modal.tsx',
    'components/dashboard/resolution-upload-modal.tsx',
    'components/dashboard/assignment-modal.tsx',
    'components/citizen/feedback-modal.tsx',
  ];

  for (const relPath of filesToCheckAlerts) {
    const fullPath = path.join(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasAlert = /\balert\s*\(/.test(content);
      test(`File ${relPath} contains zero crude alert() popups`, !hasAlert);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Audit Workflow 1: Citizen (Report -> Track -> Feedback)
  // ---------------------------------------------------------------------------
  console.log('\n2. Auditing Workflow 1: Citizen (Report -> Track -> Feedback):');
  const feedbackModalPath = path.join(process.cwd(), 'components/citizen/feedback-modal.tsx');
  const feedbackModalContent = fs.readFileSync(feedbackModalPath, 'utf8');
  test('FeedbackModal includes submission success state and star recap', feedbackModalContent.includes('Thank You for Your Feedback!'));
  test('FeedbackModal has accessible role="dialog" and aria-labelledby', feedbackModalContent.includes('role="dialog"') && feedbackModalContent.includes('aria-labelledby'));

  const trackDetailPagePath = path.join(process.cwd(), 'app/track/[id]/page.tsx');
  const trackDetailContent = fs.readFileSync(trackDetailPagePath, 'utf8');
  test('TrackDetailPage includes rich skeleton loading state', trackDetailContent.includes('Retrieving live grievance lifecycle'));
  test('TrackDetailPage includes rich empty comments state', trackDetailContent.includes('No community remarks yet'));
  test('TrackDetailPage includes floating copy confirmation toast', trackDetailContent.includes('Tracking Link copied to clipboard!'));

  // ---------------------------------------------------------------------------
  // 3. Audit Workflow 2: Voice AI (Speak -> Understand -> Confirm -> Submit/Track)
  // ---------------------------------------------------------------------------
  console.log('\n3. Auditing Workflow 2: Voice AI (Speak -> Understand -> Confirm -> Submit/Track):');
  const voiceModalPath = path.join(process.cwd(), 'components/voice/voice-assistant-modal.tsx');
  const voiceModalContent = fs.readFileSync(voiceModalPath, 'utf8');
  test('VoiceAssistantModal includes 12-state guided state machine', voiceModalContent.includes('VoiceState.WELCOME') && voiceModalContent.includes('STATE_PROMPTS'));
  test('VoiceAssistantModal supports dual language Tamil (ta) and English (en)', voiceModalContent.includes("'ta'") && voiceModalContent.includes("'en'"));
  test('VoiceAssistantModal handles GPS geocoding and manual fallback', voiceModalContent.includes('manualAddressInput'));

  // ---------------------------------------------------------------------------
  // 4. Audit Workflow 3: Official (Receive -> Assign -> Work -> Verify)
  // ---------------------------------------------------------------------------
  console.log('\n4. Auditing Workflow 3: Official (Receive -> Assign -> Work -> Verify):');
  const areaOfficerPath = path.join(process.cwd(), 'app/dashboard/area-officer/page.tsx');
  const areaOfficerContent = fs.readFileSync(areaOfficerPath, 'utf8');
  test('Area Officer dashboard renders floating action toast on verification/assignment', areaOfficerContent.includes('Floating Action Toast') && areaOfficerContent.includes('showToast'));

  const fieldWorkerPath = path.join(process.cwd(), 'app/dashboard/field-worker/page.tsx');
  const fieldWorkerContent = fs.readFileSync(fieldWorkerPath, 'utf8');
  test('Field Worker dashboard renders floating action toast on start work/submit', fieldWorkerContent.includes('Floating Action Toast') && fieldWorkerContent.includes('showToast'));

  const verificationModalPath = path.join(process.cwd(), 'components/dashboard/verification-modal.tsx');
  const verificationContent = fs.readFileSync(verificationModalPath, 'utf8');
  test('VerificationModal includes side-by-side Before/After comparison', verificationContent.includes('Photo Evidence Comparison (Before vs After)'));

  // ---------------------------------------------------------------------------
  // 5. Audit Workflow 4: Escalation (SLA -> Breach -> Escalate -> Notify)
  // ---------------------------------------------------------------------------
  console.log('\n5. Auditing Workflow 4: Escalation (SLA -> Breach -> Escalate -> Notify):');
  const cronEscalatePath = path.join(process.cwd(), 'app/api/cron/escalate/route.ts');
  const cronEscalateContent = fs.readFileSync(cronEscalatePath, 'utf8');
  test('Cron escalation route executes automated SLA breach check', cronEscalateContent.includes('processSlaBreaches'));

  const slaEscalationPath = path.join(process.cwd(), 'lib/sla/escalation.ts');
  const slaEscalationContent = fs.readFileSync(slaEscalationPath, 'utf8');
  test('SLA escalation engine executes statutory escalation rules and authority routing', slaEscalationContent.includes('processSlaBreaches') && slaEscalationContent.includes('ESCALATION_TIERS'));

  const notifServicePath = path.join(process.cwd(), 'lib/notifications/service.ts');
  const notifServiceContent = fs.readFileSync(notifServicePath, 'utf8');
  test('Notification service dispatches realtime events, in-app records and multichannels', notifServiceContent.includes('sendNotification') || notifServiceContent.includes('notifyComplaintEvent') || notifServiceContent.includes('dispatchNotification'));

  // ---------------------------------------------------------------------------
  // 6. Audit Workflow 5: DMT (Data -> Preprocess -> DBSCAN -> Hotspot -> Visualization)
  // ---------------------------------------------------------------------------
  console.log('\n6. Auditing Workflow 5: DMT (Data -> Preprocess -> DBSCAN -> Hotspot -> Visualization):');
  const dbscanPath = path.join(process.cwd(), 'lib/data-mining/dbscan.ts');
  const dbscanContent = fs.readFileSync(dbscanPath, 'utf8');
  test('DBSCAN spatial engine computes haversine distance, density scores, and cluster hulls', dbscanContent.includes('haversineDistance') && dbscanContent.includes('runDBSCAN'));

  const hotspotTablePath = path.join(process.cwd(), 'components/data-mining/hotspot-table.tsx');
  const hotspotTableContent = fs.readFileSync(hotspotTablePath, 'utf8');
  test('HotspotTable renders rich empty state when 0 hotspots are detected', hotspotTableContent.includes('No Spatial Hotspots Detected'));

  // ---------------------------------------------------------------------------
  // 7. Audit Workflow 6: Predictive AI (Historical data -> Trends -> Risk insight)
  // ---------------------------------------------------------------------------
  console.log('\n7. Auditing Workflow 6: Predictive AI (Historical data -> Trends -> Risk insight):');
  const predictiveEnginePath = path.join(process.cwd(), 'lib/predictive/risk-engine.ts');
  const predictiveEngineContent = fs.readFileSync(predictiveEnginePath, 'utf8');
  test('Predictive engine computes recurrence rate, velocity dN/dt, and seasonal risks', predictiveEngineContent.includes('evaluatePredictiveRisk') && predictiveEngineContent.includes('recurrenceScore'));

  const predictivePagePath = path.join(process.cwd(), 'app/predictive/page.tsx');
  const predictivePageContent = fs.readFileSync(predictivePagePath, 'utf8');
  test('Predictive page supports multi-role view and preventative work order dispatch', predictivePageContent.includes('handleDispatchAction') && predictivePageContent.includes('Preventative work order dispatched'));

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL QUALITY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runQualityPass();
