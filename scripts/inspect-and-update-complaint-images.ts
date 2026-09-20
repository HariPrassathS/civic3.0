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

async function inspectImages() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, tracking_id, title, district, ward')
    .order('created_at', { ascending: false });

  console.log(`Found ${complaints?.length} complaints in database.`);

  for (const c of complaints || []) {
    const { data: media } = await supabase
      .from('complaint_media')
      .select('id, url, phase, media_type')
      .eq('complaint_id', c.id);

    console.log(`\n[${c.tracking_id}] ${c.title} (${c.district})`);
    media?.forEach(m => console.log(`  -> Media: ${m.url}`));
  }
}

inspectImages();
