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

async function inspectAndClean() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: allProfiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to query profiles:', error);
    return;
  }

  console.log(`Total profiles found in DB: ${allProfiles.length}`);
  allProfiles.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Email: ${p.email} | Name: ${p.display_name} | UID: ${p.firebase_uid} | Role: ${p.role}`);
  });

  // Identify guest / dummy profiles to delete:
  // 1. firebase_uid starts with 'guest_'
  // 2. email starts with 'guest_' or contains '@citizen.civicconnect.tn.gov.in' (except real demo ones if needed, but the user said only Kavitha and Priya Sundaram are the 2 registered users!)
  const guestProfiles = allProfiles.filter(p => 
    p.firebase_uid?.startsWith('guest_') || 
    p.email?.startsWith('guest_') ||
    (p.display_name === 'Karthik Subramanian' && p.email?.includes('guest_'))
  );

  console.log(`Found ${guestProfiles.length} guest/dummy profiles to delete.`);

  if (guestProfiles.length > 0) {
    const idsToDelete = guestProfiles.map(p => p.id);
    const { error: delError } = await supabase.from('profiles').delete().in('id', idsToDelete);
    if (delError) {
      console.error('Error deleting dummy guest profiles:', delError);
    } else {
      console.log(`Successfully deleted ${guestProfiles.length} guest/dummy profiles from DB.`);
    }
  }

  // Check remaining profiles
  const { data: remaining } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  console.log(`Remaining profiles count: ${remaining?.length}`);
  remaining?.forEach(p => {
    console.log(`- ${p.display_name} (${p.email}) [Role: ${p.role}]`);
  });
}

inspectAndClean();
