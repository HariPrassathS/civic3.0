// =============================================================================
// CivicConnect TN — Complaint Management Engine Automated Test Suite
// =============================================================================
// Comprehensive test suite verifying input validation, state machine integrity,
// category & department resolution, SLA computation, tracking IDs, role guards,
// citizen ownership, exception flows (reject/escalate/reopen), and audit history.

import { ComplaintEngine } from '../lib/complaints/engine';
import { ComplaintStatus, Priority, UserRole, ComplaintSource, MediaType } from '../types/enums';
import { isValidTransition, getNextStatuses, isTerminalStatus } from '../config/lifecycle';
import { resolveCategoryAndDepartment } from '../lib/complaints/categories';
import { createAdminClient } from '../lib/supabase/admin';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) {
      console.error(`     Details: ${failureDetails}`);
    }
  }
}

async function runAllTests() {
  console.log('\n=============================================================================');
  console.log('🏛️ CivicConnect TN — Core Complaint Management Engine Test Suite');
  console.log('=============================================================================\n');

  const supabase = createAdminClient();
  const { data: profiles } = await supabase.from('profiles').select('id, email, role, display_name');
  const getProf = (role: string, fallbackId: string) => {
    const p = (profiles || []).find((x: any) => x.role === role);
    return {
      id: p?.id || fallbackId,
      role: (p?.role || role) as UserRole,
      email: p?.email || `${role}@civicconnect.tn.gov.in`,
      displayName: p?.display_name || role,
    };
  };

  const citizenA = getProf('citizen', 'c0000000-0000-0000-0000-000000000001');
  const citizenB = {
    id: '00000000-0000-0000-0000-000000000999',
    role: UserRole.CITIZEN,
    email: 'kavitha.unauth@civicconnect.tn.gov.in',
    displayName: 'Kavitha M (Unauth Citizen)',
  };
  const fieldWorker = getProf('field_worker', 'f0000000-0000-0000-0000-000000000001');
  const areaOfficer = getProf('area_officer', 'a0000000-0000-0000-0000-000000000001');
  const deptHead = getProf('department_head', 'd0000000-0000-0000-0000-000000000001');

  // ---------------------------------------------------------------------------
  // Test Group 1: Category & Department Resolution & SLA Computation
  // ---------------------------------------------------------------------------
  console.log('--- Test Group 1: Category & Department Mapping & SLA Hours ---');
  {
    const roadRes = resolveCategoryAndDepartment('ROADS_POTHOLE');
    assert(roadRes.category !== null, 'Resolves ROADS_POTHOLE category');
    assert(roadRes.department?.code === 'ROADS', 'Resolves parent department ROADS');
    assert(roadRes.resolvedPriority === Priority.HIGH, 'Default priority is HIGH');
    assert(roadRes.slaHours === 24, 'SLA hours is 24h for pothole');

    const waterRes = resolveCategoryAndDepartment('WATER_CONTAMINATION');
    assert(waterRes.category !== null, 'Resolves WATER_CONTAMINATION category');
    assert(waterRes.department?.code === 'WATER', 'Resolves parent department WATER');
    assert(waterRes.resolvedPriority === Priority.URGENT, 'Default priority is URGENT');
    assert(waterRes.slaHours === 12, 'SLA hours is 12h for contaminated water');

    const fallbackRes = resolveCategoryAndDepartment(undefined, 'DRAINAGE');
    assert(fallbackRes.department?.code === 'DRAINAGE', 'Resolves department from code directly');
  }

  // ---------------------------------------------------------------------------
  // Test Group 2: Complaint Creation & Input Validation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Complaint Creation & Validation ---');
  let validComplaintId = '';
  let validTrackingId = '';

  {
    // Valid complaint creation
    const res = await ComplaintEngine.createComplaint(
      {
        title: 'Deep Trench left open near Anna Arch signal',
        description: 'Road excavation trench left unpaved for 5 days. Water accumulating and causing traffic congestion.',
        category_id: 'ROADS_POTHOLE',
        priority: Priority.HIGH,
        latitude: 13.0827,
        longitude: 80.2707,
        ward: 105,
        district: 'Chennai',
        address: 'Poonamallee High Road, Anna Nagar, Chennai',
        source: ComplaintSource.TEXT,
        media: [
          {
            url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
            media_type: MediaType.IMAGE,
          },
        ],
      },
      citizenA
    );

    assert(res.success === true, 'Valid complaint created successfully');
    assert(!!res.complaint, 'Complaint object returned');
    if (res.complaint) {
      validComplaintId = res.complaint.id;
      validTrackingId = res.complaint.tracking_id;

      const trackingPattern = /^CC-TN-\d{4}-\d{6}$/;
      assert(trackingPattern.test(validTrackingId), `Tracking ID matches CC-TN-YYYY-XXXXXX pattern (${validTrackingId})`);
      assert(res.complaint.status === ComplaintStatus.CREATED, 'Initial status is CREATED');
      assert(res.complaint.citizen_id === citizenA.id, 'Citizen ID matches creator');
      assert(res.complaint.priority === Priority.HIGH, 'Priority is HIGH');
      assert(res.complaint.updates?.length === 1, 'Initial lifecycle update recorded');
      assert(res.complaint.updates?.[0].new_status === 'created', 'Initial update status is created');

      const lookupByTracking = await ComplaintEngine.getComplaintById(validTrackingId);
      assert(lookupByTracking?.id === validComplaintId, 'Look up complaint by tracking ID string');
    }

    // Invalid: Title too short (<5 chars)
    const shortTitleRes = await ComplaintEngine.createComplaint(
      {
        title: 'Bad',
        description: 'A sufficiently long description of the problem on the road.',
      },
      citizenA
    );
    assert(shortTitleRes.success === false, 'Rejects complaint with short title (<5 chars)');
    assert(shortTitleRes.errors?.some((e) => e.includes('5 characters')) === true, 'Returns title length error');

    // Invalid: Description too short (<10 chars)
    const shortDescRes = await ComplaintEngine.createComplaint(
      {
        title: 'Valid Complaint Title Here',
        description: 'Short',
      },
      citizenA
    );
    assert(shortDescRes.success === false, 'Rejects complaint with short description (<10 chars)');

    // Invalid: GPS latitude out of bounds
    const badLatRes = await ComplaintEngine.createComplaint(
      {
        title: 'Valid Complaint Title Here',
        description: 'A sufficiently long description of the problem on the road.',
        latitude: 145.2,
        longitude: 80.2,
      },
      citizenA
    );
    assert(badLatRes.success === false, 'Rejects invalid latitude (>90)');

    // Invalid: Ward out of bounds
    const badWardRes = await ComplaintEngine.createComplaint(
      {
        title: 'Valid Complaint Title Here',
        description: 'A sufficiently long description of the problem on the road.',
        ward: 999,
      },
      citizenA
    );
    assert(badWardRes.success === false, 'Rejects invalid ward number (>200)');
  }

  // ---------------------------------------------------------------------------
  // Test Group 3: State Machine & Transition Rules
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 3: State Machine & Transition Guards ---');
  {
    // CREATED -> AI_PROCESSING (System only)
    assert(isValidTransition(ComplaintStatus.CREATED, ComplaintStatus.AI_PROCESSING, undefined, true), 'System can transition CREATED -> AI_PROCESSING');
    assert(!isValidTransition(ComplaintStatus.CREATED, ComplaintStatus.AI_PROCESSING, UserRole.CITIZEN, false), 'Citizen CANNOT transition CREATED -> AI_PROCESSING');

    // CREATED -> CLOSED (Illegal direct jump)
    assert(!isValidTransition(ComplaintStatus.CREATED, ComplaintStatus.CLOSED, UserRole.CITIZEN, false), 'Citizen CANNOT jump CREATED -> CLOSED');
    assert(!isValidTransition(ComplaintStatus.CREATED, ComplaintStatus.RESOLVED, UserRole.AREA_OFFICER, false), 'Officer CANNOT jump CREATED -> RESOLVED');

    // Terminal statuses
    assert(isTerminalStatus(ComplaintStatus.CLOSED), 'CLOSED is a terminal status');
    assert(isTerminalStatus(ComplaintStatus.REJECTED), 'REJECTED is a terminal status');
    assert(!isTerminalStatus(ComplaintStatus.IN_PROGRESS), 'IN_PROGRESS is not a terminal status');

    // Next statuses query
    const workerNext = getNextStatuses(ComplaintStatus.IN_PROGRESS, UserRole.FIELD_WORKER);
    assert(workerNext.includes(ComplaintStatus.RESOLUTION_SUBMITTED), 'Field worker can submit resolution from IN_PROGRESS');
    assert(!workerNext.includes(ComplaintStatus.RESOLVED), 'Field worker CANNOT mark RESOLVED directly');
  }

  // ---------------------------------------------------------------------------
  // Test Group 4: Role Authorization & Citizen Ownership Enforcement
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Role Authorization & Citizen Ownership ---');

  {
    // Citizen B trying to transition Citizen A's complaint
    const unauthTransition = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.CLOSED,
      actor: citizenB,
      notes: 'Hacking status close',
    });
    assert(unauthTransition.success === false, 'Citizen B CANNOT transition Citizen A\'s complaint (Ownership violation)');
    assert(unauthTransition.errors?.some((e) => e.includes('Unauthorized') || e.includes('Illegal')) === true, 'Returns unauthorized ownership error');

    // Citizen A trying an illegal role transition (e.g. IN_PROGRESS)
    const illegalRoleTransition = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.IN_PROGRESS,
      actor: citizenA,
    });
    assert(illegalRoleTransition.success === false, 'Citizen A CANNOT transition own complaint to IN_PROGRESS (Role violation)');

    // Citizen B trying to submit feedback on Citizen A's complaint
    const unauthFeedback = await ComplaintEngine.submitCitizenFeedback({
      complaintId: validComplaintId,
      actor: citizenB,
      rating: 5,
      satisfied: true,
      feedback: 'Great job',
    });
    assert(unauthFeedback.success === false, 'Citizen B CANNOT submit feedback on Citizen A\'s complaint');
  }

  // ---------------------------------------------------------------------------
  // Test Group 5: Full Linear Lifecycle State Progression
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Full Linear Lifecycle State Progression ---');
  {
    // Step 1: CREATED -> AI_PROCESSING (System triage)
    const step1 = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.AI_PROCESSING,
      actor: { id: 'system', role: UserRole.ADMIN },
      notes: 'AI model triage: verified category ROADS_POTHOLE (confidence: 0.96)',
      isSystem: true,
    });
    assert(step1.success === true, 'Step 1: System transition CREATED -> AI_PROCESSING');
    assert(step1.complaint?.status === ComplaintStatus.AI_PROCESSING, 'Status is AI_PROCESSING');

    // Step 2: AI_PROCESSING -> VALIDATED (System)
    const step2 = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.VALIDATED,
      actor: { id: 'system', role: UserRole.ADMIN },
      notes: 'Triage complete. Issue verified as valid civic grievance.',
      isSystem: true,
    });
    assert(step2.success === true, 'Step 2: System transition AI_PROCESSING -> VALIDATED');
    assert(step2.complaint?.status === ComplaintStatus.VALIDATED, 'Status is VALIDATED');

    // Step 3: VALIDATED -> ASSIGNED (Area Officer assigns Field Worker)
    const step3 = await ComplaintEngine.assignComplaint({
      complaintId: validComplaintId,
      assignedTo: fieldWorker.id,
      assignedBy: areaOfficer,
      roleAtAssignment: 'field_worker',
      notes: 'Assigned to Ward 105 Asphalt & Road Maintenance Crew #3',
    });
    assert(step3.success === true, 'Step 3: Area Officer assigns complaint to Field Worker');
    assert(step3.complaint?.status === ComplaintStatus.ASSIGNED, 'Status is ASSIGNED');
    assert(step3.assignment?.assigned_to === fieldWorker.id, 'Assigned to fieldWorker ID');

    // Step 4: ASSIGNED -> IN_PROGRESS (Field Worker acknowledges)
    const step4 = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.IN_PROGRESS,
      actor: fieldWorker,
      notes: 'Field crew arrived at site. Bitumen patching underway.',
    });
    assert(step4.success === true, 'Step 4: Field Worker starts work -> IN_PROGRESS');
    assert(step4.complaint?.status === ComplaintStatus.IN_PROGRESS, 'Status is IN_PROGRESS');

    // Step 5: IN_PROGRESS -> RESOLUTION_SUBMITTED (Field Worker uploads after-photos)
    const step5 = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.RESOLUTION_SUBMITTED,
      actor: fieldWorker,
      notes: 'Trench leveled and resurfaced with dense bituminous macadam (DBM).',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
          media_type: MediaType.IMAGE,
        },
      ],
    });
    assert(step5.success === true, 'Step 5: Field Worker submits resolution -> RESOLUTION_SUBMITTED');
    assert(step5.complaint?.status === ComplaintStatus.RESOLUTION_SUBMITTED, 'Status is RESOLUTION_SUBMITTED');

    // Step 6: RESOLUTION_SUBMITTED -> OFFICER_VERIFICATION (System queues)
    const step6 = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.OFFICER_VERIFICATION,
      actor: { id: 'system', role: UserRole.ADMIN },
      notes: 'Queued for Area Officer verification inspection.',
      isSystem: true,
    });
    assert(step6.success === true, 'Step 6: Transition to OFFICER_VERIFICATION');
    assert(step6.complaint?.status === ComplaintStatus.OFFICER_VERIFICATION, 'Status is OFFICER_VERIFICATION');

    // Step 7: OFFICER_VERIFICATION -> RESOLVED (Area Officer inspects and approves)
    const step7 = await ComplaintEngine.transitionStatus({
      complaintId: validComplaintId,
      newStatus: ComplaintStatus.RESOLVED,
      actor: areaOfficer,
      notes: 'Site inspected. Road patch verified smooth and safe for vehicular flow.',
    });
    assert(step7.success === true, 'Step 7: Area Officer verifies and resolves -> RESOLVED');
    assert(step7.complaint?.status === ComplaintStatus.RESOLVED, 'Status is RESOLVED');
    assert(!!step7.complaint?.resolved_at, 'resolved_at timestamp is populated');

    // Step 8: RESOLVED -> CITIZEN_FEEDBACK / CLOSED (Citizen gives 5 stars)
    const step8 = await ComplaintEngine.submitCitizenFeedback({
      complaintId: validComplaintId,
      actor: citizenA,
      rating: 5,
      feedback: 'Excellent response time! Trench was fixed within 24 hours.',
      satisfied: true,
    });
    assert(step8.success === true, 'Step 8: Citizen submits satisfaction feedback');
    assert(step8.complaint?.status === ComplaintStatus.CLOSED, 'Status moves to CLOSED upon satisfied feedback');
    assert(!!step8.complaint?.closed_at, 'closed_at timestamp is populated');
  }

  // ---------------------------------------------------------------------------
  // Test Group 6: Branching & Exception Flows (Reject, Escalate, Reopen)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Branching & Exception Flows ---');
  {
    // A. REJECT FLOW
    const rejectComplaintRes = await ComplaintEngine.createComplaint(
      {
        title: 'Spam / False Advertisement banner complaint',
        description: 'Testing spam complaint to verify rejection state transition.',
      },
      citizenA
    );
    assert(rejectComplaintRes.success === true, 'Created test complaint for rejection');
    const rejectId = rejectComplaintRes.complaint!.id;

    const rejectRes = await ComplaintEngine.transitionStatus({
      complaintId: rejectId,
      newStatus: ComplaintStatus.REJECTED,
      actor: areaOfficer,
      notes: 'Rejected: Grievance falls outside municipal jurisdiction.',
    });
    assert(rejectRes.success === true, 'Officer can REJECT invalid complaint');
    assert(rejectRes.complaint?.status === ComplaintStatus.REJECTED, 'Status is REJECTED');

    // B. ESCALATION FLOW
    const escalateComplaintRes = await ComplaintEngine.createComplaint(
      {
        title: 'SLA Breach: Sewage flooding hospital entrance',
        description: 'Critical sewage backup outside Government Stanley Hospital.',
        priority: Priority.URGENT,
      },
      citizenA
    );
    const escalateId = escalateComplaintRes.complaint!.id;

    // Transition CREATED -> ESCALATED (System SLA monitor)
    const escalateStep1 = await ComplaintEngine.transitionStatus({
      complaintId: escalateId,
      newStatus: ComplaintStatus.ESCALATED,
      actor: { id: 'system', role: UserRole.ADMIN },
      notes: 'SLA Breached: Automatic escalation Level 1 triggered.',
      isSystem: true,
    });
    assert(escalateStep1.success === true, 'System escalates complaint on SLA breach');
    assert(escalateStep1.complaint?.status === ComplaintStatus.ESCALATED, 'Status is ESCALATED');
    assert(escalateStep1.complaint?.escalation_level === 1, 'Escalation level incremented to 1');

    // Department Head de-escalates by assigning
    const deescalateRes = await ComplaintEngine.assignComplaint({
      complaintId: escalateId,
      assignedTo: fieldWorker.id,
      assignedBy: deptHead,
      notes: 'Priority allocation: Executive Engineer assigned direct task force.',
    });
    assert(deescalateRes.success === true, 'Department Head can assign escalated complaint');
    assert(deescalateRes.complaint?.status === ComplaintStatus.ASSIGNED, 'Status returned to ASSIGNED');

    // C. REOPEN FLOW
    // Create complaint, move to RESOLVED, citizen rejects resolution
    const reopenComplaintRes = await ComplaintEngine.createComplaint(
      {
        title: 'Streetlight blinking erratically on 4th Main Road',
        description: 'Lamp fixture blinking all night causing epileptic hazard.',
      },
      citizenA
    );
    const reopenId = reopenComplaintRes.complaint!.id;

    // Transition CREATED -> VALIDATED -> RESOLVED (for test)
    await ComplaintEngine.transitionStatus({
      complaintId: reopenId,
      newStatus: ComplaintStatus.VALIDATED,
      actor: areaOfficer,
    });
    await ComplaintEngine.transitionStatus({
      complaintId: reopenId,
      newStatus: ComplaintStatus.ASSIGNED,
      actor: areaOfficer,
    });
    await ComplaintEngine.transitionStatus({
      complaintId: reopenId,
      newStatus: ComplaintStatus.IN_PROGRESS,
      actor: fieldWorker,
    });
    await ComplaintEngine.transitionStatus({
      complaintId: reopenId,
      newStatus: ComplaintStatus.RESOLUTION_SUBMITTED,
      actor: fieldWorker,
    });
    await ComplaintEngine.transitionStatus({
      complaintId: reopenId,
      newStatus: ComplaintStatus.OFFICER_VERIFICATION,
      actor: { id: 'system', role: UserRole.ADMIN },
      isSystem: true,
    });
    await ComplaintEngine.transitionStatus({
      complaintId: reopenId,
      newStatus: ComplaintStatus.RESOLVED,
      actor: areaOfficer,
    });

    // Citizen provides feedback: NOT satisfied -> REOPENED
    const reopenFeedbackRes = await ComplaintEngine.submitCitizenFeedback({
      complaintId: reopenId,
      actor: citizenA,
      rating: 1,
      feedback: 'Light is still flickering! Work was not completed.',
      satisfied: false,
    });
    assert(reopenFeedbackRes.success === true, 'Citizen submits unsatisfied feedback');
    assert(reopenFeedbackRes.complaint?.status === ComplaintStatus.REOPENED, 'Status transitions to REOPENED');

    // Officer reassigns reopened complaint
    const reassignRes = await ComplaintEngine.assignComplaint({
      complaintId: reopenId,
      assignedTo: fieldWorker.id,
      assignedBy: areaOfficer,
      notes: 'Reopened grievance re-assigned for immediate capacitor replacement.',
    });
    assert(reassignRes.success === true, 'Reopened complaint re-assigned successfully');
    assert(reassignRes.complaint?.status === ComplaintStatus.ASSIGNED, 'Status moves back to ASSIGNED');
  }

  // ---------------------------------------------------------------------------
  // Test Group 7: Timeline & Audit History Immutability
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Timeline & Audit Log Verification ---');
  {
    const timeline = await ComplaintEngine.getComplaintTimeline(validComplaintId);
    assert(timeline.length >= 7, `Timeline recorded complete event trail (${timeline.length} updates recorded)`);

    // Verify chronological ordering
    let isOrdered = true;
    for (let i = 1; i < timeline.length; i++) {
      if (new Date(timeline[i].created_at).getTime() < new Date(timeline[i - 1].created_at).getTime()) {
        isOrdered = false;
        break;
      }
    }
    assert(isOrdered, 'Timeline updates are strictly sorted chronologically');

    // Audit logs check
    const auditLogs = await ComplaintEngine.getAuditHistory(validComplaintId, areaOfficer);
    assert(Array.isArray(auditLogs), 'Audit history returns array');
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n=============================================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} passed, ${failedTests} failed, ${totalTests} total.`);
  console.log('=============================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
