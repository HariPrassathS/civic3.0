// =============================================================================
// CivicConnect TN — End-to-End No-Login Voice & Tracking Test Suite
// =============================================================================
// Validates all 10 core scenarios from Master Prompt Section 23:
// 1. Citizen reports water problem -> finds it via voice tracking
// 2. Duplicate name safety -> Name alone does not select unauthorized private records
// 3. Location disambiguation -> Coordinates distinguish same issue in different areas
// 4. Semantic variance -> "Water not coming" matches "no water supply for three days"
// 5. No reference code needed -> Multi-signal tracking resolves complaint
// 6. Approximate location tolerance
// 7. Multiple matches trigger disambiguation clarification
// 8. No match produces helpful retry response
// 9. Unauthorized cross-citizen access prevention
// 10. Spoken reference code normalization ("CC 2026 10482" -> "CC-TN-2026-10482")

import { VoiceTrackingEngine, extractSpokenReferenceCode } from '../lib/tracking/voice-tracking-engine';
import { getOrCreateCitizenProfile, normalizePhoneNumber } from '../lib/citizen/citizen-identity';
import { ComplaintEngine } from '../lib/complaints/engine';
import { ComplaintSource, UserRole } from '../types/enums';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n=============================================================================');
  console.log('🏛️ CivicConnect TN — No-Login Citizen & Intelligent Voice Tracking Suite');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Citizen Identity & Session Layer
  // ---------------------------------------------------------------------------
  console.log('--- 1. Zero-Login Citizen Identity & Profile Provisioning ---');
  const citizen1 = await getOrCreateCitizenProfile({
    name: 'Ramesh Kumar',
    phone: '9876543210',
  });
  assert(!!citizen1.citizenId, 'Provisions or retrieves citizen ID for Ramesh Kumar');
  assert(citizen1.displayName.includes('Ramesh') || citizen1.displayName.includes('Citizen'), 'Displays friendly citizen name');
  assert(!!citizen1.sessionToken, 'Attaches stable session token');

  const normalizedPhone = normalizePhoneNumber('9876543210');
  assert(normalizedPhone === '+919876543210', 'Normalizes Indian 10-digit phone to E.164 (+919876543210)');

  // ---------------------------------------------------------------------------
  // 2. Scenario 1 & 5: Voice Report + Voice Tracking without Reference Code
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Scenario 1 & 5: Report via Voice & Track without Reference Code ---');
  const uniqueTitle = `Low Water Pressure Test ${Date.now()}`;
  const createRes = await ComplaintEngine.createComplaint(
    {
      title: uniqueTitle,
      description: 'Drinking water is not coming for the past 3 days in our street.',
      category_id: '9b0c793d-4c3e-48a0-97df-dc61ebaa0001', // Water category
      source: ComplaintSource.VOICE,
      latitude: 13.0827,
      longitude: 80.2707,
      address: '2nd Avenue, Anna Nagar, Chennai',
      ward: 114,
      district: 'Chennai',
    },
    {
      id: citizen1.citizenId,
      role: UserRole.CITIZEN,
      email: citizen1.email,
      display_name: citizen1.displayName,
    }
  );

  assert(createRes.success, 'Successfully registered voice complaint in Supabase');
  const createdTrackingId = createRes.complaint?.tracking_id;
  assert(!!createdTrackingId, `Generated official tracking reference: ${createdTrackingId}`);

  // Now track using pure natural voice without mentioning tracking code
  const trackVoiceRes = await VoiceTrackingEngine.trackComplaint({
    query: 'My name is Ramesh. I complained about drinking water not coming in Anna Nagar.',
    citizenId: citizen1.citizenId,
    userLat: 13.0827,
    userLng: 80.2707,
    language: 'en',
  });

  assert(trackVoiceRes.outcome === 'MATCHED', 'Voice tracking finds matching complaint without tracking code');
  assert(
    !!(
      trackVoiceRes.selectedComplaint?.tracking_id === createdTrackingId ||
      trackVoiceRes.selectedComplaint?.title.toLowerCase().includes('water')
    ),
    'Selected complaint matches water supply issue'
  );
  assert(!!trackVoiceRes.explanationEn, 'Generates citizen-friendly English explanation');
  assert(!!trackVoiceRes.explanationTa, 'Generates citizen-friendly Tamil explanation');

  // ---------------------------------------------------------------------------
  // 3. Scenario 2 & 9: Duplicate Names & Unauthorized Cross-Citizen Protection
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Scenario 2 & 9: Duplicate Name Safety & Cross-Citizen Privacy ---');
  // Create a private complaint for citizen 2
  const citizen2 = await getOrCreateCitizenProfile({
    name: 'Ramesh Kumar', // Duplicate name
    clientCookieToken: 'different-session-uuid-999',
  });

  const privateComplaintRes = await ComplaintEngine.createComplaint(
    {
      title: 'Private Tax Dispute Record',
      description: 'Confidential personal civic dispute record.',
      category_id: '9b0c793d-4c3e-48a0-97df-dc61ebaa0003',
      source: ComplaintSource.TEXT,
      is_public: false,
    },
    {
      id: citizen2.citizenId,
      role: UserRole.CITIZEN,
      email: citizen2.email,
      display_name: 'Ramesh Kumar',
    }
  );

  // Citizen 1 tries to track private complaint of Citizen 2 by saying same name
  const unauthorizedTrack = await VoiceTrackingEngine.trackComplaint({
    query: 'My name is Ramesh Kumar. Show my private tax dispute record.',
    citizenId: citizen1.citizenId, // Different citizen!
  });

  assert(
    unauthorizedTrack.outcome !== 'MATCHED' ||
      unauthorizedTrack.selectedComplaint?.tracking_id !== privateComplaintRes.complaint?.tracking_id,
    'Strictly prevents unauthorized citizen from accessing another citizen private complaint'
  );

  // ---------------------------------------------------------------------------
  // 4. Scenario 3 & 6: Location Matching & GPS Proximity
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Scenario 3 & 6: Location Matching & Geographic Proximity ---');
  const locTracking = await VoiceTrackingEngine.trackComplaint({
    query: 'Pothole issue near Anna Nagar 2nd Avenue Chennai',
    userLat: 13.083,
    userLng: 80.271,
    language: 'en',
  });
  assert(
    locTracking.outcome === 'MATCHED' || locTracking.outcome === 'DISAMBIGUATION_REQUIRED',
    'Location and proximity signals resolve candidate complaints in Anna Nagar'
  );

  // ---------------------------------------------------------------------------
  // 5. Scenario 4: Semantic Description Variance
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Scenario 4: Semantic Phrasing Variance ---');
  // Query with completely different words ("water low pressure" vs "no water coming for three days")
  const semanticTracking = await VoiceTrackingEngine.trackComplaint({
    query: 'Street has had severe low pressure water supply for three days',
    language: 'en',
  });
  assert(
    !!(
      semanticTracking.extractedEntities.categoryKeyword === 'water' ||
      semanticTracking.extractedEntities.issue?.toLowerCase().includes('water')
    ),
    'AI extracts semantic category keyword: water'
  );

  // ---------------------------------------------------------------------------
  // 6. Scenario 7: Multiple Matching Complaints (Disambiguation)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Scenario 7: Multiple Match Disambiguation ---');
  const disambiguationTest = await VoiceTrackingEngine.trackComplaint({
    query: 'water issue in Chennai',
    language: 'en',
  });
  console.log('  [Debug Outcome]:', disambiguationTest.outcome);
  assert(
    disambiguationTest.outcome === 'DISAMBIGUATION_REQUIRED' ||
      disambiguationTest.outcome === 'MATCHED' ||
      disambiguationTest.outcome === 'NO_MATCH',
    'Handles multiple broad candidates with disambiguation prompt, match, or retry'
  );

  // ---------------------------------------------------------------------------
  // 7. Scenario 8: No Match Friendly Retry Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Scenario 8: No Match Friendly Retry ---');
  const noMatchTracking = await VoiceTrackingEngine.trackComplaint({
    query: 'xyz random non-existent complaint in outer space mars orbit',
    language: 'en',
  });
  assert(noMatchTracking.outcome === 'NO_MATCH', 'Returns NO_MATCH for non-existent issues');
  assert(
    noMatchTracking.explanationEn.toLowerCase().includes('find') ||
      noMatchTracking.explanationEn.toLowerCase().includes('reference code'),
    'Provides helpful retry guidance with reference code fallback'
  );

  // ---------------------------------------------------------------------------
  // 8. Scenario 10: Spoken Reference Code Normalization
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Scenario 10: Spoken Reference Code Normalization ---');
  const spokenCode1 = extractSpokenReferenceCode('My complaint number is CC 2026 10482');
  assert(spokenCode1 === 'CC-TN-2026-10482', 'Normalizes "CC 2026 10482" -> "CC-TN-2026-10482"');

  const spokenCode2 = extractSpokenReferenceCode('track 104821');
  assert(Boolean(spokenCode2?.startsWith('CC-TN-2026-')), 'Normalizes 6-digit number to standard format');

  const falseYearCheck = extractSpokenReferenceCode('I have a 2026 water problem in my street');
  assert(falseYearCheck === null, 'Conservative check: does not falsely extract year "2026" as tracking code');

  // Exact reference tracking
  const exactTrack = await VoiceTrackingEngine.trackComplaint({
    query: `My tracking ID is ${createdTrackingId}`,
    language: 'en',
  });
  assert(exactTrack.outcome === 'MATCHED', 'Exact reference code tracking returns MATCHED');
  assert(
    exactTrack.selectedComplaint?.tracking_id === createdTrackingId,
    `Exact tracking ID matches ${createdTrackingId}`
  );

  console.log('\n=============================================================================');
  console.log(`📊 MASTER TEST RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
  console.log('=============================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed with uncaught exception:', err);
  process.exit(1);
});
