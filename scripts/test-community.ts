// =============================================================================
// CivicConnect TN — Phase 11 Community Module Verification Test Suite
// =============================================================================

import { sanitizePublicAddress, sanitizeAuthorName, sanitizeComplaintForPublic } from '../lib/community/sanitizer';
import { buildCommonIssueClusters } from '../lib/community/common-issues';
import { MEMORY_COMPLAINTS } from '../lib/complaints/service';

async function runCommunityTests() {
  console.log('🧪 Starting Phase 11: Community Module & Privacy Engine Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. PRIVACY & ADDRESS SANITIZATION TESTS
  // ---------------------------------------------------------------------------
  console.log('--- 1. Address Privacy & Door Number Redaction ---');

  const addr1 = 'Door No. 14/2, 3rd Main Road, Anna Nagar, Chennai';
  const sanitized1 = sanitizePublicAddress(addr1, 114, 'Chennai');
  assert(
    !sanitized1.includes('14/2') && !sanitized1.toLowerCase().includes('door'),
    'Redacts exact Door No. and flat numbers',
    `Result: "${sanitized1}"`
  );

  const addr2 = 'Flat 301, Plot #45, Gandhi Street, T. Nagar';
  const sanitized2 = sanitizePublicAddress(addr2, 115, 'Chennai');
  assert(
    !sanitized2.includes('301') && !sanitized2.includes('45'),
    'Redacts Flat and Plot numbers',
    `Result: "${sanitized2}"`
  );

  const emptyAddr = sanitizePublicAddress('', 114, 'Chennai');
  assert(
    emptyAddr.includes('Ward 114') && emptyAddr.includes('Chennai'),
    'Graceful fallback to Ward and District for empty address',
    `Result: "${emptyAddr}"`
  );

  // ---------------------------------------------------------------------------
  // 2. CITIZEN & OFFICIAL COMMENT AUTHOR PRIVACY
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Author Identity Masking & Official Badges ---');

  const citizenMasked = sanitizeAuthorName('Kavitha Ramesh', 'citizen', 114);
  assert(
    citizenMasked.author_name === 'Concerned Resident (Ward 114)' && !citizenMasked.is_official,
    'Masks citizen full name with ward-level residency tag',
    `Result: ${JSON.stringify(citizenMasked)}`
  );

  const officialMasked = sanitizeAuthorName('Anand Kumar', 'area_officer', 114, 'GCC-ENG');
  assert(
    officialMasked.is_official && officialMasked.author_badge === 'Verified Official',
    'Maintains verified status and title for government officers',
    `Result: ${JSON.stringify(officialMasked)}`
  );

  // ---------------------------------------------------------------------------
  // 3. PRIVATE COMPLAINT ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Private vs Public Complaint Privacy Guard ---');

  const samplePrivate = {
    id: 'test-priv-1',
    tracking_id: 'CC-TN-2026-PRIV01',
    title: 'Illegal construction complaint against neighbor',
    description: 'Call me at 9876543210 or email test@gmail.com. Door 12/A.',
    citizen_id: 'secret-uuid-1234',
    is_public: false,
    status: 'created',
    priority: 'high',
    address: 'Door No. 12/A, Gandhi Street, Ward 100',
    ward: 100,
    district: 'Chennai',
    created_at: new Date().toISOString(),
  };

  const samplePublic = {
    id: 'test-pub-1',
    tracking_id: 'CC-TN-2026-PUB01',
    title: 'Severe road pothole near junction',
    description: 'Contact volunteer 9444123456 regarding this pothole near bus stop.',
    citizen_id: 'secret-uuid-5678',
    is_public: true,
    status: 'in_progress',
    priority: 'urgent',
    address: 'Plot #9, Ring Road, Anna Nagar',
    ward: 114,
    district: 'Chennai',
    created_at: new Date().toISOString(),
  };

  const sanitizedPublic = sanitizeComplaintForPublic(samplePublic, false);
  assert(
    !(sanitizedPublic as any).citizen_id,
    'Strips internal citizen_id completely from public payload',
    JSON.stringify(sanitizedPublic)
  );

  assert(
    !sanitizedPublic.description.includes('9444123456'),
    'Masks phone numbers inside public description with [PHONE REDACTED]',
    sanitizedPublic.description
  );

  assert(
    !sanitizedPublic.address.includes('#9'),
    'Strips plot number from public address',
    sanitizedPublic.address
  );

  // ---------------------------------------------------------------------------
  // 4. COMMON ISSUE CLUSTERING (NON-DESTRUCTIVE)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Common Issue Spatial Clustering Engine ---');

  const nearbyComplaints = [
    {
      id: 'c1',
      tracking_id: 'CC-TN-2026-001',
      title: 'Water pipe burst on 4th Main Rd',
      description: 'Major water leakage flooding street',
      category_id: 'water-supply',
      ward: 114,
      district: 'Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      is_public: true,
      upvotes_count: 5,
      status: 'in_progress',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'c2',
      tracking_id: 'CC-TN-2026-002',
      title: 'Drinking water pipeline ruptured',
      description: 'Road flooded due to pipe burst',
      category_id: 'water-supply',
      ward: 114,
      district: 'Chennai',
      latitude: 13.0831, // ~50m away
      longitude: 80.2711,
      is_public: true,
      upvotes_count: 3,
      status: 'created',
      created_at: new Date().toISOString(),
    },
    {
      id: 'c3',
      tracking_id: 'CC-TN-2026-003',
      title: 'Street light broken in Madurai',
      description: 'Lamp post dark for 3 days',
      category_id: 'electricity',
      ward: 5,
      district: 'Madurai',
      latitude: 9.9252,
      longitude: 78.1198,
      is_public: true,
      upvotes_count: 1,
      status: 'created',
      created_at: new Date().toISOString(),
    },
  ];

  const { clusters, enrichedComplaints } = buildCommonIssueClusters(nearbyComplaints);

  assert(
    clusters.length === 1,
    'Identifies 1 common issue cluster among nearby Chennai water complaints',
    `Found: ${clusters.length} clusters`
  );

  assert(
    clusters[0].total_reports_count === 2,
    'Cluster combines 2 distinct citizen reports into shared relationship',
    `Report count: ${clusters[0]?.total_reports_count}`
  );

  const enrichedC1 = enrichedComplaints.find((c) => c.tracking_id === 'CC-TN-2026-001');
  const enrichedC2 = enrichedComplaints.find((c) => c.tracking_id === 'CC-TN-2026-002');
  const enrichedC3 = enrichedComplaints.find((c) => c.tracking_id === 'CC-TN-2026-003');

  assert(
    enrichedC1?.is_common_issue === true && enrichedC2?.is_common_issue === true,
    'Both complaints are marked as is_common_issue: true with link references',
    `c1: ${enrichedC1?.is_common_issue}, c2: ${enrichedC2?.is_common_issue}`
  );

  assert(
    enrichedC1?.tracking_id !== enrichedC2?.tracking_id,
    'Non-destructive: Each citizen maintains their distinct unique tracking ID',
    `c1 ID: ${enrichedC1?.tracking_id}, c2 ID: ${enrichedC2?.tracking_id}`
  );

  assert(
    enrichedC3?.is_common_issue === false,
    'Isolated Madurai complaint is correctly not flagged as common issue',
    `c3 is_common: ${enrichedC3?.is_common_issue}`
  );

  // ---------------------------------------------------------------------------
  // 5. SEED DATA AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Public Memory Complaints Dataset Audit ---');

  const publicFeed = MEMORY_COMPLAINTS.filter((c) => c.is_public);
  assert(
    publicFeed.length > 0,
    `Memory store has ${publicFeed.length} public complaints ready for community feed`,
    `Count: ${publicFeed.length}`
  );

  console.log(`\n==================================================`);
  console.log(`Phase 11 Community Tests Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCommunityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
