// =============================================================================
// CivicConnect TN — Core DBSCAN Clustering Algorithm
// =============================================================================
// Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
// Identifies spatial-temporal density clusters and noise outliers among civic complaints.

import { DataPoint, DBSCANOptions, DBSCANCluster } from './types';

/**
 * Calculates Haversine distance between two GPS coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes composite feature distance between two civic complaints:
 * d = sqrt( (spatial_dist)^2 + (category_penalty)^2 + (time_penalty)^2 )
 */
export function computePointDistance(
  p1: DataPoint,
  p2: DataPoint,
  options: DBSCANOptions
): number {
  const spatialDist = haversineDistanceKm(
    p1.latitude,
    p1.longitude,
    p2.latitude,
    p2.longitude
  );

  const categoryWeight = options.categoryWeight ?? 0.2;
  const timeWeight = options.timeWeight ?? 0.1;
  const maxDays = options.maxDaysWindow ?? 90;

  // Category mismatch penalty
  let categoryPenalty = 0;
  if (categoryWeight > 0 && p1.category_id && p2.category_id) {
    if (p1.category_id !== p2.category_id) {
      categoryPenalty = categoryWeight * options.epsilonKm;
    }
  }

  // Time difference penalty
  let timePenalty = 0;
  if (timeWeight > 0 && p1.created_at && p2.created_at) {
    const t1 = new Date(p1.created_at).getTime();
    const t2 = new Date(p2.created_at).getTime();
    const diffDays = Math.abs(t1 - t2) / (1000 * 3600 * 24);
    const normalizedTime = Math.min(1.0, diffDays / maxDays);
    timePenalty = timeWeight * normalizedTime * options.epsilonKm;
  }

  return Math.sqrt(
    spatialDist * spatialDist +
      categoryPenalty * categoryPenalty +
      timePenalty * timePenalty
  );
}

/**
 * Executes DBSCAN Clustering on an array of civic data points.
 */
export function runDBSCAN(
  points: DataPoint[],
  options: DBSCANOptions
): {
  clusters: DBSCANCluster[];
  noisePoints: DataPoint[];
  allPoints: DataPoint[];
} {
  const n = points.length;
  if (n === 0) {
    return { clusters: [], noisePoints: [], allPoints: [] };
  }

  const epsilon = Math.max(0.05, options.epsilonKm);
  const minPts = Math.max(2, options.minPts);

  // Initialize point states
  const processedPoints: DataPoint[] = points.map((p) => ({
    ...p,
    cluster_id: undefined,
    point_type: undefined,
  }));

  const visited = new Set<number>();
  const pointClusters = new Map<number, number>(); // pointIndex -> clusterId
  const pointTypes = new Map<number, 'core' | 'border' | 'noise'>();

  let currentClusterId = 0;

  // Helper: Find all neighbors within epsilon radius
  function regionQuery(pointIdx: number): number[] {
    const neighbors: number[] = [];
    const p1 = processedPoints[pointIdx];
    for (let j = 0; j < n; j++) {
      const p2 = processedPoints[j];
      const dist = computePointDistance(p1, p2, options);
      if (dist <= epsilon) {
        neighbors.push(j);
      }
    }
    return neighbors;
  }

  // Main DBSCAN Loop
  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighborIndices = regionQuery(i);

    if (neighborIndices.length < minPts) {
      // Temporarily mark as noise (might later be reassigned as border point)
      if (!pointClusters.has(i)) {
        pointTypes.set(i, 'noise');
      }
    } else {
      // Form new cluster
      const clusterId = currentClusterId;
      currentClusterId++;

      pointClusters.set(i, clusterId);
      pointTypes.set(i, 'core');

      // Expand cluster queue
      const seedQueue = [...neighborIndices];

      let qIdx = 0;
      while (qIdx < seedQueue.length) {
        const neighborIdx = seedQueue[qIdx];
        qIdx++;

        if (!visited.has(neighborIdx)) {
          visited.add(neighborIdx);
          const subNeighbors = regionQuery(neighborIdx);

          if (subNeighbors.length >= minPts) {
            pointTypes.set(neighborIdx, 'core');
            // Add non-duplicate neighbors to exploration queue
            for (const subIdx of subNeighbors) {
              if (!seedQueue.includes(subIdx)) {
                seedQueue.push(subIdx);
              }
            }
          } else {
            // Border point (reached from core, but has < minPts)
            pointTypes.set(neighborIdx, 'border');
          }
        }

        // If neighbor is not yet assigned to any cluster, assign to current cluster
        if (!pointClusters.has(neighborIdx)) {
          pointClusters.set(neighborIdx, clusterId);
          if (!pointTypes.has(neighborIdx) || pointTypes.get(neighborIdx) === 'noise') {
            pointTypes.set(neighborIdx, 'border');
          }
        }
      }
    }
  }

  // Assign cluster_id and point_type back to data points
  for (let i = 0; i < n; i++) {
    const cid = pointClusters.get(i);
    const pType = pointTypes.get(i) || 'noise';

    processedPoints[i].cluster_id = cid !== undefined ? cid : -1;
    processedPoints[i].point_type = cid !== undefined ? pType : 'noise';
  }

  // Group into DBSCANCluster objects
  const clusterGroups = new Map<number, DataPoint[]>();
  const noisePoints: DataPoint[] = [];

  for (const pt of processedPoints) {
    if (pt.cluster_id !== undefined && pt.cluster_id >= 0) {
      if (!clusterGroups.has(pt.cluster_id)) {
        clusterGroups.set(pt.cluster_id, []);
      }
      clusterGroups.get(pt.cluster_id)!.push(pt);
    } else {
      noisePoints.push(pt);
    }
  }

  const clusters: DBSCANCluster[] = [];

  for (const [cId, pts] of clusterGroups.entries()) {
    // Compute centroid
    const avgLat = pts.reduce((sum, p) => sum + p.latitude, 0) / pts.length;
    const avgLng = pts.reduce((sum, p) => sum + p.longitude, 0) / pts.length;

    // Compute bounding radius (max distance from centroid)
    let maxDist = 0.05; // min 50 meters
    for (const p of pts) {
      const d = haversineDistanceKm(avgLat, avgLng, p.latitude, p.longitude);
      if (d > maxDist) maxDist = d;
    }

    // Area in sqkm (pi * r^2)
    const areaSqKm = Math.PI * Math.max(0.05, maxDist) * Math.max(0.05, maxDist);
    const density = Math.round((pts.length / areaSqKm) * 10) / 10;

    // Breakdowns
    const catBreakdown: Record<string, number> = {};
    const statBreakdown: Record<string, number> = {};
    const prioBreakdown: Record<string, number> = {};
    let dominantCat = 'Civic Infrastructure';
    let maxCatCount = 0;

    for (const p of pts) {
      const cName = p.category_name || 'General Civic';
      catBreakdown[cName] = (catBreakdown[cName] || 0) + 1;
      if (catBreakdown[cName] > maxCatCount) {
        maxCatCount = catBreakdown[cName];
        dominantCat = cName;
      }

      statBreakdown[p.status] = (statBreakdown[p.status] || 0) + 1;
      prioBreakdown[p.priority] = (prioBreakdown[p.priority] || 0) + 1;
    }

    // Dates
    const dates = pts.map((p) => new Date(p.created_at).getTime());
    const earliest = new Date(Math.min(...dates)).toISOString();
    const latest = new Date(Math.max(...dates)).toISOString();

    const coreCount = pts.filter((p) => p.point_type === 'core').length;
    const borderCount = pts.filter((p) => p.point_type === 'border').length;

    // Pick representative locality and ward
    const primaryPt = pts[0];
    const clusterName = `${dominantCat} Epicenter — ${primaryPt.address || primaryPt.district}`;

    clusters.push({
      cluster_id: cId,
      name: clusterName,
      centroid_latitude: Math.round(avgLat * 100000) / 100000,
      centroid_longitude: Math.round(avgLng * 100000) / 100000,
      radius_km: Math.round(maxDist * 100) / 100,
      total_points: pts.length,
      core_points_count: coreCount,
      border_points_count: borderCount,
      density_pts_per_sqkm: density,
      dominant_category: dominantCat,
      category_breakdown: catBreakdown,
      status_breakdown: statBreakdown,
      priority_breakdown: prioBreakdown,
      ward: primaryPt.ward,
      district: primaryPt.district,
      earliest_complaint: earliest,
      latest_complaint: latest,
      points: pts,
    });
  }

  // Sort clusters by size / density
  clusters.sort((a, b) => b.total_points - a.total_points || b.density_pts_per_sqkm - a.density_pts_per_sqkm);

  return {
    clusters,
    noisePoints,
    allPoints: processedPoints,
  };
}
