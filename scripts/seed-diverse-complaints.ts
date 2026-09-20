// =============================================================================
// CivicConnect TN — Diverse 16-Complaint Multi-Domain Seeder
// =============================================================================
// Raises 16 realistic, human-authored citizen grievances across 12+ districts of
// Tamil Nadu, spanning all major line ministries (Highways, MAWS, TANGEDCO, Health,
// RDPR, Housing) with matching high-resolution before-evidence photos.

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { ComplaintEngine } from '../lib/complaints/engine';
import { UserRole, ComplaintSource, MediaType, MediaPhase } from '../types/enums';

// Load environment variables from .env.local
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

interface SeedComplaintDef {
  idIndex: number;
  title: string;
  description: string;
  citizenName: string;
  citizenEmail: string;
  district: string;
  ward: number;
  address: string;
  latitude: number;
  longitude: number;
  categoryCode: string;
  departmentCode: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  imageUrl: string;
  caption: string;
}

const DIVERSE_16_COMPLAINTS: SeedComplaintDef[] = [
  {
    idIndex: 1,
    title: 'Severe Asphalt Pothole Crater on Main Carriageway',
    description: 'Deep crater on Usman Road junction near flyover descent. Multiple two-wheelers skidding daily, causing heavy traffic backlog during morning peak hours.',
    citizenName: 'Senthil Kumar',
    citizenEmail: 'senthil.k@gmail.com',
    district: 'Chennai',
    ward: 114,
    address: 'Usman Road Junction, T. Nagar, Chennai - 600017',
    latitude: 13.0418,
    longitude: 80.2341,
    categoryCode: 'ROAD_POTHOLE',
    departmentCode: 'HIGHWAYS',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop',
    caption: 'Deep asphalt road pothole crater with exposed gravel on carriage-way',
  },
  {
    idIndex: 2,
    title: 'Drinking Water Main Pipeline Burst & Heavy Flooding',
    description: 'Underground 300mm drinking water main pipeline burst near 5th cross street. Clean drinking water gushing under high pressure and flooding road for 6 hours.',
    citizenName: 'Meenakshi Sundaram',
    citizenEmail: 'meenakshi.sundaram@gmail.com',
    district: 'Coimbatore',
    ward: 45,
    address: '5th Cross Street, Gandhipuram, Coimbatore - 641012',
    latitude: 11.0168,
    longitude: 76.9558,
    categoryCode: 'WATER_LEAKAGE',
    departmentCode: 'MAWS',
    priority: 'urgent',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop',
    caption: 'High-pressure drinking water gushing from burst municipal pipeline',
  },
  {
    idIndex: 3,
    title: 'Stagnant Dirty Wastewater & Mosquito Breeding Threat',
    description: 'Stagnant wastewater pooling behind college hostel area and vacant plots. Heavy mosquito breeding creating severe dengue and malaria public health hazard.',
    citizenName: 'S Hari Prassath',
    citizenEmail: 'shariprassath@gmail.com',
    district: 'Karur',
    ward: 29,
    address: 'Near M. Kumarasamy College, Thanthonimalai, Karur - 639005',
    latitude: 10.9601,
    longitude: 78.0766,
    categoryCode: 'HEALTH_MOSQUITO',
    departmentCode: 'HEALTH',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop',
    caption: 'Stagnant dirty green water pool with mosquito breeding larvae',
  },
  {
    idIndex: 4,
    title: 'Overflowing Municipal Garbage Dumper Bin',
    description: 'Community dumper bin overflowing for 4 consecutive days near daily vegetable market. Stray animals scattering trash, extreme foul stench across the street.',
    citizenName: 'Kavitha Rajan',
    citizenEmail: 'kavithaa1927@gmail.com',
    district: 'Madurai',
    ward: 18,
    address: 'North Veli Street, Simmakkal, Madurai - 625001',
    latitude: 9.9252,
    longitude: 78.1198,
    categoryCode: 'GARBAGE_OVERFLOW',
    departmentCode: 'MAWS',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop',
    caption: 'Green municipal dumper bin overflowing with domestic solid waste',
  },
  {
    idIndex: 5,
    title: 'Dark Road Hazard: Consecutive Broken Streetlights',
    description: '3 consecutive 70W LED streetlights not functioning on residential link road. Pitch dark stretch causing acute safety hazard for women and elders walking at night.',
    citizenName: 'Karthik Ramanathan',
    citizenEmail: 'karthik.ram@gmail.com',
    district: 'Salem',
    ward: 12,
    address: 'Cherry Road, Hasthampatti, Salem - 636007',
    latitude: 11.6643,
    longitude: 78.1460,
    categoryCode: 'STREETLIGHT_OUT',
    departmentCode: 'ENERGY',
    priority: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop',
    caption: 'Dark urban residential street with non-functional streetlight pole',
  },
  {
    idIndex: 6,
    title: 'Collapsed Pedestrian Footpath Concrete Slabs',
    description: 'Footpath concrete slabs collapsed into storm drain trench for 15 meters. Pedestrians forced to walk on busy carriage-way with speeding buses.',
    citizenName: 'Anandhi V',
    citizenEmail: 'anandhi.v@gmail.com',
    district: 'Tiruchirappalli',
    ward: 34,
    address: 'Main Road, Thillai Nagar, Tiruchirappalli - 620018',
    latitude: 10.7905,
    longitude: 78.7047,
    categoryCode: 'FOOTPATH_DAMAGED',
    departmentCode: 'HIGHWAYS',
    priority: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop',
    caption: 'Broken pedestrian sidewalk concrete slabs over open storm drain',
  },
  {
    idIndex: 7,
    title: 'Dangerous Low-Hanging Live Electrical Cable near School',
    description: 'Storm damaged 415V distribution line sagging 4 feet above ground across the road near higher secondary school gate. Life-threatening electrocution risk.',
    citizenName: 'Murugesan P',
    citizenEmail: 'murugesan.p@gmail.com',
    district: 'Tirunelveli',
    ward: 8,
    address: 'Trivandrum Road, Palayamkottai, Tirunelveli - 627002',
    latitude: 8.7139,
    longitude: 77.7567,
    categoryCode: 'ELECTRICITY_HAZARD',
    departmentCode: 'ENERGY',
    priority: 'urgent',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop',
    caption: 'Low-hanging power distribution cable sagging near roadside',
  },
  {
    idIndex: 8,
    title: 'Choked Sewer Manhole Bubbling Sewage onto Road',
    description: 'Underground sewer manhole choked with silt and overflowing foul black sewage water onto bus route road, contaminating nearby groundwater sources.',
    citizenName: 'Selvamani K',
    citizenEmail: 'selvamani.k@gmail.com',
    district: 'Vellore',
    ward: 15,
    address: 'Katpadi Main Road, Vellore - 632007',
    latitude: 12.9165,
    longitude: 79.1325,
    categoryCode: 'SEWAGE_OVERFLOW',
    departmentCode: 'MAWS',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=800&auto=format&fit=crop',
    caption: 'Overflowing black sewage water bubbling from road manhole',
  },
  {
    idIndex: 9,
    title: 'Illegal Construction Debris & Plastic Waste Dump',
    description: 'Unidentified commercial trucks dumped heavy concrete debris, plaster rubble, and industrial plastic packaging on footpath corner, blocking road visibility.',
    citizenName: 'Ramesh Babu',
    citizenEmail: 'ramesh.babu@gmail.com',
    district: 'Chennai',
    ward: 88,
    address: '2nd Avenue, Anna Nagar, Chennai - 600040',
    latitude: 13.0850,
    longitude: 80.2101,
    categoryCode: 'GARBAGE_OVERFLOW',
    departmentCode: 'MAWS',
    priority: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop',
    caption: 'Heavy construction concrete rubble and debris dumped on street pavement',
  },
  {
    idIndex: 10,
    title: 'Muddy Brown Contaminated Tap Water Supply',
    description: 'Municipal drinking water supplied to 40 houses is dark muddy brown with foul chemical odor due to old pipeline corrosion and drain seepage.',
    citizenName: 'Priya Sundaram',
    citizenEmail: 'citizen.test@civicconnect.tn.gov.in',
    district: 'Coimbatore',
    ward: 23,
    address: 'DB Road, RS Puram, Coimbatore - 641002',
    latitude: 11.0086,
    longitude: 76.9450,
    categoryCode: 'WATER_CONTAMINATION',
    departmentCode: 'MAWS',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop',
    caption: 'Discolored turbid brownish tap water collected from residential pipeline',
  },
  {
    idIndex: 11,
    title: 'Frequent Sparking and Smoke from Distribution Transformer',
    description: 'Distribution transformer on street corner sparking loudly with smoke during evening peak load. Nearby trees touching lines, fire hazard.',
    citizenName: 'Venkatesh N',
    citizenEmail: 'venkatesh.n@gmail.com',
    district: 'Erode',
    ward: 19,
    address: 'Perundurai Road, Erode - 638011',
    latitude: 11.3410,
    longitude: 77.7172,
    categoryCode: 'ELECTRICITY_HAZARD',
    departmentCode: 'ENERGY',
    priority: 'urgent',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop',
    caption: 'Distribution electrical transformer pole with exposed connectors',
  },
  {
    idIndex: 12,
    title: 'Damaged Knocked-down Traffic Signal at 4-Way Junction',
    description: 'Key 4-way intersection traffic signal pole knocked down by vehicle impact. Signals completely dark, near-accidents occurring every few minutes.',
    citizenName: 'Lakshmi Narayanan',
    citizenEmail: 'lakshmi.narayan@gmail.com',
    district: 'Madurai',
    ward: 42,
    address: 'KK Nagar Main Road, Madurai - 625020',
    latitude: 9.9328,
    longitude: 78.1487,
    categoryCode: 'TRAFFIC_SIGNAL_OUT',
    departmentCode: 'HIGHWAYS',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop',
    caption: 'Damaged bent traffic signal post at four-way road junction',
  },
  {
    idIndex: 13,
    title: 'Monsoon Waterlogged Mud Track in Panchayat Village',
    description: 'Village panchayat access road inundated with 2 feet of water and heavy sludge. School buses and ambulances unable to reach settlement.',
    citizenName: 'Muthuvel Pandian',
    citizenEmail: 'muthuvel.p@gmail.com',
    district: 'Dharmapuri',
    ward: 6,
    address: 'Harur Link Road, Dharmapuri - 636701',
    latitude: 12.1211,
    longitude: 78.1582,
    categoryCode: 'RURAL_ROAD_DAMAGE',
    departmentCode: 'RDPR',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop',
    caption: 'Waterlogged muddy unpaved rural road with deep tire tracks',
  },
  {
    idIndex: 14,
    title: 'Commercial Meat & Fish Offal Dumped in Open Drain',
    description: 'Nearby meat and fish vendors dumping untreated animal waste directly into open municipal storm drain. Unbearable stench, attracting vectors and stray dogs.',
    citizenName: 'Saravanan M',
    citizenEmail: 'saravanan.m@gmail.com',
    district: 'Thanjavur',
    ward: 14,
    address: 'Medical College Road, Thanjavur - 613004',
    latitude: 10.7870,
    longitude: 79.1378,
    categoryCode: 'HEALTH_SANITATION',
    departmentCode: 'HEALTH',
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop',
    caption: 'Open municipal storm drain choked with dumped market organic waste',
  },
  {
    idIndex: 15,
    title: 'Broken Children Swings & Sharp Exposed Iron in Public Park',
    description: 'Corporation children play park equipment rusted and broken with sharp exposed iron rods. Two children injured, urgent welding/replacement required.',
    citizenName: 'Divya Bharathi',
    citizenEmail: 'divya.b@gmail.com',
    district: 'Kanchipuram',
    ward: 21,
    address: 'Gandhi Road, Kanchipuram - 631501',
    latitude: 12.8342,
    longitude: 79.7036,
    categoryCode: 'PARK_MAINTENANCE',
    departmentCode: 'HOUSING',
    priority: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop',
    caption: 'Broken playground swings with rusted chain and exposed iron structure',
  },
  {
    idIndex: 16,
    title: 'Uncovered Open Stormwater Drain Hole on Busy Road',
    description: '3x3 foot open drain pit without cover slab located directly adjacent to crowded bus shelter. Severe accident trap especially at night.',
    citizenName: 'Gopinath S',
    citizenEmail: 'gopinath.s@gmail.com',
    district: 'Dindigul',
    ward: 10,
    address: 'Palani Road, Dindigul - 624001',
    latitude: 10.3673,
    longitude: 77.9803,
    categoryCode: 'DRAINAGE_OPEN',
    departmentCode: 'HIGHWAYS',
    priority: 'urgent',
    imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop',
    caption: 'Open rectangular concrete drain pit hole without cover slab on roadside',
  },
];

async function seedDiverseComplaints() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🚀 Starting Diverse 16-Complaint Multi-Domain Seeder...');

  // Get active citizen profile IDs to associate with complaints
  const { data: profiles } = await supabase.from('profiles').select('id, email, display_name');
  const profileMap = new Map<string, string>();
  profiles?.forEach((p) => {
    profileMap.set(p.email.toLowerCase(), p.id);
  });

  const defaultCitizenId = profiles?.[0]?.id || 'usr-citizen-default';

  let successCount = 0;

  for (const item of DIVERSE_16_COMPLAINTS) {
    let citizenId = profileMap.get(item.citizenEmail.toLowerCase()) || defaultCitizenId;

    // If citizen is S Hari Prassath or Kavitha or Priya, use their exact Supabase ID
    if (item.citizenEmail === 'shariprassath@gmail.com' && profileMap.has('shariprassath@gmail.com')) {
      citizenId = profileMap.get('shariprassath@gmail.com')!;
    } else if (item.citizenEmail === 'kavithaa1927@gmail.com' && profileMap.has('kavithaa1927@gmail.com')) {
      citizenId = profileMap.get('kavithaa1927@gmail.com')!;
    } else if (item.citizenEmail === 'citizen.test@civicconnect.tn.gov.in' && profileMap.has('citizen.test@civicconnect.tn.gov.in')) {
      citizenId = profileMap.get('citizen.test@civicconnect.tn.gov.in')!;
    }

    const actor = {
      id: citizenId,
      role: UserRole.CITIZEN,
      email: item.citizenEmail,
      display_name: item.citizenName,
    };

    const complaintInput = {
      title: item.title,
      description: item.description,
      address: item.address,
      ward_id: item.ward,
      district: item.district,
      latitude: item.latitude,
      longitude: item.longitude,
      source: ComplaintSource.MOBILE,
      is_public: true,
      media: [
        {
          url: item.imageUrl,
          media_type: MediaType.IMAGE,
          phase: MediaPhase.COMPLAINT,
        },
      ],
    };

    try {
      console.log(`\n[${item.idIndex}/16] Raising complaint: "${item.title}" in ${item.district} (Ward ${item.ward})...`);
      const result = await ComplaintEngine.createComplaint(complaintInput, actor, { ipAddress: '127.0.0.1' });

      if (result.success && result.complaint) {
        successCount++;
        console.log(`✅ Success! Tracking ID: ${result.complaint.tracking_id} | Status: ${result.complaint.status} | Priority: ${result.complaint.priority}`);
      } else {
        console.error(`❌ Failed to create complaint #${item.idIndex}:`, result.errors);
      }
    } catch (err) {
      console.error(`❌ Exception creating complaint #${item.idIndex}:`, err);
    }
  }

  console.log(`\n🎉 Seeding completed! Successfully created ${successCount}/16 complaints across Tamil Nadu.`);
}

seedDiverseComplaints();
