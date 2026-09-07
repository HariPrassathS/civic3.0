// =============================================================================
// CivicConnect TN — Complaint Service Layer
// =============================================================================

import { ComplaintStatus, Priority, ComplaintSource, MediaType, MediaPhase, UpdateType } from '@/types/enums';
import type { Complaint, ComplaintMedia, ComplaintUpdate } from '@/types/database';

export interface CreateComplaintInput {
  citizen_id: string;
  category_id?: string;
  department_id?: string;
  title: string;
  description: string;
  priority?: Priority;
  latitude?: number;
  longitude?: number;
  address?: string;
  ward?: number;
  district?: string;
  source?: ComplaintSource;
  language?: string;
  is_public?: boolean;
  media?: {
    url: string;
    storage_path?: string;
    media_type: 'image' | 'video' | 'audio' | 'document';
  }[];
}

/**
 * Generates a human-friendly tracking ID for Tamil Nadu citizens.
 * Format: CC-TN-YYYY-XXXXXX (e.g. CC-TN-2026-489210)
 */
export function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `CC-TN-${year}-${randomSuffix}`;
}

/**
 * Calculate SLA deadline in hours based on priority.
 */
export function calculateSlaDeadline(priority: Priority = Priority.MEDIUM): Date {
  const hoursMap: Record<Priority, number> = {
    [Priority.URGENT]: 12,
    [Priority.HIGH]: 24,
    [Priority.MEDIUM]: 48,
    [Priority.LOW]: 72,
  };
  const hours = hoursMap[priority] || 48;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Computes Haversine distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(
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
  return Math.round(R * c * 10) / 10;
}

// In-memory store for fallback/runtime complaints
export const MEMORY_COMPLAINTS: (Complaint & {
  media?: ComplaintMedia[];
  updates?: ComplaintUpdate[];
  upvotes_count?: number;
  comments_count?: number;
  is_upvoted?: boolean;
  latitude?: number;
  longitude?: number;
})[] = [];

