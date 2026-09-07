// =============================================================================
// CivicConnect TN — Intelligent Multi-Signal Voice Tracking Engine
// =============================================================================
// Evaluates spoken queries, reference codes, semantic descriptions, citizen identity,
// and geographic proximity to accurately locate complaints without mandatory logins.

import { createAdminClient } from '@/lib/supabase/admin';
import { getGroqClient, GROQ_MODELS, safeLog } from '@/lib/ai/client';
import { calculateHaversineDistanceKm } from '@/lib/spatial/spatial-engine';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';

export interface TrackingSignalInput {
  query: string;
  language?: string;
  citizenId?: string | null;
  sessionToken?: string | null;
  userLat?: number | null;
  userLng?: number | null;
}

export interface CandidateScore {
  complaintId: string;
  trackingId: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  address: string;
  ward?: number;
  district?: string;
  createdAt: string;
  isPublic: boolean;
  isAuthorized: boolean;
  distanceKm?: number | null;
  scores: {
    referenceCode: number;
    identityMatch: number;
    semanticSimilarity: number;
    locationProximity: number;
    timeRecency: number;
    composite: number;
  };
}

export interface VoiceTrackingResult {
  outcome: 'MATCHED' | 'DISAMBIGUATION_REQUIRED' | 'NO_MATCH';
  selectedComplaint?: {
    tracking_id: string;
    title: string;
    status: string;
    priority: string;
    category?: string;
    address?: string;
    ward?: number;
    district?: string;
    sla_deadline?: string | null;
    sla_breached?: boolean;
    escalation_level?: number;
    created_at: string;
    updated_at?: string;
    resolved_at?: string | null;
  };
  explanationEn: string;
  explanationTa: string;
  clarificationQuestion?: {
    en: string;
    ta: string;
    options: {
      trackingId: string;
      title: string;
      category: string;
      locationSummary: string;
      reportedTimeAgo: string;
    }[];
  };
  nearbyCommunityCount?: number;
  extractedEntities: {
    referenceCode: string | null;
    name: string | null;
    issue: string | null;
    location: string | null;
    categoryKeyword: string | null;
  };
  diagnosticScores?: CandidateScore[];
}

// -----------------------------------------------------------------------------
// 1. Reference Code Normalization
// -----------------------------------------------------------------------------
const TRACKING_ID_PATTERNS = [
  /CC[-\s]?TN[-\s]?\d{4}[-\s]?(?:TEST[-\s]?)?\w{3,8}/i,
  /C\s*C\s*(?:T\s*N\s*)?\d{4}\s*\d{3,6}/i,
  /\b(\d{6})\b/,
];

export function extractSpokenReferenceCode(text: string): string | null {
  const cleaned = text.replace(/[.,!?;:'"]/g, ' ').trim();

  // Conservative check: do not treat plain sentences like "in 2026 water problem" as tracking code
  if (/^(?:i\s+have|in|for|year|since)\s+\d{4}\s+[a-z]+/i.test(cleaned) && !/CC/i.test(cleaned)) {
    return null;
  }

  for (const pattern of TRACKING_ID_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      let normalized = match[0].replace(/\s+/g, '-').toUpperCase();
      if (/^\d{6}$/.test(normalized)) {
        const year = new Date().getFullYear();
        normalized = `CC-TN-${year}-${normalized}`;
      } else {
        normalized = normalized
          .replace(/^CC\s*-?\s*(?:TN\s*-?\s*)?/i, 'CC-TN-')
          .replace(/(\d{4})\s*-?\s*(\w+)$/, '$1-$2');
      }

      if (/^CC-TN-\d{4}-(?:TEST-)?\w+$/i.test(normalized)) {
        return normalized;
      }
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// 2. Citizen-Friendly Status Descriptions
// -----------------------------------------------------------------------------
const STATUS_EXPLANATIONS: Record<string, { en: string; ta: string }> = {
  created: {
    en: 'Your complaint has been successfully registered and is queued for verification.',
    ta: 'உங்கள் புகார் பதிவு செய்யப்பட்டு சரிபார்ப்பிற்காக காத்திருக்கிறது.',
  },
  ai_processing: {
    en: 'Your complaint is currently being analyzed and routed by our AI engine.',
    ta: 'உங்கள் புகார் AI அமைப்பால் பகுப்பாய்வு செய்யப்பட்டு உரிய துறைக்கு அனுப்பப்படுகிறது.',
  },
  validated: {
    en: 'Your complaint has been validated and an official department is being assigned.',
    ta: 'உங்கள் புகார் சரிபார்க்கப்பட்டு, துறை ஒதுக்கீட்டிற்கு தயாராக உள்ளது.',
  },
  assigned: {
    en: 'A field worker and area officer have been assigned to inspect and resolve your issue.',
    ta: 'உங்கள் பிரச்சனையை ஆய்வு செய்து தீர்க்க களப் பணியாளர் நியமிக்கப்பட்டுள்ளார்.',
  },
  in_progress: {
    en: 'Work is currently actively in progress on your complaint on-site.',
    ta: 'உங்கள் புகார் மீது களப்பணி தற்போது தீவிரமாக நடைபெற்றுக்கொண்டிருக்கிறது.',
  },
  resolution_submitted: {
    en: 'A resolution proof has been submitted by the field worker and is awaiting officer verification.',
    ta: 'பணியாளரால் தீர்வு அறிக்கை சமர்ப்பிக்கப்பட்டு அதிகாரி சரிபார்ப்பில் உள்ளது.',
  },
  officer_verification: {
    en: 'The Area Officer is currently reviewing the on-ground resolution.',
    ta: 'பகுதி அதிகாரி கள தீர்வை மதிப்பாய்வு செய்து கொண்டிருக்கிறார்.',
  },
  resolved: {
    en: 'Your complaint has been resolved. Please let us know your feedback.',
    ta: 'உங்கள் புகார் வெற்றிகரமாக தீர்க்கப்பட்டது. உங்கள் கருத்தை தெரிவிக்கலாம்.',
  },
  closed: {
    en: 'Your complaint has been completed and closed.',
    ta: 'உங்கள் புகார் வெற்றிகரமாக முடிக்கப்பட்டு மூடப்பட்டது.',
  },
  escalated: {
    en: 'Your complaint has been escalated to senior authorities for expedited resolution.',
    ta: 'உங்கள் புகார் விரைவு நடவடிக்கைக்காக உயர் அதிகாரிகளுக்கு அனுப்பப்பட்டுள்ளது.',
  },
};

export class VoiceTrackingEngine {
  /**
   * Main entrypoint for multi-signal complaint tracking
   */
  static async trackComplaint(input: TrackingSignalInput): Promise<VoiceTrackingResult> {
    const cleanText = (input.query || '').trim();
    safeLog('info', 'Executing VoiceTrackingEngine pipeline', {
      queryLength: cleanText.length,
      hasCitizenId: !!input.citizenId,
      hasGps: !!(input.userLat && input.userLng),
    });

    // 1. Spoken Reference Code check
    const extractedRefCode = extractSpokenReferenceCode(cleanText);

    // 2. Groq AI Entity & Semantic Extraction
    const entities = await this.extractEntitiesWithGroq(cleanText, extractedRefCode);

    // 3. Query candidates from Supabase & Memory Store
    const rawCandidates = await this.fetchCandidateComplaints({
      refCode: entities.referenceCode,
      citizenId: input.citizenId,
      categoryKeyword: entities.categoryKeyword,
      locationKeyword: entities.location,
      userLat: input.userLat,
      userLng: input.userLng,
    });

    // 4. Compute multi-signal scores for all candidates
    const scoredCandidates = this.scoreCandidates(rawCandidates, {
      ...input,
      entities,
    });

    // 5. Check Community Aggregates nearby
    let nearbyCommunityCount = 0;
    if (input.userLat && input.userLng && entities.categoryKeyword) {
      nearbyCommunityCount = rawCandidates.filter((c) => {
        const dist = (c.latitude && c.longitude)
          ? calculateHaversineDistanceKm(input.userLat!, input.userLng!, c.latitude, c.longitude)
          : null;
        return dist !== null && dist <= 3.0;
      }).length;
    }

    // 6. Evaluate Top Matches
    if (scoredCandidates.length === 0) {
      return {
        outcome: 'NO_MATCH',
        extractedEntities: entities,
        explanationEn:
          "I couldn't find a matching complaint in our system. You can try giving more details about the location or problem, or provide your reference code.",
        explanationTa:
          'பொருத்தமான புகார் எதுவும் கிடைக்கவில்லை. பிரச்சனையின் இடம் அல்லது குறிப்பு எண்ணை கூறி மீண்டும் முயற்சிக்கவும்.',
      };
    }

    const topCandidate = scoredCandidates[0];
    const secondCandidate = scoredCandidates.length > 1 ? scoredCandidates[1] : null;

    // Check if authorization allows viewing this complaint
    if (!topCandidate.isAuthorized && !topCandidate.isPublic) {
      return {
        outcome: 'NO_MATCH',
        extractedEntities: entities,
        explanationEn:
          "For privacy protection, matching private records cannot be displayed without verified citizen identity.",
        explanationTa:
          'பாதுகாப்பு கருதி, சரிபார்க்கப்பட்ட குடிமக்கள் மட்டுமே இந்த தனிப்பட்ட புகாரை பார்க்க முடியும்.',
      };
    }

    // Threshold checks:
    // If top score is high (> 0.65) or exact reference code matched (refCodeScore === 1.0)
    if (
      topCandidate.scores.referenceCode === 1.0 ||
      (topCandidate.scores.composite >= 0.55 &&
        (!secondCandidate || topCandidate.scores.composite - secondCandidate.scores.composite > 0.12))
    ) {
      const statusKey = topCandidate.status.toLowerCase();
      const explanationObj = STATUS_EXPLANATIONS[statusKey] || {
        en: `Your complaint is currently marked as ${topCandidate.status}.`,
        ta: `உங்கள் புகார் தற்போது ${topCandidate.status} நிலையில் உள்ளது.`,
      };

      const titleEn = topCandidate.title;
      const explanationEn = `Yes, I found your complaint regarding "${titleEn}". ${explanationObj.en}`;
      const explanationTa = `உங்கள் புகார் "${titleEn}" கண்டறியப்பட்டது. ${explanationObj.ta}`;

      return {
        outcome: 'MATCHED',
        selectedComplaint: {
          tracking_id: topCandidate.trackingId,
          title: topCandidate.title,
          status: topCandidate.status,
          priority: topCandidate.priority,
          category: topCandidate.category,
          address: topCandidate.address,
          ward: topCandidate.ward,
          district: topCandidate.district,
          created_at: topCandidate.createdAt,
        },
        explanationEn,
        explanationTa,
        nearbyCommunityCount: nearbyCommunityCount > 1 ? nearbyCommunityCount : undefined,
        extractedEntities: entities,
        diagnosticScores: scoredCandidates.slice(0, 5),
      };
    }

    // If top 2 candidates are very close in score (>= 0.20 composite), trigger DISAMBIGUATION
    if (
      secondCandidate &&
      topCandidate.scores.composite >= 0.20 &&
      Math.abs(topCandidate.scores.composite - secondCandidate.scores.composite) <= 0.12
    ) {
      const options = [topCandidate, secondCandidate].map((c) => ({
        trackingId: c.trackingId,
        title: c.title,
        category: c.category || 'General Civic',
        locationSummary: c.address || `Ward ${c.ward || '114'}, ${c.district || 'Chennai'}`,
        reportedTimeAgo: this.formatTimeAgo(c.createdAt),
      }));

      const clarifyEn = `I found two complaints that might match. Is it about "${topCandidate.title}" (${options[0].locationSummary}) or "${secondCandidate.title}" (${options[1].locationSummary})?`;
      const clarifyTa = `இரண்டு புகார்கள் பொருத்தமாக உள்ளன. "${topCandidate.title}" குறித்ததா அல்லது "${secondCandidate.title}" குறித்ததா?`;

      return {
        outcome: 'DISAMBIGUATION_REQUIRED',
        clarificationQuestion: {
          en: clarifyEn,
          ta: clarifyTa,
          options,
        },
        explanationEn: clarifyEn,
        explanationTa: clarifyTa,
        extractedEntities: entities,
        diagnosticScores: scoredCandidates.slice(0, 5),
      };
    }

    // Weak match fallback (< 0.20)
    if (topCandidate.scores.composite < 0.20) {
      return {
        outcome: 'NO_MATCH',
        extractedEntities: entities,
        explanationEn:
          "I couldn't find a matching complaint. Please specify the location, department, or your reference code.",
        explanationTa:
          'பொருத்தமான புகார் கண்டறியப்படவில்லை. இடத்தின் பெயர் அல்லது குறிப்பு எண்ணைக் கூறி முயற்சிக்கவும்.',
        diagnosticScores: scoredCandidates.slice(0, 3),
      };
    }

    // Single moderate match (>= 0.20)
    const statusKey = topCandidate.status.toLowerCase();
    const explanationObj = STATUS_EXPLANATIONS[statusKey] || {
      en: `Your complaint status is ${topCandidate.status}.`,
      ta: `உங்கள் புகார் நிலை: ${topCandidate.status}.`,
    };

    return {
      outcome: 'MATCHED',
      selectedComplaint: {
        tracking_id: topCandidate.trackingId,
        title: topCandidate.title,
        status: topCandidate.status,
        priority: topCandidate.priority,
        category: topCandidate.category,
        address: topCandidate.address,
        ward: topCandidate.ward,
        district: topCandidate.district,
        created_at: topCandidate.createdAt,
      },
      explanationEn: `I found your complaint regarding "${topCandidate.title}". ${explanationObj.en}`,
      explanationTa: `உங்கள் புகார் "${topCandidate.title}" கண்டறியப்பட்டது. ${explanationObj.ta}`,
      extractedEntities: entities,
      diagnosticScores: scoredCandidates.slice(0, 5),
    };
  }

  // ---------------------------------------------------------------------------
  // AI Entity Extraction
  // ---------------------------------------------------------------------------
  private static async extractEntitiesWithGroq(
    query: string,
    preExtractedRef: string | null
  ): Promise<{
    referenceCode: string | null;
    name: string | null;
    issue: string | null;
    location: string | null;
    categoryKeyword: string | null;
  }> {
    const fallback = {
      referenceCode: preExtractedRef,
      name: null,
      issue: query,
      location: null,
      categoryKeyword: null,
    };

    const groq = getGroqClient();
    if (!groq) return fallback;

    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.PRIMARY,
        messages: [
          {
            role: 'system',
            content: `You are the CivicConnect TN Voice Tracking Entity Parser.
The user is speaking in Tamil, Tanglish, or English to find a civic complaint.
Extract:
- referenceCode: tracking code like CC-TN-2026-10482 if mentioned, else null
- name: citizen's name (e.g. Ramesh, Priya, Kumar) if stated, else null
- issue: specific problem (e.g. "no water supply", "street light broken", "garbage overflow"), else null
- location: location/area/street name (e.g. "Anna Nagar", "T. Nagar", "Main Road"), else null
- categoryKeyword: normalized keyword: "water" | "road" | "garbage" | "electricity" | "drainage" | "public_health" | "other"

Return ONLY valid JSON:
{
  "referenceCode": string or null,
  "name": string or null,
  "issue": string or null,
  "location": string or null,
  "categoryKeyword": string or null
}`,
          },
          {
            role: 'user',
            content: `Query: "${query}"`,
          },
        ],
        temperature: 0.1,
        max_tokens: 220,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        referenceCode: preExtractedRef || parsed.referenceCode || null,
        name: parsed.name || null,
        issue: parsed.issue || query,
        location: parsed.location || null,
        categoryKeyword: parsed.categoryKeyword || null,
      };
    } catch {
      return fallback;
    }
  }

  // ---------------------------------------------------------------------------
  // Fetch Candidates from Database
  // ---------------------------------------------------------------------------
  private static async fetchCandidateComplaints(params: {
    refCode: string | null;
    citizenId?: string | null;
    categoryKeyword?: string | null;
    locationKeyword?: string | null;
    userLat?: number | null;
    userLng?: number | null;
  }): Promise<any[]> {
    const candidatesMap = new Map<string, any>();

    // 1. Add Memory complaints (for mock / dev testing)
    for (const mem of MEMORY_COMPLAINTS) {
      candidatesMap.set(mem.id, {
        ...mem,
        latitude: mem.latitude,
        longitude: mem.longitude,
      });
    }

    // 2. Query Supabase
    try {
      const supabase = createAdminClient();

      // Query A: By Reference Code if present
      if (params.refCode) {
        const { data: refMatches } = await supabase
          .from('complaints')
          .select('id, tracking_id, citizen_id, title, description, status, priority, address, ward, district, is_public, created_at')
          .ilike('tracking_id', params.refCode)
          .limit(5);

        if (refMatches) {
          for (const m of refMatches) candidatesMap.set(m.id, m);
        }
      }

      // Query B: By Citizen ID / Session if provided
      if (params.citizenId) {
        const { data: citizenMatches } = await supabase
          .from('complaints')
          .select('id, tracking_id, citizen_id, title, description, status, priority, address, ward, district, is_public, created_at')
          .eq('citizen_id', params.citizenId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (citizenMatches) {
          for (const m of citizenMatches) candidatesMap.set(m.id, m);
        }
      }

      // Query C: Keyword / Recency Pool
      const { data: recentPool } = await supabase
        .from('complaints')
        .select('id, tracking_id, citizen_id, title, description, status, priority, address, ward, district, is_public, created_at')
        .order('created_at', { ascending: false })
        .limit(25);

      if (recentPool) {
        for (const m of recentPool) {
          if (!candidatesMap.has(m.id)) candidatesMap.set(m.id, m);
        }
      }
    } catch (dbErr) {
      safeLog('warn', 'Database query in VoiceTrackingEngine had issues, using memory pool', {
        error: String(dbErr),
      });
    }

    return Array.from(candidatesMap.values());
  }

  // ---------------------------------------------------------------------------
  // Candidate Scoring Algorithm
  // ---------------------------------------------------------------------------
  private static scoreCandidates(
    candidates: any[],
    ctx: TrackingSignalInput & { entities: any }
  ): CandidateScore[] {
    const scored: CandidateScore[] = [];
    const queryTokens = this.tokenize(ctx.query);
    const issueTokens = this.tokenize(ctx.entities.issue || '');
    const locationTokens = this.tokenize(ctx.entities.location || '');
    const extractedName = (ctx.entities.name || '').toLowerCase().trim();
    const targetRefCode = ctx.entities.referenceCode?.toUpperCase();

    for (const c of candidates) {
      const trackingId = String(c.tracking_id || '').toUpperCase();
      const title = String(c.title || '');
      const description = String(c.description || '');
      const address = String(c.address || '');
      const searchableContent = `${title} ${description} ${address}`.toLowerCase();

      // Signal 1: Reference Code Match
      let referenceCodeScore = 0.0;
      if (targetRefCode && (trackingId === targetRefCode || trackingId.includes(targetRefCode))) {
        referenceCodeScore = 1.0;
      }

      // Signal 2: Identity / Ownership Match
      let identityScore = 0.0;
      let isAuthorized = false;

      if (ctx.citizenId && c.citizen_id === ctx.citizenId) {
        identityScore = 1.0;
        isAuthorized = true;
      } else if (c.is_public !== false) {
        isAuthorized = true;
        if (extractedName && c.citizen_name) {
          const cName = String(c.citizen_name).toLowerCase();
          if (cName.includes(extractedName) || extractedName.includes(cName)) {
            identityScore = 0.8;
          }
        }
      } else {
        // Private complaint belonging to another citizen
        isAuthorized = false;
        identityScore = 0.0;
      }

      // Signal 3: Semantic & Keyword Similarity
      let semanticScore = 0.0;
      const combinedTargetTokens = Array.from(new Set([...queryTokens, ...issueTokens]));
      if (combinedTargetTokens.length > 0) {
        let matchedTokens = 0;
        for (const token of combinedTargetTokens) {
          if (searchableContent.includes(token)) matchedTokens++;
        }
        semanticScore = Math.min(1.0, matchedTokens / Math.max(1, combinedTargetTokens.length));
      }

      // Category match boost
      if (ctx.entities.categoryKeyword) {
        const catKw = ctx.entities.categoryKeyword.toLowerCase();
        if (searchableContent.includes(catKw)) {
          semanticScore = Math.min(1.0, semanticScore + 0.35);
        }
      }

      // Signal 4: Location & Distance Proximity
      let locationScore = 0.0;
      let distanceKm: number | null = null;

      if (ctx.userLat && ctx.userLng && c.latitude && c.longitude) {
        distanceKm = calculateHaversineDistanceKm(ctx.userLat, ctx.userLng, c.latitude, c.longitude);
        if (distanceKm <= 0.3) locationScore = 1.0;
        else if (distanceKm <= 1.0) locationScore = 0.8;
        else if (distanceKm <= 5.0) locationScore = 0.5;
        else if (distanceKm <= 15.0) locationScore = 0.2;
      }

      // Location keyword matching boost
      if (locationTokens.length > 0) {
        for (const locTok of locationTokens) {
          if (address.toLowerCase().includes(locTok)) {
            locationScore = Math.min(1.0, locationScore + 0.45);
          }
        }
      }

      // Signal 5: Time Relevance (Recency)
      let timeScore = 0.5;
      if (c.created_at) {
        const ageInDays = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays <= 3) timeScore = 1.0;
        else if (ageInDays <= 7) timeScore = 0.85;
        else if (ageInDays <= 30) timeScore = 0.6;
        else timeScore = 0.3;
      }

      // Weighted Composite Score
      // If reference code matches, it dominates. Otherwise, voice semantic & location signals scale to 1.0.
      let composite = 0.0;
      if (referenceCodeScore === 1.0) {
        composite = 1.0;
      } else {
        composite =
          semanticScore * 0.45 +
          locationScore * 0.30 +
          identityScore * 0.15 +
          timeScore * 0.10;
      }

      scored.push({
        complaintId: c.id,
        trackingId: c.tracking_id || 'UNKNOWN',
        title: c.title || 'Civic Issue',
        status: c.status || 'created',
        priority: c.priority || 'medium',
        category: c.category_code || ctx.entities.categoryKeyword || 'Civic Grievance',
        address: c.address || 'Chennai, Tamil Nadu',
        ward: c.ward,
        district: c.district,
        createdAt: c.created_at || new Date().toISOString(),
        isPublic: c.is_public !== false,
        isAuthorized,
        distanceKm,
        scores: {
          referenceCode: Number(referenceCodeScore.toFixed(2)),
          identityMatch: Number(identityScore.toFixed(2)),
          semanticSimilarity: Number(semanticScore.toFixed(2)),
          locationProximity: Number(locationScore.toFixed(2)),
          timeRecency: Number(timeScore.toFixed(2)),
          composite: Number(composite.toFixed(2)),
        },
      });
    }

    // Sort descending by composite score
    return scored.sort((a, b) => b.scores.composite - a.scores.composite);
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'near', 'have'].includes(t));
  }

  private static formatTimeAgo(dateStr: string): string {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  }
}
