// =============================================================================
// CivicConnect TN — Voice Grievance Natural Language Interpretation API
// =============================================================================
// Translates and normalizes Tamil, Tanglish, and English spoken complaints into
// structured, database-grounded civic grievance records with priority and safety risk.

import { NextResponse } from 'next/server';
import { getGroqClient, GROQ_MODELS, safeLog } from '@/lib/ai/client';
import { validateAndGroundCategory, validateAndGroundPriority } from '@/lib/ai/schemas';
import { Priority } from '@/types/enums';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, language, citizenName } = body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing or empty speech transcript' },
        { status: 400 }
      );
    }

    const cleanTranscript = transcript.trim();
    const groq = getGroqClient();

    if (groq) {
      try {
        const systemPrompt = `You are the Tamil Nadu Government (CivicConnect TN) Voice Complaint Parsing Engine.
A citizen has spoken their civic grievance in Tamil, Tanglish (Tamil written in English/colloquial phonetics), or English.

Your responsibilities:
1. Interpret the spoken text accurately regardless of whether it is Tamil script, Tanglish ("enga street la thanni varala", "road la periya kuzhi irukku"), or English.
2. Produce a clear, professional English title and description suitable for official municipal records.
3. Produce a 1-sentence Tamil explanation (in Tamil script) so the citizen can hear/verify their complaint summary.
4. Categorize into the exact appropriate department & category.
   Valid Departments: WATER, ROADS, SANITATION, DRAINAGE, STREETLIGHT, ELECTRICITY, HEALTH, GENERAL.
   Valid Categories include:
   - ROADS_POTHOLE, ROADS_DAMAGE, ROADS_FOOTPATH
   - WATER_NO_SUPPLY, WATER_CONTAMINATION, WATER_PIPELINE_LEAK, WATER_LOW_PRESSURE
   - SANIT_GARBAGE_DUMP, SANIT_NO_COLLECT, SANIT_OVERFLOW
   - DRAIN_SEWAGE, DRAIN_CLOGGED, DRAIN_OPEN_MANHOLE
   - LIGHT_NOT_WORKING, LIGHT_FLICKERING
   - ELEC_OUTAGE, ELEC_TRANSFORMER, ELEC_WIRE_DANGLING
   - HEALTH_MOSQUITO, HEALTH_STRAY_ANIMALS
   - GEN_ENCROACH, GEN_OTHER
5. Determine priority: "urgent" (safety hazard/outage), "high", "medium", or "low".
6. Detect if there is a public safety hazard.

Return ONLY a valid JSON object matching this schema:
{
  "title": string (concise 4-8 word professional English title),
  "description": string (clear, detailed English grievance description preserving citizen facts),
  "tamilSummary": string (1-sentence Tamil confirmation in Tamil script),
  "categoryCode": string,
  "departmentCode": string,
  "priority": "urgent" | "high" | "medium" | "low",
  "safetyRisk": boolean,
  "urgencyScore": number (0 to 100),
  "confidence": number (0.8 to 0.99),
  "detectedLanguage": "ta" | "en" | "tanglish"
}`;

        const completion = await groq.chat.completions.create({
          model: GROQ_MODELS.PRIMARY,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Citizen Name: ${citizenName || 'Citizen'}\nSelected Language: ${language || 'Auto'}\nSpoken Transcript: "${cleanTranscript}"`,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const rawContent = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);

        // Ground category & department strictly against live database schema
        const groundedCategory = validateAndGroundCategory(
          parsed.categoryCode,
          parsed.departmentCode
        );
        const groundedPriority = validateAndGroundPriority(parsed.priority);

        safeLog('info', 'Voice grievance interpreted with AI', {
          title: parsed.title,
          category: groundedCategory.categoryCode,
          priority: groundedPriority,
        });

        return NextResponse.json({
          success: true,
          data: {
            title: parsed.title || 'Civic Issue Reported via Voice',
            description: parsed.description || cleanTranscript,
            tamilSummary:
              parsed.tamilSummary ||
              `உங்கள் புகார்: ${parsed.title || 'குடிமை பிரச்சனை பதிவு செய்யப்பட்டுள்ளது.'}`,
            categoryCode: groundedCategory.categoryCode,
            categoryId: groundedCategory.categoryId,
            departmentCode: groundedCategory.departmentCode,
            departmentId: groundedCategory.departmentId,
            priority: groundedPriority,
            safetyRisk: Boolean(parsed.safetyRisk),
            urgencyScore: Number(parsed.urgencyScore) || (groundedPriority === Priority.URGENT ? 90 : 60),
            confidence: Number(parsed.confidence) || 0.92,
            language: parsed.detectedLanguage || language || 'tanglish',
            rawTranscript: cleanTranscript,
          },
        });
      } catch (groqErr) {
        safeLog('warn', 'Groq NLP interpretation failed, using intelligent rule-based fallback', {
          error: String(groqErr),
        });
      }
    }

    // Intelligent fallback parser for Tamil, Tanglish, and English
    const lower = cleanTranscript.toLowerCase();
    let catCode = 'GEN_OTHER';
    let deptCode = 'GENERAL';
    let prio = Priority.MEDIUM;
    let safety = false;
    let fallbackTitle = 'Civic Grievance Report';
    let fallbackTaSummary = 'உங்கள் புகார் பதிவு செய்யப்பட்டுள்ளது.';

    if (
      lower.includes('water') ||
      lower.includes('thanni') ||
      lower.includes('kudineer') ||
      lower.includes('தண்ணீர்') ||
      lower.includes('குடிநீர்') ||
      lower.includes('pipe') ||
      lower.includes('leak')
    ) {
      catCode = 'WATER_NO_SUPPLY';
      deptCode = 'WATER';
      prio = Priority.HIGH;
      fallbackTitle = 'Drinking water supply disruption reported';
      fallbackTaSummary = 'குடிநீர் விநியோக தடை பற்றிய உங்கள் புகார்.';
    } else if (
      lower.includes('pothole') ||
      lower.includes('road') ||
      lower.includes('kuzhi') ||
      lower.includes('குழி') ||
      lower.includes('சாலை') ||
      lower.includes('thar')
    ) {
      catCode = 'ROADS_POTHOLE';
      deptCode = 'ROADS';
      prio = Priority.HIGH;
      safety = true;
      fallbackTitle = 'Hazardous road pothole and surface damage';
      fallbackTaSummary = 'சாலையில் உள்ள குழி மற்றும் சேதம் பற்றிய உங்கள் புகார்.';
    } else if (
      lower.includes('light') ||
      lower.includes('dark') ||
      lower.includes('vilakku') ||
      lower.includes('விளக்கு') ||
      lower.includes('eriyala')
    ) {
      catCode = 'LIGHT_NOT_WORKING';
      deptCode = 'STREETLIGHT';
      prio = Priority.MEDIUM;
      fallbackTitle = 'Street light malfunction causing dark area';
      fallbackTaSummary = 'தெரு விளக்கு எரியாதது பற்றிய உங்கள் புகார்.';
    } else if (
      lower.includes('garbage') ||
      lower.includes('kuppai') ||
      lower.includes('குப்பை') ||
      lower.includes('waste') ||
      lower.includes('smell')
    ) {
      catCode = 'SANIT_GARBAGE_DUMP';
      deptCode = 'SANITATION';
      prio = Priority.MEDIUM;
      fallbackTitle = 'Accumulated solid waste and garbage dump';
      fallbackTaSummary = 'குப்பை தேக்கம் அகற்ற கோரும் உங்கள் புகார்.';
    } else if (
      lower.includes('drain') ||
      lower.includes('sewage') ||
      lower.includes('saguthi') ||
      lower.includes('saakkadai') ||
      lower.includes('சாக்கடை') ||
      lower.includes('manhole')
    ) {
      catCode = 'DRAIN_SEWAGE';
      deptCode = 'DRAINAGE';
      prio = Priority.HIGH;
      safety = true;
      fallbackTitle = 'Blocked drainage and overflowing sewage';
      fallbackTaSummary = 'சாக்கடை அடைப்பு மற்றும் கழிவுநீர் வெளியேற்றம் பற்றிய உங்கள் புகார்.';
    } else if (
      lower.includes('current') ||
      lower.includes('power') ||
      lower.includes('wire') ||
      lower.includes('transformer') ||
      lower.includes('மின்சாரம்')
    ) {
      catCode = 'ELEC_OUTAGE';
      deptCode = 'ELECTRICITY';
      prio = Priority.URGENT;
      safety = true;
      fallbackTitle = 'Power disruption and electrical infrastructure issue';
      fallbackTaSummary = 'மின்சார விநியோக தடை மற்றும் கம்பிகள் பற்றிய உங்கள் புகார்.';
    }

    const grounded = validateAndGroundCategory(catCode, deptCode);

    return NextResponse.json({
      success: true,
      data: {
        title: fallbackTitle,
        description: cleanTranscript,
        tamilSummary: fallbackTaSummary,
        categoryCode: grounded.categoryCode,
        categoryId: grounded.categoryId,
        departmentCode: grounded.departmentCode,
        departmentId: grounded.departmentId,
        priority: prio,
        safetyRisk: safety,
        urgencyScore: prio === Priority.URGENT ? 90 : prio === Priority.HIGH ? 75 : 50,
        confidence: 0.88,
        language: language || 'tanglish',
        rawTranscript: cleanTranscript,
      },
    });
  } catch (error) {
    console.error('[/api/voice/interpret error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to interpret voice grievance' },
      { status: 500 }
    );
  }
}
