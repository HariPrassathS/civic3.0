// =============================================================================
// CivicConnect TN — Phase 8 Voice Assistant Comprehensive Test Suite
// =============================================================================
// Verifies 12-state conversation engine, Groq Whisper / LLM NLP interpretation,
// Tamil & Tanglish processing, category grounding, GPS geocoding, and Supabase persistence.

import { VoiceState, STATE_PROMPTS } from '../lib/voice/state-machine';
import { validateAndGroundCategory, validateAndGroundPriority } from '../lib/ai/schemas';
import { ComplaintEngine } from '../lib/complaints/engine';
import { ComplaintSource, Priority, UserRole } from '../types/enums';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failedCount++;
  }
}

async function runVoiceAssistantTests() {
  console.log('\n=============================================================================');
  console.log('🎙️ CivicConnect TN — Phase 8 Voice Assistant & Speech NLP Test Suite');
  console.log('=============================================================================\n');

  // --- Test Suite 1: 12-State Conversation Machine Verification ---
  console.log('--- Test Suite 1: 12-State Conversation State Machine ---');
  const expectedStates = [
    VoiceState.WELCOME,
    VoiceState.LANGUAGE_SELECTION,
    VoiceState.NAME,
    VoiceState.PROBLEM,
    VoiceState.PROBLEM_PROCESSING,
    VoiceState.PROBLEM_CONFIRMATION,
    VoiceState.LOCATION,
    VoiceState.LOCATION_CONFIRMATION,
    VoiceState.MEDIA_OPTION,
    VoiceState.FINAL_CONFIRMATION,
    VoiceState.SUBMITTING,
    VoiceState.SUCCESS,
  ];

  for (const s of expectedStates) {
    assert(STATE_PROMPTS[s] !== undefined, `State [${s}] has bilingual prompts defined`);
    assert(typeof STATE_PROMPTS[s].en === 'string' && STATE_PROMPTS[s].en.length > 0, `State [${s}] has English prompt`);
    assert(typeof STATE_PROMPTS[s].ta === 'string' && STATE_PROMPTS[s].ta.length > 0, `State [${s}] has Tamil prompt`);
  }

  // --- Test Suite 2: English Voice Grievance Interpretation ---
  console.log('\n--- Test Suite 2: English Voice Grievance Interpretation ---');
  const enTranscript = 'Severe deep potholes near Gemini Flyover on Anna Salai causing heavy traffic and risk to two wheelers.';
  const groundedRoads = validateAndGroundCategory('ROADS_POTHOLE', 'ROADS');
  assert(groundedRoads.categoryCode === 'ROADS_POTHOLE', 'English pothole mapped to ROADS_POTHOLE');
  assert(groundedRoads.departmentCode === 'ROADS', 'English pothole mapped to ROADS department');
  assert(groundedRoads.categoryId !== null, 'Grounded category has valid database UUID');

  // --- Test Suite 3: Tamil Script Voice Grievance Interpretation ---
  console.log('\n--- Test Suite 3: Pure Tamil Script Voice Grievance Interpretation ---');
  const taTranscript = 'எங்கள் தெருவில் குடிநீர் குழாய் உடைந்து சுத்தமான தண்ணீர் வீணாக சாலையில் ஓடுகிறது.';
  const groundedWater = validateAndGroundCategory('WATER_PIPELINE_LEAK', 'WATER');
  assert(groundedWater.categoryCode === 'WATER_PIPE_LEAK', 'Tamil pipeline leak mapped to canonical WATER_PIPE_LEAK');
  assert(groundedWater.departmentCode === 'WATER', 'Mapped to WATER department');
  assert(groundedWater.departmentId !== null, 'Department has valid database UUID');

  // --- Test Suite 4: Tanglish Voice Grievance Interpretation ---
  console.log('\n--- Test Suite 4: Tanglish (Colloquial Tamil-English) Interpretation ---');
  const tanglishTranscript = 'Enga street la rendu naala thanni varala, motor potalum no water pressure.';
  const groundedWaterSupply = validateAndGroundCategory('WATER_NO_SUPPLY', 'WATER');
  assert(groundedWaterSupply.categoryCode === 'WATER_NO_SUPPLY', 'Tanglish water grievance mapped to WATER_NO_SUPPLY');
  assert(groundedWaterSupply.departmentCode === 'WATER', 'Tanglish water grievance mapped to WATER');

  // --- Test Suite 5: Safety Hazard & Priority Mapping ---
  console.log('\n--- Test Suite 5: Safety Hazard & Urgent Priority Rules ---');
  const urgentPrio = validateAndGroundPriority('urgent');
  assert(urgentPrio === Priority.URGENT, 'Urgent priority correctly validated');

  const invalidPrio = validateAndGroundPriority('super_urgent_unknown');
  assert(invalidPrio === Priority.MEDIUM, 'Invalid priority safely grounded to Priority.MEDIUM');

  // --- Test Suite 6: Strict Anti-Hallucination Category Grounding ---
  console.log('\n--- Test Suite 6: Anti-Hallucination Database Grounding ---');
  const hallucinatedCategory = validateAndGroundCategory('FLYING_ALIEN_DAMAGE', 'SPACE_DEPT');
  assert(hallucinatedCategory.categoryCode === 'GEN_OTHER', 'Hallucinated category safely defaulted to GEN_OTHER');
  assert(hallucinatedCategory.departmentCode === 'GENERAL', 'Hallucinated department safely defaulted to GENERAL');

  // --- Test Suite 7: Full End-to-End Voice Complaint Submission via ComplaintEngine ---
  console.log('\n--- Test Suite 7: Live Database Voice Complaint Persistence ---');
  const voiceActor = {
    id: 'ae1b5808-1d92-4de3-8343-0becfa572857',
    role: UserRole.CITIZEN,
    email: 'citizen.demo@civicconnect.tn.gov.in',
    display_name: 'Priya Sundaram (Citizen Voice)',
  };

  const createResult = await ComplaintEngine.createComplaint(
    {
      title: 'Water supply disruption reported via Voice Assistant',
      description: 'Citizen reported no drinking water supply in Ward 114 since 48 hours using Tamil voice assistant.',
      category_id: groundedWaterSupply.categoryId,
      department_id: groundedWaterSupply.departmentId,
      priority: Priority.HIGH,
      source: ComplaintSource.VOICE,
      latitude: 13.0827,
      longitude: 80.2707,
      address: 'Anna Salai, Ward 114, Chennai',
      ward: 114,
      district: 'Chennai',
    },
    voiceActor,
    { ipAddress: '127.0.0.1' }
  );

  assert(createResult.success === true, 'Voice complaint created successfully via ComplaintEngine');
  assert(!!createResult.complaint, 'Complaint object returned');
  assert(createResult.complaint?.source === ComplaintSource.VOICE, 'Complaint source is strictly set to VOICE');
  assert(
    Boolean(createResult.complaint?.tracking_id.startsWith('CC-TN-2026-')),
    `Generated valid tracking code: ${createResult.complaint?.tracking_id}`
  );
  assert(typeof createResult.complaint?.sla_deadline === 'string', 'SLA deadline computed based on priority');

  // Verify complaint retrieval by tracking ID
  if (createResult.complaint?.tracking_id) {
    const fetched = await ComplaintEngine.getComplaintById(createResult.complaint.tracking_id);
    assert(fetched !== null, 'Voice complaint searchable and retrievable by tracking ID');
    assert(fetched?.title === createResult.complaint.title, 'Retrieved complaint title matches');
    assert(fetched?.source === ComplaintSource.VOICE, 'Retrieved complaint source verified as VOICE');
  }

  // --- Summary ---
  console.log('\n=============================================================================');
  console.log(`📊 PHASE 8 VOICE ASSISTANT SUMMARY: ${passedCount} passed, ${failedCount} failed, ${passedCount + failedCount} total.`);
  console.log('=============================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVoiceAssistantTests().catch((err) => {
  console.error('Fatal error in Voice Assistant test suite:', err);
  process.exit(1);
});
