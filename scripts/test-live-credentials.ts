// =============================================================================
// CivicConnect TN — Live Services & Credentials Verification Suite
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import { getGroqClient, triageComplaintWithGroq } from '../lib/ai/groq';
import { ComplaintEngine } from '../lib/complaints/engine';
import { Priority, UserRole, ComplaintStatus, ComplaintSource } from '../types/enums';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, name: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name}`);
    if (detail) console.error(`     Details: ${detail}`);
  }
}

async function runLiveTests() {
  console.log('\n=============================================================================');
  console.log('🏛️ CivicConnect TN — Live Credentials & Cloud Services Verification');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Firebase Configuration Checks
  // ---------------------------------------------------------------------------
  console.log('--- 1. Firebase Client Configuration ---');
  {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    assert(!!apiKey && apiKey.startsWith('AIzaSy'), 'Firebase API Key is valid and starts with AIzaSy');
    assert(authDomain === 'civic-connect-6e7c9.firebaseapp.com', 'Firebase Auth Domain configured');
    assert(projectId === 'civic-connect-6e7c9', 'Firebase Project ID matches civic-connect-6e7c9');
    assert(!!appId && appId.includes('651912628044'), 'Firebase App ID matches sender ID');
  }

  // ---------------------------------------------------------------------------
  // 2. Groq AI Engine Live Inference
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Groq AI Engine (Llama 3.3 70B Versatile) ---');
  try {
    const groq = getGroqClient();
    assert(!!groq, 'Groq client initialized with API key');

    console.log('  ⏳ Running AI Triage on live Groq LPU...');
    const triage = await triageComplaintWithGroq(
      'Deep potholes cluster near Anna Flyover on Mount Road',
      'Multiple hazardous craters causing vehicles to brake abruptly. Danger of two-wheeler skids.'
    );

    assert(triage.departmentCode === 'ROADS', `AI correctly identified Department as ROADS (Got: ${triage.departmentCode})`);
    assert(triage.categoryCode.includes('ROAD') || triage.categoryCode.includes('POTHOLE'), `AI correctly identified Category (${triage.categoryCode})`);
    assert([Priority.HIGH, Priority.URGENT].includes(triage.priority), `AI assessed Priority as ${triage.priority}`);
    assert(triage.confidence >= 0.8, `AI Confidence is high (${(triage.confidence * 100).toFixed(1)}%)`);
    assert(!!triage.tamilSummary && triage.tamilSummary.length > 5, `AI generated Tamil summary: "${triage.tamilSummary}"`);
    console.log(`     Summary (EN): ${triage.summary}`);
    console.log(`     Summary (TA): ${triage.tamilSummary}`);
  } catch (err) {
    assert(false, 'Groq AI Inference failed', String(err));
  }

  // ---------------------------------------------------------------------------
  // 3. Supabase Live Cloud Database Connection
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Supabase Live Cloud Database (PostgreSQL / PostGIS) ---');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assert(!!supabaseUrl && supabaseUrl.includes('supabase.co'), 'Supabase Project URL configured');
  assert(!!serviceKey && serviceKey.length > 50, 'Supabase Service Role Key configured');
  assert(!!anonKey && anonKey.length > 50, 'Supabase Public Anon Key configured');

  let catData: any[] | null = null;
  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);

    // Test querying tables
    try {
      console.log('  ⏳ Testing Supabase connection & schema...');
      const { data: deptData, error: deptError } = await supabase.from('departments').select('*').limit(5);

      if (deptError) {
        console.log(`     Supabase table check info: ${deptError.message}`);
        assert(false, 'Query departments table', deptError.message);
      } else {
        assert(true, 'Successfully connected to Supabase and queried departments');
        console.log(`     Found ${deptData.length} departments in live database`);
      }

      const { data: cData, error: catError } = await supabase.from('categories').select('*').limit(5);
      catData = cData;
      if (!catError && catData) {
        assert(true, `Successfully queried categories table (${catData.length} records found)`);
      }

      const { data: compData, error: compError } = await supabase.from('complaints').select('*').limit(5);
      if (!compError && compData) {
        assert(true, `Successfully queried complaints table`);
      }
    } catch (err) {
      assert(false, 'Supabase queries failed', String(err));
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Live End-to-End Complaint Engine Flow with Cloud Sync
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Live Complaint Engine Integration ---');
  try {
    const testCitizen = {
      id: 'live-test-citizen-01',
      role: UserRole.CITIZEN,
      email: 'citizen.chennai@tn.gov.in',
      displayName: 'Karthik Subramanian',
    };

    const realCatId = catData && catData.length > 0 ? catData[0].id : 'WATER_PIPE_LEAK';
    const createRes = await ComplaintEngine.createComplaint(
      {
        title: 'Broken water distribution pipe flooding Gandhi Mandapam Road',
        description: 'Drinking water pipeline leaking heavily opposite Guindy National Park entrance.',
        category_id: realCatId,
        priority: Priority.HIGH,
        latitude: 13.0067,
        longitude: 80.2206,
        ward: 173,
        district: 'Chennai',
        address: 'Gandhi Mandapam Road, Guindy, Chennai',
        media: [{ url: 'https://example.com/pipe-leak-evidence.jpg' }],
        source: ComplaintSource.VOICE,
      },
      testCitizen
    );

    if (!createRes.success) {
      console.log('     CreateComplaint error details:', createRes.errors || createRes);
    }

    assert(createRes.success === true, 'ComplaintEngine created live complaint');
    assert(!!createRes.complaint?.tracking_id, `Generated Tracking ID: ${createRes.complaint?.tracking_id}`);

    if (createRes.complaint) {
      const complaintId = createRes.complaint.id;

      // Transition to IN_PROGRESS (Field Worker acknowledges and starts work order)
      const inProgressRes = await ComplaintEngine.transitionStatus({
        complaintId,
        newStatus: ComplaintStatus.IN_PROGRESS,
        actor: { id: 'worker-chennai-173', role: UserRole.FIELD_WORKER },
        notes: 'Field Worker arrived at Gandhi Mandapam Road and initiated pipeline repair.',
      });
      assert(inProgressRes.success === true, 'Live transition to IN_PROGRESS by Field Worker');

      // Timeline retrieval
      const timeline = await ComplaintEngine.getComplaintTimeline(complaintId);
      assert(timeline.length >= 2, `Timeline retrieved ${timeline.length} updates for live complaint`);
    }
  } catch (err) {
    assert(false, 'Live ComplaintEngine test failed', String(err));
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n=============================================================================');
  console.log(`📊 LIVE CREDENTIALS TEST SUMMARY: ${passed} passed, ${failed} failed, ${total} total.`);
  console.log('=============================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
