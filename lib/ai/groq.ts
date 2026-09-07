// =============================================================================
// CivicConnect TN — Groq AI Client & Triage Engine
// =============================================================================
// Fast AI inference using Groq LPU technology for complaint classification,
// urgency detection, bilingual sentiment analysis, and smart civic routing.

import Groq from 'groq-sdk';
import { Priority } from '@/types/enums';

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (groqInstance) return groqInstance;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable.');
  }

  groqInstance = new Groq({ apiKey });
  return groqInstance;
}

export interface TriageResult {
  categoryCode: string;
  departmentCode: string;
  priority: Priority;
  confidence: number;
  sentiment: string;
  summary: string;
  tamilSummary?: string;
  safetyRisk: boolean;
}

/**
 * Perform AI triage on a civic complaint using Groq LLM inference.
 */
export async function triageComplaintWithGroq(
  title: string,
  description: string
): Promise<TriageResult> {
  const groq = getGroqClient();

  const systemPrompt = `You are the AI Grievance Triage Engine for the Government of Tamil Nadu (CivicConnect TN).
Analyze the reported civic grievance and categorize it into the appropriate Tamil Nadu department and category.

Valid Department Codes:
- WATER (Water Supply & Sewerage - CMWSSB/TWAD)
- ROADS (Roads & Infrastructure - Highways/GCC)
- SANITATION (Solid Waste Management & Sanitation)
- DRAINAGE (Storm Water Drainage & Sewage Management)
- STREETLIGHT (Street Lighting & Illumination)
- ELECTRICITY (TANGEDCO Electricity Distribution)
- HEALTH (Public Health & Vector Control)
- GENERAL (Revenue & General Administration)

Valid Priority Levels: "urgent", "high", "medium", "low".

Return ONLY a valid JSON object matching this schema:
{
  "categoryCode": "ROADS_POTHOLE" | "WATER_CONTAMINATION" | "DRAIN_SEWAGE" | "SANIT_NO_COLLECT" | "LIGHT_NOT_WORKING" | "ELEC_OUTAGE" | "HEALTH_MOSQUITO" | "GEN_ENCROACH" (or closest valid code),
  "departmentCode": "WATER" | "ROADS" | "SANITATION" | "DRAINAGE" | "STREETLIGHT" | "ELECTRICITY" | "HEALTH" | "GENERAL",
  "priority": "urgent" | "high" | "medium" | "low",
  "confidence": number between 0.8 and 0.99,
  "sentiment": string (e.g. "Concerned", "Urgent", "Frustrated"),
  "summary": string (1-sentence concise English summary),
  "tamilSummary": string (1-sentence Tamil translation),
  "safetyRisk": boolean
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Complaint Title: ${title}\nComplaint Description: ${description}`,
      },
    ],
    model: 'openai/gpt-oss-120b',
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(responseContent);

  return {
    categoryCode: parsed.categoryCode || 'GEN_OTHER',
    departmentCode: parsed.departmentCode || 'GENERAL',
    priority: (parsed.priority as Priority) || Priority.MEDIUM,
    confidence: Number(parsed.confidence) || 0.9,
    sentiment: parsed.sentiment || 'Reported',
    summary: parsed.summary || title,
    tamilSummary: parsed.tamilSummary || '',
    safetyRisk: Boolean(parsed.safetyRisk),
  };
}
