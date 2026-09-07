// =============================================================================
// CivicConnect TN — Strict AI Schemas & Runtime Response Validators
// =============================================================================
// Guarantees that AI inferences always conform to valid database enums,
// registered categories, and safety bounds without hallucinated fields.

import { Priority, VerificationResult } from '@/types/enums';
import { MASTER_CATEGORIES, MASTER_DEPARTMENTS } from '@/lib/complaints/categories';

// -----------------------------------------------------------------------------
// 1. Complaint Categorization Schema
// -----------------------------------------------------------------------------
export interface CategorizationResult {
  categoryCode: string;
  departmentCode: string;
  categoryId: string;
  departmentId: string;
  confidence: number;
  reasoning: string;
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 2. Priority Analysis Schema
// -----------------------------------------------------------------------------
export interface PriorityAnalysisResult {
  priority: Priority;
  confidence: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 3. Sentiment & Urgency Schema
// -----------------------------------------------------------------------------
export interface SentimentAnalysisResult {
  sentiment: string; // e.g. "Distress", "Frustrated", "Urgent", "Concerned", "Neutral"
  urgencyScore: number; // 0 to 100
  citizenTone: 'ANGRY' | 'ANXIOUS' | 'NEUTRAL' | 'APPRECIATIVE';
  emotionKeywords: string[];
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 4. Safety Risk Detection Schema
// -----------------------------------------------------------------------------
export interface SafetyRiskResult {
  isSafetyRisk: boolean;
  hazardType: 'ELECTRICAL' | 'STRUCTURAL_ROAD' | 'HEALTH_WATER' | 'FIRE_HAZARD' | 'TRAFFIC_COLLISION' | 'NONE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  immediateActionRecommended: string;
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 5. Duplicate Detection Schema
// -----------------------------------------------------------------------------
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOfTrackingId: string | null;
  similarityScore: number; // 0.0 to 1.0
  explanation: string;
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 6. Complaint Summarization Schema
// -----------------------------------------------------------------------------
export interface SummarizationResult {
  englishSummary: string;
  tamilSummary: string;
  keyActionItem: string;
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 7. Resolution Verification Schema
// -----------------------------------------------------------------------------
export interface ResolutionVerificationResult {
  verificationResult: VerificationResult;
  confidence: number; // 0.0 to 1.0
  assessmentNotes: string;
  beforeAfterComparison: {
    problemIdentifiedBefore: string;
    rectificationObservedAfter: string;
    anomalyDetected: boolean;
  };
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// 8. Insight Generation Schema
// -----------------------------------------------------------------------------
export interface InsightGenerationResult {
  macroInsights: string[];
  recurringFailurePatterns: string[];
  preventiveRecommendations: string[];
  hotspotAreas: string[];
  isAiGenerated: boolean;
}

// -----------------------------------------------------------------------------
// Unified Full Triage Result
// -----------------------------------------------------------------------------
export interface FullTriageResult {
  categorization: CategorizationResult;
  priority: PriorityAnalysisResult;
  sentiment: SentimentAnalysisResult;
  safety: SafetyRiskResult;
  summary: SummarizationResult;
}

// =============================================================================
// Strict Runtime Validation Helpers
// =============================================================================

/**
 * Validates that a categoryCode is grounded in the real database registry.
 * Never allows invented or hallucinated categories.
 */
export function validateAndGroundCategory(
  categoryCode: unknown,
  departmentCode?: unknown
): {
  categoryCode: string;
  departmentCode: string;
  categoryId: string;
  departmentId: string;
} {
  const codeStr = typeof categoryCode === 'string' ? categoryCode.toUpperCase().trim() : '';

  // Alias mappings
  const ALIASES: Record<string, string> = {
    WATER_PIPELINE_LEAK: 'WATER_PIPE_LEAK',
    WATER_LEAK: 'WATER_PIPE_LEAK',
    ROAD_POTHOLE: 'ROADS_POTHOLE',
    ROAD_DAMAGE: 'ROADS_DAMAGE',
    GARBAGE_DUMP: 'SANIT_GARBAGE_DUMP',
    SEWAGE_OVERFLOW: 'DRAIN_SEWAGE',
    STREETLIGHT_OUT: 'LIGHT_NOT_WORKING',
  };

  const normalizedCode = ALIASES[codeStr] || codeStr;

  // 1. Direct match on registered category
  const exactCat = MASTER_CATEGORIES.find((c) => c.code === normalizedCode);
  if (exactCat) {
    return {
      categoryCode: exactCat.code,
      departmentCode: exactCat.department_code,
      categoryId: exactCat.id,
      departmentId: exactCat.department_id,
    };
  }

  // 2. Department-level match
  const deptStr = typeof departmentCode === 'string' ? departmentCode.toUpperCase().trim() : '';
  const matchingDept = MASTER_DEPARTMENTS.find((d) => d.code === deptStr);
  if (matchingDept) {
    const firstDeptCat = MASTER_CATEGORIES.find((c) => c.department_code === matchingDept.code);
    if (firstDeptCat) {
      return {
        categoryCode: firstDeptCat.code,
        departmentCode: matchingDept.code,
        categoryId: firstDeptCat.id,
        departmentId: matchingDept.id,
      };
    }
  }

  // 3. Absolute safe fallback: General Civic Category (GEN_OTHER)
  const defaultCat = MASTER_CATEGORIES.find((c) => c.code === 'GEN_OTHER') || MASTER_CATEGORIES[0];
  return {
    categoryCode: defaultCat.code,
    departmentCode: defaultCat.department_code,
    categoryId: defaultCat.id,
    departmentId: defaultCat.department_id,
  };
}

/**
 * Validates that priority is an exact valid Priority enum value.
 */
export function validateAndGroundPriority(priority: unknown): Priority {
  if (typeof priority !== 'string') return Priority.MEDIUM;
  const p = priority.toLowerCase().trim();
  if (p === Priority.URGENT) return Priority.URGENT;
  if (p === Priority.HIGH) return Priority.HIGH;
  if (p === Priority.MEDIUM) return Priority.MEDIUM;
  if (p === Priority.LOW) return Priority.LOW;
  return Priority.MEDIUM;
}

/**
 * Validates VerificationResult enum value.
 */
export function validateAndGroundVerificationResult(val: unknown): VerificationResult {
  if (typeof val !== 'string') return VerificationResult.REQUIRES_REVIEW;
  const v = val.toLowerCase().trim();
  if (v === VerificationResult.VERIFIED) return VerificationResult.VERIFIED;
  if (v === VerificationResult.SUSPICIOUS) return VerificationResult.SUSPICIOUS;
  if (v === VerificationResult.REQUIRES_REVIEW) return VerificationResult.REQUIRES_REVIEW;
  return VerificationResult.REQUIRES_REVIEW;
}
