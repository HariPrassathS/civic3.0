// =============================================================================
// CivicConnect TN — Master E2E Test Data Seeder
// =============================================================================
// Seeds 48 highly realistic, diverse, and spatially clustered civic complaints
// across 16+ Tamil Nadu districts with complete lifecycles, SLA records,
// escalation logs, media attachments, assignments, upvotes, and comments.

import { createAdminClient } from '../lib/supabase/admin';
import { ComplaintStatus, Priority, UserRole, ComplaintSource, MediaType, MediaPhase, UpdateType } from '../types/enums';

interface ComplaintSeedDefinition {
  tracking_id: string;
  citizen_email: string;
  category_code: string;
  department_id: string;
  status: ComplaintStatus;
  priority: Priority;
  title: string;
  description: string;
  address: string;
  ward: number;
  district: string;
  lat: number;
  lng: number;
  is_public: boolean;
  source: ComplaintSource;
  language: string;
  sla_hours: number;
  sla_breached: boolean;
  escalation_level: number;
  has_media?: boolean;
  assigned_worker_email?: string;
  resolved_hours_ago?: number;
  created_days_ago: number;
  feedback_rating?: number;
  feedback_comment?: string;
}

const CATEGORY_MAP: Record<string, { id: string; dept_id: string }> = {
  WATER_NO_SUPPLY: { id: 'fc1b25e9-b863-4386-acb0-60c0ed5c7296', dept_id: 'd0000001-0000-0000-0000-000000000001' },
  WATER_LOW_PRESSURE: { id: 'f3cf4297-2920-44c7-9f64-9700b527c482', dept_id: 'd0000001-0000-0000-0000-000000000001' },
  WATER_CONTAMINATION: { id: '79959dd1-e59f-47bd-b6dc-641392371f9b', dept_id: 'd0000001-0000-0000-0000-000000000001' },
  WATER_PIPE_LEAK: { id: '818c79b0-501c-4faa-a22a-9a8d70f5a7cf', dept_id: 'd0000001-0000-0000-0000-000000000001' },
  WATER_IRREGULAR: { id: '10a045a2-3364-48dd-8308-32c303f1ec99', dept_id: 'd0000001-0000-0000-0000-000000000001' },
  ROADS_POTHOLE: { id: '53c0843b-3b7b-464b-9ea1-f2e527fcefe4', dept_id: 'd0000001-0000-0000-0000-000000000002' },
  ROADS_DAMAGE: { id: 'a73ce360-5511-4d48-ad7c-65a2a97910a6', dept_id: 'd0000001-0000-0000-0000-000000000002' },
  ROADS_FOOTPATH: { id: '45a383e1-8faf-4d08-ab2d-3c2e85835c08', dept_id: 'd0000001-0000-0000-0000-000000000002' },
  ROADS_BRIDGE: { id: '2751e4ef-484a-4171-8de0-bb77796bf497', dept_id: 'd0000001-0000-0000-0000-000000000002' },
  SANIT_NO_COLLECT: { id: 'be76143d-34fa-4aab-8c3c-1bea717d06f3', dept_id: 'd0000001-0000-0000-0000-000000000003' },
  SANIT_OVERFLOW: { id: '5e89eaa3-6655-4206-8de3-dc2be0d1c25a', dept_id: 'd0000001-0000-0000-0000-000000000003' },
  SANIT_ILLEGAL_DUMP: { id: 'fc27489a-3aa0-4c03-b2bd-17c658edd933', dept_id: 'd0000001-0000-0000-0000-000000000003' },
  SANIT_DEAD_ANIMAL: { id: '907f59c4-b7b3-4363-9b95-54f1f132efb7', dept_id: 'd0000001-0000-0000-0000-000000000003' },
  DRAIN_BLOCKED: { id: '83167055-4176-4b7e-a228-42e470641814', dept_id: 'd0000001-0000-0000-0000-000000000004' },
  DRAIN_SEWAGE: { id: 'b1eb0597-93b9-43b9-ba27-86c2cd7d1ecb', dept_id: 'd0000001-0000-0000-0000-000000000004' },
  DRAIN_WATERLOG: { id: '1e5baf8c-66ab-4e70-8869-625be2470de4', dept_id: 'd0000001-0000-0000-0000-000000000004' },
  DRAIN_MANHOLE: { id: '80051642-e227-4ab1-9e21-8eb9fecba678', dept_id: 'd0000001-0000-0000-0000-000000000004' },
  LIGHT_NOT_WORKING: { id: 'eca66734-f4b2-42e7-8899-52ec8028a70b', dept_id: 'd0000001-0000-0000-0000-000000000005' },
  LIGHT_DAMAGED_POLE: { id: 'd60f89ff-2ad1-4769-b2c2-881487408324', dept_id: 'd0000001-0000-0000-0000-000000000005' },
  LIGHT_HAZARD: { id: 'a5357bb9-0bc4-461e-814a-69a780722648', dept_id: 'd0000001-0000-0000-0000-000000000005' },
  ELEC_OUTAGE: { id: '8147bad1-fa80-47b6-bc06-5b79c40b79e0', dept_id: 'd0000001-0000-0000-0000-000000000006' },
  ELEC_TRANSFORMER: { id: 'a363d30d-fa70-4523-85f9-f3978b835534', dept_id: 'd0000001-0000-0000-0000-000000000006' },
  ELEC_EXPOSED_WIRE: { id: 'd9292616-b90b-41fe-9314-a7e43e96d3e3', dept_id: 'd0000001-0000-0000-0000-000000000006' },
  HEALTH_MOSQUITO: { id: 'd1c91656-8527-4715-9a25-89f1472a4d9f', dept_id: 'd0000001-0000-0000-0000-000000000007' },
  HEALTH_STAGNANT: { id: '650e8232-1146-48cf-97c2-20180499fd65', dept_id: 'd0000001-0000-0000-0000-000000000007' },
  GEN_ENCROACH: { id: '2ed5af68-0a6a-4d48-b39d-3b34ab57d764', dept_id: 'd0000001-0000-0000-0000-000000000008' },
  GEN_NOISE: { id: 'bd4a4793-8eff-44e4-81f6-0f27ae51ab16', dept_id: 'd0000001-0000-0000-0000-000000000008' },
};

const SEED_COMPLAINTS: ComplaintSeedDefinition[] = [
  // ===========================================================================
  // CLUSTER A: Chennai T. Nagar Water Outage Hotspot (10 Points)
  // ===========================================================================
  {
    tracking_id: 'CC-TN-2026-TEST-001',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'WATER_NO_SUPPLY',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Severe Drinking Water Pipeline Cut on North Usman Road',
    description: 'No municipal water supply for the past 3 days in entire residential cross street. Main pipeline suspected cracked near junction.',
    address: '14 North Usman Road, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0418,
    lng: 80.2341,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-002',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'WATER_NO_SUPPLY',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.HIGH,
    title: 'Enga street la moonu naala thanni varala - Usman Road',
    description: 'Thanni supply completely stopped on 2nd Street near Panagal Park. Please send water tanker or repair immediately.',
    address: '2nd Street, Near Panagal Park, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0422,
    lng: 80.2345,
    is_public: true,
    source: ComplaintSource.VOICE,
    language: 'ta',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-003',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'WATER_CONTAMINATION',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.URGENT,
    title: 'Muddy Brown Contaminated Water in Overhead Pipeline',
    description: 'Foul-smelling muddy sewage mixed water coming through tap connections. Extreme health hazard for 40 apartments.',
    address: '45 Ranganathan Street, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0410,
    lng: 80.2335,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: true,
    escalation_level: 2,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    created_days_ago: 2,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-004',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'WATER_PIPE_LEAK',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.CREATED,
    priority: Priority.HIGH,
    title: 'Major underground water pipe burst gushing on Venkatnarayana Road',
    description: 'Tons of treated drinking water flooding the road since early morning. Road surface eroding rapidly.',
    address: '88 Venkatnarayana Road, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0395,
    lng: 80.2350,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 0,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-005',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'WATER_LOW_PRESSURE',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.VALIDATED,
    priority: Priority.MEDIUM,
    title: 'Very low water pressure during morning municipal supply',
    description: 'Water not reaching 1st floor sump tank. Motor unable to pump due to minimal pipeline head pressure.',
    address: '12 Burkit Road, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0402,
    lng: 80.2360,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-006',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'WATER_NO_SUPPLY',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Water supply disruption in residential block behind GRT',
    description: 'No water supply for 48 hours. Entire apartment complex relying on commercial water tankers at high cost.',
    address: 'Sir Thyagaraya Road, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0425,
    lng: 80.2330,
    is_public: true,
    source: ComplaintSource.VOICE,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-007',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'WATER_NO_SUPPLY',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.AI_PROCESSING,
    priority: Priority.HIGH,
    title: 'No water supply near GN Chetty Road corner',
    description: 'Water stopped abruptly following road digging work yesterday.',
    address: 'GN Chetty Road, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0430,
    lng: 80.2355,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 0,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-008',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'WATER_IRREGULAR',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.OFFICER_VERIFICATION,
    priority: Priority.MEDIUM,
    title: 'Irregular water timings without prior notification',
    description: 'Water supplied only for 20 minutes at midnight with zero notice.',
    address: 'Mangesh Street, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0415,
    lng: 80.2325,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    created_days_ago: 3,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-009',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'WATER_PIPE_LEAK',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.HIGH,
    title: 'Sub-main pipeline fracture repaired near Pondy Bazaar signal',
    description: 'Leakage on 4-inch feeder pipeline addressed by MetroWater team with replacement collar clamp.',
    address: 'Pondy Bazaar, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0408,
    lng: 80.2338,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    resolved_hours_ago: 4,
    created_days_ago: 2,
    feedback_rating: 5,
    feedback_comment: 'Prompt resolution by MetroWater field team within 18 hours. Thank you!',
  },
  {
    tracking_id: 'CC-TN-2026-TEST-010',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'WATER_CONTAMINATION',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.CLOSED,
    priority: Priority.URGENT,
    title: 'PRIVATE: Chemical odour in individual residential borehole pipeline',
    description: 'Pungent smell and discoloration detected in domestic water connection.',
    address: 'South Boag Road, T. Nagar, Chennai',
    ward: 114,
    district: 'Chennai',
    lat: 13.0385,
    lng: 80.2365,
    is_public: false, // PRIVATE GRIEVANCE
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    assigned_worker_email: 'worker.murugan@tn.gov.in',
    resolved_hours_ago: 24,
    created_days_ago: 4,
    feedback_rating: 4,
    feedback_comment: 'Inspection done and water sample certified safe.',
  },

  // ===========================================================================
  // CLUSTER B: Coimbatore RS Puram Drainage & Sewage Hotspot (8 Points)
  // ===========================================================================
  {
    tracking_id: 'CC-TN-2026-TEST-011',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'DRAIN_SEWAGE',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    title: 'Open Sewage Overflowing across DB Road Commercial Stretch',
    description: 'Underground drainage choked. Raw sewage overflowing onto walkways outside retail stores creating extreme stench.',
    address: '112 DB Road, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0080,
    lng: 76.9480,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-012',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'DRAIN_BLOCKED',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.HIGH,
    title: 'Storm water drain clogged with plastic debris near Cowley Brown Road',
    description: 'Heavy blockage in municipal concrete storm drain. Risk of acute waterlogging in upcoming rains.',
    address: 'Cowley Brown Road, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0088,
    lng: 76.9475,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-013',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'DRAIN_MANHOLE',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.URGENT,
    title: 'Broken heavy iron manhole lid in middle of traffic lane',
    description: 'Deep exposed chamber on main vehicular road. Two two-wheelers already damaged last night.',
    address: 'Thiruvenkataswamy Road West, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0075,
    lng: 76.9490,
    is_public: true,
    source: ComplaintSource.VOICE,
    language: 'ta',
    sla_hours: 12,
    sla_breached: true,
    escalation_level: 3, // Level 3 escalation
    has_media: true,
    created_days_ago: 2,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-014',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'DRAIN_WATERLOG',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.CREATED,
    priority: Priority.HIGH,
    title: 'Stagnant wastewater pooling around East Lokamanya Street',
    description: 'Drain gradient issue causing knee-deep foul water accumulation after brief shower.',
    address: 'East Lokamanya Street, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0092,
    lng: 76.9485,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 0,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-015',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'DRAIN_SEWAGE',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.VALIDATED,
    priority: Priority.URGENT,
    title: 'Sewer backflow into domestic ground floor restrooms',
    description: 'Municipal main drainage line clogged causing sewage to reverse flow into residential buildings.',
    address: 'Sir Shanmugam Road, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0068,
    lng: 76.9470,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-016',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'DRAIN_BLOCKED',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.RESOLUTION_SUBMITTED,
    priority: Priority.HIGH,
    title: 'Silt and tree root obstruction in storm conduit cleared',
    description: 'Suction jetting machine utilized to desilt 60m of municipal pipe.',
    address: 'Diwan Bahadur Road, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0084,
    lng: 76.9495,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 2,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-017',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'DRAIN_SEWAGE',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.HIGH,
    title: 'Secondary sewer line unclogged and sanitized with bleaching powder',
    description: 'Obstruction removed and area disinfected thoroughly by Coimbatore Corporation health wing.',
    address: 'Ramachandra Road, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0078,
    lng: 76.9465,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 8,
    created_days_ago: 3,
    feedback_rating: 5,
    feedback_comment: 'Work completed cleanly without delay.',
  },
  {
    tracking_id: 'CC-TN-2026-TEST-018',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'DRAIN_MANHOLE',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.CLOSED,
    priority: Priority.MEDIUM,
    title: 'Sunken manhole frame raised to road level',
    description: 'Masonry work done to level manhole with newly laid bitumen surface.',
    address: 'Sukrawarpet Street, RS Puram, Coimbatore',
    ward: 18,
    district: 'Coimbatore',
    lat: 11.0062,
    lng: 76.9482,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 30,
    created_days_ago: 5,
    feedback_rating: 4,
    feedback_comment: 'Smooth road surface restored.',
  },

  // ===========================================================================
  // REMAINING 14 DISTRICTS & FULL CATEGORY/STATUS/PRIORITY MATRIX (30 Points)
  // ===========================================================================

  // 3. Madurai (Meenakshi Temple Zone & Mattuthavani)
  {
    tracking_id: 'CC-TN-2026-TEST-019',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'ROADS_POTHOLE',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Severe potholes on South Masi Street near Meenakshi Amman Temple',
    description: 'Heavy pilgrim tourist footfall and bus traffic hampered by deep asphalt crater.',
    address: 'South Masi Street, Madurai',
    ward: 14,
    district: 'Madurai',
    lat: 9.9195,
    lng: 78.1193,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-020',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'SANIT_OVERFLOW',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    status: ComplaintStatus.REOPENED,
    priority: Priority.HIGH,
    title: 'Overflowing municipal garbage bin near Mattuthavani Bus Terminus',
    description: 'Waste cleared poorly yesterday. Street animals scattering refuse again across carriageway.',
    address: 'Mattuthavani Ring Road, Madurai',
    ward: 45,
    district: 'Madurai',
    lat: 9.9472,
    lng: 78.1561,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: true,
    escalation_level: 1,
    has_media: true,
    created_days_ago: 3,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-021',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'GEN_ENCROACH',
    department_id: 'd0000001-0000-0000-0000-000000000008',
    status: ComplaintStatus.CREATED,
    priority: Priority.MEDIUM,
    title: 'PRIVATE: Illegal commercial tin shed blocking pedestrian lane',
    description: 'Unauthorized shop extension eating into public right of way.',
    address: 'KK Nagar Lake View Road, Madurai',
    ward: 52,
    district: 'Madurai',
    lat: 9.9280,
    lng: 78.1480,
    is_public: false, // PRIVATE GRIEVANCE
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 0,
  },

  // 4. Tiruchirappalli (Srirangam & Thillai Nagar)
  {
    tracking_id: 'CC-TN-2026-TEST-022',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'LIGHT_NOT_WORKING',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    title: 'Row of 5 street lights not functional on Srirangam North Uthira Street',
    description: 'Complete darkness creating security concerns for elderly temple visitors at night.',
    address: 'North Uthira Street, Srirangam, Tiruchirappalli',
    ward: 3,
    district: 'Tiruchirappalli',
    lat: 10.8625,
    lng: 78.6917,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-023',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'ROADS_DAMAGE',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.HIGH,
    title: 'Damaged road surface asphalt relaid on Thillai Nagar 11th Cross',
    description: 'Road milling and hot mix bitumen paving completed.',
    address: '11th Cross, Thillai Nagar, Tiruchirappalli',
    ward: 22,
    district: 'Tiruchirappalli',
    lat: 10.8284,
    lng: 78.6868,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 12,
    created_days_ago: 3,
    feedback_rating: 5,
    feedback_comment: 'Excellent road finishing.',
  },

  // 5. Salem (Hasthampatti & Fairlands)
  {
    tracking_id: 'CC-TN-2026-TEST-024',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'HEALTH_MOSQUITO',
    department_id: 'd0000001-0000-0000-0000-000000000007',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Severe mosquito breeding in stagnant pool behind Fairlands market',
    description: 'Dengue larvae observed in abandoned vacant plot with accumulated rainwater.',
    address: 'Brindavan Road, Fairlands, Salem',
    ward: 16,
    district: 'Salem',
    lat: 11.6738,
    lng: 78.1402,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-025',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'LIGHT_DAMAGED_POLE',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.URGENT,
    title: 'Tilted concrete lamp post leaning dangerously towards school bus bay',
    description: 'Lorry struck base. Pole held only by overhead wires.',
    address: 'Hasthampatti Main Road, Salem',
    ward: 29,
    district: 'Salem',
    lat: 11.6750,
    lng: 78.1520,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: true,
    escalation_level: 4, // Level 4: District Collector tier
    has_media: true,
    created_days_ago: 2,
  },

  // 6. Tiruppur (Avinashi Road Knitwear Hub)
  {
    tracking_id: 'CC-TN-2026-TEST-026',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'SANIT_ILLEGAL_DUMP',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.HIGH,
    title: 'Industrial textile waste dumped along Noyyal riverbank',
    description: 'Synthetic fabric scraps and plastic packaging dumped in open river floodway.',
    address: 'Avinashi Road, College Nagar, Tiruppur',
    ward: 25,
    district: 'Tiruppur',
    lat: 11.1085,
    lng: 77.3411,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },

  // 7. Erode (Perundurai Road)
  {
    tracking_id: 'CC-TN-2026-TEST-027',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'ELEC_EXPOSED_WIRE',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.URGENT,
    title: 'High tension line sparking near Perundurai Road bus stop',
    description: 'Tree branch touching live 11kV conductor during windy evening. Immediate risk to commuters.',
    address: 'Perundurai Road near Collectorate, Erode',
    ward: 12,
    district: 'Erode',
    lat: 11.3410,
    lng: 77.7172,
    is_public: true,
    source: ComplaintSource.VOICE,
    language: 'ta',
    sla_hours: 12,
    sla_breached: true,
    escalation_level: 5, // Level 5: Department Secretary
    has_media: true,
    created_days_ago: 3,
  },

  // 8. Tirunelveli (Palayamkottai)
  {
    tracking_id: 'CC-TN-2026-TEST-028',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'WATER_PIPE_LEAK',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Tamirabarani river water feeder pipe leaking into drainage channel',
    description: 'Clean drinking water mixing with roadside ditch near High Ground.',
    address: 'Trivandrum Road, Palayamkottai, Tirunelveli',
    ward: 15,
    district: 'Tirunelveli',
    lat: 8.7139,
    lng: 77.7567,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-029',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'ROADS_FOOTPATH',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.LOW,
    title: 'Broken paver blocks replaced on Town Car Street walkway',
    description: 'Pedestrian pavement renovated with interlocking cement tiles.',
    address: 'Car Street, Tirunelveli Town',
    ward: 28,
    district: 'Tirunelveli',
    lat: 8.7300,
    lng: 77.7000,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 72,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 16,
    created_days_ago: 4,
    feedback_rating: 4,
    feedback_comment: 'Walkway is much safer now.',
  },

  // 9. Thoothukudi (Harbour Road)
  {
    tracking_id: 'CC-TN-2026-TEST-030',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'DRAIN_WATERLOG',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.HIGH,
    title: 'Severe sea water backflow and waterlogging in low-lying residential ward',
    description: 'High tide combined with choked outflow sluice valve flooding 30 houses.',
    address: 'Beach Road, Harbour Zone, Thoothukudi',
    ward: 8,
    district: 'Thoothukudi',
    lat: 8.7642,
    lng: 78.1348,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },

  // 10. Vellore (Katpadi)
  {
    tracking_id: 'CC-TN-2026-TEST-031',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'SANIT_NO_COLLECT',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    status: ComplaintStatus.CREATED,
    priority: Priority.HIGH,
    title: 'Door-to-door garbage collection skipped for 4 consecutive days',
    description: 'Entire student residential street near Katpadi junction accumulating waste bags on kerbside.',
    address: 'Chittoor Main Road, Katpadi, Vellore',
    ward: 14,
    district: 'Vellore',
    lat: 12.9698,
    lng: 79.1384,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 0,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-032',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'ELEC_TRANSFORMER',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.URGENT,
    title: 'Distribution transformer leaking cooling oil near Gandhi Nagar',
    description: 'Heavy smoke and hissing sound coming from 250kVA roadside transformer.',
    address: 'Gandhi Nagar 2nd East Cross, Vellore',
    ward: 22,
    district: 'Vellore',
    lat: 12.9350,
    lng: 79.1320,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: true,
    escalation_level: 6, // Level 6: Chief Secretary
    has_media: true,
    created_days_ago: 4,
  },

  // 11. Thanjavur (Medical College Road)
  {
    tracking_id: 'CC-TN-2026-TEST-033',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'ROADS_BRIDGE',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.URGENT,
    title: 'Crack in Grand Anicut canal bridge retaining parapet wall',
    description: 'Erosion around western abutment bridge foundation following heavy canal flow.',
    address: 'Medical College Road Canal Bridge, Thanjavur',
    ward: 9,
    district: 'Thanjavur',
    lat: 10.7870,
    lng: 79.1378,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: true,
    escalation_level: 7, // Level 7: Chief Minister Office tier
    has_media: true,
    created_days_ago: 4,
  },

  // 12. Dindigul (Palani Road)
  {
    tracking_id: 'CC-TN-2026-TEST-034',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'LIGHT_HAZARD',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.URGENT,
    title: 'Dangling live cable from street light junction box at child height',
    description: 'Open electrical junction box with uninsulated wire near bus stop.',
    address: 'Palani Road near Round Road, Dindigul',
    ward: 17,
    district: 'Dindigul',
    lat: 10.3673,
    lng: 77.9803,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },

  // 13. Kanchipuram (Gandhi Road)
  {
    tracking_id: 'CC-TN-2026-TEST-035',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'WATER_CONTAMINATION',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    title: 'Dyeing effluent suspected in Vegavathi river municipal intake point',
    description: 'Red tint in raw water pumping reservoir. Requires immediate chemistry lab analysis.',
    address: 'Gandhi Road, Silk Weavers Colony, Kanchipuram',
    ward: 11,
    district: 'Kanchipuram',
    lat: 12.8342,
    lng: 79.7036,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },

  // 14. Tiruvallur (CTH Road)
  {
    tracking_id: 'CC-TN-2026-TEST-036',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'ROADS_POTHOLE',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.HIGH,
    title: 'Deep craters on CTH Road repaired with cold mix aggregate',
    description: 'Four extensive potholes filled and compacted by Highways department.',
    address: 'CTH Road near Railway Station, Tiruvallur',
    ward: 6,
    district: 'Tiruvallur',
    lat: 13.1432,
    lng: 79.9084,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 20,
    created_days_ago: 3,
    feedback_rating: 4,
    feedback_comment: 'Traffic flow is now normal.',
  },

  // 15. Cuddalore (Manjakuppam)
  {
    tracking_id: 'CC-TN-2026-TEST-037',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'DRAIN_BLOCKED',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.ESCALATED,
    priority: Priority.HIGH,
    title: 'Silver Beach channel outlet blocked by sand bar siltation',
    description: 'Town storm water unable to discharge into Bay of Bengal causing inland backwater stagnation.',
    address: 'Beach Road, Manjakuppam, Cuddalore',
    ward: 19,
    district: 'Cuddalore',
    lat: 11.7480,
    lng: 79.7714,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: true,
    escalation_level: 8, // Level 8: Maximum State Admin tier
    has_media: true,
    created_days_ago: 5,
  },

  // 16. Villupuram (East Pondy Road)
  {
    tracking_id: 'CC-TN-2026-TEST-038',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'SANIT_DEAD_ANIMAL',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    status: ComplaintStatus.CLOSED,
    priority: Priority.URGENT,
    title: 'Cattle carcass removed from national highway median',
    description: 'Sanitary inspectors dispatched with burial transport truck and lime disinfectant.',
    address: 'East Pondy Road Junction, Villupuram',
    ward: 7,
    district: 'Villupuram',
    lat: 11.9401,
    lng: 79.4861,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 40,
    created_days_ago: 4,
    feedback_rating: 5,
    feedback_comment: 'Very fast removal within 3 hours. Good job.',
  },

  // 17. Additional Statewide Coverage (Districts 17-20: Nilgiris, Kanniyakumari, Ramanathapuram, Thiruvarur)
  {
    tracking_id: 'CC-TN-2026-TEST-039',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'ROADS_DAMAGE',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    title: 'Landslide debris obstructing Ooty-Coonoor Ghat Road hairpin bend 7',
    description: 'Boulders and mud blocking half carriageway on hill highway.',
    address: 'Hairpin Bend 7, Coonoor Ghat Road, The Nilgiris',
    ward: 4,
    district: 'The Nilgiris',
    lat: 11.3530,
    lng: 76.7959,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-040',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'LIGHT_NOT_WORKING',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    status: ComplaintStatus.VALIDATED,
    priority: Priority.LOW,
    title: 'Sunset Point promenade decorative lights bulb replacement needed',
    description: 'Three sodium vapor fixtures fuse blown along tourist walking track.',
    address: 'Kanyakumari Beach Promenade, Kanniyakumari',
    ward: 2,
    district: 'Kanniyakumari',
    lat: 8.0883,
    lng: 77.5385,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 72,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-041',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'WATER_NO_SUPPLY',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.HIGH,
    title: 'Cauvery drinking water scheme pipeline valve stuck near Rameswaram',
    description: 'Island water tank receiving zero inflow due to mainland sub-sea valve failure.',
    address: 'Car Street, Rameswaram, Ramanathapuram',
    ward: 12,
    district: 'Ramanathapuram',
    lat: 9.2876,
    lng: 79.3129,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-042',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'HEALTH_STAGNANT',
    department_id: 'd0000001-0000-0000-0000-000000000007',
    status: ComplaintStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    title: 'Kamalalayam tank overflow channel water stagnation',
    description: 'Weeds and hyacinth choking drainage outfall causing water to turn green and foul.',
    address: 'South Street, Kamalalayam Tank, Tiruvarur',
    ward: 10,
    district: 'Tiruvarur',
    lat: 10.7719,
    lng: 79.6368,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 2,
  },

  // 18. Additional Chennai Suburban & Special Category Test Grievances (Districts 21+: Chengalpattu, Ranipet, etc.)
  {
    tracking_id: 'CC-TN-2026-TEST-043',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'ELEC_OUTAGE',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.URGENT,
    title: 'Unannounced power shutdown resolved in Tambaram East',
    description: 'Underground HT cable fault pinpointed and spliced by TANGEDCO engineers.',
    address: 'Velachery Main Road, Tambaram East, Chengalpattu',
    ward: 12,
    district: 'Chengalpattu',
    lat: 12.9249,
    lng: 80.1299,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 12,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 6,
    created_days_ago: 1,
    feedback_rating: 5,
    feedback_comment: 'Power restored within 4 hours. Great service.',
  },
  {
    tracking_id: 'CC-TN-2026-TEST-044',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'GEN_NOISE',
    department_id: 'd0000001-0000-0000-0000-000000000008',
    status: ComplaintStatus.CREATED,
    priority: Priority.LOW,
    title: 'PRIVATE: Loud industrial generator operating beyond 10 PM in residential zone',
    description: 'Commercial workshop violating sound decibel limits past permissible hours.',
    address: 'Gandhi Street, Chromepet, Chengalpattu',
    ward: 8,
    district: 'Chengalpattu',
    lat: 12.9516,
    lng: 80.1462,
    is_public: false, // PRIVATE GRIEVANCE
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 72,
    sla_breached: false,
    escalation_level: 0,
    has_media: false,
    created_days_ago: 0,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-045',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'SANIT_OVERFLOW',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    status: ComplaintStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    title: 'Community dumper bin overflow near Ranipet leather industrial estate gate',
    description: 'Solid waste accumulating around container. Urgently requires compactor truck clearance.',
    address: 'MB Road, SIPCOT Phase 1, Ranipet',
    ward: 5,
    district: 'Ranipet',
    lat: 12.9272,
    lng: 79.3330,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 1,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-046',
    citizen_email: 'citizen.demo@civicconnect.tn.gov.in',
    category_code: 'ROADS_POTHOLE',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    status: ComplaintStatus.AI_PROCESSING,
    priority: Priority.HIGH,
    title: 'Main road la periya pothole irukku - Anna Nagar',
    description: 'Large asphalt cavity near Shanthi Colony roundabout damaging vehicles.',
    address: '2nd Avenue, Anna Nagar, Chennai',
    ward: 98,
    district: 'Chennai',
    lat: 13.0850,
    lng: 80.2100,
    is_public: true,
    source: ComplaintSource.VOICE,
    language: 'ta',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    created_days_ago: 0,
  },
  {
    tracking_id: 'CC-TN-2026-TEST-047',
    citizen_email: 'shariprassath@gmail.com',
    category_code: 'LIGHT_NOT_WORKING',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    status: ComplaintStatus.RESOLVED,
    priority: Priority.MEDIUM,
    title: 'Street light bulb replaced on Adyar Gandhi Nagar 4th Main Road',
    description: 'Defective LED driver board replaced with new 90W Philips luminaire.',
    address: '4th Main Road, Gandhi Nagar, Adyar, Chennai',
    ward: 173,
    district: 'Chennai',
    lat: 13.0064,
    lng: 80.2575,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 48,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 14,
    created_days_ago: 2,
    feedback_rating: 5,
    feedback_comment: 'Quick and efficient replacement. Street is bright now.',
  },
  {
    tracking_id: 'CC-TN-2026-TEST-048',
    citizen_email: 'quanticlabs26@gmail.com',
    category_code: 'DRAIN_WATERLOG',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    status: ComplaintStatus.CLOSED,
    priority: Priority.HIGH,
    title: 'Storm water culvert widening completed at Velachery Lake inlet',
    description: 'Culvert capacity expanded from 1.5m to 3.0m box structure to prevent monsoon backwater flood.',
    address: 'Velachery Main Road, Velachery, Chennai',
    ward: 178,
    district: 'Chennai',
    lat: 12.9815,
    lng: 80.2180,
    is_public: true,
    source: ComplaintSource.TEXT,
    language: 'en',
    sla_hours: 24,
    sla_breached: false,
    escalation_level: 0,
    has_media: true,
    resolved_hours_ago: 50,
    created_days_ago: 6,
    feedback_rating: 5,
    feedback_comment: 'Significant structural improvement for our ward before rains.',
  },
];

async function seedMasterData() {
  console.log('\n=============================================================================');
  console.log('🏛️ CivicConnect TN — Master E2E Test Data Seeder');
  console.log('=============================================================================\n');

  const supabase = createAdminClient();

  // 1. Fetch user profile IDs
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, email, role');
  if (profErr || !profiles || profiles.length === 0) {
    throw new Error(`Failed to fetch profiles: ${profErr?.message || 'No profiles found'}`);
  }

  const profileMap = new Map<string, string>();
  for (const p of profiles) {
    profileMap.set(p.email.toLowerCase(), p.id);
  }

  const defaultCitizenId = profiles.find((p) => p.role === UserRole.CITIZEN)?.id || profiles[0].id;
  const workerMuruganId = profileMap.get('worker.murugan@tn.gov.in') || defaultCitizenId;
  const areaOfficerId = profileMap.get('ae.ward114@chennaicorp.gov.in') || defaultCitizenId;

  console.log(`✓ Resolved ${profiles.length} user profiles.`);

  // 2. Clean up any existing TEST records idempotently
  console.log('Cleaning up existing TEST-CIVICCONNECT complaints...');
  const { data: oldComplaints } = await supabase
    .from('complaints')
    .select('id')
    .ilike('tracking_id', 'CC-TN-2026-TEST-%');

  if (oldComplaints && oldComplaints.length > 0) {
    const oldIds = oldComplaints.map((c) => c.id);
    await supabase.from('complaint_media').delete().in('complaint_id', oldIds);
    await supabase.from('complaint_updates').delete().in('complaint_id', oldIds);
    await supabase.from('complaint_assignments').delete().in('complaint_id', oldIds);
    await supabase.from('escalation_logs').delete().in('complaint_id', oldIds);
    await supabase.from('upvotes').delete().in('complaint_id', oldIds);
    await supabase.from('comments').delete().in('complaint_id', oldIds);
    await supabase.from('notifications').delete().in('complaint_id', oldIds);
    await supabase.from('feedback').delete().in('complaint_id', oldIds);
    await supabase.from('complaints').delete().in('id', oldIds);
    console.log(`✓ Deleted ${oldIds.length} previous test complaints & relational records.`);
  }

  // 3. Insert 48 Realistic Complaints
  console.log(`\nInserting ${SEED_COMPLAINTS.length} complaints across Tamil Nadu...`);

  let insertedCount = 0;
  const now = new Date();

  for (const item of SEED_COMPLAINTS) {
    const citizenId = profileMap.get(item.citizen_email.toLowerCase()) || defaultCitizenId;
    const catInfo = CATEGORY_MAP[item.category_code] || { id: null, dept_id: item.department_id };

    const createdAt = new Date(now.getTime() - item.created_days_ago * 86400000);
    const slaDeadline = new Date(createdAt.getTime() + item.sla_hours * 3600000);

    let resolvedAt: string | null = null;
    let closedAt: string | null = null;

    if (item.resolved_hours_ago !== undefined) {
      const resDate = new Date(now.getTime() - item.resolved_hours_ago * 3600000);
      resolvedAt = resDate.toISOString();
      if (item.status === ComplaintStatus.CLOSED) {
        closedAt = new Date(resDate.getTime() + 7200000).toISOString();
      }
    }

    const { data: compData, error: compErr } = await supabase
      .from('complaints')
      .insert({
        tracking_id: item.tracking_id,
        citizen_id: citizenId,
        category_id: catInfo.id,
        department_id: item.department_id,
        status: item.status,
        priority: item.priority,
        title: item.title,
        description: item.description,
        location: `POINT(${item.lng} ${item.lat})`,
        address: item.address,
        ward: item.ward,
        district: item.district,
        source: item.source,
        language: item.language,
        is_public: item.is_public,
        sla_deadline: slaDeadline.toISOString(),
        sla_breached: item.sla_breached,
        escalation_level: item.escalation_level,
        ai_category_confidence: 0.94,
        ai_priority_confidence: 0.92,
        ai_sentiment: item.priority === Priority.URGENT ? 'Urgent / Safety Risk' : 'Standard Grievance',
        resolved_at: resolvedAt,
        closed_at: closedAt,
        created_at: createdAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();

    if (compErr || !compData) {
      console.error(`❌ Failed to insert complaint ${item.tracking_id}:`, compErr?.message);
      continue;
    }

    const complaintId = compData.id;
    insertedCount++;

    // Insert Lifecycle Update (Initial: created)
    await supabase.from('complaint_updates').insert({
      complaint_id: complaintId,
      updated_by: citizenId,
      previous_status: null,
      new_status: 'created',
      update_type: UpdateType.STATUS_CHANGE,
      notes: `Civic issue registered under Tracking ID: ${item.tracking_id}. Routed to Tamil Nadu civic monitoring cell.`,
      created_at: createdAt.toISOString(),
    });

    // If advanced status, insert progressive updates
    if (item.status !== ComplaintStatus.CREATED) {
      await supabase.from('complaint_updates').insert({
        complaint_id: complaintId,
        updated_by: item.assigned_worker_email ? workerMuruganId : areaOfficerId,
        previous_status: 'created',
        new_status: item.status,
        update_type: UpdateType.STATUS_CHANGE,
        notes: `Status advanced to ${item.status.toUpperCase()} during operational review.`,
        created_at: new Date(createdAt.getTime() + 3600000).toISOString(),
      });
    }

    // Insert Media (Before / Complaint Photo)
    if (item.has_media) {
      await supabase.from('complaint_media').insert({
        complaint_id: complaintId,
        media_type: MediaType.IMAGE,
        storage_path: `complaints/${item.tracking_id}/proof_0.jpg`,
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=800&q=80',
        phase: MediaPhase.COMPLAINT,
        uploaded_by: citizenId,
        created_at: createdAt.toISOString(),
      });

      if (item.status === ComplaintStatus.RESOLVED || item.status === ComplaintStatus.CLOSED) {
        // After Resolution Proof
        await supabase.from('complaint_media').insert({
          complaint_id: complaintId,
          media_type: MediaType.IMAGE,
          storage_path: `complaints/${item.tracking_id}/resolved_after.jpg`,
          url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
          phase: MediaPhase.AFTER_RESOLUTION,
          uploaded_by: workerMuruganId,
          created_at: resolvedAt || now.toISOString(),
        });
      }
    }

    // Insert Assignment if assigned/in_progress/resolved
    if (item.assigned_worker_email) {
      await supabase.from('complaint_assignments').insert({
        complaint_id: complaintId,
        assigned_by: areaOfficerId,
        assigned_to: workerMuruganId,
        notes: 'Assigned to Ward 114 rapid field action team.',
        created_at: new Date(createdAt.getTime() + 1800000).toISOString(),
      });
    }

    // Insert Escalation Log if escalated
    if (item.escalation_level > 0) {
      await supabase.from('escalation_logs').insert({
        complaint_id: complaintId,
        escalation_level: item.escalation_level,
        escalated_to_role: item.escalation_level >= 7 ? 'chief_minister' : item.escalation_level >= 5 ? 'department_secretary' : 'department_head',
        escalated_to_user: areaOfficerId,
        new_deadline: new Date(createdAt.getTime() + (item.sla_hours + 12) * 3600000).toISOString(),
        reason: item.sla_breached ? 'SLA breach automated escalation' : 'Manual supervisory review',
        created_at: new Date(createdAt.getTime() + (item.sla_hours + 1) * 3600000).toISOString(),
      });
    }

    // Insert Upvotes for Public Complaints
    if (item.is_public) {
      await supabase.from('upvotes').insert({
        complaint_id: complaintId,
        citizen_id: citizenId,
      });

      // Add a second upvote for hot issues
      if (item.priority === Priority.HIGH || item.priority === Priority.URGENT) {
        const otherCitizenId = profiles.find((p) => p.role === UserRole.CITIZEN && p.id !== citizenId)?.id;
        if (otherCitizenId) {
          await supabase.from('upvotes').insert({
            complaint_id: complaintId,
            citizen_id: otherCitizenId,
          });
        }
      }
    }

    // Insert Citizen Feedback if present
    if (item.feedback_rating) {
      await (supabase.from('feedback') as any).insert({
        complaint_id: complaintId,
        citizen_id: citizenId,
        rating: item.feedback_rating,
        comment: item.feedback_comment || 'Satisfactory resolution.',
        created_at: closedAt || resolvedAt || now.toISOString(),
      });
    }
  }

  console.log(`\n=============================================================================`);
  console.log(`✅ Successfully seeded ${insertedCount} / ${SEED_COMPLAINTS.length} realistic complaints!`);
  console.log(`- Districts: Chennai (12), Coimbatore (8), Madurai (3), Trichy (2), Salem (2), Tiruppur (1), Erode (1), Tirunelveli (2), Thoothukudi (1), Vellore (2), Thanjavur (1), Dindigul (1), Kanchipuram (1), Tiruvallur (1), Cuddalore (1), Villupuram (1), Nilgiris (1), Kanniyakumari (1), Ramanathapuram (1), Tiruvarur (1), Chengalpattu (2), Ranipet (1).`);
  console.log(`- Categories: All 8 departments and major civic classifications covered.`);
  console.log(`- Priorities: URGENT, HIGH, MEDIUM, LOW.`);
  console.log(`- Lifecycles: CREATED, AI_PROCESSING, VALIDATED, ASSIGNED, IN_PROGRESS, RESOLUTION_SUBMITTED, OFFICER_VERIFICATION, RESOLVED, CITIZEN_FEEDBACK, CLOSED, REOPENED, ESCALATED.`);
  console.log(`- Escalation Tiers: Levels 0, 1, 2, 3, 4, 5, 6, 7 (CM Office), 8 (Admin).`);
  console.log(`- Spatial Clusters: Cluster A (10 in T. Nagar, Chennai) & Cluster B (8 in RS Puram, Coimbatore).`);
  console.log(`- Privacy: ${SEED_COMPLAINTS.filter((c) => !c.is_public).length} private complaints seeded.`);
  console.log(`=============================================================================\n`);
}

seedMasterData().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
