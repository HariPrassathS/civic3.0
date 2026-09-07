// =============================================================================
// CivicConnect TN — Master Categories & Departments Registry
// =============================================================================
// Provides authoritative mapping between civic grievance categories, departments,
// default priorities, and SLA turnaround times across Tamil Nadu jurisdictions.

import { Priority } from '@/types/enums';

export interface DepartmentDef {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string;
}

export interface CategoryDef {
  id: string;
  code: string;
  name: string;
  department_id: string;
  department_code: string;
  default_priority: Priority;
  default_sla_hours: number;
  description?: string;
}

/** Master list of Government of Tamil Nadu Urban & Civic Departments */
export const MASTER_DEPARTMENTS: DepartmentDef[] = [
  {
    id: 'd0000001-0000-0000-0000-000000000001',
    code: 'WATER',
    name: 'Water Supply & Sewerage (CMWSSB / TWAD)',
    description: 'Drinking water distribution, pipeline leakages, quality inspection, and supply schedules.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000002',
    code: 'ROADS',
    name: 'Roads & Infrastructure (Highways / GCC)',
    description: 'Road repair, asphalt laying, pothole remediation, footpaths, bridges, and flyovers.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000003',
    code: 'SANITATION',
    name: 'Solid Waste Management & Sanitation',
    description: 'Door-to-door garbage collection, community dustbins, debris clearing, and public hygiene.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000004',
    code: 'DRAINAGE',
    name: 'Storm Water Drainage & Sewage Management',
    description: 'Desilting monsoon drains, sewage overflow clearing, manhole repairs, and flood mitigation.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000005',
    code: 'STREETLIGHT',
    name: 'Street Lighting & Public Illumination',
    description: 'Streetlight repair, smart LED pole installation, timer sync, and dark-spot elimination.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000006',
    code: 'ELECTRICITY',
    name: 'TANGEDCO / Electricity Distribution',
    description: 'Transformer faults, exposed overhead wires, power supply disruptions, and voltage spikes.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000007',
    code: 'HEALTH',
    name: 'Public Health & Vector Control',
    description: 'Mosquito fogging, dengue prevention, food safety checks, vaccination drives, and sanitation certs.',
  },
  {
    id: 'd0000001-0000-0000-0000-000000000008',
    code: 'GENERAL',
    name: 'Revenue, Town Planning & General Administration',
    description: 'Public nuisances, unauthorized encroachments, park upkeep, noise violations, and general complaints.',
  },
];

/** Master list of grievance categories */
export const MASTER_CATEGORIES: CategoryDef[] = [
  // Water Supply
  {
    id: 'fc1b25e9-b863-4386-acb0-60c0ed5c7296',
    code: 'WATER_NO_SUPPLY',
    name: 'No Water Supply',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    department_code: 'WATER',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Complete disruption of municipal pipeline water supply to residential or commercial area.',
  },
  {
    id: 'f3cf4297-2920-44c7-9f64-9700b527c482',
    code: 'WATER_LOW_PRESSURE',
    name: 'Low Water Pressure',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    department_code: 'WATER',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Inadequate pressure at household tap connection preventing tank storage.',
  },
  {
    id: '79959dd1-e59f-47bd-b6dc-641392371f9b',
    code: 'WATER_CONTAMINATION',
    name: 'Water Contamination / Bad Odor',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    department_code: 'WATER',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Discolored, turbid, or foul-smelling tap water posing immediate health risk.',
  },
  {
    id: '818c79b0-501c-4faa-a22a-9a8d70f5a7cf',
    code: 'WATER_PIPE_LEAK',
    name: 'Drinking Water Main Pipe Leakage',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    department_code: 'WATER',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Underground or surface drinking water pipeline rupture causing water wastage.',
  },
  {
    id: '10a045a2-3364-48dd-8308-32c303f1ec99',
    code: 'WATER_IRREGULAR',
    name: 'Irregular Supply Timings',
    department_id: 'd0000001-0000-0000-0000-000000000001',
    department_code: 'WATER',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Unannounced changes in water distribution schedule.',
  },

  // Roads & Infrastructure
  {
    id: '53c0843b-3b7b-464b-9ea1-f2e527fcefe4',
    code: 'ROADS_POTHOLE',
    name: 'Pothole Cluster / Crater',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    department_code: 'ROADS',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Dangerous pothole on public roadway endangering motorists and pedestrians.',
  },
  {
    id: 'a73ce360-5511-4d48-ad7c-65a2a97910a6',
    code: 'ROADS_DAMAGE',
    name: 'Broken Road / Trench Not Restored',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    department_code: 'ROADS',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Unpaved dug-up trench or sunken tar section post-utility work.',
  },
  {
    id: '45a383e1-8faf-4d08-ab2d-3c2e85835c08',
    code: 'ROADS_FOOTPATH',
    name: 'Damaged Footpath / Paver Blocks',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    department_code: 'ROADS',
    default_priority: Priority.LOW,
    default_sla_hours: 72,
    description: 'Missing or broken sidewalk slabs causing tripping hazard.',
  },
  {
    id: '2751e4ef-484a-4171-8de0-bb77796bf497',
    code: 'ROADS_BRIDGE',
    name: 'Bridge / Flyover Structural Defect',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    department_code: 'ROADS',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Expansion joint gap, railing collapse, or structural crack on overpass.',
  },
  {
    id: 'b943f84a-c0e7-45bc-bee4-35f323e4457f',
    code: 'ROADS_CONSTRUCTION',
    name: 'Road Construction Delay / Barrier Issue',
    department_id: 'd0000001-0000-0000-0000-000000000002',
    department_code: 'ROADS',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Abandoned roadwork material causing severe traffic gridlock.',
  },

  // Sanitation & Solid Waste
  {
    id: 'be76143d-34fa-4aab-8c3c-1bea717d06f3',
    code: 'SANIT_NO_COLLECT',
    name: 'Garbage Not Collected (Door-to-Door)',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    department_code: 'SANITATION',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Conservancy vehicle has not visited residential street for over 48 hours.',
  },
  {
    id: '5e89eaa3-6655-4206-8de3-dc2be0d1c25a',
    code: 'SANIT_OVERFLOW',
    name: 'Overflowing Community Dustbin',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    department_code: 'SANITATION',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Litter spilling onto public street attracting stray cattle and dogs.',
  },
  {
    id: 'fc27489a-3aa0-4c03-b2bd-17c658edd933',
    code: 'SANIT_ILLEGAL_DUMP',
    name: 'Illegal Debris / Construction Waste Dumping',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    department_code: 'SANITATION',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Unlawful dumping of demolition rubble or hazardous industrial debris on vacant plot.',
  },
  {
    id: '907f59c4-b7b3-4363-9b95-54f1f132efb7',
    code: 'SANIT_DEAD_ANIMAL',
    name: 'Dead Animal Removal',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    department_code: 'SANITATION',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Carcass of animal requiring immediate hygienic disposal.',
  },
  {
    id: 'ef8fc401-f68a-470b-bab4-b6551f2b38be',
    code: 'SANIT_TOILET',
    name: 'Public Toilet Maintenance / Hygiene',
    department_id: 'd0000001-0000-0000-0000-000000000003',
    department_code: 'SANITATION',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Unsanitary, locked, or unserviced municipal public convenience.',
  },

  // Drainage & Sewage
  {
    id: '83167055-4176-4b7e-a228-42e470641814',
    code: 'DRAIN_BLOCKED',
    name: 'Blocked Storm Water Drain',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    department_code: 'DRAINAGE',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Plastic or silt blockage in roadside storm drain causing water backup.',
  },
  {
    id: 'b1eb0597-93b9-43b9-ba27-86c2cd7d1ecb',
    code: 'DRAIN_SEWAGE',
    name: 'Sewage Overflow on Street',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    department_code: 'DRAINAGE',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Choked underground drainage line pushing raw sewage onto pedestrian path.',
  },
  {
    id: '1e5baf8c-66ab-4e70-8869-625be2470de4',
    code: 'DRAIN_WATERLOG',
    name: 'Rain Water Inundation / Waterlogging',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    department_code: 'DRAINAGE',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Stagnant stormwater submerging street and preventing access.',
  },
  {
    id: '80051642-e227-4ab1-9e21-8eb9fecba678',
    code: 'DRAIN_MANHOLE',
    name: 'Open / Broken Manhole Cover',
    department_id: 'd0000001-0000-0000-0000-000000000004',
    department_code: 'DRAINAGE',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Missing or sunken chamber lid posing life-threatening danger to public.',
  },

  // Street Lighting
  {
    id: 'eca66734-f4b2-42e7-8899-52ec8028a70b',
    code: 'LIGHT_NOT_WORKING',
    name: 'Streetlight Not Working (Dark Area)',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    department_code: 'STREETLIGHT',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Non-functional lamp fitting creating safety hazard at night.',
  },
  {
    id: 'd60f89ff-2ad1-4769-b2c2-881487408324',
    code: 'LIGHT_DAMAGED_POLE',
    name: 'Damaged / Tilting Light Pole',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    department_code: 'STREETLIGHT',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Rusted or vehicle-impacted pole leaning dangerously.',
  },
  {
    id: '6c9dfe14-3e15-49f1-938b-4e98e8ce6621',
    code: 'LIGHT_NEW_REQUEST',
    name: 'New Streetlight Installation Request',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    department_code: 'STREETLIGHT',
    default_priority: Priority.LOW,
    default_sla_hours: 72,
    description: 'Request for extending public lighting coverage on new street.',
  },
  {
    id: 'a5357bb9-0bc4-461e-814a-69a780722648',
    code: 'LIGHT_HAZARD',
    name: 'Exposed Electrical Pole Junction',
    department_id: 'd0000001-0000-0000-0000-000000000005',
    department_code: 'STREETLIGHT',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Uncovered live wire junction box at pedestrian eye level.',
  },

  // Electricity
  {
    id: '8147bad1-fa80-47b6-bc06-5b79c40b79e0',
    code: 'ELEC_OUTAGE',
    name: 'Frequent Power Outage / Blackout',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    department_code: 'ELECTRICITY',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Unscheduled grid breakdown affecting entire residential sector.',
  },
  {
    id: 'a363d30d-fa70-4523-85f9-f3978b835534',
    code: 'ELEC_TRANSFORMER',
    name: 'Transformer Sparking / Oil Leak',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    department_code: 'ELECTRICITY',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Distribution transformer buzzing loudly or emitting sparks.',
  },
  {
    id: 'd9292616-b90b-41fe-9314-a7e43e96d3e3',
    code: 'ELEC_EXPOSED_WIRE',
    name: 'Hanging / Low Clearance High-Voltage Line',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    department_code: 'ELECTRICITY',
    default_priority: Priority.URGENT,
    default_sla_hours: 12,
    description: 'Overhead 11kV conductor sagging below statutory height limit.',
  },
  {
    id: '8fadbd47-a4b2-4ac8-b7e9-181a59151cfb',
    code: 'ELEC_VOLTAGE',
    name: 'Severe Voltage Fluctuation',
    department_id: 'd0000001-0000-0000-0000-000000000006',
    department_code: 'ELECTRICITY',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'High voltage damaging home appliances and industrial equipment.',
  },

  // Public Health
  {
    id: 'd1c91656-8527-4715-9a25-89f1472a4d9f',
    code: 'HEALTH_MOSQUITO',
    name: 'Mosquito Breeding / Fogging Request',
    department_id: 'd0000001-0000-0000-0000-000000000007',
    department_code: 'HEALTH',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'High mosquito density in neighborhood requiring thermal fogging.',
  },
  {
    id: '650e8232-1146-48cf-97c2-20180499fd65',
    code: 'HEALTH_STAGNANT',
    name: 'Stagnant Water with Larvae in Vacant Plot',
    department_id: 'd0000001-0000-0000-0000-000000000007',
    department_code: 'HEALTH',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Green algae and mosquito breeding ground on abandoned private plot.',
  },
  {
    id: 'd5d77388-e15f-45a0-a25f-e3cd4bcb2674',
    code: 'HEALTH_FOOD',
    name: 'Food Safety & Hygiene Violation',
    department_id: 'd0000001-0000-0000-0000-000000000007',
    department_code: 'HEALTH',
    default_priority: Priority.HIGH,
    default_sla_hours: 24,
    description: 'Uninspected or adulterated food sold in unhygienic conditions.',
  },

  // General & Administration
  {
    id: '2ed5af68-0a6a-4d48-b39d-3b34ab57d764',
    code: 'GEN_ENCROACH',
    name: 'Unauthorized Footpath Encroachment',
    department_id: 'd0000001-0000-0000-0000-000000000008',
    department_code: 'GENERAL',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Illegal temporary shed or commercial extension blocking pedestrian access.',
  },
  {
    id: 'bd4a4793-8eff-44e4-81f6-0f27ae51ab16',
    code: 'GEN_NOISE',
    name: 'Noise Pollution Beyond Permitted Hours',
    department_id: 'd0000001-0000-0000-0000-000000000008',
    department_code: 'GENERAL',
    default_priority: Priority.LOW,
    default_sla_hours: 72,
    description: 'Loudspeakers or commercial machinery operating past 10 PM in residential zone.',
  },
  {
    id: '66b4b7ea-7993-4a6f-b1d4-b3b4abe68682',
    code: 'GEN_NUISANCE',
    name: 'Public Nuisance / Stray Animal Menace',
    department_id: 'd0000001-0000-0000-0000-000000000008',
    department_code: 'GENERAL',
    default_priority: Priority.MEDIUM,
    default_sla_hours: 48,
    description: 'Aggressive stray dog pack or cattle obstructing thoroughfare.',
  },
  {
    id: '85cdae1f-e67f-4572-ac5b-2300b6ec931c',
    code: 'GEN_OTHER',
    name: 'Other General Civic Grievance',
    department_id: 'd0000001-0000-0000-0000-000000000008',
    department_code: 'GENERAL',
    default_priority: Priority.LOW,
    default_sla_hours: 72,
    description: 'Miscellaneous municipal matter not categorized above.',
  },
];

/**
 * Resolves a category and its parent department from id or code.
 */
export function resolveCategoryAndDepartment(
  categoryIdOrCode?: string | null,
  departmentIdOrCode?: string | null
): {
  category: CategoryDef | null;
  department: DepartmentDef | null;
  resolvedPriority: Priority;
  slaHours: number;
} {
  let matchedCat: CategoryDef | null = null;
  let matchedDept: DepartmentDef | null = null;

  if (categoryIdOrCode) {
    const cleanCat = categoryIdOrCode.trim().toLowerCase();
    matchedCat =
      MASTER_CATEGORIES.find(
        (c) =>
          c.id.toLowerCase() === cleanCat ||
          c.code.toLowerCase() === cleanCat ||
          c.name.toLowerCase() === cleanCat
      ) || null;
  }

  if (matchedCat) {
    matchedDept =
      MASTER_DEPARTMENTS.find(
        (d) =>
          d.id === matchedCat!.department_id ||
          d.code.toLowerCase() === matchedCat!.department_code.toLowerCase()
      ) || null;
  } else if (departmentIdOrCode) {
    const cleanDept = departmentIdOrCode.trim().toLowerCase();
    matchedDept =
      MASTER_DEPARTMENTS.find(
        (d) =>
          d.id.toLowerCase() === cleanDept ||
          d.code.toLowerCase() === cleanDept ||
          d.name.toLowerCase() === cleanDept
      ) || null;
  }

  // Fallback defaults
  const resolvedPriority = matchedCat?.default_priority || Priority.MEDIUM;
  const slaHours = matchedCat?.default_sla_hours || (
    resolvedPriority === Priority.URGENT ? 12 :
    resolvedPriority === Priority.HIGH ? 24 :
    resolvedPriority === Priority.MEDIUM ? 48 : 72
  );

  return {
    category: matchedCat,
    department: matchedDept,
    resolvedPriority,
    slaHours,
  };
}

/**
 * Helper to get a Department by ID or Code
 */
export function getDepartmentByIdOrCode(idOrCode: string): DepartmentDef | null {
  const clean = idOrCode.trim().toLowerCase();
  return (
    MASTER_DEPARTMENTS.find(
      (d) => d.id.toLowerCase() === clean || d.code.toLowerCase() === clean
    ) || null
  );
}

/**
 * Helper to get a Category by ID or Code
 */
export function getCategoryByIdOrCode(idOrCode: string): CategoryDef | null {
  const clean = idOrCode.trim().toLowerCase();
  return (
    MASTER_CATEGORIES.find(
      (c) => c.id.toLowerCase() === clean || c.code.toLowerCase() === clean
    ) || null
  );
}
