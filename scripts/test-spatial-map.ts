// =============================================================================
// CivicConnect TN — Phase 10 Spatial GIS & Maps Test Suite
// =============================================================================
// Tests: PostGIS spatial radius queries, clustering, heatmaps, reverse geocoding,
// forward geocoding, administrative role-based spatial security, and error handling.

import { calculateHaversineDistanceKm, isInBoundingBox } from '../lib/spatial/spatial-engine';

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
  console.log('='.repeat(70));
  console.log('  CivicConnect TN — Phase 10 Spatial GIS & Leaflet Maps Test Suite');
  console.log('='.repeat(70));

  // =========================================================================
  // SUITE 1: Haversine & Geometric Computations
  // =========================================================================
  console.log('\n📁 Suite 1: Geometric Calculations & Bounding Box Logic');

  await test('Haversine distance between Ripon Building and Anna Salai', () => {
    // Ripon Building: 13.0827, 80.2755
    // Anna Salai (Teynampet): 13.0418, 80.2458
    const dist = calculateHaversineDistanceKm(13.0827, 80.2755, 13.0418, 80.2458);
    assert(dist > 5 && dist < 6.5, `Distance is approx 5.5 - 6.0 km (got ${dist} km)`);
  });

  await test('Haversine distance between Chennai and Coimbatore is ~420-500 km', () => {
    const dist = calculateHaversineDistanceKm(13.0827, 80.2707, 11.0168, 76.9558);
    assert(dist > 400 && dist < 520, `Distance is valid inter-district range (got ${dist} km)`);
  });

  await test('Bounding box inclusion check', () => {
    const bbox = { minLat: 13.0, maxLat: 13.2, minLng: 80.1, maxLng: 80.3 };
    assert(isInBoundingBox(13.08, 80.25, bbox) === true, 'Point inside bbox returns true');
    assert(isInBoundingBox(11.01, 76.95, bbox) === false, 'Point outside bbox returns false');
  });

  // =========================================================================
  // SUITE 2: Server-Side Radius Spatial API (/api/spatial/nearby)
  // =========================================================================
  console.log('\n📁 Suite 2: Nearby Complaints Spatial Query API');

  await test('Radius query around Chennai center returns sorted issues', async () => {
    const { status, data } = await fetchJson('/api/spatial/nearby?lat=13.0418&lng=80.2341&radius_km=15');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(Array.isArray(data.data?.issues), 'issues is an array');
    assert(data.data.issues.length > 0, 'Found nearby issues');
    assert(typeof data.data.issues[0].distance_km === 'number', 'Has distance_km property');

    // Verify distance sorting
    if (data.data.issues.length > 1) {
      const d1 = data.data.issues[0].distance_km;
      const d2 = data.data.issues[1].distance_km;
      assert(d1 <= d2, 'Issues are sorted in ascending order of distance');
    }
  });

  await test('Nearby query missing coordinates returns 400', async () => {
    const { status, data } = await fetchJson('/api/spatial/nearby');
    assert(status === 400, 'Returns HTTP 400 when lat/lng missing');
    assert(data.success === false, 'success is false');
  });

  await test('Nearby query with small radius (1km) restricts results', async () => {
    const { data: wide } = await fetchJson('/api/spatial/nearby?lat=13.0418&lng=80.2341&radius_km=25');
    const { data: narrow } = await fetchJson('/api/spatial/nearby?lat=13.0418&lng=80.2341&radius_km=1');

    assert(narrow.data.count <= wide.data.count, 'Narrow radius returns fewer or equal issues');
  });

  // =========================================================================
  // SUITE 3: Spatial Clusters API (/api/spatial/clusters)
  // =========================================================================
  console.log('\n📁 Suite 3: Spatial Clustering & Viewport Aggregation');

  await test('Spatial clusters returned for statewide bounding box', async () => {
    const { status, data } = await fetchJson(
      '/api/spatial/clusters?minLat=8.0&minLng=76.0&maxLat=14.0&maxLng=81.0&zoom=8'
    );
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(data.data?.totalInView > 0, 'totalInView > 0');
    assert(Array.isArray(data.data?.clusters), 'clusters is an array');
  });

  await test('High zoom level returns individual points instead of clusters', async () => {
    const { status, data } = await fetchJson(
      '/api/spatial/clusters?minLat=13.0&minLng=80.2&maxLat=13.1&maxLng=80.3&zoom=16'
    );
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(Array.isArray(data.data?.individual), 'individual items returned at close zoom');
  });

  // =========================================================================
  // SUITE 4: Heatmap Density API (/api/spatial/heatmap)
  // =========================================================================
  console.log('\n📁 Suite 4: Density Heatmap Intensity Generation');

  await test('Heatmap points returned with normalized intensity weights', async () => {
    const { status, data } = await fetchJson(
      '/api/spatial/heatmap?minLat=8.0&minLng=76.0&maxLat=14.0&maxLng=81.0'
    );
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(Array.isArray(data.data?.points), 'points is an array');
    assert(data.data.count > 0, 'Found heatmap points');

    const sample = data.data.points[0];
    assert(typeof sample.latitude === 'number', 'Has numeric latitude');
    assert(typeof sample.longitude === 'number', 'Has numeric longitude');
    assert(sample.weight >= 0.1 && sample.weight <= 1.0, 'Weight is between 0.1 and 1.0');
  });

  // =========================================================================
  // SUITE 5: Reverse & Forward Geocoding APIs
  // =========================================================================
  console.log('\n📁 Suite 5: Geocoding & Address Resolution');

  await test('Reverse geocode coordinates resolves to Tamil Nadu district & street', async () => {
    const { status, data } = await fetchJson('/api/spatial/reverse-geocode?lat=13.0827&lng=80.2755');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(data.data?.state === 'Tamil Nadu', 'State is Tamil Nadu');
    assert(typeof data.data?.district === 'string', 'Has district string');
    assert(typeof data.data?.formatted_address === 'string', 'Has formatted_address');
  });

  await test('Forward geocode search query returns coordinate results', async () => {
    const { status, data } = await fetchJson('/api/spatial/geocode?q=Gandhipuram');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(Array.isArray(data.data?.results), 'results is an array');
    assert(data.data.results.length > 0, 'Found Gandhipuram location');
    assert(data.data.results[0].district === 'Coimbatore', 'Resolved to Coimbatore district');
  });

  // =========================================================================
  // SUITE 6: Administrative Spatial Map & Multi-Criteria Filtering
  // =========================================================================
  console.log('\n📁 Suite 6: Administrative Spatial Multi-Criteria Filter API');

  await test('Admin map query returns KPIs and spatial complaints', async () => {
    const { status, data } = await fetchJson('/api/spatial/admin-map?district=Chennai');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    assert(data.data?.stats != null, 'stats object returned');
    assert(typeof data.data.stats.total === 'number', 'stats.total is numeric');
    assert(Array.isArray(data.data?.complaints), 'complaints array returned');
  });

  await test('Admin map filters by priority (urgent)', async () => {
    const { status, data } = await fetchJson('/api/spatial/admin-map?priority=urgent');
    assert(status === 200, 'Returns HTTP 200');
    assert(data.success === true, 'success is true');
    for (const c of data.data.complaints) {
      assert(c.priority.toLowerCase() === 'urgent', 'Complaint is urgent priority');
    }
  });

  await test('Public unauthenticated request only sees public complaints', async () => {
    const { data } = await fetchJson('/api/spatial/admin-map');
    assert(data.data.isOfficial === false, 'Identified as public access');
    for (const c of data.data.complaints) {
      assert(c.is_public !== false, 'Only public complaints visible');
      assert((c as any).citizen_id == null, 'citizen_id not exposed in spatial response');
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`  PHASE 10 GIS TEST RESULTS: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  console.log('='.repeat(70));

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
