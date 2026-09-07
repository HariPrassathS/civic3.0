// =============================================================================
// CivicConnect TN — Developer Voice & Reference Tracking Diagnostic API
// =============================================================================
// Exposes the complete tracking pipeline with stage-by-stage telemetry:
// 1. Raw Input Analysis
// 2. Reference Code Regex & Conservative Normalization
// 3. Groq AI Intent & Semantic Entity Extraction
// 4. Supabase Database Candidate Query & Match Scoring
// 5. RBAC & Citizen Ownership Authorization Guard
// 6. Multilingual Tracking Result Formatting (English & Tamil)
// 7. Microsecond Timing Breakdown

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGroqClient, GROQ_MODELS, safeLog } from '@/lib/ai/client';
import { calculateHaversineDistanceKm } from '@/lib/spatial/spatial-engine';

const TRACKING_ID_PATTERNS = [
  // Full standard format: CC-TN-2026-123456 or CC-TN-2026-TEST-001
  /CC[-\s]?TN[-\s]?\d{4}[-\s]?(?:TEST[-\s]?)?\w{3,8}/i,
  // Spoken format: CC 2026 10482
  /C\s*C\s*(?:T\s*N\s*)?\d{4}\s*\d{3,6}/i,
  // 6-digit standalone code
  /\b(\d{6})\b/,
];

function extractTrackingIdDiagnostic(text: string): {
  detected: boolean;
  rawMatch: string | null;
  normalizedCode: string | null;
  isValidFormat: boolean;
  isOverNormalized: boolean;
} {
  const cleaned = text.replace(/[.,!?;:'"]/g, ' ').trim();

  // Conservative safeguard: Do not over-normalize generic sentences with years
  // E.g. "I have 2026 water complaint" should NOT become a tracking code
  if (/^(?:i\s+have|in|for|year|since)\s+\d{4}\s+[a-z]+/i.test(cleaned) && !/CC/i.test(cleaned)) {
    return {
      detected: false,
      rawMatch: null,
      normalizedCode: null,
      isValidFormat: false,
      isOverNormalized: false,
    };
  }

  for (const pattern of TRACKING_ID_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      const rawMatch = match[0];
      let normalized = rawMatch.replace(/\s+/g, '-').toUpperCase();

      // If just 6 digits, construct full standard tracking code
      if (/^\d{6}$/.test(normalized)) {
        const year = new Date().getFullYear();
        normalized = `CC-TN-${year}-${normalized}`;
      } else {
        // Normalize prefixes
        normalized = normalized
          .replace(/^CC\s*-?\s*(?:TN\s*-?\s*)?/i, 'CC-TN-')
          .replace(/(\d{4})\s*-?\s*(\w+)$/, '$1-$2');
      }

      const isValidFormat = /^CC-TN-\d{4}-(?:TEST-)?\w+$/i.test(normalized);

      return {
        detected: true,
        rawMatch,
        normalizedCode: normalized,
        isValidFormat,
        isOverNormalized: false,
      };
    }
  }

  return {
    detected: false,
    rawMatch: null,
    normalizedCode: null,
    isValidFormat: false,
    isOverNormalized: false,
  };
}

export async function POST(request: Request) {
  const pipelineStart = Date.now();
  const timings = {
    regexMs: 0,
    aiMs: 0,
    dbMs: 0,
    totalMs: 0,
  };

  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_DIAGNOSTICS !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Developer diagnostics are disabled in production environments.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { query, citizenId, language = 'auto' } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Query string is required for tracking diagnostics' },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    // -------------------------------------------------------------------------
    // Stage 1: Reference Code Regex & Normalization
    // -------------------------------------------------------------------------
    const regexStart = Date.now();
    const refResult = extractTrackingIdDiagnostic(cleanQuery);
    timings.regexMs = Date.now() - regexStart;

    // -------------------------------------------------------------------------
    // Stage 2: AI Intent & Semantic Extraction (Groq)
    // -------------------------------------------------------------------------
    const aiStart = Date.now();
    let aiParsed: {
      intent: 'TRACK_STATUS' | 'RAISE_COMPLAINT' | 'GENERAL_QUERY';
      categoryKeyword?: string;
      locationKeyword?: string;
      extractedReferenceCode?: string;
      confidence: number;
      tamilSummary?: string;
      rawOutput?: any;
    } = {
      intent: refResult.detected ? 'TRACK_STATUS' : 'TRACK_STATUS',
      confidence: refResult.detected ? 0.99 : 0.85,
    };

    const groq = getGroqClient();
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_MODELS.PRIMARY,
          messages: [
            {
              role: 'system',
              content: `You are the CivicConnect TN Voice Tracking Intent Parser.
Analyze user query in Tamil, Tanglish, or English.
Detect intent: "TRACK_STATUS" | "RAISE_COMPLAINT" | "GENERAL_QUERY".
Extract categoryKeyword (e.g. water, road, pothole, garbage, streetlight, drainage, electricity).
Extract locationKeyword (e.g. Chennai, T. Nagar, Coimbatore, Madurai).
Extract referenceCode if mentioned.
Return ONLY valid JSON:
{
  "intent": "TRACK_STATUS" | "RAISE_COMPLAINT" | "GENERAL_QUERY",
  "categoryKeyword": string or null,
  "locationKeyword": string or null,
  "extractedReferenceCode": string or null,
  "confidence": number,
  "tamilSummary": string
}`,
            },
            {
              role: 'user',
              content: `Query: "${cleanQuery}"`,
            },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        });

        const raw = JSON.parse(completion.choices[0]?.message?.content || '{}');
        aiParsed = {
          intent: raw.intent || 'TRACK_STATUS',
          categoryKeyword: raw.categoryKeyword || undefined,
          locationKeyword: raw.locationKeyword || undefined,
          extractedReferenceCode: raw.extractedReferenceCode || undefined,
          confidence: raw.confidence || 0.9,
          tamilSummary: raw.tamilSummary || 'உங்கள் புகாரின் நிலை கண்காணிக்கப்படுகிறது.',
          rawOutput: raw,
        };
      } catch (aiErr: any) {
        safeLog('warn', 'Tracking AI parsing error (fallback heuristic used)', { error: String(aiErr) });
        aiParsed.rawOutput = { error: String(aiErr), fallback: true };
      }
    }
    timings.aiMs = Date.now() - aiStart;

    // -------------------------------------------------------------------------
    // Stage 3: Database Search & Candidate Match Scoring
    // -------------------------------------------------------------------------
    const dbStart = Date.now();
    const supabase = createAdminClient();
    let candidates: any[] = [];
    let searchStrategy = 'NONE';

    // A. Direct Reference Code Match
    const targetRef = refResult.normalizedCode || aiParsed.extractedReferenceCode;
    if (targetRef) {
      searchStrategy = 'EXACT_REFERENCE_CODE';
      const { data: exactMatch } = await (supabase
        .from('complaints')
        .select(`
          id, tracking_id, title, description, status, priority,
          district, ward, address, created_at, resolved_at,
          citizen_id, is_public, department_id,
          departments(name, code)
        `)
        .ilike('tracking_id', targetRef.trim())
        .limit(5) as any);

      if (exactMatch && exactMatch.length > 0) {
        candidates = exactMatch.map((c: any) => ({
          ...c,
          matchType: 'EXACT_CODE',
          similarityScore: 100,
          locationMatch: true,
          categoryMatch: true,
        }));
      }
    }

    // B. Semantic & Keyword Fallback if no exact reference match
    if (candidates.length === 0 && (aiParsed.categoryKeyword || aiParsed.locationKeyword || cleanQuery.length > 3)) {
      searchStrategy = 'SEMANTIC_KEYWORD_MATCH';
      let dbQuery = supabase
        .from('complaints')
        .select(`
          id, tracking_id, title, description, status, priority,
          district, ward, address, created_at, resolved_at,
          citizen_id, is_public, department_id,
          departments(name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // If citizenId provided, prioritize their own complaints
      if (citizenId) {
        dbQuery = dbQuery.eq('citizen_id', citizenId);
      }

      const { data: results } = await (dbQuery as any);

      if (results && results.length > 0) {
        const catFilter = (aiParsed.categoryKeyword || '').toLowerCase();
        const locFilter = (aiParsed.locationKeyword || '').toLowerCase();

        candidates = results
          .map((c: any) => {
            let score = 30; // base relevance
            const titleLower = (c.title || '').toLowerCase();
            const descLower = (c.description || '').toLowerCase();
            const distLower = (c.district || '').toLowerCase();
            const addrLower = (c.address || '').toLowerCase();

            const catMatch = catFilter ? titleLower.includes(catFilter) || descLower.includes(catFilter) : false;
            const locMatch = locFilter ? distLower.includes(locFilter) || addrLower.includes(locFilter) : false;

            if (catMatch) score += 40;
            if (locMatch) score += 30;

            return {
              ...c,
              matchType: 'SEMANTIC_SCORE',
              similarityScore: Math.min(100, score),
              locationMatch: locMatch,
              categoryMatch: catMatch,
            };
          })
          .filter((c: any) => c.similarityScore >= 50)
          .sort((a: any, b: any) => b.similarityScore - a.similarityScore);
      }
    }
    timings.dbMs = Date.now() - dbStart;

    // -------------------------------------------------------------------------
    // Stage 4: RBAC & Ownership Authorization Guard
    // -------------------------------------------------------------------------
    const candidateDiagnostics = candidates.map((cand) => {
      let isAuthorized = true;
      let authReason = 'AUTHORIZED_CITIZEN_OWNER';

      if (citizenId) {
        if (cand.citizen_id !== citizenId) {
          if (cand.is_public) {
            isAuthorized = true;
            authReason = 'PUBLIC_COMMUNITY_VIEW';
          } else {
            isAuthorized = false;
            authReason = 'ACCESS_DENIED_PRIVATE_RECORD';
          }
        }
      } else if (!cand.is_public) {
        // Unauthenticated access to private complaint
        isAuthorized = false;
        authReason = 'UNAUTHENTICATED_PRIVATE_RECORD';
      }

      return {
        id: cand.id,
        tracking_id: cand.tracking_id,
        title: cand.title,
        status: cand.status,
        priority: cand.priority,
        district: cand.district,
        address: cand.address,
        is_public: cand.is_public,
        citizen_id_masked: cand.citizen_id ? `${cand.citizen_id.slice(0, 8)}...` : 'N/A',
        department: (cand.departments as any)?.name || 'Municipal Administration',
        similarityScore: cand.similarityScore,
        matchType: cand.matchType,
        isAuthorized,
        authReason,
      };
    });

    const authorizedCandidates = candidateDiagnostics.filter((c) => c.isAuthorized);

    // -------------------------------------------------------------------------
    // Stage 5: Outcome Resolution (Single, Multiple, None, Denied)
    // -------------------------------------------------------------------------
    let outcome: 'MATCHED' | 'MULTIPLE_MATCHES' | 'NO_MATCH' | 'ACCESS_DENIED' = 'NO_MATCH';
    let resolutionMessageEn = '';
    let resolutionMessageTa = '';

    if (candidateDiagnostics.length > 0 && authorizedCandidates.length === 0) {
      outcome = 'ACCESS_DENIED';
      resolutionMessageEn = 'Access Denied: This grievance is private and belongs to another citizen.';
      resolutionMessageTa = 'அணுகல் மறுக்கப்பட்டது: இந்த புகார் தனிப்பட்டது மற்றும் மற்றொரு குடிமகனுக்குரியது.';
    } else if (authorizedCandidates.length === 1) {
      outcome = 'MATCHED';
      const c = authorizedCandidates[0];
      resolutionMessageEn = `Grievance [${c.tracking_id}] regarding "${c.title}" is currently "${c.status.toUpperCase()}".`;
      resolutionMessageTa = `உங்கள் புகார் [${c.tracking_id}] "${c.status}" நிலையில் உள்ளது.`;
    } else if (authorizedCandidates.length > 1) {
      outcome = 'MULTIPLE_MATCHES';
      resolutionMessageEn = `Found ${authorizedCandidates.length} matching complaints. Please specify your tracking code or district.`;
      resolutionMessageTa = `${authorizedCandidates.length} புகார்கள் கண்டுபிடிக்கப்பட்டன. தயவுசெய்து உங்கள் குறிப்பு குறியீட்டை கூறவும்.`;
    } else {
      outcome = 'NO_MATCH';
      resolutionMessageEn = 'No complaints found matching your query. Please speak your 6-digit tracking code.';
      resolutionMessageTa = 'உங்கள் வினவலுக்குரிய புகார் கிடைக்கவில்லை. தயவுசெய்து உங்கள் குறிப்பு குறியீட்டை கூறவும்.';
    }

    timings.totalMs = Date.now() - pipelineStart;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timings,
      pipeline: {
        rawInput: cleanQuery,
        referenceExtraction: refResult,
        aiIntent: aiParsed,
        searchStrategy,
        totalCandidatesFound: candidateDiagnostics.length,
        authorizedCandidatesCount: authorizedCandidates.length,
        outcome,
        resolutionMessageEn,
        resolutionMessageTa,
        candidates: candidateDiagnostics,
      },
    });
  } catch (error: any) {
    console.error('[/api/dev/track-diagnostic error]:', error);
    timings.totalMs = Date.now() - pipelineStart;
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to process tracking diagnostic',
        timings,
      },
      { status: 500 }
    );
  }
}
