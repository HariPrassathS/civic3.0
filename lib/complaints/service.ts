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

// In-memory store for fallback/demo complaints
export const MEMORY_COMPLAINTS: (Complaint & {
  media?: ComplaintMedia[];
  updates?: ComplaintUpdate[];
  upvotes_count?: number;
  comments_count?: number;
  is_upvoted?: boolean;
  latitude?: number;
  longitude?: number;
})[] = [
  {
    id: 'demo-cmp-1',
    tracking_id: 'CC-TN-2026-104921',
    citizen_id: 'dev-user-citizen',
    category_id: 'cat-roads-1',
    department_id: 'dept-roads',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Severe Pothole Cluster on Usman Road Flyover descent',
    description:
      'Multiple deep potholes covering 15 meters on the descent towards T. Nagar bus terminus. Causing dangerous traffic slowdowns and water pooling.',
    location: null,
    address: 'Usman Road Flyover, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    source: ComplaintSource.TEXT,
    language: 'en',
    is_public: true,
    sla_deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    sla_breached: false,
    escalation_level: 0,
    ai_category_confidence: 0.96,
    ai_priority_confidence: 0.92,
    ai_sentiment: 'Urgent/Frustrated',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    latitude: 13.0418,
    longitude: 80.2341,
    upvotes_count: 42,
    comments_count: 5,
    media: [
      {
        id: 'media-1',
        complaint_id: 'demo-cmp-1',
        media_type: MediaType.IMAGE,
        storage_path: 'demo/pothole1.jpg',
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        phase: MediaPhase.COMPLAINT,
        uploaded_by: null,
        ai_analysis: null,
        created_at: new Date().toISOString(),
      },
    ],
    updates: [
      {
        id: 'upd-1',
        complaint_id: 'demo-cmp-1',
        updated_by: 'system',
        previous_status: null,
        new_status: 'created',
        update_type: UpdateType.STATUS_CHANGE,
        notes: 'Complaint registered and assigned tracking ID CC-TN-2026-104921.',
        metadata: null,
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-2',
        complaint_id: 'demo-cmp-1',
        updated_by: 'ae.chennai',
        previous_status: 'created',
        new_status: 'in_progress',
        update_type: UpdateType.STATUS_CHANGE,
        notes: 'Inspected by Area Officer Ward 114. Road repair crew dispatched.',
        metadata: null,
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'demo-cmp-2',
    tracking_id: 'CC-TN-2026-218492',
    citizen_id: 'dev-user-citizen',
    category_id: 'cat-water-3',
    department_id: 'dept-water',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.URGENT,
    title: 'Drinking Water Main Pipeline Burst on Velachery Main Road',
    description:
      'Major pipeline leak opposite Phoenix MarketCity. Clean drinking water flooding the road since 6 AM.',
    location: null,
    address: 'Near Phoenix MarketCity, Velachery Main Road, Chennai',
    ward: 175,
    district: 'Chennai',
    source: ComplaintSource.TEXT,
    language: 'en',
    is_public: true,
    sla_deadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    sla_breached: false,
    escalation_level: 0,
    ai_category_confidence: 0.98,
    ai_priority_confidence: 0.95,
    ai_sentiment: 'Urgent',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    latitude: 12.9915,
    longitude: 80.2185,
    upvotes_count: 87,
    comments_count: 12,
    media: [
      {
        id: 'media-2',
        complaint_id: 'demo-cmp-2',
        media_type: MediaType.IMAGE,
        storage_path: 'demo/waterleak.jpg',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        phase: MediaPhase.COMPLAINT,
        uploaded_by: null,
        ai_analysis: null,
        created_at: new Date().toISOString(),
      },
    ],
    updates: [
      {
        id: 'upd-21',
        complaint_id: 'demo-cmp-2',
        updated_by: 'system',
        previous_status: null,
        new_status: 'created',
        update_type: UpdateType.STATUS_CHANGE,
        notes: 'Complaint logged via CivicConnect Portal.',
        metadata: null,
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-22',
        complaint_id: 'demo-cmp-2',
        updated_by: 'system',
        previous_status: 'created',
        new_status: 'assigned',
        update_type: UpdateType.REASSIGNMENT,
        notes: 'Auto-assigned to CMWSSB Velachery Area Maintenance Division.',
        metadata: null,
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'demo-cmp-3',
    tracking_id: 'CC-TN-2026-339104',
    citizen_id: 'dev-user-citizen',
    category_id: 'cat-swm-1',
    department_id: 'dept-swm',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.HIGH,
    title: 'Garbage Dump uncleared for 4 days near Mylapore Temple Tank',
    description:
      'Heavy accumulation of mixed waste attracting stray animals near North Mada Street.',
    location: null,
    address: 'North Mada Street, Mylapore, Chennai',
    ward: 122,
    district: 'Chennai',
    source: ComplaintSource.TEXT,
    language: 'en',
    is_public: true,
    sla_deadline: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    sla_breached: false,
    escalation_level: 0,
    ai_category_confidence: 0.95,
    ai_priority_confidence: 0.9,
    ai_sentiment: 'Concerned',
    resolved_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    closed_at: null,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    latitude: 13.0336,
    longitude: 80.2697,
    upvotes_count: 53,
    comments_count: 8,
    media: [
      {
        id: 'media-3a',
        complaint_id: 'demo-cmp-3',
        media_type: MediaType.IMAGE,
        storage_path: 'demo/garbage_before.jpg',
        url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
        phase: MediaPhase.COMPLAINT,
        uploaded_by: null,
        ai_analysis: null,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'media-3b',
        complaint_id: 'demo-cmp-3',
        media_type: MediaType.IMAGE,
        storage_path: 'demo/garbage_after.jpg',
        url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        phase: MediaPhase.AFTER_RESOLUTION,
        uploaded_by: null,
        ai_analysis: null,
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
    updates: [
      {
        id: 'upd-31',
        complaint_id: 'demo-cmp-3',
        updated_by: 'system',
        previous_status: null,
        new_status: 'created',
        update_type: UpdateType.STATUS_CHANGE,
        notes: 'Complaint logged.',
        metadata: null,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'upd-32',
        complaint_id: 'demo-cmp-3',
        updated_by: 'worker.murugan',
        previous_status: 'in_progress',
        new_status: 'resolved',
        update_type: UpdateType.VERIFICATION,
        notes: 'Sanitation vehicle cleared 3 tons of garbage. Area disinfected with bleaching powder.',
        metadata: null,
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
];
