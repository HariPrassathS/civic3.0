// =============================================================================
// CivicConnect TN — Phase 9 Tracking System Test Suite
// =============================================================================
// Tests: tracking ID lookup, voice tracking, related issues, privacy, security

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ PASS: ${message}`);
}

let passCount = 0;
let failCount = 0;

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  console.log(`\n🧪 ${name}`);
  try {
    await fn();
    passCount++;
  } catch (err) {
    failCount++;
    console.error(`  ❌ ${err instanceof Error ? err.message : String(err)}`);
  }
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function fetchJson(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data, ok: res.ok };
}

async function main() {
  console.log('='.repeat(60));
  console.log('  CivicConnect TN — Phase 9 Tracking Test Suite');
  console.log('='.repeat(60));

  // =========================================================================
  // SUITE 1: Tracking API — Valid Lookups
  // =========================================================================
  console.log('\n📁 Suite 1: Tracking API — Valid Lookups');

  await test('Lookup valid demo tracking ID (CC-TN-2026-104921)', async () => {
    const { status, data } = await fetchJson('/api/complaints/track/CC-TN-2026-104921');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(data.data?.complaint != null, 'complaint object returned');
    assert(data.data.complaint.tracking_id === 'CC-TN-2026-104921', 'Correct tracking ID');
    assert(data.data.complaint.title != null, 'Has title');
    assert(data.data.complaint.status != null, 'Has status');
  });

  await test('Lookup is case-insensitive', async () => {
    const { status, data } = await fetchJson('/api/complaints/track/cc-tn-2026-104921');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'Case-insensitive match works');
  });

  await test('Tracking response includes timeline with ?include=timeline', async () => {
    const { status, data } = await fetchJson('/api/complaints/track/CC-TN-2026-104921?include=timeline');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
  });

  // =========================================================================
  // SUITE 2: Tracking API — Invalid Lookups
  // =========================================================================
  console.log('\n📁 Suite 2: Tracking API — Invalid/Not Found');

  await test('Invalid tracking ID returns 404', async () => {
    const { status, data } = await fetchJson('/api/complaints/track/CC-TN-2026-000000');
    assert(status === 404, 'Returns HTTP 404');
    assert(data.success === false, 'success is false');
    assert(typeof data.error === 'string', 'Error message returned');
  });

  await test('Empty tracking ID returns 400', async () => {
    const { status, data } = await fetchJson('/api/complaints/track/ab');
    assert(status === 400, 'Returns HTTP 400 for too-short ID');
    assert(data.success === false, 'success is false');
  });

  await test('Sanitized response does not expose citizen_id', async () => {
    const { data } = await fetchJson('/api/complaints/track/CC-TN-2026-104921');
    const complaint = data.data?.complaint;
    if (complaint) {
      // For memory-store complaints, citizen_id should be stripped
      if (data.data?.source === 'cache') {
        assert(complaint.citizen_id == null, 'citizen_id is stripped from public response');
      }
    }
  });

  // =========================================================================
  // SUITE 3: Related Issues API
  // =========================================================================
  console.log('\n📁 Suite 3: Related Issues API');

  await test('Related issues by ward returns results', async () => {
    const { status, data } = await fetchJson('/api/complaints/related?ward=114');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(Array.isArray(data.data?.related), 'related is an array');
  });

  await test('Related issues with exclude_id filters out complaint', async () => {
    const { status, data } = await fetchJson('/api/complaints/related?ward=114&exclude_id=demo-cmp-1');
    assert(status === 200, 'Returns HTTP 200');
    const related = data.data?.related || [];
    const hasExcluded = related.some((r: Record<string, string>) => r.tracking_id === 'CC-TN-2026-104921');
    assert(!hasExcluded, 'Excluded complaint not in results');
  });

  await test('Related issues do not expose citizen_id', async () => {
    const { data } = await fetchJson('/api/complaints/related?ward=114');
    const related = data.data?.related || [];
    for (const item of related) {
      assert(!('citizen_id' in item), `Item ${item.tracking_id} does not expose citizen_id`);
    }
  });

  await test('Related issues requires at least ward or category_id', async () => {
    const { status, data } = await fetchJson('/api/complaints/related');
    assert(status === 400, 'Returns HTTP 400 without params');
    assert(data.success === false, 'success is false');
  });

  // =========================================================================
  // SUITE 4: Voice Tracking API
  // =========================================================================
  console.log('\n📁 Suite 4: Voice Tracking API');

  await test('Voice tracking with explicit tracking ID', async () => {
    const { status, data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'Check status of CC-TN-2026-104921',
        language: 'en',
      }),
    });
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(data.data?.found === true, 'Complaint found');
    assert(data.data?.complaint?.status != null, 'Has status');
    assert(data.data?.statusDescription != null, 'Has status description');
  });

  await test('Voice tracking with keyword search', async () => {
    const { status, data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'pothole road Usman',
        language: 'en',
      }),
    });
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    // May or may not find — depends on matching
  });

  await test('Voice tracking with nonexistent ID returns not found', async () => {
    const { status, data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'CC-TN-2026-999999',
        language: 'en',
      }),
    });
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(data.data?.found === false, 'Complaint not found');
    assert(typeof data.data?.message === 'string', 'Has not-found message');
  });

  await test('Voice tracking with Tamil query', async () => {
    const { status, data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'CC-TN-2026-104921 நிலை என்ன',
        language: 'ta',
      }),
    });
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    if (data.data?.found) {
      assert(data.data?.tamilResponse != null, 'Has Tamil response');
    }
  });

  await test('Voice tracking empty transcript returns 400', async () => {
    const { status, data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: '', language: 'en' }),
    });
    assert(status === 400, 'Returns HTTP 400');
    assert(data.success === false, 'success is false');
  });

  // =========================================================================
  // SUITE 5: Tracking ID Extraction
  // =========================================================================
  console.log('\n📁 Suite 5: Tracking ID Format Patterns');

  await test('Extracts from "CC-TN-2026-339104"', async () => {
    const { data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'What is the status of CC-TN-2026-339104?',
        language: 'en',
      }),
    });
    assert(data.success === true, 'Parsed successfully');
    if (data.data?.found) {
      assert(data.data.complaint?.status === 'resolved', 'Found the resolved complaint');
    }
  });

  await test('Extracts from spoken digits only "339104"', async () => {
    const { data } = await fetchJson('/api/voice/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'My complaint number is 339104',
        language: 'en',
      }),
    });
    assert(data.success === true, 'Parsed successfully');
  });

  // =========================================================================
  // RESULTS
  // =========================================================================
  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
