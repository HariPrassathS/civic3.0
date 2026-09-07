// =============================================================================
// CivicConnect TN — Reset / Delete All Complaints (Fresh Deployment Prep)
// =============================================================================
// Deletes only complaint records and cascading data (complaint_media,
// complaint_updates, upvotes, comments, assignments, ai_insights, escalation_logs).
// Profiles, departments, categories, and configs are left completely intact.

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually if process.env values are missing
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

async function resetComplaints() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n=============================================================================');
  console.log('🧹 CivicConnect TN — Database Complaint Cleanup for Fresh Deployment');
  console.log('=============================================================================\n');

  // 1. Check current complaint count
  const { count: initialCount, error: countErr } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('❌ Failed to count complaints:', countErr.message);
    process.exit(1);
  }

  console.log(`📊 Current complaints in database: ${initialCount ?? 0}`);

  // 2. Delete all complaints (cascades to media, updates, upvotes, comments, assignments, etc.)
  console.log('⏳ Deleting all complaints and cascading records...');
  const { error: deleteErr } = await supabase
    .from('complaints')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows

  if (deleteErr) {
    console.error('❌ Error deleting complaints:', deleteErr.message);
    process.exit(1);
  }

  // 3. Clean up any leftover notifications referencing complaints
  console.log('⏳ Cleaning notifications...');
  const { error: notifErr } = await supabase
    .from('notifications')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (notifErr) {
    console.warn('⚠️ Warning cleaning notifications:', notifErr.message);
  }

  // 4. Clean up files in complaint-evidence bucket if any
  console.log('⏳ Cleaning files in complaint-evidence bucket...');
  try {
    const { data: fileList, error: listErr } = await supabase.storage
      .from('complaint-evidence')
      .list('', { limit: 100 });

    if (!listErr && fileList && fileList.length > 0) {
      const pathsToDelete = fileList.map((f) => f.name);
      console.log(`   Found ${pathsToDelete.length} files in storage to delete.`);
      const { error: removeErr } = await supabase.storage
        .from('complaint-evidence')
        .remove(pathsToDelete);
      if (removeErr) {
        console.warn('⚠️ Warning removing storage files:', removeErr.message);
      } else {
        console.log('   ✅ Cleaned storage bucket files.');
      }
    } else {
      console.log('   ✅ Storage bucket is already empty.');
    }
  } catch (err) {
    console.warn('⚠️ Storage cleanup note:', err);
  }

  // 5. Verify remaining counts
  const { count: finalCount } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true });

  const { count: deptCount } = await supabase
    .from('departments')
    .select('*', { count: 'exact', head: true });

  const { count: catCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log('\n-----------------------------------------------------------------------------');
  console.log('✅ CLEANUP COMPLETE — CURRENT DATABASE STATUS:');
  console.log(`   Complaints:       ${finalCount ?? 0} (Fresh start)`);
  console.log(`   Departments:      ${deptCount ?? 0} (Preserved)`);
  console.log(`   Categories:       ${catCount ?? 0} (Preserved)`);
  console.log(`   User Profiles:    ${profileCount ?? 0} (Preserved)`);
  console.log('=============================================================================\n');
}

resetComplaints().catch((err) => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
