// =============================================================================
// CivicConnect TN — Deterministic Local Fallback AI Engines
// =============================================================================
// Zero-downtime, rule-based heuristics providing guaranteed valid schema outputs
// when Groq AI is unreachable, rate-limited, offline, or returns malformed JSON.

import { Priority, VerificationResult } from '@/types/enums';
import {
  CategorizationResult,
  PriorityAnalysisResult,
  SentimentAnalysisResult,
  SafetyRiskResult,
  DuplicateDetectionResult,
  SummarizationResult,
  ResolutionVerificationResult,
  InsightGenerationResult,
  validateAndGroundCategory,
} from './schemas';
import type { Complaint } from '@/types/database';

// -----------------------------------------------------------------------------
// 1. Fallback Categorization
// -----------------------------------------------------------------------------
export function fallbackCategorize(title: string, description: string): CategorizationResult {
  const text = `${title} ${description}`.toLowerCase();

  let matchedCode = 'GEN_OTHER';
  let matchedDept = 'GENERAL';

  if (text.includes('pothole') || text.includes('tar') || text.includes('road') || text.includes('flyover') || text.includes('footpath')) {
    matchedCode = 'ROADS_POTHOLE';
    matchedDept = 'ROADS';
  } else if (text.includes('water leak') || text.includes('drinking water') || text.includes('pipe') || text.includes('tap') || text.includes('water supply')) {
    matchedCode = 'WATER_PIPELINE_LEAK';
    matchedDept = 'WATER';
  } else if (text.includes('contamination') || text.includes('muddy water') || text.includes('smelly water') || text.includes('dirty water')) {
    matchedCode = 'WATER_CONTAMINATION';
    matchedDept = 'WATER';
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('dustbin') || text.includes('dump')) {
    matchedCode = 'SANIT_NO_COLLECT';
    matchedDept = 'SANITATION';
  } else if (text.includes('drain') || text.includes('sewage') || text.includes('manhole') || text.includes('gutter') || text.includes('overflow')) {
    matchedCode = 'DRAIN_SEWAGE';
    matchedDept = 'DRAINAGE';
  } else if (text.includes('streetlight') || text.includes('lamp') || text.includes('dark street') || text.includes('light not working')) {
    matchedCode = 'LIGHT_NOT_WORKING';
    matchedDept = 'STREETLIGHT';
  } else if (text.includes('electric') || text.includes('power cut') || text.includes('transformer') || text.includes('wire') || text.includes('tangedco')) {
    matchedCode = 'ELEC_OUTAGE';
    matchedDept = 'ELECTRICITY';
  } else if (text.includes('mosquito') || text.includes('dengue') || text.includes('stagnant') || text.includes('fogging')) {
    matchedCode = 'HEALTH_MOSQUITO';
    matchedDept = 'HEALTH';
  }

  const grounded = validateAndGroundCategory(matchedCode, matchedDept);

  return {
    categoryCode: grounded.categoryCode,
    departmentCode: grounded.departmentCode,
    categoryId: grounded.categoryId,
    departmentId: grounded.departmentId,
    confidence: 0.85,
    reasoning: `Categorized via local keyword classifier matching '${matchedCode}'.`,
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 2. Fallback Priority Analysis
// -----------------------------------------------------------------------------
export function fallbackAnalyzePriority(
  title: string,
  description: string,
  categoryCode?: string
): PriorityAnalysisResult {
  const text = `${title} ${description}`.toLowerCase();

  const urgentKeywords = [
    'emergency', 'danger', 'hazard', 'live wire', 'shock', 'cave in', 'collapse',
    'hospital', 'school', 'burst', 'flooding', 'poison', 'electrocution', 'sparking',
    'fatal', 'life threatening', 'ambulance', 'fire', 'burning', 'flames', 'blast', 'transformer'
  ];

  const highKeywords = [
    'major', 'heavy', 'severe', 'blockage', 'pothole', 'arterial', 'main road',
    'overflow', 'deep', 'urgent', 'impassable', 'stink', 'foul', 'leak'
  ];

  if (urgentKeywords.some((k) => text.includes(k)) || categoryCode === 'WATER_CONTAMINATION' || categoryCode === 'ELEC_TRANSFORMER') {
    return {
      priority: Priority.URGENT,
      confidence: 0.9,
      riskLevel: 'CRITICAL',
      explanation: 'Critical safety or public health hazard detected from keyword heuristic rules.',
      isAiGenerated: false,
    };
  }

  if (highKeywords.some((k) => text.includes(k)) || categoryCode === 'ROADS_POTHOLE' || categoryCode === 'DRAIN_SEWAGE') {
    return {
      priority: Priority.HIGH,
      confidence: 0.85,
      riskLevel: 'HIGH',
      explanation: 'High impact civic disruption requiring 24h remediation.',
      isAiGenerated: false,
    };
  }

  if (text.includes('minor') || text.includes('routine') || text.includes('cosmetic') || text.includes('signage')) {
    return {
      priority: Priority.LOW,
      confidence: 0.8,
      riskLevel: 'LOW',
      explanation: 'Routine civic maintenance requirement.',
      isAiGenerated: false,
    };
  }

  return {
    priority: Priority.MEDIUM,
    confidence: 0.8,
    riskLevel: 'MEDIUM',
    explanation: 'Standard municipal turnaround priority.',
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 3. Fallback Sentiment & Urgency
// -----------------------------------------------------------------------------
export function fallbackAnalyzeSentiment(text: string): SentimentAnalysisResult {
  const lower = text.toLowerCase();

  const distressKeywords = ['danger', 'threat', 'terrible', 'horrible', 'worst', 'pathetic', 'emergency', 'dying', 'sick', 'disaster'];
  const angerKeywords = ['angry', 'useless', 'corrupt', 'days', 'weeks', 'frustrated', 'negligence', 'shame'];
  const politeKeywords = ['please', 'kindly', 'request', 'help', 'thank you', 'assist'];

  const foundDistress = distressKeywords.filter((w) => lower.includes(w));
  const foundAnger = angerKeywords.filter((w) => lower.includes(w));

  if (foundDistress.length > 0) {
    return {
      sentiment: 'High Distress & Urgent',
      urgencyScore: 92,
      citizenTone: 'ANXIOUS',
      emotionKeywords: foundDistress,
      isAiGenerated: false,
    };
  }

  if (foundAnger.length > 0) {
    return {
      sentiment: 'Frustrated / Dissatisfied',
      urgencyScore: 78,
      citizenTone: 'ANGRY',
      emotionKeywords: foundAnger,
      isAiGenerated: false,
    };
  }

  if (politeKeywords.some((w) => lower.includes(w))) {
    return {
      sentiment: 'Constructive Citizen Report',
      urgencyScore: 50,
      citizenTone: 'NEUTRAL',
      emotionKeywords: ['Polite Request'],
      isAiGenerated: false,
    };
  }

  return {
    sentiment: 'Standard Civic Filing',
    urgencyScore: 60,
    citizenTone: 'NEUTRAL',
    emotionKeywords: ['Informational'],
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 4. Fallback Safety Risk Detection
// -----------------------------------------------------------------------------
export function fallbackDetectSafetyRisk(title: string, description: string): SafetyRiskResult {
  const text = `${title} ${description}`.toLowerCase();

  const hasElectrical = text.includes('live wire') || text.includes('sparking') || text.includes('electric shock') || text.includes('open transformer') || text.includes('high voltage') || text.includes('electrocution');
  const hasStructural = text.includes('manhole') || text.includes('cave in') || text.includes('collapse') || text.includes('sinkhole') || text.includes('deep ditch') || text.includes('open chamber') || text.includes('bridge crack');
  const hasHealthBiohazard = text.includes('contaminated') || text.includes('sewage') || text.includes('toxic') || text.includes('poison') || (text.includes('hospital') && text.includes('drain')) || text.includes('disease');
  const hasFire = text.includes('gas leak') || text.includes('cylinder blast') || text.includes('fire') || text.includes('explosion');

  if (hasElectrical) {
    return {
      isSafetyRisk: true,
      hazardType: 'ELECTRICAL',
      severity: 'CRITICAL',
      immediateActionRecommended: 'Dispatch TANGEDCO emergency lineman unit and cordon off area immediately.',
      isAiGenerated: false,
    };
  }

  if (hasStructural) {
    return {
      isSafetyRisk: true,
      hazardType: 'STRUCTURAL_ROAD',
      severity: 'CRITICAL',
      immediateActionRecommended: 'Place reflective barricades and dispatch GCC road maintenance flying squad.',
      isAiGenerated: false,
    };
  }

  if (hasFire) {
    return {
      isSafetyRisk: true,
      hazardType: 'FIRE_HAZARD',
      severity: 'CRITICAL',
      immediateActionRecommended: 'Alert TN Fire and Rescue Services and secure immediate perimeter.',
      isAiGenerated: false,
    };
  }

  if (hasHealthBiohazard) {
    return {
      isSafetyRisk: true,
      hazardType: 'HEALTH_WATER',
      severity: 'HIGH',
      immediateActionRecommended: 'Deploy emergency vacuum suction truck, test water supply, and sanitize perimeter.',
      isAiGenerated: false,
    };
  }

  return {
    isSafetyRisk: false,
    hazardType: 'NONE',
    severity: 'NONE',
    immediateActionRecommended: 'Standard resolution assignment as per departmental SLA.',
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 5. Fallback Duplicate Detection
// -----------------------------------------------------------------------------
export function fallbackDetectDuplicates(
  newTitle: string,
  newDescription: string,
  candidates: Complaint[]
): DuplicateDetectionResult {
  const tokenize = (str: string) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const newTokens = tokenize(`${newTitle} ${newDescription}`);
  if (newTokens.size === 0) {
    return { isDuplicate: false, duplicateOfTrackingId: null, similarityScore: 0, explanation: 'Insufficient text to assess similarity.', isAiGenerated: false };
  }

  let highestScore = 0;
  let matchingComplaint: Complaint | null = null;

  for (const candidate of candidates) {
    const candidateTokens = tokenize(`${candidate.title} ${candidate.description}`);
    if (candidateTokens.size === 0) continue;

    // Compute Dice similarity coefficient: 2 * |A ∩ B| / (|A| + |B|)
    let intersection = 0;
    newTokens.forEach((t) => {
      if (candidateTokens.has(t)) intersection++;
    });

    const diceScore = (2 * intersection) / (newTokens.size + candidateTokens.size);

    if (diceScore > highestScore) {
      highestScore = diceScore;
      matchingComplaint = candidate;
    }
  }

  if (highestScore >= 0.40 && matchingComplaint) {
    return {
      isDuplicate: true,
      duplicateOfTrackingId: matchingComplaint.tracking_id,
      similarityScore: Math.round(highestScore * 100) / 100,
      explanation: `High lexical overlap (${Math.round(highestScore * 100)}%) with active grievance ${matchingComplaint.tracking_id}.`,
      isAiGenerated: false,
    };
  }

  return {
    isDuplicate: false,
    duplicateOfTrackingId: null,
    similarityScore: Math.round(highestScore * 100) / 100,
    explanation: 'No duplicate complaints identified in the immediate vicinity.',
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 6. Fallback Summarization
// -----------------------------------------------------------------------------
export function fallbackSummarize(title: string, description: string): SummarizationResult {
  const cleanTitle = title.trim();
  const firstSentence = description.split(/[.!?]/)[0]?.trim() || description.slice(0, 100);

  return {
    englishSummary: `${cleanTitle}: ${firstSentence}.`,
    tamilSummary: `பொதுப் புகார் சுருக்கம்: ${cleanTitle}.`,
    keyActionItem: `Inspect and rectify ${cleanTitle} as per municipal guidelines.`,
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 7. Fallback Resolution Verification
// -----------------------------------------------------------------------------
export function fallbackVerifyResolution(
  title: string,
  description: string,
  beforeMediaUrls: string[] = [],
  afterMediaUrls: string[] = [],
  notes: string = ''
): ResolutionVerificationResult {
  const hasAfterProof = afterMediaUrls.length > 0;
  const hasNotes = notes.trim().length > 10;

  if (hasAfterProof && hasNotes) {
    return {
      verificationResult: VerificationResult.VERIFIED,
      confidence: 0.88,
      assessmentNotes: 'Resolution proof photo provided with detailed work completion log by field worker.',
      beforeAfterComparison: {
        problemIdentifiedBefore: `${title} reported by citizen with ${beforeMediaUrls.length} initial photos.`,
        rectificationObservedAfter: `${afterMediaUrls.length} post-repair photo(s) submitted. Notes: "${notes.slice(0, 80)}".`,
        anomalyDetected: false,
      },
      isAiGenerated: false,
    };
  }

  if (hasAfterProof && !hasNotes) {
    return {
      verificationResult: VerificationResult.REQUIRES_REVIEW,
      confidence: 0.7,
      assessmentNotes: 'Photo submitted but field completion notes are missing or insufficient. Manual AE verification advised.',
      beforeAfterComparison: {
        problemIdentifiedBefore: title,
        rectificationObservedAfter: 'Photo attached without descriptive field log.',
        anomalyDetected: false,
      },
      isAiGenerated: false,
    };
  }

  return {
    verificationResult: VerificationResult.SUSPICIOUS,
    confidence: 0.9,
    assessmentNotes: 'Missing post-repair photographic proof. Resolution cannot be authenticated automatically.',
    beforeAfterComparison: {
      problemIdentifiedBefore: title,
      rectificationObservedAfter: 'No post-repair photographs provided.',
      anomalyDetected: true,
    },
    isAiGenerated: false,
  };
}

// -----------------------------------------------------------------------------
// 8. Fallback Insight Generation
// -----------------------------------------------------------------------------
export function fallbackGenerateInsights(
  complaints: Complaint[],
  departmentCode?: string
): InsightGenerationResult {
  const total = complaints.length;
  const urgentCount = complaints.filter((c) => c.priority === Priority.URGENT).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

  return {
    macroInsights: [
      `Analyzed ${total} grievances for ${departmentCode || 'All Departments'}. Current resolution efficiency is ${resolutionRate}%.`,
      `${urgentCount} critical public safety hazard(s) flagged for immediate supervisory monitoring.`,
    ],
    recurringFailurePatterns: [
      'Pothole re-emergence along heavy transit corridors following monsoon downpours.',
      'Underground stormwater siltation causing localised road surface waterlogging.',
    ],
    preventiveRecommendations: [
      'Implement preventive micro-surfacing on arterial asphalt stretches.',
      'Deploy pre-monsoon mechanized desilting teams in low-lying ward clusters.',
    ],
    hotspotAreas: ['Ward 114 (T. Nagar)', 'Ward 175 (Velachery)', 'Ward 122 (Mylapore)'],
    isAiGenerated: false,
  };
}
