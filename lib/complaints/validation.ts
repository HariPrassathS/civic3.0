// =============================================================================
// CivicConnect TN — Complaint Validation Layer
// =============================================================================
// Centralized, strict validation logic for complaint intake, status transitions,
// assignment authorization, citizen ownership verification, and feedback constraints.

import { ComplaintStatus, Priority, ComplaintSource, UserRole, MediaType } from '@/types/enums';
import { isValidTransition } from '@/config/lifecycle';
import type { Complaint } from '@/types/database';

/** Input shape for creating a complaint */
export interface ComplaintInput {
  title: string;
  description: string;
  category_id?: string | null;
  department_id?: string | null;
  priority?: Priority;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  ward?: number | null;
  district?: string | null;
  source?: ComplaintSource;
  language?: string;
  is_public?: boolean;
  media?: Array<{
    url: string;
    storage_path?: string;
    media_type?: MediaType;
  }>;
}

/** Actor executing an engine action */
export interface ComplaintActor {
  id: string;
  role: UserRole;
  email?: string;
  display_name?: string;
  displayName?: string;
}

/** Validation result object */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/** Tamil Nadu geographic bounding box boundaries */
export const TN_BOUNDS = {
  MIN_LAT: 8.0,
  MAX_LAT: 13.6,
  MIN_LNG: 76.2,
  MAX_LNG: 80.4,
};

/**
 * Validates raw user input for creating a new complaint.
 */
export function validateComplaintInput(input: Partial<ComplaintInput>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!input.title || typeof input.title !== 'string') {
    errors.push('Complaint title is required');
  } else {
    const trimmedTitle = input.title.trim();
    if (trimmedTitle.length < 5) {
      errors.push('Complaint title must be at least 5 characters long');
    }
    if (trimmedTitle.length > 150) {
      errors.push('Complaint title must not exceed 150 characters');
    }
  }

  // Description validation
  if (!input.description || typeof input.description !== 'string') {
    errors.push('Complaint description is required');
  } else {
    const trimmedDesc = input.description.trim();
    if (trimmedDesc.length < 10) {
      errors.push('Complaint description must be at least 10 characters long');
    }
    if (trimmedDesc.length > 2000) {
      errors.push('Complaint description must not exceed 2000 characters');
    }
  }

  // Priority validation
  if (input.priority) {
    const validPriorities = Object.values(Priority);
    if (!validPriorities.includes(input.priority)) {
      errors.push(`Invalid priority '${input.priority}'. Allowed: ${validPriorities.join(', ')}`);
    }
  }

  // Source validation
  if (input.source) {
    const validSources = Object.values(ComplaintSource);
    if (!validSources.includes(input.source)) {
      errors.push(`Invalid source '${input.source}'. Allowed: ${validSources.join(', ')}`);
    }
  }

  // GPS Coordinates validation
  if (input.latitude !== undefined && input.latitude !== null && input.longitude !== undefined && input.longitude !== null) {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a valid floating point number between -90 and 90');
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a valid floating point number between -180 and 180');
    }

    // Tamil Nadu Geographic boundary check
    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat < TN_BOUNDS.MIN_LAT || lat > TN_BOUNDS.MAX_LAT || lng < TN_BOUNDS.MIN_LNG || lng > TN_BOUNDS.MAX_LNG) {
        warnings.push(
          `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) appear to be outside the state of Tamil Nadu boundary.`
        );
      }
    }
  }

  // Ward validation
  if (input.ward !== undefined && input.ward !== null) {
    const wardNum = Number(input.ward);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > 200) {
      errors.push('Ward number must be an integer between 1 and 200');
    }
  }

  // Media validation:
  // Literate web users (source: TEXT / undefined) MUST provide at least 1 photo/video evidence.
  // Illiterate/accessible voice users (source: VOICE) can optionally upload media.
  const isVoiceUser = input.source === ComplaintSource.VOICE;

  if (!isVoiceUser) {
    if (!input.media || !Array.isArray(input.media) || input.media.length === 0) {
      errors.push('Photo/video evidence is mandatory for standard web grievance submissions. Please upload at least one photo showing the issue.');
    }
  }

  if (input.media && Array.isArray(input.media)) {
    if (input.media.length > 10) {
      errors.push('Cannot attach more than 10 media items to a single complaint');
    }
    for (let i = 0; i < input.media.length; i++) {
      const item = input.media[i];
      if (!item.url || typeof item.url !== 'string') {
        errors.push(`Media item #${i + 1} is missing a valid URL`);
      }
      if (item.media_type && !Object.values(MediaType).includes(item.media_type)) {
        errors.push(`Media item #${i + 1} has an invalid media type '${item.media_type}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates whether an actor has permission and ownership to transition a complaint's status.
 */
export function validateStatusTransition(
  complaint: Complaint,
  newStatus: ComplaintStatus,
  actor: ComplaintActor,
  isSystem = false
): ValidationResult {
  const errors: string[] = [];

  if (!complaint) {
    errors.push('Target complaint does not exist');
    return { valid: false, errors };
  }

  // 1. Check if newStatus is a valid enum value
  if (!Object.values(ComplaintStatus).includes(newStatus)) {
    errors.push(`Invalid target status '${newStatus}'`);
    return { valid: false, errors };
  }

  // 2. Check State Machine valid transition
  const validTransition = isValidTransition(complaint.status, newStatus, actor.role, isSystem);
  if (!validTransition) {
    errors.push(
      `Illegal status transition from '${complaint.status}' to '${newStatus}' for role '${actor.role}'`
    );
  }

  // 3. Citizen Ownership Verification
  if (actor.role === UserRole.CITIZEN && !isSystem) {
    if (complaint.citizen_id !== actor.id) {
      errors.push('Unauthorized: Citizens can only manage grievances they originally submitted.');
    }

    // Citizens cannot arbitrarily jump lifecycle stages
    const citizenAllowedTargets = [ComplaintStatus.CLOSED, ComplaintStatus.REOPENED];
    if (!citizenAllowedTargets.includes(newStatus)) {
      errors.push(`Unauthorized: Citizen role cannot set status to '${newStatus}'.`);
    }
  }

  // 4. Field Worker Role Boundaries
  if (actor.role === UserRole.FIELD_WORKER && !isSystem) {
    const workerAllowedTargets = [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLUTION_SUBMITTED];
    if (!workerAllowedTargets.includes(newStatus)) {
      errors.push(`Unauthorized: Field worker cannot set status to '${newStatus}'. Must submit resolution for officer verification.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates whether a complaint can be assigned or reassigned by the actor.
 */
export function validateAssignment(
  complaint: Complaint,
  assignedTo: string,
  actor: ComplaintActor
): ValidationResult {
  const errors: string[] = [];

  if (!complaint) {
    errors.push('Target complaint does not exist');
    return { valid: false, errors };
  }

  if (!assignedTo || typeof assignedTo !== 'string' || assignedTo.trim() === '') {
    errors.push('Assigned recipient user ID is required');
  }

  // Only authorized management/administrative roles can assign work
  const assignerRoles = [
    UserRole.AREA_OFFICER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.CITY_COMMISSIONER,
    UserRole.DISTRICT_COLLECTOR,
    UserRole.DEPARTMENT_SECRETARY,
    UserRole.CHIEF_SECRETARY,
    UserRole.CHIEF_MINISTER,
    UserRole.ADMIN,
  ];

  if (!assignerRoles.includes(actor.role)) {
    errors.push(`Role '${actor.role}' is not authorized to assign complaints.`);
  }

  // Check if complaint is in an assignable status
  const assignableStatuses = [
    ComplaintStatus.VALIDATED,
    ComplaintStatus.ASSIGNED,
    ComplaintStatus.REOPENED,
    ComplaintStatus.ESCALATED,
  ];

  if (!assignableStatuses.includes(complaint.status)) {
    errors.push(
      `Cannot assign complaint in status '${complaint.status}'. Complaint must be in Validated, Assigned, Reopened, or Escalated status.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates citizen feedback submission constraints.
 */
export function validateCitizenFeedback(
  complaint: Complaint,
  rating: number,
  satisfied: boolean,
  actor: ComplaintActor
): ValidationResult {
  const errors: string[] = [];

  if (!complaint) {
    errors.push('Target complaint does not exist');
    return { valid: false, errors };
  }

  // Enforce Citizen Ownership
  if (actor.role === UserRole.CITIZEN && complaint.citizen_id !== actor.id) {
    errors.push('Unauthorized: You can only submit feedback for your own complaints.');
  }

  // Rating must be integer 1 to 5
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer between 1 and 5 stars');
  }

  // Complaint must be resolved or awaiting feedback
  const feedbackAllowedStatuses = [
    ComplaintStatus.RESOLVED,
    ComplaintStatus.CITIZEN_FEEDBACK,
    ComplaintStatus.CLOSED,
  ];

  if (!feedbackAllowedStatuses.includes(complaint.status)) {
    errors.push(
      `Cannot submit feedback for complaint with status '${complaint.status}'. Issue must be resolved first.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
