import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnv();

async function cleanMockUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: allProfiles } = await supabase.from('profiles').select('*');
  if (!allProfiles) return;

  console.log('Total profiles before cleanup:', allProfiles.length);

  // Target profiles to keep:
  // 1. Kavitha 1927 (kavithaa1927@gmail.com)
  // 2. Priya Sundaram (citizen.test@civicconnect.tn.gov.in)
  // Official system roles:
  const officialEmails = [
    'kavithaa1927@gmail.com',
    'citizen.test@civicconnect.tn.gov.in',
  ];

  const profilesToDelete = allProfiles.filter(p => {
    // Delete any mock citizens, phone numbers, dummy test accounts
    const isMockCitizen = p.role === 'citizen' && !officialEmails.includes(p.email.toLowerCase());
    return isMockCitizen;
  });

  console.log(`Found ${profilesToDelete.length} mock citizen profiles to remove:`);
  profilesToDelete.forEach(p => console.log(`- ${p.display_name} (${p.email})`));

  // Find a target profile to reassign any existing complaints to before deleting
  const priyaProfile = allProfiles.find(p => p.email.toLowerCase() === 'citizen.test@civicconnect.tn.gov.in') ||
                       allProfiles.find(p => p.email.toLowerCase() === 'kavithaa1927@gmail.com');

  if (!priyaProfile) {
    console.error('Target keeper profile not found!');
    return;
  }

  for (const p of profilesToDelete) {
    // Reassign complaints if any
    await supabase.from('complaints').update({ citizen_id: priyaProfile.id }).eq('citizen_id', p.id);
    await supabase.from('complaint_updates').update({ updated_by: priyaProfile.id }).eq('updated_by', p.id);
    await supabase.from('comments').delete().eq('user_id', p.id);
    await supabase.from('upvotes').delete().eq('user_id', p.id);
    await supabase.from('notifications').delete().eq('user_id', p.id);

    // Delete profile
    const { error: delErr } = await supabase.from('profiles').delete().eq('id', p.id);
    if (delErr) {
      console.error(`Failed to delete profile ${p.email}:`, delErr.message);
    } else {
      console.log(`Deleted profile: ${p.display_name} (${p.email})`);
    }
  }

  const { data: remaining } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  console.log('\n--- Remaining profiles in database ---');
  console.log('Count:', remaining?.length);
  remaining?.forEach(p => console.log(`[${p.role}] ${p.display_name} (${p.email})`));
}

cleanMockUsers();
