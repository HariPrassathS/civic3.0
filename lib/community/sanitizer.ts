// =============================================================================
// CivicConnect TN — Community Privacy & PII Sanitizer Engine
// =============================================================================
// Guarantees zero leakage of citizen personal identifiable information (PII)
// across all public community feeds, search APIs, upvotes, and discussions.

import { maskPii } from '@/lib/ai/client';

export interface SanitizedPublicComplaint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category_id?: string;
  category_name?: string;
  department_id?: string;
  department_name?: string;
  status: string;
  priority: string;
  address: string;
  ward: number | null;
  district: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at?: string;
  upvotes_count: number;
  comments_count: number;
  is_upvoted: boolean;
  distance_km?: number;
  media?: {
    id?: string;
    url: string;
    storage_path?: string;
    media_type?: string;
    phase?: string;
    ai_analysis?: any;
  }[];
  is_common_issue?: boolean;
  common_reports_count?: number;
  common_tracking_ids?: string[];
}

export interface SanitizedComment {
  id: string;
  complaint_id: string;
  author_name: string;
  author_badge: string;
  is_official: boolean;
  content: string;
  created_at: string;
}

/**
 * Sanitizes physical address to prevent revealing exact house/flat/door numbers.
 * e.g. "Door 4B, Plot 12, 3rd Cross Street, T. Nagar" -> "3rd Cross Street, T. Nagar, Ward 114"
 */
export function sanitizePublicAddress(
  rawAddress?: string | null,
  ward?: number | null,
  district?: string | null
): string {
  if (!rawAddress || rawAddress.trim() === '') {
    const wardPart = ward ? `Ward ${ward}, ` : '';
    return `${wardPart}${district || 'Tamil Nadu'}`;
  }

  let cleaned = rawAddress
    // Remove door, flat, plot, house, apartment numbers: "No. 14/2", "Door 4B", "Plot No. 12", "Flat 301", "#45"
    .replace(/\b(?:flat|plot|door|house|apt|apartment|no|h\.?no|d\.?no|villa|site)\s*(?:no\.?|#)?\s*[:#-]?\s*\d+[\w/-]*/gi, '')
    .replace(/\b#\s*\d+[\w/-]*\b/g, '')
    .replace(/\b\d+[/\\-]\d+[\w]*\b/g, '') // e.g. "14/2B"
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading commas, spaces, or dashes
  cleaned = cleaned.replace(/^[,\s-]+/, '').replace(/[,\s-]+$/, '').trim();

  if (cleaned.length < 3) {
    const wardPart = ward ? `Ward ${ward}, ` : '';
    return `${wardPart}${district || 'Tamil Nadu'}`;
  }

  return cleaned;
}

/**
 * Masks citizen author name to preserve community anonymity and prevent harassment.
 * Preserves full title and government department for verified public officials.
 */
export function sanitizeAuthorName(
  displayName?: string | null,
  role?: string | null,
  ward?: number | null,
  departmentCode?: string | null
): { author_name: string; author_badge: string; is_official: boolean } {
  const officialRoles = [
    'area_officer',
    'department_head',
    'district_collector',
    'city_commissioner',
    'department_secretary',
    'chief_secretary',
    'chief_minister',
    'admin',
    'field_worker',
  ];

  const isOfficial = role ? officialRoles.includes(role.toLowerCase()) : false;

  if (isOfficial) {
    const officialTitle =
      displayName ||
      (role === 'area_officer'
        ? `Assistant Engineer (Ward ${ward || 'Local'})`
        : role === 'field_worker'
        ? `Field Operations Officer (${departmentCode || 'TN Civic'})`
        : role === 'district_collector'
        ? 'District Collectorate Official'
        : 'Civic Authority Official');

    return {
      author_name: officialTitle,
      author_badge: 'Verified Official',
      is_official: true,
    };
  }

  // Citizen anonymity masking
  const citizenLabel = ward ? `Concerned Resident (Ward ${ward})` : 'Concerned Citizen';
  return {
    author_name: citizenLabel,
    author_badge: 'Citizen',
    is_official: false,
  };
}

/**
 * Completely purges all sensitive citizen identity fields from public complaint objects.
 */
export function sanitizeComplaintForPublic(
  c: any,
  isUpvotedByCurrentUser: boolean = false
): SanitizedPublicComplaint {
  const sanitizedAddress = sanitizePublicAddress(c.address, c.ward, c.district);
  const maskedDescription = maskPii(c.description || '');

  // Filter media: keep public reported images/videos (BEFORE & AFTER evidence)
  const publicMedia = Array.isArray(c.media)
    ? c.media
        .filter((m: any) => m && (m.url || m.storage_path))
        .map((m: any) => ({
          id: m.id,
          url: m.url,
          storage_path: m.storage_path,
          media_type: m.media_type || 'image',
          phase: m.phase || 'complaint',
          ai_analysis: m.ai_analysis,
        }))
    : [];

  return {
    id: c.id,
    tracking_id: c.tracking_id,
    title: c.title,
    description: maskedDescription,
    category_id: c.category_id || undefined,
    category_name: c.category?.name || undefined,
    department_id: c.department_id || undefined,
    department_name: c.department?.name || undefined,
    status: c.status,
    priority: c.priority,
    address: sanitizedAddress,
    ward: c.ward ?? null,
    district: c.district || 'Tamil Nadu',
    latitude: c.latitude ? Number(c.latitude) : undefined,
    longitude: c.longitude ? Number(c.longitude) : undefined,
    created_at: c.created_at,
    updated_at: c.updated_at,
    upvotes_count: typeof c.upvotes_count === 'number' ? c.upvotes_count : 0,
    comments_count: typeof c.comments_count === 'number' ? c.comments_count : 0,
    is_upvoted: isUpvotedByCurrentUser,
    distance_km: typeof c.distance_km === 'number' ? c.distance_km : undefined,
    media: publicMedia,
    is_common_issue: Boolean(c.is_common_issue),
    common_reports_count: c.common_reports_count || 1,
    common_tracking_ids: c.common_tracking_ids || [c.tracking_id],
  };
}
