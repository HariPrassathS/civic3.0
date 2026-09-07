import { createAdminClient } from '../lib/supabase/admin';
import { UserRole } from '../types/enums';

const ALL_ROLES_PROFILES = [
  {
    firebase_uid: 'demo_citizen_tn',
    email: 'citizen.demo@civicconnect.tn.gov.in',
    display_name: 'Priya Sundaram (Citizen)',
    role: UserRole.CITIZEN,
    ward_id: 114,
    district: 'Chennai',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=citizen',
    is_active: true,
  },
  {
    firebase_uid: 'demo_field_worker_tn',
    email: 'worker.murugan@tn.gov.in',
    display_name: 'Murugan K (Field Worker)',
    role: UserRole.FIELD_WORKER,
    ward_id: 114,
    district: 'Chennai',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=field_worker',
    is_active: true,
  },
  {
    firebase_uid: 'demo_area_officer_tn',
    email: 'ae.ward114@chennaicorp.gov.in',
    display_name: 'Anand Kumar, AE (Area Officer)',
    role: UserRole.AREA_OFFICER,
    ward_id: 114,
    district: 'Chennai',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=area_officer',
    is_active: true,
  },
  {
    firebase_uid: 'demo_department_head_tn',
    email: 'ee.roads@chennaicorp.gov.in',
    display_name: 'Rajendran P, EE (Roads Dept Head)',
    role: UserRole.DEPARTMENT_HEAD,
    district: 'Chennai',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dept_head',
    is_active: true,
  },
  {
    firebase_uid: 'demo_commissioner_tn',
    email: 'commissioner@chennaicorp.gov.in',
    display_name: 'J. Radhakrishnan, IAS (City Commissioner)',
    role: UserRole.CITY_COMMISSIONER,
    district: 'Chennai',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=commissioner',
    is_active: true,
  },
  {
    firebase_uid: 'demo_district_collector_tn',
    email: 'collector.cni@tn.gov.in',
    display_name: 'Rashmi Siddharth, IAS (District Collector)',
    role: UserRole.DISTRICT_COLLECTOR,
    district: 'Chennai',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=collector',
    is_active: true,
  },
  {
    firebase_uid: 'demo_department_secretary_tn',
    email: 'sec.maws@tn.gov.in',
    display_name: 'D. Karthikeyan, IAS (MAWS Secretary)',
    role: UserRole.DEPARTMENT_SECRETARY,
    district: 'Tamil Nadu',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=secretary',
    is_active: true,
  },
  {
    firebase_uid: 'demo_chief_secretary_tn',
    email: 'cs@tn.gov.in',
    display_name: 'Shiv Das Meena, IAS (Chief Secretary)',
    role: UserRole.CHIEF_SECRETARY,
    district: 'Tamil Nadu',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=chief_secretary',
    is_active: true,
  },
  {
    firebase_uid: 'demo_chief_minister_tn',
    email: 'cmcell@tn.gov.in',
    display_name: 'Hon. Chief Minister Office',
    role: UserRole.CHIEF_MINISTER,
    district: 'Tamil Nadu',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=chief_minister',
    is_active: true,
  },
  {
    firebase_uid: 'demo_admin_tn',
    email: 'admin@civicconnect.tn.gov.in',
    display_name: 'CivicConnect TN Administrator',
    role: UserRole.ADMIN,
    district: 'Statewide',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    is_active: true,
  },
];

async function seedAllProfiles() {
  const supabase = createAdminClient();
  console.log('Seeding profiles to live Supabase...');

  for (const p of ALL_ROLES_PROFILES) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', p.email)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([p])
        .select('*')
        .single();

      if (error) {
        console.error(`Failed to insert ${p.email}:`, error.message);
      } else {
        console.log(`✅ Created profile ${p.email} -> ${data.id}`);
      }
    } else {
      console.log(`ℹ️ Profile exists ${p.email} -> ${existing.id}`);
    }
  }
}

seedAllProfiles().catch(console.error);
