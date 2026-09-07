// =============================================================================
// CivicConnect TN — Predictive Recurrence & Infrastructure Failure Analytics
// =============================================================================
// Identifies chronic breakdown hotspots, spatial-temporal repeat failures,
// and unresolved infrastructure strain at micro-locations.

import { calculateDistanceKm } from '@/lib/complaints/service';

export interface RecurrentLocationCluster {
  centroid_lat: number;
  centroid_lng: number;
  locality: string;
  ward: number | null;
  district: string;
  category: string;
  complaints: any[];
  total_count: number;
  unresolved_count: number;
  recurrence_score: number; // 0 to 100
  chronic_indicator: boolean;
  repeat_time_span_days: number;
  average_days_between_complaints: number;
}

/**
 * Groups complaints by micro-geographic proximity (< 0.25 km) and category to find repeat failures.
 */
export function analyzeInfrastructureRecurrence(
  complaints: any[],
  radiusKm: number = 0.25
): RecurrentLocationCluster[] {
  const clusters: RecurrentLocationCluster[] = [];
  const visited = new Set<string>();

  // Filter complaints with valid coordinates
  const validComplaints = complaints.filter(
    (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude)
  );

  for (let i = 0; i < validComplaints.length; i++) {
    const cA = validComplaints[i];
    const keyA = cA.id || cA.tracking_id || `item-${i}`;
    if (visited.has(keyA)) continue;

    const group = [cA];
    visited.add(keyA);

    for (let j = i + 1; j < validComplaints.length; j++) {
      const cB = validComplaints[j];
      const keyB = cB.id || cB.tracking_id || `item-${j}`;
      if (visited.has(keyB)) continue;

      // Check category match or category equivalence
      const catA = (cA.category_name || cA.category_id || '').toLowerCase();
      const catB = (cB.category_name || cB.category_id || '').toLowerCase();
      const sameCategory = catA === catB || catA.includes(catB) || catB.includes(catA);

      if (sameCategory) {
        const distKm = calculateDistanceKm(cA.latitude, cA.longitude, cB.latitude, cB.longitude);
        if (distKm <= radiusKm) {
          group.push(cB);
          visited.add(keyB);
        }
      }
    }

    if (group.length >= 2) {
      // Calculate cluster metrics
      let sumLat = 0;
      let sumLng = 0;
      let unresolvedCount = 0;
      const timestamps: number[] = [];

      for (const item of group) {
        sumLat += item.latitude;
        sumLng += item.longitude;
        const status = (item.status || '').toLowerCase();
        if (status !== 'resolved' && status !== 'closed') {
          unresolvedCount++;
        }
        const createdMs = new Date(item.created_at || Date.now()).getTime();
        if (!isNaN(createdMs)) timestamps.push(createdMs);
      }

      timestamps.sort((a, b) => a - b);
      const earliest = timestamps[0] || Date.now();
      const latest = timestamps[timestamps.length - 1] || Date.now();
      const spanDays = Math.max(1, Math.round((latest - earliest) / (24 * 3600 * 1000)));

      let avgDaysBetween = spanDays;
      if (timestamps.length > 1) {
        avgDaysBetween = Math.round(spanDays / (timestamps.length - 1));
      }

      // Recurrence score calculation (0 to 100)
      // High count + shorter intervals + high unresolved ratio => higher recurrence score
      const countScore = Math.min(group.length * 15, 50); // Up to 50 pts for count >= 4
      const persistenceScore = Math.min(Math.max(0, 100 - avgDaysBetween * 2), 30); // Up to 30 pts for frequent repeat
      const unresolvedRatio = unresolvedCount / group.length;
      const unresolvedScore = Math.round(unresolvedRatio * 20); // Up to 20 pts

      const recurrenceScore = Math.min(100, countScore + persistenceScore + unresolvedScore);
      const isChronic = group.length >= 3 && spanDays >= 14;

      const primary = group[0];
      clusters.push({
        centroid_lat: sumLat / group.length,
        centroid_lng: sumLng / group.length,
        locality: primary.address || primary.locality || `Ward ${primary.ward || 'General'}`,
        ward: primary.ward || null,
        district: primary.district || 'Chennai',
        category: primary.category_name || primary.category_id || 'General Infrastructure',
        complaints: group,
        total_count: group.length,
        unresolved_count: unresolvedCount,
        recurrence_score: recurrenceScore,
        chronic_indicator: isChronic,
        repeat_time_span_days: spanDays,
        average_days_between_complaints: avgDaysBetween,
      });
    }
  }

  // Sort by highest recurrence score descending
  return clusters.sort((a, b) => b.recurrence_score - a.recurrence_score);
}
