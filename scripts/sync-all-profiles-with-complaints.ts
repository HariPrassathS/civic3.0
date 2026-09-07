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

async function syncProfiles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr || !profiles) {
    console.error('Failed to get profiles:', pErr);
    return;
  }

  for (const prof of profiles) {
    // Find latest complaint for this profile
    const { data: comp } = await supabase
      .from('complaints')
      .select('district, ward, created_at')
      .eq('citizen_id', prof.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (comp && (comp.district || comp.ward)) {
      console.log(`Syncing profile ${prof.display_name} (${prof.email}) -> District: ${comp.district}, Ward: ${comp.ward}`);
      await supabase
        .from('profiles')
        .update({
          district: comp.district || prof.district,
          ward_id: comp.ward || prof.ward_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prof.id);
    }
  }

  // Also check if any complaint has citizen name or email matching
  const { data: updatedProfiles } = await supabase.from('profiles').select('id, display_name, email, role, ward_id, district').order('created_at', { ascending: false });
  console.log('\n--- Updated Profiles ---');
  updatedProfiles?.forEach(p => console.log(`${p.display_name} (${p.email}) -> Ward: ${p.ward_id}, District: ${p.district}`));
}

syncProfiles();
