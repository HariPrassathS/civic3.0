// =============================================================================
// CivicConnect TN — Role Configuration
// =============================================================================
// Role hierarchy, labels, and permission checks used across the application.

import { UserRole } from '@/types/enums';

/** Role hierarchy: higher index = more privilege */
export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.CITIZEN,
  UserRole.FIELD_WORKER,
  UserRole.AREA_OFFICER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.CITY_COMMISSIONER,
  UserRole.DISTRICT_COLLECTOR,
  UserRole.DEPARTMENT_SECRETARY,
  UserRole.CHIEF_SECRETARY,
  UserRole.CHIEF_MINISTER,
  UserRole.ADMIN,
];

/** Human-readable role labels */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CITIZEN]: 'Citizen',
  [UserRole.FIELD_WORKER]: 'Field Worker',
  [UserRole.AREA_OFFICER]: 'Area Officer / AE',
  [UserRole.DEPARTMENT_HEAD]: 'Department Head / EE',
  [UserRole.CITY_COMMISSIONER]: 'City Commissioner',
  [UserRole.DISTRICT_COLLECTOR]: 'District Collector',
  [UserRole.DEPARTMENT_SECRETARY]: 'Department Secretary',
  [UserRole.CHIEF_SECRETARY]: 'Chief Secretary',
  [UserRole.CHIEF_MINISTER]: 'Chief Minister',
  [UserRole.ADMIN]: 'System Administrator',
};

/** Government roles (non-citizen, non-field-worker) */
export const GOVERNMENT_ROLES: UserRole[] = [
  UserRole.AREA_OFFICER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.CITY_COMMISSIONER,
  UserRole.DISTRICT_COLLECTOR,
  UserRole.DEPARTMENT_SECRETARY,
  UserRole.CHIEF_SECRETARY,
  UserRole.CHIEF_MINISTER,
];

/** Senior officials with state-wide or cross-region access */
export const SENIOR_ROLES: UserRole[] = [
  UserRole.CITY_COMMISSIONER,
  UserRole.DISTRICT_COLLECTOR,
  UserRole.DEPARTMENT_SECRETARY,
  UserRole.CHIEF_SECRETARY,
  UserRole.CHIEF_MINISTER,
];

/**
 * Check if a role has at least the privilege of a required role.
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Check if a role is one of the allowed roles.
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get the default redirect path after login based on role.
 */
export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case UserRole.CITIZEN:
      return '/citizen';
    case UserRole.FIELD_WORKER:
      return '/field';
    case UserRole.AREA_OFFICER:
      return '/dashboard/area-officer';
    case UserRole.DEPARTMENT_HEAD:
      return '/dashboard/dept-head';
    case UserRole.CITY_COMMISSIONER:
      return '/dashboard/commissioner';
    case UserRole.DISTRICT_COLLECTOR:
      return '/dashboard/collector';
    case UserRole.DEPARTMENT_SECRETARY:
      return '/dashboard/secretary';
    case UserRole.CHIEF_SECRETARY:
      return '/dashboard/chief-secretary';
    case UserRole.CHIEF_MINISTER:
      return '/dashboard/chief-minister';
    case UserRole.ADMIN:
      return '/admin';
    default:
      return '/citizen';
  }
}
