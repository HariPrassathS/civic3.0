// =============================================================================
// CivicConnect TN — Predictive Role-Based Visibility & Authorization
// =============================================================================
// Tailors predictive analytics, risks, and actionable recommendations based on
// user role (Citizen vs Area Officer vs Department Head vs District Collector).

import { UserRole } from '@/types/enums';
import {
  PredictiveRisk,
  PreventativeAction,
  RoleContext,
  UnifiedPredictiveResponse,
} from './types';

/**
 * Returns RoleContext configuration based on user role string.
 */
export function getPredictiveRoleContext(roleStr: string = 'citizen'): RoleContext {
  const role = (roleStr || 'citizen').toLowerCase();

  switch (role) {
    case 'citizen':
      return {
        role: UserRole.CITIZEN,
        view_mode: 'public',
        can_dispatch: false,
        can_view_internal_crew_allocations: false,
        scope_description:
          'Public View: Viewing community early warnings, seasonal advisories, and citizen preparedness tips.',
      };

    case 'field_worker':
    case 'area_officer':
      return {
        role: role as UserRole,
        view_mode: 'tactical',
        can_dispatch: true,
        can_view_internal_crew_allocations: true,
        scope_description:
          'Tactical Officer View: Ward-level early alerts, equipment checklists, and actionable preventive inspection tasks.',
      };

    case 'department_head':
      return {
        role: UserRole.DEPARTMENT_HEAD,
        view_mode: 'tactical',
        can_dispatch: true,
        can_view_internal_crew_allocations: true,
        scope_description:
          'Departmental Leadership View: Asset degradation indices, crew re-allocation directives, and preventative work-order dispatch.',
      };

    case 'city_commissioner':
    case 'district_collector':
    case 'department_secretary':
    case 'chief_secretary':
    case 'chief_minister':
    case 'admin':
      return {
        role: role as UserRole,
        view_mode: 'strategic',
        can_dispatch: true,
        can_view_internal_crew_allocations: true,
        scope_description:
          'Executive Command View: Cross-departmental vulnerability matrix, seasonal disaster mitigation, and inter-agency resource mobilization.',
      };

    default:
      return {
        role: UserRole.CITIZEN,
        view_mode: 'public',
        can_dispatch: false,
        can_view_internal_crew_allocations: false,
        scope_description: 'Public View',
      };
  }
}

/**
 * Applies role-based filters and redactions to UnifiedPredictiveResponse.
 */
export function scopePredictiveResponseByRole(
  response: UnifiedPredictiveResponse,
  roleStr: string = 'citizen',
  userWard?: number,
  userDepartmentId?: string
): UnifiedPredictiveResponse {
  const context = getPredictiveRoleContext(roleStr);
  const isCitizen = context.view_mode === 'public';
  const isAreaOfficer = context.role === UserRole.AREA_OFFICER || context.role === UserRole.FIELD_WORKER;
  const isDeptHead = context.role === UserRole.DEPARTMENT_HEAD;

  let scopedRisks = [...response.risks];
  let scopedProblemAreas = [...response.future_problem_areas];
  let scopedPatterns = [...response.emerging_patterns];

  // If Area Officer has a specific ward assigned, filter accordingly
  if (isAreaOfficer && typeof userWard === 'number') {
    scopedRisks = scopedRisks.filter((r) => r.ward === userWard || r.ward === null);
    scopedProblemAreas = scopedProblemAreas.filter((p) => p.ward === userWard || p.ward === null);
    scopedPatterns = scopedPatterns.filter((p) => p.ward === userWard || p.ward === null);
  }

  // If Department Head has a specific department, prioritize that department
  if (isDeptHead && userDepartmentId) {
    scopedRisks = scopedRisks.filter((r) =>
      r.preventative_actions.some((a) => a.target_department_id === userDepartmentId)
    );
  }

  // Redact internal administrative/crew details for Citizens
  if (isCitizen) {
    scopedRisks = scopedRisks.map((risk) => ({
      ...risk,
      preventative_actions: risk.preventative_actions.map((action) => ({
        ...action,
        instructions: `Municipal preventative maintenance planned for ${risk.locality}. Citizens advised to cooperate with ground crews.`,
        recommended_crew: 'Municipal Maintenance Unit',
        equipment_needed: ['Standard Municipal Machinery'],
      })),
    }));
  }

  return {
    ...response,
    role_context: context,
    risks: scopedRisks,
    future_problem_areas: scopedProblemAreas,
    emerging_patterns: scopedPatterns,
  };
}
