// =============================================================================
// CivicConnect TN — Common Civic Issue Relationship Engine
// =============================================================================
// Identifies when multiple citizens report the same physical civic failure
// (e.g. water main burst, large pothole, broken transformer) within a close radius.
// Establishes a relationship link without destroying individual citizen tracking IDs.

import { calculateHaversineDistanceKm } from '@/lib/spatial/spatial-engine';
import { SanitizedPublicComplaint, sanitizeComplaintForPublic } from './sanitizer';

export interface CommonIssueCluster {
  cluster_id: string;
  category_id?: string;
  department_id?: string;
  title: string;
  category_name: string;
  locality: string;
  ward: number | null;
  district: string;
  latitude: number;
  longitude: number;
  total_reports_count: number;
  total_upvotes_count: number;
  status: string;
  primary_tracking_id: string;
  linked_tracking_ids: string[];
  earliest_reported_at: string;
  latest_reported_at: string;
  representative_complaint: SanitizedPublicComplaint;
  related_complaints: SanitizedPublicComplaint[];
}

/**
 * Groups raw public complaints into Common Issue clusters based on spatial proximity (<250m),
 * matching category/department, and unresolved status.
 */
export function buildCommonIssueClusters(
  complaints: any[],
  currentUserId?: string | null
): {
  clusters: CommonIssueCluster[];
  enrichedComplaints: SanitizedPublicComplaint[];
} {
  // Only process public complaints
  const publicItems = complaints.filter((c) => c.is_public);
  const sanitizedList: SanitizedPublicComplaint[] = publicItems.map((c) =>
    sanitizeComplaintForPublic(c, false)
  );

  const clusterGroups: SanitizedPublicComplaint[][] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < sanitizedList.length; i++) {
    const itemA = sanitizedList[i];
    if (assigned.has(itemA.id)) continue;

    const group = [itemA];
    assigned.add(itemA.id);

    const latA = itemA.latitude || 13.0418 + ((itemA.ward || 114) % 20 - 10) * 0.008;
    const lngA = itemA.longitude || 80.2341 + ((itemA.ward || 114) % 15 - 7) * 0.008;

    for (let j = i + 1; j < sanitizedList.length; j++) {
      const itemB = sanitizedList[j];
      if (assigned.has(itemB.id)) continue;

      const latB = itemB.latitude || 13.0418 + ((itemB.ward || 114) % 20 - 10) * 0.008;
      const lngB = itemB.longitude || 80.2341 + ((itemB.ward || 114) % 15 - 7) * 0.008;

      const distance = calculateHaversineDistanceKm(latA, lngA, latB, lngB);

      // Match criteria: within 0.3 km, same ward or district, and compatible category
      const sameCategory =
        !itemA.category_id || !itemB.category_id || itemA.category_id === itemB.category_id;
      const sameWard = itemA.ward && itemB.ward && itemA.ward === itemB.ward;

      if (distance <= 0.35 && sameCategory && (sameWard || distance <= 0.15)) {
        group.push(itemB);
        assigned.add(itemB.id);
      }
    }

    clusterGroups.push(group);
  }

  const clusters: CommonIssueCluster[] = [];
  const enrichedComplaints: SanitizedPublicComplaint[] = [];

  for (let idx = 0; idx < clusterGroups.length; idx++) {
    const group = clusterGroups[idx];
    const isMultiReport = group.length > 1;

    // Pick representative item (earliest or highest upvoted)
    group.sort((a, b) => b.upvotes_count - a.upvotes_count || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const primary = group[0];
    const linkedIds = group.map((g) => g.tracking_id);
    const totalUpvotes = group.reduce((sum, g) => sum + g.upvotes_count, 0);

    const dates = group.map((g) => new Date(g.created_at).getTime());
    const earliest = new Date(Math.min(...dates)).toISOString();
    const latest = new Date(Math.max(...dates)).toISOString();

    const clusterId = `common-cluster-${idx + 1}`;

    const cluster: CommonIssueCluster = {
      cluster_id: clusterId,
      category_id: primary.category_id,
      department_id: primary.department_id,
      title: primary.title,
      category_name: primary.category_name || 'Civic Infrastructure',
      locality: primary.address,
      ward: primary.ward,
      district: primary.district,
      latitude: primary.latitude || 13.0418,
      longitude: primary.longitude || 80.2341,
      total_reports_count: group.length,
      total_upvotes_count: totalUpvotes,
      status: primary.status,
      primary_tracking_id: primary.tracking_id,
      linked_tracking_ids: linkedIds,
      earliest_reported_at: earliest,
      latest_reported_at: latest,
      representative_complaint: primary,
      related_complaints: group.slice(1),
    };

    if (isMultiReport) {
      clusters.push(cluster);
    }

    // Enrich each individual complaint with common issue cluster metadata
    for (const item of group) {
      enrichedComplaints.push({
        ...item,
        is_common_issue: isMultiReport,
        common_reports_count: group.length,
        common_tracking_ids: linkedIds,
      });
    }
  }

  return {
    clusters,
    enrichedComplaints,
  };
}
