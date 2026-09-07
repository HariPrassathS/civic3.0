// =============================================================================
// CivicConnect TN — Diagnostic Console & Voice Backend Validation Suite
// =============================================================================

import { GET as healthHandler } from '../app/api/dev/health/route';
import { POST as interpretHandler } from '../app/api/voice/interpret/route';
import { POST as trackDiagnosticHandler } from '../app/api/dev/track-diagnostic/route';
import { POST as submitHandler } from '../app/api/voice/submit/route';
import { createAdminClient } from '../lib/supabase/admin';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) {
      console.error('     Details:', failureDetails);
    }
  }
}

async function runDiagnosticTests() {
  console.log('\n=============================================================================');
  console.log('🏛️ CivicConnect TN — Developer Diagnostic Console & Voice Suite');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Health Diagnostic Endpoint Test
  // ---------------------------------------------------------------------------
  console.log('--- 1. Subsystem Health & Diagnostics API ---');
  {
    const req = new Request('http://localhost:3000/api/dev/health');
    const res = await healthHandler();
    const data = await res.json();

    assert(data.success === true, 'Health check returns success: true');
    assert(data.services?.nextjs?.status === 'READY', 'Next.js App Server is READY');
    assert(data.services?.supabase?.status === 'READY', 'Supabase Database is READY');
    assert(data.services?.postgis?.status === 'READY' || data.services?.postgis?.status === 'WARNING', 'PostGIS Spatial Engine is probed');
    assert(Boolean(data.services?.groq), 'Groq AI status reported');
    assert(Boolean(data.services?.whisper), 'Whisper STT status reported');
    assert(Boolean(data.services?.storage), 'Supabase Storage status reported');
    assert(Boolean(data.services?.realtime), 'Realtime engine status reported');

    // Secrets check: Ensure no raw keys appear in output
    const jsonStr = JSON.stringify(data);
    assert(!jsonStr.includes('eyJhbGciOi'), 'No raw JWT tokens or service role secrets exposed');
    assert(!jsonStr.includes('gsk_'), 'No raw Groq API keys exposed in health payload');
  }

  // ---------------------------------------------------------------------------
  // 2. Voice Assistant Natural Language Interpretation
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Voice Assistant Natural Language Interpretation ---');
  {
    // Test 2.1: Tamil Spoken Water Issue
    const reqTa = new Request('http://localhost:3000/api/voice/interpret', {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Enga street la moonu naala thanni varala, romba kashtama irukku.',
        language: 'ta',
        citizenName: 'Hari',
      }),
    });
    const resTa = await interpretHandler(reqTa);
    const dataTa = await resTa.json();

    assert(dataTa.success === true, 'Interprets Tamil water supply grievance');
    assert(dataTa.data?.departmentCode === 'WATER', 'Correctly grounds department to WATER');
    assert(Boolean(dataTa.data?.title), `Generates English title: "${dataTa.data?.title}"`);
    assert(Boolean(dataTa.data?.tamilSummary), `Generates Tamil confirmation summary: "${dataTa.data?.tamilSummary}"`);

    // Test 2.2: Tanglish Pothole / Safety Risk
    const reqTanglish = new Request('http://localhost:3000/api/voice/interpret', {
      method: 'POST',
      body: JSON.stringify({
        transcript: 'Main road la periya deep pothole irukku, transformer wire nearby dangling dangerous!',
        language: 'auto',
      }),
    });
    const resTanglish = await interpretHandler(reqTanglish);
    const dataTanglish = await resTanglish.json();

    assert(dataTanglish.success === true, 'Interprets Tanglish safety hazard');
    assert(dataTanglish.data?.priority === 'urgent' || dataTanglish.data?.priority === 'high', 'Calculates high/urgent priority');
    assert(dataTanglish.data?.safetyRisk === true, 'Detects safety risk flag');
  }

  // ---------------------------------------------------------------------------
  // 3. Voice Tracking & Spoken Reference Code Normalization
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Voice Tracking & Spoken Reference Code Diagnostics ---');
  {
    // Test 3.1: Spoken Reference Code Extraction ("CC 2026 10482")
    const reqSpokenCode = new Request('http://localhost:3000/api/dev/track-diagnostic', {
      method: 'POST',
      body: JSON.stringify({
        query: 'My complaint code is CC 2026 10482',
      }),
    });
    const resSpokenCode = await trackDiagnosticHandler(reqSpokenCode);
    const dataSpokenCode = await resSpokenCode.json();

    assert(dataSpokenCode.success === true, 'Processes spoken reference code query');
    assert(dataSpokenCode.pipeline?.referenceExtraction?.detected === true, 'Detects spoken reference code');
    assert(
      dataSpokenCode.pipeline?.referenceExtraction?.normalizedCode === 'CC-TN-2026-10482',
      `Normalizes "CC 2026 10482" -> "${dataSpokenCode.pipeline?.referenceExtraction?.normalizedCode}"`
    );

    // Test 3.2: Existing Test Complaint Lookup
    const reqExact = new Request('http://localhost:3000/api/dev/track-diagnostic', {
      method: 'POST',
      body: JSON.stringify({
        query: 'CC-TN-2026-TEST-001',
      }),
    });
    const resExact = await trackDiagnosticHandler(reqExact);
    const dataExact = await resExact.json();

    assert(dataExact.success === true, 'Processes exact test reference code');
    assert(dataExact.pipeline?.outcome === 'MATCHED', 'Outcome is MATCHED for existing test complaint');
    assert(dataExact.pipeline?.candidates?.length >= 1, 'Returns candidate complaint record');
    assert(Boolean(dataExact.pipeline?.resolutionMessageEn), 'Generates English resolution message');
    assert(Boolean(dataExact.pipeline?.resolutionMessageTa), 'Generates Tamil resolution message');

    // Test 3.3: Conservative Normalization (Do not over-normalize "in 2026 water problem")
    const reqConservative = new Request('http://localhost:3000/api/dev/track-diagnostic', {
      method: 'POST',
      body: JSON.stringify({
        query: 'I have 2026 water problem in my house',
      }),
    });
    const resConservative = await trackDiagnosticHandler(reqConservative);
    const dataConservative = await resConservative.json();

    assert(
      dataConservative.pipeline?.referenceExtraction?.detected === false,
      'Does NOT falsely extract "2026" as a tracking code (Conservative check)'
    );

    // Test 3.4: Cross-Citizen Privacy & Authorization Guard
    // Citizen B querying Citizen A's private complaint
    const supabase = createAdminClient();
    const { data: privateComp } = await supabase
      .from('complaints')
      .select('tracking_id, citizen_id')
      .eq('is_public', false)
      .limit(1)
      .maybeSingle();

    if (privateComp) {
      const reqAuth = new Request('http://localhost:3000/api/dev/track-diagnostic', {
        method: 'POST',
        body: JSON.stringify({
          query: privateComp.tracking_id,
          citizenId: '00000000-0000-0000-0000-000000000999', // Different citizen ID
        }),
      });
      const resAuth = await trackDiagnosticHandler(reqAuth);
      const dataAuth = await resAuth.json();

      assert(dataAuth.pipeline?.outcome === 'ACCESS_DENIED', 'Denies access when unauthorized citizen tracks private complaint');
      assert(dataAuth.pipeline?.candidates?.[0]?.isAuthorized === false, 'Candidate is marked isAuthorized: false');
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Voice Submission Test (Test Submission Mode)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Voice Submission & Database Persistence ---');
  {
    const reqSubmit = new Request('http://localhost:3000/api/voice/submit', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Diagnostic Test Water Leakage on 2nd Avenue',
        description: 'Underground drinking water feeder pipe burst causing surface flooding near school gate.',
        category_id: 'WATER_PIPE_LEAK',
        department_id: 'd0000001-0000-0000-0000-000000000001',
        priority: 'high',
        citizen_name: 'Developer Diagnostic Test',
        address: '2nd Avenue, Anna Nagar, Chennai',
        ward_id: 105,
        district: 'Chennai',
        latitude: 13.0827,
        longitude: 80.2707,
      }),
    });
    const resSubmit = await submitHandler(reqSubmit);
    const dataSubmit = await resSubmit.json();

    assert(dataSubmit.success === true, 'Persists real test complaint via /api/voice/submit');
    assert(Boolean(dataSubmit.data?.tracking_id), `Generated tracking ID: ${dataSubmit.data?.tracking_id}`);
    assert(Boolean(dataSubmit.data?.sla_deadline), 'Computed SLA deadline timestamp');
  }

  console.log('\n=============================================================================');
  console.log(`📊 DIAGNOSTIC RESULTS: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
  console.log('=============================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runDiagnosticTests().catch((err) => {
  console.error('Diagnostic test suite encountered unhandled error:', err);
  process.exit(1);
});
