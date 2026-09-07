// =============================================================================
// CivicConnect TN — Predictive Seasonal & Climate Risk Analytics
// =============================================================================
// Encodes Tamil Nadu meteorological and civic calendar patterns to compute
// seasonal multipliers for various municipal infrastructure hazards.

import { ClimateSeason, RiskCategory, SeasonalAdvisory } from './types';

/**
 * Returns current Tamil Nadu climate season based on calendar month and day.
 */
export function getCurrentTamilNaduSeason(date: Date = new Date()): ClimateSeason {
  const month = date.getMonth(); // 0 = Jan, 9 = Oct, 11 = Dec
  const day = date.getDate();

  // Northeast Monsoon: Oct 15 - Dec 31
  if (month === 9 && day >= 15) return 'NORTHEAST_MONSOON';
  if (month === 10 || month === 11) return 'NORTHEAST_MONSOON';

  // Winter / Post-Monsoon & Pongal: Jan 1 - Feb 28/29
  if (month === 0 || month === 1) return 'WINTER_POST_MONSOON';

  // Summer / Pre-Monsoon: Mar 1 - May 31
  if (month >= 2 && month <= 4) return 'SUMMER_PRE_MONSOON';

  // Southwest Monsoon & Pre-Northeast preparations: Jun 1 - Oct 14
  return 'SOUTHWEST_MONSOON';
}

/**
 * Computes category-specific seasonal vulnerability multiplier (1.0 to 1.7).
 */
export function getSeasonalCategoryMultiplier(
  category: RiskCategory | string,
  season: ClimateSeason = getCurrentTamilNaduSeason()
): number {
  const cat = category.toUpperCase();

  switch (season) {
    case 'NORTHEAST_MONSOON':
      if (cat.includes('DRAIN') || cat.includes('FLOOD')) return 1.7; // +70% risk multiplier
      if (cat.includes('ROAD') || cat.includes('POTHOLE')) return 1.5;
      if (cat.includes('HEALTH') || cat.includes('SANITATION')) return 1.4;
      if (cat.includes('ELECTRIC') || cat.includes('LIGHT')) return 1.3;
      return 1.1;

    case 'SUMMER_PRE_MONSOON':
      if (cat.includes('WATER') || cat.includes('PIPE')) return 1.65; // +65% water stress
      if (cat.includes('ELECTRIC') || cat.includes('TRANSFORMER')) return 1.55; // +55% transformer load
      if (cat.includes('SANITATION') || cat.includes('GARBAGE')) return 1.3; // Rapid decomposition/odor
      return 1.05;

    case 'WINTER_POST_MONSOON':
      if (cat.includes('SANITATION') || cat.includes('GARBAGE') || cat.includes('WASTE')) return 1.45; // Pongal market surges
      if (cat.includes('ROAD')) return 1.25; // Cold-mix paving window
      return 1.0;

    case 'SOUTHWEST_MONSOON':
      if (cat.includes('DRAIN')) return 1.4; // Pre-monsoon desilting critical window
      if (cat.includes('ROAD') || cat.includes('POTHOLE')) return 1.35;
      if (cat.includes('HEALTH')) return 1.3;
      return 1.1;

    default:
      return 1.0;
  }
}

/**
 * Returns complete Tamil Nadu Seasonal Advisories catalog.
 */
export function getTamilNaduSeasonalAdvisories(): SeasonalAdvisory[] {
  const currentSeason = getCurrentTamilNaduSeason();

  return [
    {
      id: 'season-ne-monsoon',
      season: 'NORTHEAST_MONSOON',
      season_name: 'Northeast Monsoon (North-East Rainfall Window)',
      active_months: 'October – December',
      is_active_now: currentSeason === 'NORTHEAST_MONSOON',
      vulnerability_index: 88,
      title: 'Monsoon Inundation & Storm Drain Surge Vulnerability',
      summary:
        'Tamil Nadu receives over 60% of its annual precipitation during this period. Low-lying wards (Velachery, Madipakkam, Kolathur) face severe waterlogging if micro-canals and culverts are constricted.',
      affected_departments: ['Drainage & Sewage', 'Roads & Infrastructure', 'Public Health'],
      primary_risks: [
        'Rapid storm drain overflow causing road sub-base flooding',
        'Increased breeding of vector-borne vectors (Dengue, Malaria)',
        'Bitumen stripping and deep cratering on high-traffic corridors',
      ],
      proactive_steps: [
        'Pre-position high-capacity diesel dewatering pumps (50HP) at vulnerable culverts',
        'Deploy rapid desilting suction trucks across arterial canals',
        'Initiate ward-level larvicidal fogging drives',
      ],
      public_guidance: [
        'Keep household drain inlets clear of solid garbage',
        'Avoid parking vehicles over stormwater grating',
        'Report blocked culverts immediately via CivicConnect photo upload',
      ],
    },
    {
      id: 'season-summer',
      season: 'SUMMER_PRE_MONSOON',
      season_name: 'Summer & Pre-Monsoon Peak',
      active_months: 'March – May',
      is_active_now: currentSeason === 'SUMMER_PRE_MONSOON',
      vulnerability_index: 76,
      title: 'Potable Water Distribution & Electrical Grid Stress',
      summary:
        'Ambient temperatures exceeding 38°C induce severe peak air conditioning loads causing distribution transformer overheating, alongside groundwater drop and piped water pressure loss.',
      affected_departments: ['Water Supply', 'Electricity', 'Sanitation & Waste'],
      primary_risks: [
        'Distribution transformer oil burnout and feeder line tripping',
        'Tail-end residential pipeline pressure loss leading to dry runs',
        'Accelerated municipal solid waste organic decomposition and odor complaints',
      ],
      proactive_steps: [
        'Conduct thermal infrared scans on all 11kV distribution transformers',
        'Schedule pressurized water tanker convoys for tail-end ward zones',
        'Double daily garbage clearance frequency in commercial market zones',
      ],
      public_guidance: [
        'Report low water pressure early to enable booster valve adjustment',
        'Practice rain water harvesting storage conservation',
        'Avoid burning roadside dry leaf litter near electrical poles',
      ],
    },
    {
      id: 'season-winter',
      season: 'WINTER_POST_MONSOON',
      season_name: 'Winter & Post-Monsoon Festive Phase',
      active_months: 'January – February',
      is_active_now: currentSeason === 'WINTER_POST_MONSOON',
      vulnerability_index: 54,
      title: 'Pongal Festival Waste Surge & Road Rehabilitation Window',
      summary:
        'Post-monsoon dry weather presents the optimal municipal window for full-depth asphalt re-carpeting, while harvest festivals produce significant localized commercial organic waste surges.',
      affected_departments: ['Sanitation & Waste', 'Roads & Infrastructure'],
      primary_risks: [
        'Overflowing secondary waste transfer stations around Koyambedu and wholesale markets',
        'Residual dust and loose gravel hazards on unpaved milled roads',
      ],
      proactive_steps: [
        'Deploy dedicated festival waste compactor trucks to temple and market zones',
        'Accelerate surface asphalt re-laying before summer bitumen shortages',
      ],
      public_guidance: [
        'Segregate organic festival sugarcane and leaf waste at source',
        'Do not dump festive debris inside open roadside stormwater drains',
      ],
    },
    {
      id: 'season-sw-monsoon',
      season: 'SOUTHWEST_MONSOON',
      season_name: 'Southwest Monsoon & Pre-Monsoon Preparedness',
      active_months: 'June – September',
      is_active_now: currentSeason === 'SOUTHWEST_MONSOON',
      vulnerability_index: 68,
      title: 'Pre-Monsoon Desilting & Pothole Patching Window',
      summary:
        'Intermittent precipitation and moderate temperatures require mandatory preparatory clearing of major canals, storm water drain networks, and road crater patching.',
      affected_departments: ['Drainage & Sewage', 'Roads & Infrastructure'],
      primary_risks: [
        'Clogged culvert screens trapping upstream plastic and silt',
        'Pothole expansion on arterial ring roads due to localized downpours',
      ],
      proactive_steps: [
        'Complete 100% desilting audit across all major stormwater drains',
        'Execute hot-mix asphalt patching on all bus route roads',
      ],
      public_guidance: [
        'Check private rainwater harvesting filters and rooftop outlets',
        'Report open or damaged manhole covers ahead of heavy monsoon showers',
      ],
    },
  ];
}
