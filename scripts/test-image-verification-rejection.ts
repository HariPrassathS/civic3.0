import fs from 'fs';
import path from 'path';

// Load .env.local variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {}

import { ComplaintEngine } from '../lib/complaints/engine';
import { UserRole, ComplaintSource, MediaType } from '../types/enums';

async function runVerificationTests() {
  console.log('=============================================================================');
  console.log('🧪 Testing CivicConnect AI Evidence Verification & Auto-Rejection Gate');
  console.log('=============================================================================\n');

  const actor = {
    id: 'b3e93510-b1cf-4b7f-95ec-ce6cac4fc613',
    role: UserRole.CITIZEN,
    display_name: 'Kavitha S',
  };

  // 1. Test Non-Civic Image (Cat photo)
  console.log('▶ Test 1: Submitting Non-Civic Photo (Pet/Cat)...');
  const catResult = await ComplaintEngine.createComplaint(
    {
      title: 'Water pipe leaking heavily on street',
      description: 'Major drinking water pipe cracked and flooding road.',
      address: 'Velachery Main Road, Chennai',
      ward: 178,
      district: 'Chennai',
      source: ComplaintSource.TEXT,
      media: [
        {
          url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
          media_type: MediaType.IMAGE,
        },
      ],
    },
    actor
  );

  console.log('Test 1 Result:', {
    success: catResult.success,
    is_rejected: catResult.is_rejected,
    detected_content: catResult.detected_content,
    rejection_reason_en: catResult.rejection_reason,
    rejection_reason_ta: catResult.rejection_reason_ta,
  });

  if (catResult.success === false && catResult.is_rejected === true) {
    console.log('✅ Test 1 PASSED: Non-civic photo was correctly REJECTED with reason!\n');
  } else {
    console.error('❌ Test 1 FAILED: Expected rejection but got:', catResult);
  }

  // 2. Test Mismatched Image (Dark road photo for Garbage complaint)
  console.log('▶ Test 2: Submitting Mismatched Photo (Dark road for Garbage complaint)...');
  const mismatchResult = await ComplaintEngine.createComplaint(
    {
      title: 'Overflowing garbage bin and dead animal waste',
      description: 'Massive garbage heap overflowing with toxic smell near temple.',
      address: 'Mylapore Tank, Chennai',
      ward: 124,
      district: 'Chennai',
      source: ComplaintSource.TEXT,
      media: [
        {
          url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400', // dark road at night
          media_type: MediaType.IMAGE,
        },
      ],
    },
    actor
  );

  console.log('Test 2 Result:', {
    success: mismatchResult.success,
    is_rejected: mismatchResult.is_rejected,
    detected_content: mismatchResult.detected_content,
    rejection_reason_en: mismatchResult.rejection_reason,
    rejection_reason_ta: mismatchResult.rejection_reason_ta,
  });

  if (mismatchResult.success === false && mismatchResult.is_rejected === true) {
    console.log('✅ Test 2 PASSED: Mismatched photo was correctly REJECTED with reason!\n');
  } else {
    console.error('❌ Test 2 FAILED: Expected rejection but got:', mismatchResult);
  }

  // 3. Test Valid Construction Waste Photo for Debris Complaint
  console.log('▶ Test 3: Submitting Genuine Matching Construction Waste Photo...');
  const wasteImgPath = 'C:\\Users\\harip\\Downloads\\test images\\12 constructions waste.jpg';
  let wasteDataUrl = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400';
  if (fs.existsSync(wasteImgPath)) {
    wasteDataUrl = `data:image/jpeg;base64,${fs.readFileSync(wasteImgPath).toString('base64')}`;
  }

  const validResult = await ComplaintEngine.createComplaint(
    {
      title: 'Construction debris and concrete waste dumped on road',
      description: 'Illegal dumping of building demolition waste and concrete rubble blocking sidewalk.',
      address: 'Anna Salai, Chennai',
      ward: 114,
      district: 'Chennai',
      source: ComplaintSource.TEXT,
      media: [
        {
          url: wasteDataUrl,
          media_type: MediaType.IMAGE,
        },
      ],
    },
    actor
  );

  console.log('Test 3 Result:', {
    success: validResult.success,
    tracking_id: validResult.complaint?.tracking_id,
    status: validResult.complaint?.status,
    priority: validResult.complaint?.priority,
    detected_content: (validResult.complaint?.media?.[0]?.ai_analysis as any)?.detected_content,
  });

  if (validResult.success === true && validResult.complaint?.tracking_id) {
    console.log('✅ Test 3 PASSED: Valid civic photo was APPROVED and registered!\n');
  } else {
    console.error('❌ Test 3 FAILED: Expected approval but got:', validResult);
  }

  console.log('=============================================================================');
  console.log('🎉 ALL AI EVIDENCE VERIFICATION & REJECTION TESTS COMPLETED');
  console.log('=============================================================================');
}

runVerificationTests().catch(console.error);
