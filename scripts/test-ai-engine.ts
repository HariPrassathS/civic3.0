// =============================================================================
// CivicConnect TN — Phase 7 Groq AI Intelligence Engine Test Suite
// =============================================================================

import { Priority, VerificationResult, ComplaintStatus, ComplaintSource } from '../types/enums';
import { GroqAiEngine } from '../lib/ai/engine';
import { maskPii } from '../lib/ai/client';
import {
  validateAndGroundCategory,
  validateAndGroundPriority,
  validateAndGroundVerificationResult,
} from '../lib/ai/schemas';
import { fallbackCategorize, fallbackAnalyzePriority } from '../lib/ai/fallbacks';
import type { Complaint } from '../types/database';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runAiTests() {
  console.log('\n=============================================================================');
  console.log('🤖 CivicConnect TN — Phase 7 Groq AI Engine Test Suite');
  console.log('=============================================================================\n');

  // ---------------------------------------------------------------------------
  // Test Suite 1: Complaint Categorization & Grounding
  // ---------------------------------------------------------------------------
  console.log('--- Test Suite 1: Categorization & Strict Database Grounding ---');
  const cat1 = await GroqAiEngine.categorizeComplaint(
    'Deep dangerous pothole on Anna Salai',
    'Vehicles swerving dangerously near DMS metro station due to unpaved crater.'
  );
  assert(cat1.departmentCode === 'ROADS', 'Categorized under ROADS department');
  assert(cat1.categoryCode.startsWith('ROADS_'), `Category code is valid: ${cat1.categoryCode}`);
  assert(!!cat1.categoryId && !!cat1.departmentId, 'Includes valid database UUIDs for category and department');

  const cat2 = await GroqAiEngine.categorizeComplaint(
    'Muddy contaminated tap water supply',
    'Brown smelly water coming from municipal pipe since 2 days in Royapettah.'
  );
  assert(cat2.departmentCode === 'WATER', 'Categorized under WATER department');
  assert(cat2.categoryCode.includes('WATER'), `Category code is valid: ${cat2.categoryCode}`);

  // Grounding test: ensure unknown category falls back safely
  const groundedUnknown = validateAndGroundCategory('HALLUCINATED_CATEGORY_999', 'UNKNOWN_DEPT');
  assert(groundedUnknown.categoryCode === 'GEN_OTHER', `Unknown category safely grounded to default: ${groundedUnknown.categoryCode}`);
  assert(!!groundedUnknown.categoryId, 'Grounded category has valid UUID');

  // ---------------------------------------------------------------------------
  // Test Suite 2: Priority Analysis & Risk Determination
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: Priority Analysis & Risk Levels ---');
  const prio1 = await GroqAiEngine.analyzePriority(
    'Live electric wire snapped and hanging across school entrance',
    'High voltage cable sparking on the road with students walking nearby.'
  );
  assert(prio1.priority === Priority.URGENT, 'Hazardous live cable analyzed as URGENT priority');
  assert(prio1.riskLevel === 'CRITICAL', 'Hazard assigned CRITICAL risk level');

  const prio2 = await GroqAiEngine.analyzePriority(
    'Large pothole on arterial road',
    'Slows down traffic during peak office hours.'
  );
  assert(prio2.priority === Priority.HIGH || prio2.priority === Priority.MEDIUM, 'Arterial pothole assigned appropriate priority');

  const prioGround = validateAndGroundPriority('INVALID_PRIORITY_TEXT');
  assert(prioGround === Priority.MEDIUM, 'Invalid priority safely grounded to Priority.MEDIUM');

  // ---------------------------------------------------------------------------
  // Test Suite 3: Sentiment & Urgency Analysis
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: Sentiment & Urgency Scoring ---');
  const sent1 = await GroqAiEngine.analyzeSentiment(
    'This is a complete disaster! People are getting hurt, negligence is terrible! Fix this emergency now!'
  );
  assert(sent1.urgencyScore >= 75, `High urgency narrative scored: ${sent1.urgencyScore}/100`);
  assert(sent1.citizenTone === 'ANXIOUS' || sent1.citizenTone === 'ANGRY', `Citizen tone accurately detected: ${sent1.citizenTone}`);

  const sent2 = await GroqAiEngine.analyzeSentiment(
    'Kindly request you to inspect the park lights when convenient. Thank you.'
  );
  assert(sent2.urgencyScore <= 65, `Polite inquiry scored moderate urgency: ${sent2.urgencyScore}/100`);
  const validPoliteTones = ['NEUTRAL', 'POLITE', 'CALM', 'HOPEFUL', 'APPRECIATIVE', 'CONCERNED'];
  assert(validPoliteTones.includes(sent2.citizenTone.toUpperCase()), `Polite request tone detected as ${sent2.citizenTone}`);

  // ---------------------------------------------------------------------------
  // Test Suite 4: Safety Risk Detection
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: Public Safety Hazard Detection ---');
  const safe1 = await GroqAiEngine.detectSafetyRisk(
    'Open deep manhole with no barricade on dark street',
    'Pedestrians at risk of falling into 10-foot open sewer chamber.'
  );
  assert(safe1.isSafetyRisk === true, 'Open manhole detected as Public Safety Risk');
  assert(safe1.severity === 'CRITICAL' || safe1.severity === 'HIGH', `Safety severity is high: ${safe1.severity}`);

  const safe2 = await GroqAiEngine.detectSafetyRisk(
    'Street sign font repainting needed',
    'Street board letters have faded slightly.'
  );
  assert(safe2.isSafetyRisk === false, 'Routine cosmetic maintenance not flagged as safety risk');

  // ---------------------------------------------------------------------------
  // Test Suite 5: Duplicate Detection
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: Duplicate Grievance Classifier ---');
  const candidateComplaints: Complaint[] = [
    {
      id: 'cmp-dup-01',
      tracking_id: 'CC-TN-2026-104921',
      citizen_id: 'usr-cit-01',
      category_id: 'cat-roads-1',
      department_id: 'dept-roads',
      status: ComplaintStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      title: 'Severe Pothole Cluster on Usman Road Flyover descent',
      description: 'Multiple deep potholes covering 15 meters on the descent towards T. Nagar bus terminus.',
      location: null,
      address: 'Usman Road Flyover, T. Nagar, Chennai',
      ward: 114,
      district: 'Chennai',
      source: ComplaintSource.TEXT,
      language: 'en',
      is_public: true,
      sla_deadline: null,
      sla_breached: false,
      escalation_level: 0,
      ai_category_confidence: 0.95,
      ai_priority_confidence: 0.9,
      ai_sentiment: 'Urgent',
      resolved_at: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const dupResult = await GroqAiEngine.detectDuplicates(
    'Deep potholes on Usman Road flyover ramp',
    'Severe road holes on Usman road descent near T Nagar bus stand.',
    candidateComplaints
  );
  assert(dupResult.isDuplicate === true, 'Successfully flagged duplicate grievance');
  assert(dupResult.duplicateOfTrackingId === 'CC-TN-2026-104921', 'Matched exact existing tracking ID');

  const nonDupResult = await GroqAiEngine.detectDuplicates(
    'Park bench broken in Anna Nagar',
    'Children play area bench is broken in Anna Nagar tower park.',
    candidateComplaints
  );
  assert(nonDupResult.isDuplicate === false, 'Unrelated issue correctly marked as non-duplicate');

  // ---------------------------------------------------------------------------
  // Test Suite 6: Complaint Summarization (Bilingual English + Tamil)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 6: Bilingual Summarization ---');
  const summaryResult = await GroqAiEngine.summarizeComplaint(
    'Drinking water pipeline leakage on Velachery Main Road',
    'Clean drinking water gushing from underground joint opposite Phoenix mall since morning.'
  );
  assert(summaryResult.englishSummary.length > 10, 'Generated concise English summary');
  assert(summaryResult.tamilSummary.length > 5, 'Generated Tamil translation summary');
  assert(!!summaryResult.keyActionItem, 'Generated actionable recommendation');

  // ---------------------------------------------------------------------------
  // Test Suite 7: Resolution Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 7: Resolution Proof Verification ---');
  const resValid = await GroqAiEngine.verifyResolution(
    'Large pothole on Usman Road',
    'Deep crater in asphalt.',
    ['https://example.com/before.jpg'],
    ['https://example.com/after.jpg'],
    'Asphalt patch applied, compacted with 5-ton roller, surface leveled.'
  );
  assert(
    resValid.verificationResult === VerificationResult.VERIFIED || resValid.verificationResult === VerificationResult.REQUIRES_REVIEW,
    `Valid proof verified: ${resValid.verificationResult}`
  );

  const resSuspicious = await GroqAiEngine.verifyResolution(
    'Large pothole on Usman Road',
    'Deep crater in asphalt.',
    ['https://example.com/before.jpg'],
    [], // Missing after photos
    'Done.'
  );
  assert(
    resSuspicious.verificationResult === VerificationResult.SUSPICIOUS || resSuspicious.verificationResult === VerificationResult.REQUIRES_REVIEW,
    `Missing proof flagged: ${resSuspicious.verificationResult}`
  );

  const verifiedGround = validateAndGroundVerificationResult('UNKNOWN_VERIFICATION_STATUS');
  assert(verifiedGround === VerificationResult.REQUIRES_REVIEW, 'Safely grounded unknown verification result');

  // ---------------------------------------------------------------------------
  // Test Suite 8: Macro Insight & Trend Generation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 8: Macro Insight & Trend Analytics ---');
  const insights = await GroqAiEngine.generateInsights(candidateComplaints, 'ROADS');
  assert(Array.isArray(insights.macroInsights) && insights.macroInsights.length > 0, 'Generated macro insights list');
  assert(Array.isArray(insights.preventiveRecommendations), 'Generated preventive recommendations');

  // ---------------------------------------------------------------------------
  // Test Suite 9: PII Redaction & Privacy Shield
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 9: PII Masking & Privacy Shield ---');
  const sensitiveText = 'My phone number is 9840012345 and email is citizen.karthik@gmail.com. Aadhaar: 1234 5678 9012.';
  const masked = maskPii(sensitiveText);
  assert(!masked.includes('9840012345'), 'Phone number redacted from log output');
  assert(!masked.includes('citizen.karthik@gmail.com'), 'Email address redacted from log output');
  assert(!masked.includes('1234 5678 9012'), 'Aadhaar ID number redacted from log output');
  assert(masked.includes('[PHONE_REDACTED]'), 'Phone replacement token present');

  // ---------------------------------------------------------------------------
  // Test Suite 10: Unified Full Triage Pipeline
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 10: Unified Full Triage Pipeline ---');
  const fullTriage = await GroqAiEngine.runFullTriage(
    'Hazardous overflowing sewage drain near children hospital',
    'Foul black sewage flooding the hospital entrance path for 3 days.'
  );
  assert(fullTriage.categorization.departmentCode === 'DRAINAGE', 'Triage categorized as DRAINAGE');
  assert(fullTriage.priority.priority === Priority.URGENT || fullTriage.priority.priority === Priority.HIGH, 'Triage marked high/urgent priority');
  assert(fullTriage.safety.isSafetyRisk === true, 'Triage detected safety hazard near hospital');
  assert(!!fullTriage.summary.englishSummary, 'Triage generated English summary');

  // ---------------------------------------------------------------------------
  // Test Suite 11: Malformed AI Responses & Schema Defensive Validation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 11: Malformed AI Responses & Defensive Validation ---');
  // Hallucinated priority
  const groundedPrio = validateAndGroundPriority('HALLUCINATED_EMERGENCY_EXTRA_CRITICAL');
  assert(groundedPrio === Priority.MEDIUM, 'Hallucinated priority safely defaulted to MEDIUM');

  // Hallucinated Category and Department
  const groundedCat = validateAndGroundCategory('INVENTED_CAT_007', 'INVENTED_DEPT_X');
  assert(groundedCat.departmentCode === 'GENERAL', 'Hallucinated department safely defaulted to GENERAL');
  assert(groundedCat.categoryCode === 'GEN_OTHER', 'Hallucinated category safely defaulted to GEN_OTHER');
  assert(!!groundedCat.categoryId, 'Grounded category has valid UUID in database');

  // Grounding of malformed status
  const groundedVerif = validateAndGroundVerificationResult('INVENTED_CLOSE_NOW');
  assert(groundedVerif === VerificationResult.REQUIRES_REVIEW, 'Hallucinated verification status defaulted to REQUIRES_REVIEW');

  // ---------------------------------------------------------------------------
  // Test Suite 12: API Failures & Zero-Downtime Fallback Behavior
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 12: API Failures & Fallback Resilience ---');
  // Verify that even with network failure / no GROQ_API_KEY, fallback engine returns 100% valid schema
  const fallbackCat = fallbackCategorize('Broken water pipe leaking clean drinking water', 'Royapettah main junction pipe ruptured.');
  assert(fallbackCat.departmentCode === 'WATER', 'Fallback successfully handled query without external API');
  assert(fallbackCat.isAiGenerated === false, 'Fallback correctly tagged as non-AI generated');
  assert(!!fallbackCat.categoryId, 'Fallback yielded validated database category UUID');

  const fallbackPrio = fallbackAnalyzePriority('High voltage transformer burning on street', 'Flames coming from box near apartment.');
  assert(fallbackPrio.priority === Priority.URGENT, 'Fallback correctly classified urgency of life safety hazard');
  assert(fallbackPrio.isAiGenerated === false, 'Fallback marked as rule-based fallback');

  console.log('\n=============================================================================');
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
  console.log('=============================================================================\n');

  if (failed > 0) process.exit(1);
}

runAiTests().catch((err) => {
  console.error('Fatal error in AI test suite:', err);
  process.exit(1);
});
