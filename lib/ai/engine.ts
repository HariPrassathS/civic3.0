// =============================================================================
// CivicConnect TN — Master Groq AI Intelligence Engine
// =============================================================================
// High-performance Groq LPU inference for all 8 CivicConnect TN AI modules.
// Uses structured JSON output, strict schema validation, database grounding,
// PII masking, and seamless local fallback engines.

import { getGroqClient, GROQ_MODELS, safeLog } from './client';
import {
  CategorizationResult,
  PriorityAnalysisResult,
  SentimentAnalysisResult,
  SafetyRiskResult,
  DuplicateDetectionResult,
  SummarizationResult,
  ResolutionVerificationResult,
  InsightGenerationResult,
  FullTriageResult,
  validateAndGroundCategory,
  validateAndGroundPriority,
  validateAndGroundVerificationResult,
} from './schemas';
import {
  fallbackCategorize,
  fallbackAnalyzePriority,
  fallbackAnalyzeSentiment,
  fallbackDetectSafetyRisk,
  fallbackDetectDuplicates,
  fallbackSummarize,
  fallbackVerifyResolution,
  fallbackGenerateInsights,
} from './fallbacks';
import type { Complaint } from '@/types/database';

export class GroqAiEngine {
  /**
   * Module 1: Complaint Categorization & Department Routing
   */
  public static async categorizeComplaint(
    title: string,
    description: string
  ): Promise<CategorizationResult> {
    const groq = getGroqClient();
    if (!groq) {
      safeLog('info', 'Groq client unavailable, using fallback categorization', { title });
      return fallbackCategorize(title, description);
    }

    try {
      const systemPrompt = `You are the AI Grievance Categorization Engine for CivicConnect TN (Government of Tamil Nadu).
Analyze the complaint title and description, then classify it into the most accurate department and category.

Valid Department Codes: WATER, ROADS, SANITATION, DRAINAGE, STREETLIGHT, ELECTRICITY, HEALTH, GENERAL.
Valid Category Codes include: ROADS_POTHOLE, ROADS_DAMAGE, ROADS_FOOTPATH, WATER_PIPELINE_LEAK, WATER_CONTAMINATION, WATER_NO_SUPPLY, SANIT_NO_COLLECT, SANIT_GARBAGE_DUMP, DRAIN_SEWAGE, DRAIN_CLOGGED, LIGHT_NOT_WORKING, ELEC_OUTAGE, ELEC_TRANSFORMER, HEALTH_MOSQUITO, GEN_ENCROACH, GEN_OTHER.

Respond ONLY with a valid JSON object matching:
{
  "categoryCode": string,
  "departmentCode": string,
  "confidence": number (0.0 to 1.0),
  "reasoning": string (1 concise sentence)
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Title: ${title}\nDescription: ${description}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      const grounded = validateAndGroundCategory(parsed.categoryCode, parsed.departmentCode);

      return {
        categoryCode: grounded.categoryCode,
        departmentCode: grounded.departmentCode,
        categoryId: grounded.categoryId,
        departmentId: grounded.departmentId,
        confidence: typeof parsed.confidence === 'number' ? Math.min(0.99, Math.max(0.5, parsed.confidence)) : 0.9,
        reasoning: parsed.reasoning || `Categorized under ${grounded.categoryCode}.`,
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq categorization failed, using fallback', { error: String(error) });
      return fallbackCategorize(title, description);
    }
  }

  /**
   * Module 2: Priority Analysis & Risk Determination
   */
  public static async analyzePriority(
    title: string,
    description: string,
    categoryCode?: string
  ): Promise<PriorityAnalysisResult> {
    const groq = getGroqClient();
    if (!groq) {
      return fallbackAnalyzePriority(title, description, categoryCode);
    }

    try {
      const systemPrompt = `You are the Civic Priority Analyzer for the Government of Tamil Nadu.
Determine the priority level ("urgent", "high", "medium", "low") for the complaint based on public safety, disruption severity, and proximity to critical infrastructure.

Priority Rules:
- "urgent": Imminent danger, live wire, hospital/school route blockage, contaminated drinking water, cave-in (SLA: 6-12h).
- "high": Arterial road pothole, sewage overflow, major water leak, localized flooding (SLA: 24h).
- "medium": Streetlight repair, uncollected residential garbage, noisy machinery (SLA: 48h).
- "low": Non-hazardous road signage, routine tree pruning, general inquiries (SLA: 72h).

Respond ONLY with a JSON object:
{
  "priority": "urgent" | "high" | "medium" | "low",
  "confidence": number (0.0 to 1.0),
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "explanation": string
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Title: ${title}\nDescription: ${description}\nCategory: ${categoryCode || 'N/A'}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      const groundedPriority = validateAndGroundPriority(parsed.priority);
      const riskLevel = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : groundedPriority === 'urgent'
        ? 'CRITICAL'
        : 'HIGH';

      return {
        priority: groundedPriority,
        confidence: typeof parsed.confidence === 'number' ? Math.min(0.99, Math.max(0.5, parsed.confidence)) : 0.88,
        riskLevel,
        explanation: parsed.explanation || `Assigned ${groundedPriority} priority based on civic impact.`,
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq priority analysis failed, using fallback', { error: String(error) });
      return fallbackAnalyzePriority(title, description, categoryCode);
    }
  }

  /**
   * Module 3: Sentiment & Urgency Analysis
   */
  public static async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    const groq = getGroqClient();
    if (!groq) {
      return fallbackAnalyzeSentiment(text);
    }

    try {
      const systemPrompt = `You are a Citizen Sentiment and Urgency Analyzer for CivicConnect TN.
Analyze the citizen's complaint narrative to evaluate emotional tone, distress level, and urgency score (0 to 100).

Respond ONLY with a JSON object:
{
  "sentiment": string (e.g. "Urgent & Distressed", "Frustrated", "Concerned", "Constructive"),
  "urgencyScore": number (0 to 100),
  "citizenTone": "ANGRY" | "ANXIOUS" | "NEUTRAL" | "APPRECIATIVE",
  "emotionKeywords": string[]
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Narrative: ${text}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      return {
        sentiment: parsed.sentiment || 'Reported Concern',
        urgencyScore: typeof parsed.urgencyScore === 'number' ? Math.min(100, Math.max(0, parsed.urgencyScore)) : 65,
        citizenTone: ['ANGRY', 'ANXIOUS', 'NEUTRAL', 'APPRECIATIVE'].includes(parsed.citizenTone)
          ? parsed.citizenTone
          : 'NEUTRAL',
        emotionKeywords: Array.isArray(parsed.emotionKeywords) ? parsed.emotionKeywords.slice(0, 5) : [],
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq sentiment analysis failed, using fallback', { error: String(error) });
      return fallbackAnalyzeSentiment(text);
    }
  }

  /**
   * Module 4: Safety Risk Detection
   */
  public static async detectSafetyRisk(
    title: string,
    description: string
  ): Promise<SafetyRiskResult> {
    const groq = getGroqClient();
    if (!groq) {
      return fallbackDetectSafetyRisk(title, description);
    }

    try {
      const systemPrompt = `You are a Public Safety Hazard Detection Specialist for the Government of Tamil Nadu.
Scan the civic issue for life safety risks (e.g. open high-voltage cables, cave-ins, deep ditches, toxic water, collapsed bridges, open manholes).

Respond ONLY with a JSON object:
{
  "isSafetyRisk": boolean,
  "hazardType": "ELECTRICAL" | "STRUCTURAL_ROAD" | "HEALTH_WATER" | "FIRE_HAZARD" | "TRAFFIC_COLLISION" | "NONE",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE",
  "immediateActionRecommended": string
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.PRIMARY,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Title: ${title}\nDescription: ${description}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      const validHazards = ['ELECTRICAL', 'STRUCTURAL_ROAD', 'HEALTH_WATER', 'FIRE_HAZARD', 'TRAFFIC_COLLISION', 'NONE'];
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];

      return {
        isSafetyRisk: Boolean(parsed.isSafetyRisk),
        hazardType: validHazards.includes(parsed.hazardType) ? parsed.hazardType : 'NONE',
        severity: validSeverities.includes(parsed.severity) ? parsed.severity : 'NONE',
        immediateActionRecommended: parsed.immediateActionRecommended || 'Standard operational verification.',
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq safety risk detection failed, using fallback', { error: String(error) });
      return fallbackDetectSafetyRisk(title, description);
    }
  }

  /**
   * Module 5: Duplicate Detection
   */
  public static async detectDuplicates(
    newTitle: string,
    newDescription: string,
    candidateComplaints: Complaint[]
  ): Promise<DuplicateDetectionResult> {
    if (candidateComplaints.length === 0) {
      return {
        isDuplicate: false,
        duplicateOfTrackingId: null,
        similarityScore: 0,
        explanation: 'No existing complaints in the surrounding vicinity.',
        isAiGenerated: false,
      };
    }

    const groq = getGroqClient();
    if (!groq) {
      return fallbackDetectDuplicates(newTitle, newDescription, candidateComplaints);
    }

    try {
      const candidatesPayload = candidateComplaints.slice(0, 10).map((c) => ({
        tracking_id: c.tracking_id,
        title: c.title,
        description: c.description,
        address: c.address,
      }));

      const systemPrompt = `You are the Duplicate Grievance Classifier for CivicConnect TN.
Compare the incoming new complaint against the candidate active complaints in the same area.
Determine if the new filing is a duplicate of an existing unresolved grievance.

Respond ONLY with a JSON object:
{
  "isDuplicate": boolean,
  "duplicateOfTrackingId": string | null,
  "similarityScore": number (0.0 to 1.0),
  "explanation": string
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.PRIMARY,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `New Complaint:\nTitle: ${newTitle}\nDescription: ${newDescription}\n\nExisting Active Candidates:\n${JSON.stringify(candidatesPayload, null, 2)}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      return {
        isDuplicate: Boolean(parsed.isDuplicate),
        duplicateOfTrackingId: typeof parsed.duplicateOfTrackingId === 'string' ? parsed.duplicateOfTrackingId : null,
        similarityScore: typeof parsed.similarityScore === 'number' ? Math.min(1.0, Math.max(0.0, parsed.similarityScore)) : 0,
        explanation: parsed.explanation || 'Semantic duplicate similarity check completed.',
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq duplicate detection failed, using fallback', { error: String(error) });
      return fallbackDetectDuplicates(newTitle, newDescription, candidateComplaints);
    }
  }

  /**
   * Module 6: Complaint Summarization (Bilingual English + Tamil)
   */
  public static async summarizeComplaint(
    title: string,
    description: string
  ): Promise<SummarizationResult> {
    const groq = getGroqClient();
    if (!groq) {
      return fallbackSummarize(title, description);
    }

    try {
      const systemPrompt = `You are the Executive Grievance Summarizer for CivicConnect TN.
Create a crisp, 1-sentence English summary and a 1-sentence Tamil (தமிழ்) translation for government officials.

Respond ONLY with a JSON object:
{
  "englishSummary": string (1 concise sentence),
  "tamilSummary": string (1 concise sentence in pure Tamil script),
  "keyActionItem": string (recommended direct action)
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Title: ${title}\nDescription: ${description}` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      return {
        englishSummary: parsed.englishSummary || `${title}: ${description.slice(0, 90)}...`,
        tamilSummary: parsed.tamilSummary || `பொதுப் புகார்: ${title}`,
        keyActionItem: parsed.keyActionItem || `Inspect and resolve ${title}.`,
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq summarization failed, using fallback', { error: String(error) });
      return fallbackSummarize(title, description);
    }
  }

  /**
   * Module 7: Resolution Verification
   */
  public static async verifyResolution(
    title: string,
    description: string,
    beforeMediaUrls: string[] = [],
    afterMediaUrls: string[] = [],
    resolutionNotes: string = ''
  ): Promise<ResolutionVerificationResult> {
    const groq = getGroqClient();
    if (!groq) {
      return fallbackVerifyResolution(title, description, beforeMediaUrls, afterMediaUrls, resolutionNotes);
    }

    try {
      const systemPrompt = `You are the Resolution Verification Officer for CivicConnect TN.
Review the reported problem and the resolution evidence submitted by the field gang.
Determine whether the resolution is genuine and verified, suspicious, or requires manual review.

Respond ONLY with a JSON object:
{
  "verificationResult": "verified" | "suspicious" | "requires_review",
  "confidence": number (0.0 to 1.0),
  "assessmentNotes": string,
  "beforeAfterComparison": {
    "problemIdentifiedBefore": string,
    "rectificationObservedAfter": string,
    "anomalyDetected": boolean
  }
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.PRIMARY,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Complaint: ${title}\nProblem: ${description}\nBefore Photos: ${beforeMediaUrls.length} image(s)\nAfter Photos: ${afterMediaUrls.length} image(s)\nField Notes: ${resolutionNotes}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      const groundedResult = validateAndGroundVerificationResult(parsed.verificationResult);

      return {
        verificationResult: groundedResult,
        confidence: typeof parsed.confidence === 'number' ? Math.min(1.0, Math.max(0.5, parsed.confidence)) : 0.88,
        assessmentNotes: parsed.assessmentNotes || 'Field resolution proof evaluated.',
        beforeAfterComparison: {
          problemIdentifiedBefore: parsed.beforeAfterComparison?.problemIdentifiedBefore || title,
          rectificationObservedAfter: parsed.beforeAfterComparison?.rectificationObservedAfter || resolutionNotes,
          anomalyDetected: Boolean(parsed.beforeAfterComparison?.anomalyDetected),
        },
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq resolution verification failed, using fallback', { error: String(error) });
      return fallbackVerifyResolution(title, description, beforeMediaUrls, afterMediaUrls, resolutionNotes);
    }
  }

  /**
   * Module 8: Macro Insight & Trend Generation
   */
  public static async generateInsights(
    complaints: Complaint[],
    departmentCode?: string
  ): Promise<InsightGenerationResult> {
    const groq = getGroqClient();
    if (!groq) {
      return fallbackGenerateInsights(complaints, departmentCode);
    }

    try {
      const sample = complaints.slice(0, 15).map((c) => ({
        tracking_id: c.tracking_id,
        title: c.title,
        priority: c.priority,
        ward: c.ward,
        status: c.status,
      }));

      const systemPrompt = `You are the Urban Governance Insight Engine for the Chief Minister & Chief Secretary of Tamil Nadu.
Analyze batch civic grievance telemetry to extract systemic infrastructure patterns, recurring failures, and preventive maintenance actions.

Respond ONLY with a JSON object:
{
  "macroInsights": string[],
  "recurringFailurePatterns": string[],
  "preventiveRecommendations": string[],
  "hotspotAreas": string[]
}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.PRIMARY,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Department: ${departmentCode || 'All'}\nSample Tickets (${complaints.length} total):\n${JSON.stringify(sample, null, 2)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      return {
        macroInsights: Array.isArray(parsed.macroInsights) ? parsed.macroInsights : [`Analyzed ${complaints.length} tickets.`],
        recurringFailurePatterns: Array.isArray(parsed.recurringFailurePatterns) ? parsed.recurringFailurePatterns : [],
        preventiveRecommendations: Array.isArray(parsed.preventiveRecommendations) ? parsed.preventiveRecommendations : [],
        hotspotAreas: Array.isArray(parsed.hotspotAreas) ? parsed.hotspotAreas : ['Ward 114', 'Ward 105'],
        isAiGenerated: true,
      };
    } catch (error) {
      safeLog('warn', 'Groq insight generation failed, using fallback', { error: String(error) });
      return fallbackGenerateInsights(complaints, departmentCode);
    }
  }

  /**
   * Unified Full Complaint Triage Pipeline (Single Pass)
   */
  public static async runFullTriage(
    title: string,
    description: string
  ): Promise<FullTriageResult> {
    const [categorization, priority, sentiment, safety, summary] = await Promise.all([
      this.categorizeComplaint(title, description),
      this.analyzePriority(title, description),
      this.analyzeSentiment(`${title} ${description}`),
      this.detectSafetyRisk(title, description),
      this.summarizeComplaint(title, description),
    ]);

    return {
      categorization,
      priority,
      sentiment,
      safety,
      summary,
    };
  }
}
