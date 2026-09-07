'use client';

// =============================================================================
// CivicConnect TN — Administrative Spatial Intelligence GIS Map
// =============================================================================
// Features:
// 1. Zero-API Key Leaflet + OpenStreetMap Map Engine with Dark Mode Styling
// 2. Strict Tamil Nadu Geographic Boundary Constraint
// 3. Robust Density Heatmap Layer with Vivid Gradient & Dynamic Spectrum Legend
// 4. Interactive Clusters & Pulsing Markers with Detail Popups
// 5. Civic Auto-Tour (Animatic Navigation) with Camera Flythrough & Intelligent Auto-Resume on User Idle
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type * as L from 'leaflet';
import { LeafletMapWrapper } from './leaflet-map-wrapper';
import { ClusterLayer, TN_DISTRICTS_TAMIL, PRIORITY_TAMIL, STATUS_TAMIL, translateComplaintTitleToTamil } from './cluster-layer';
import { HeatmapLayer } from './heatmap-layer';
import { DistrictLabelsLayer } from './district-labels-layer';
import {
  Layers,
  Filter,
  MapPin,
  AlertTriangle,
  Flame,
  Grid,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ChevronDown,
  Building,
  Calendar,
  Shield,
  Loader2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sparkles,
  ExternalLink,
  Eye,
  Camera,
  Bot,
  Zap,
  Languages,
} from 'lucide-react';
import {
  TN_DISTRICTS,
  SpatialComplaintItem,
  SpatialCluster,
  HeatmapPoint,
  BoundingBox,
} from '@/lib/spatial/spatial-engine';

export type MapViewMode = 'markers' | 'clusters' | 'heatmap';

export const DEPT_TAMIL: Record<string, string> = {
  WATER: 'குடிநீர் வழங்கல் (CMWSSB/TWAD)',
  ROADS: 'நெடுஞ்சாலை & சாலைகள்',
  SANITATION: 'துப்புரவு & குப்பை மேலாண்மை',
  DRAINAGE: 'மழைநீர் வடிகால்',
  ELECTRICITY: 'மின்சார வாரியம் (TANGEDCO)',
  HEALTH: 'பொது சுகாதாரம்',
};

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'All Tamil Nadu': [10.8505, 78.6500], // Central TN (Trichy overview)
  Chennai: [13.0827, 80.2707],
  Coimbatore: [11.0168, 76.9558],
  Madurai: [9.9252, 78.1198],
  Tiruchirappalli: [10.7905, 78.7047],
  Salem: [11.6643, 78.1460],
  Tirunelveli: [8.7139, 77.7567],
  Tiruppur: [11.1085, 77.3411],
  Erode: [11.3410, 77.7172],
  Vellore: [12.9165, 79.1325],
  Thanjavur: [10.7870, 79.1378],
  Dindigul: [10.3673, 77.9803],
  Kanchipuram: [12.8342, 79.7036],
  Chengalpattu: [12.6819, 79.9888],
  Tiruvallur: [13.1432, 79.9079],
  Cuddalore: [11.7480, 79.7714],
  Kanniyakumari: [8.0883, 77.5385],
  Karur: [10.9601, 78.0766],
  Namakkal: [11.2189, 78.1674],
  Krishnagiri: [12.5186, 78.2137],
  Dharmapuri: [12.1211, 78.1582],
  'The Nilgiris': [11.4102, 76.6950],
  Thoothukudi: [8.7642, 78.1348],
  Theni: [10.0104, 77.4768],
  Virudhunagar: [9.5872, 77.9514],
  Sivaganga: [9.8433, 78.4809],
  Ramanathapuram: [9.3639, 78.8395],
  Pudukkottai: [10.3833, 78.8001],
  Ariyalur: [11.1401, 79.0786],
  Perambalur: [11.2342, 78.8820],
  Tiruvarur: [10.7725, 79.6365],
  Nagapattinam: [10.7672, 79.8449],
  Mayiladuthurai: [11.1075, 79.6523],
  Tiruvannamalai: [12.2253, 79.0747],
  Viluppuram: [11.9401, 79.4861],
  Kallakurichi: [11.7384, 78.9639],
  Ranipet: [12.9274, 79.3330],
  Tirupathur: [12.4958, 78.5678],
  Tenkasi: [8.9594, 77.3152],
};

interface AdminSpatialMapProps {
  initialDistrict?: string;
  initialDepartment?: string;
  userRole?: string;
  className?: string;
}

export function AdminSpatialMap({
  initialDistrict = 'All Tamil Nadu',
  initialDepartment = '',
  userRole = 'official',
  className = 'w-full h-[650px]',
}: AdminSpatialMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('clusters');
  const [mapLang, setMapLang] = useState<'en' | 'ta'>('en');

  // Multi-criteria filters
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDept, setSelectedDept] = useState(initialDepartment);
  const [dateRange, setDateRange] = useState('all');
  const [wardFilter, setWardFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [complaints, setComplaints] = useState<SpatialComplaintItem[]>([]);
  const [clusters, setClusters] = useState<SpatialCluster[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
    slaBreached: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ===========================================================================
  // CIVIC AUTO-TOUR / ANIMATIC NAVIGATION STATE
  // ===========================================================================
  const [isTourActive, setIsTourActive] = useState(false);
  const [isTourPaused, setIsTourPaused] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourSpeed, setTourSpeed] = useState<number>(1); // 1 = 4.5s per stop, 1.5 = 3s per stop
  const [tourTimeLeft, setTourTimeLeft] = useState<number>(4.5);
  const [autoResumeTimeLeft, setAutoResumeTimeLeft] = useState<number | null>(null);
  const [activeTourComplaint, setActiveTourComplaint] = useState<SpatialComplaintItem | null>(null);

  // Refs for seamless event listener integration without stale closures
  const isTourActiveRef = useRef(false);
  const isTourPausedRef = useRef(false);
  const isProgrammaticFlyRef = useRef(false);
  const tourIndexRef = useRef(0);
  const tourSpeedRef = useRef(1);
  const complaintsRef = useRef<SpatialComplaintItem[]>([]);
  const tourTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResumeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  isTourActiveRef.current = isTourActive;
  isTourPausedRef.current = isTourPaused;
  tourIndexRef.current = tourIndex;
  tourSpeedRef.current = tourSpeed;
  complaintsRef.current = complaints;

  // Fetch Spatial Data based on View Mode & Filters
  const loadSpatialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Heatmap points
      const heatParams = new URLSearchParams();
      if (selectedDept) heatParams.set('department_id', selectedDept);
      if (selectedDistrict && selectedDistrict !== 'All Tamil Nadu') {
        heatParams.set('district', selectedDistrict);
      }
      const hRes = await fetch(`/api/spatial/heatmap?${heatParams.toString()}`);
      if (hRes.ok) {
        const hJson = await hRes.json();
        if (hJson.success && hJson.data?.points) {
          setHeatmapPoints(hJson.data.points);
        }
      }

      // 2. Fetch Clusters
      const clusterParams = new URLSearchParams();
      if (selectedDistrict && selectedDistrict !== 'All Tamil Nadu') {
        clusterParams.set('district', selectedDistrict);
      }
      if (selectedCategory) clusterParams.set('category_id', selectedCategory);
      if (selectedStatus) clusterParams.set('status', selectedStatus);
      if (selectedDept) clusterParams.set('department_id', selectedDept);
      clusterParams.set('zoom', String(mapRef.current?.getZoom() || 8));

      const cRes = await fetch(`/api/spatial/clusters?${clusterParams.toString()}`);
      if (cRes.ok) {
        const cJson = await cRes.json();
        if (cJson.success && cJson.data) {
          setClusters(cJson.data.clusters || []);
        }
      }

      // 3. Fetch Admin Map stats & full complaints array for pins & tour
      const adminParams = new URLSearchParams();
      if (selectedDistrict && selectedDistrict !== 'All Tamil Nadu') {
        adminParams.set('district', selectedDistrict);
      }
      if (selectedCategory) adminParams.set('category_id', selectedCategory);
      if (selectedStatus) adminParams.set('status', selectedStatus);
      if (selectedPriority) adminParams.set('priority', selectedPriority);
      if (selectedDept) adminParams.set('department_id', selectedDept);
      if (dateRange !== 'all') adminParams.set('date_range', dateRange);
      if (wardFilter) adminParams.set('ward', wardFilter);

      const aRes = await fetch(`/api/spatial/admin-map?${adminParams.toString()}`);
      if (aRes.ok) {
        const aJson = await aRes.json();
        if (aJson.success && aJson.data) {
          setStats(aJson.data.stats || stats);
          setComplaints(aJson.data.complaints || []);
        }
      }
    } catch (err) {
      console.warn('Failed to load spatial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDistrict,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    selectedDept,
    dateRange,
    wardFilter,
  ]);

  useEffect(() => {
    loadSpatialData();
  }, [loadSpatialData]);

  // Clean up tour timers on unmount
  useEffect(() => {
    return () => {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
    };
  }, []);

  // ===========================================================================
  // CAMERA FLYTHROUGH ANIMATION & TOUR EXECUTION
  // ===========================================================================
  const flyToComplaint = useCallback((index: number) => {
    const list = complaintsRef.current;
    if (!list || list.length === 0 || !mapRef.current) return;

    const validIndex = ((index % list.length) + list.length) % list.length;
    tourIndexRef.current = validIndex;
    setTourIndex(validIndex);
    const target = list[validIndex];
    setActiveTourComplaint(target);
    setAutoResumeTimeLeft(null);
    setIsTourPaused(false);
    isTourPausedRef.current = false;
    isTourActiveRef.current = true;

    // Clear all existing intervals and timeouts cleanly
    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);

    // Flag programmatic flight so Leaflet internal events don't trigger false user pause
    isProgrammaticFlyRef.current = true;
    const currentSpeed = tourSpeedRef.current || 1;
    const flightDuration = 1.8 / currentSpeed;

    mapRef.current.flyTo([target.latitude, target.longitude], 16, {
      duration: flightDuration,
      easeLinearity: 0.25,
    });

    setTimeout(() => {
      isProgrammaticFlyRef.current = false;
    }, flightDuration * 1000 + 400);

    const stopDuration = 4500 / currentSpeed;
    setTourTimeLeft(stopDuration / 1000);

    // Countdown progress updates
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      if (!isTourPausedRef.current) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (stopDuration - elapsed) / 1000);
        setTourTimeLeft(remaining);
      }
    }, 100);

    // Schedule next stop in the cinematic loop
    tourTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (isTourActiveRef.current && !isTourPausedRef.current) {
        flyToComplaint(validIndex + 1);
      }
    }, stopDuration);
  }, []);

  // ===========================================================================
  // AUTOMATIC RESUME ON USER IDLE (4-SECOND SMART COUNTDOWN)
  // ===========================================================================
  const triggerAutoResumeTimer = useCallback(() => {
    if (!isTourActiveRef.current || isProgrammaticFlyRef.current) return;

    setIsTourPaused(true);
    isTourPausedRef.current = true;

    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);

    const idleDelayMs = 4000;
    const startTime = Date.now();
    setAutoResumeTimeLeft(4.0);

    // Tick countdown every 100ms
    autoResumeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (idleDelayMs - elapsed) / 1000);
      setAutoResumeTimeLeft(remaining);
      if (remaining <= 0 && autoResumeIntervalRef.current) {
        clearInterval(autoResumeIntervalRef.current);
      }
    }, 100);

    // Automatically resume when idle delay finishes!
    autoResumeTimerRef.current = setTimeout(() => {
      if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
      setAutoResumeTimeLeft(null);
      if (isTourActiveRef.current) {
        setIsTourPaused(false);
        isTourPausedRef.current = false;
        flyToComplaint(tourIndexRef.current + 1);
      }
    }, idleDelayMs);
  }, [flyToComplaint]);

  const startAutoTour = () => {
    if (complaints.length === 0) return;
    setIsTourActive(true);
    isTourActiveRef.current = true;
    setIsTourPaused(false);
    isTourPausedRef.current = false;
    setAutoResumeTimeLeft(null);
    setViewMode('markers'); // Ensure markers are visible during tour
    flyToComplaint(tourIndexRef.current);
  };

  const pauseAutoTour = () => {
    setIsTourPaused(true);
    isTourPausedRef.current = true;
    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
    setAutoResumeTimeLeft(null);
  };

  const resumeAutoTour = () => {
    setIsTourPaused(false);
    isTourPausedRef.current = false;
    setAutoResumeTimeLeft(null);
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
    flyToComplaint(tourIndexRef.current + 1);
  };

  const stopAutoTour = () => {
    setIsTourActive(false);
    isTourActiveRef.current = false;
    setIsTourPaused(false);
    isTourPausedRef.current = false;
    setActiveTourComplaint(null);
    setAutoResumeTimeLeft(null);
    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
  };

  const nextTourItem = () => {
    flyToComplaint(tourIndexRef.current + 1);
  };

  const prevTourItem = () => {
    flyToComplaint(tourIndexRef.current - 1);
  };

  const handleSelectComplaint = (item: SpatialComplaintItem) => {
    const idx = complaintsRef.current.findIndex(
      (c) => c.id === item.id || c.tracking_id === item.tracking_id
    );
    if (idx !== -1) {
      tourIndexRef.current = idx;
      setTourIndex(idx);
      setActiveTourComplaint(item);
    }
    if (isTourActiveRef.current) {
      triggerAutoResumeTimer();
    }
  };

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    setMapInstance(map);

    // Attach user input listeners to container to distinguish human clicks vs camera animations
    try {
      const container = map.getContainer();
      if (container) {
        const onUserTouch = (e: MouseEvent | TouchEvent) => {
          if (!isTourActiveRef.current || isProgrammaticFlyRef.current) return;
          const targetEl = e.target as HTMLElement | null;
          if (targetEl && (targetEl.closest('.civic-tour-hud') || targetEl.closest('.leaflet-popup-content-wrapper') || targetEl.closest('button') || targetEl.closest('a'))) {
            return;
          }
          triggerAutoResumeTimer();
        };

        container.addEventListener('pointerdown', onUserTouch, { passive: true });
        container.addEventListener('wheel', onUserTouch, { passive: true });
      }
    } catch {
      // Guard
    }

    map.on('dragstart', () => {
      if (isTourActiveRef.current && !isProgrammaticFlyRef.current) {
        triggerAutoResumeTimer();
      }
    });

    map.on('moveend', () => {
      if (viewMode === 'clusters' && !isTourActiveRef.current) {
        loadSpatialData();
      }
    });
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    const coords = DISTRICT_COORDINATES[district] || [10.8505, 78.6500];
    const targetZoom = district === 'All Tamil Nadu' ? 8 : 12;

    if (mapRef.current) {
      mapRef.current.setView(coords, targetZoom, { animate: true });
    }
  };

  return (
    <div className={`relative flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden ${className}`}>
      {/* Top Header Bar */}
      <div className="bg-slate-950/95 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{mapLang === 'ta' ? 'இடஞ்சார்ந்த நுண்ணறிவு & GIS மையம்' : 'Spatial Intelligence & GIS Console'}</span>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
            </h3>
            <p className="text-[11px] text-slate-400">
              {mapLang === 'ta'
                ? 'பூஜ்ஜிய-API PostGIS குறைதீர்ப்பு ரேடார் • தமிழ்நாடு மாநில எல்லை'
                : 'Zero-API Key PostGIS grievance radar • Tamil Nadu State Scope'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills + Auto Tour Trigger */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (isTourActive) stopAutoTour();
              setViewMode('clusters');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'clusters' && !isTourActive
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{mapLang === 'ta' ? 'குழுக்கள்' : 'Clusters'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isTourActive) stopAutoTour();
              setViewMode('markers');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'markers' && !isTourActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{mapLang === 'ta' ? 'இடங்கள்' : 'Pins'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isTourActive) stopAutoTour();
              setViewMode('heatmap');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'heatmap' && !isTourActive
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{mapLang === 'ta' ? 'வெப்ப வரைபடம்' : 'Heatmap'}</span>
          </button>

          {/* Civic Auto-Tour Button */}
          <button
            type="button"
            onClick={() => {
              if (isTourActive) {
                if (isTourPaused) resumeAutoTour();
                else pauseAutoTour();
              } else {
                startAutoTour();
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isTourActive
                ? isTourPaused
                  ? 'bg-amber-600 text-white hover:bg-amber-500 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                : 'bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isTourActive
                ? isTourPaused
                  ? autoResumeTimeLeft !== null
                    ? mapLang === 'ta'
                      ? `தானாக தொடங்கும் (${autoResumeTimeLeft.toFixed(0)}வி) ▶`
                      : `Auto-Resuming (${autoResumeTimeLeft.toFixed(0)}s) ▶`
                    : mapLang === 'ta'
                    ? 'மீண்டும் தொடங்கு ▶'
                    : 'Resume Auto-Tour ▶'
                  : mapLang === 'ta'
                  ? 'உலா தொடர்கிறது ⏸'
                  : 'Touring Live ⏸'
                : mapLang === 'ta'
                ? '✨ தானியங்கி உலா'
                : '✨ Auto-Tour (Animatic)'}
            </span>
          </button>
        </div>

        {/* District Selector, Map Language Toggle & Filter Toggle */}
        <div className="flex items-center gap-2">
          {/* Map-Only Language Switcher (ENG / தமிழ்) */}
          <button
            type="button"
            onClick={() => setMapLang(mapLang === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title={mapLang === 'en' ? 'தமிழுக்கு மாற்றவும் (Switch Map to Tamil)' : 'Switch Map to English'}
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span className={mapLang === 'en' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-normal'}>ENG</span>
            <span className="text-slate-600 font-light">/</span>
            <span className={mapLang === 'ta' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-normal'}>தமிழ்</span>
          </button>

          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All Tamil Nadu">
              {mapLang === 'ta' ? '🌟 தமிழ்நாடு முழுவதும் (Statewide)' : '🌟 All Tamil Nadu (Statewide)'}
            </option>
            {TN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {mapLang === 'ta' ? TN_DISTRICTS_TAMIL[d] || d : d}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFilters
                ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{mapLang === 'ta' ? 'வடிகட்டிகள்' : 'Filters'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Multi-criteria Filter Bar */}
      {showFilters && (
        <div className="bg-slate-950/95 border-b border-slate-800/80 p-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 z-20 animate-in fade-in slide-in-from-top-2">
          {/* Priority */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              {mapLang === 'ta' ? 'முன்னுரிமை' : 'Priority'}
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">{mapLang === 'ta' ? 'அனைத்து முன்னுரிமைகள்' : 'All Priorities'}</option>
              <option value="urgent">{mapLang === 'ta' ? '🔴 அவசரம்' : '🔴 Urgent'}</option>
              <option value="high">{mapLang === 'ta' ? '🟠 அதிகம்' : '🟠 High'}</option>
              <option value="medium">{mapLang === 'ta' ? '🔵 நடுத்தரம்' : '🔵 Medium'}</option>
              <option value="low">{mapLang === 'ta' ? '⚪ குறைவு' : '⚪ Low'}</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              {mapLang === 'ta' ? 'நிலை' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">{mapLang === 'ta' ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
              <option value="created">{mapLang === 'ta' ? 'புகாரளிக்கப்பட்டது' : 'Reported'}</option>
              <option value="assigned">{mapLang === 'ta' ? 'ஒதுக்கப்பட்டது' : 'Assigned'}</option>
              <option value="in_progress">{mapLang === 'ta' ? 'செயலில்' : 'In Progress'}</option>
              <option value="resolved">{mapLang === 'ta' ? 'தீர்க்கப்பட்டது' : 'Resolved'}</option>
              <option value="escalated">{mapLang === 'ta' ? 'மேலதிகாரிக்கு அனுப்பப்பட்டது' : 'Escalated'}</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              {mapLang === 'ta' ? 'துறை' : 'Department'}
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">{mapLang === 'ta' ? 'அனைத்து துறைகள்' : 'All Departments'}</option>
              <option value="WATER">{mapLang === 'ta' ? 'குடிநீர் வழங்கல் (CMWSSB/TWAD)' : 'Water Supply (CMWSSB/TWAD)'}</option>
              <option value="ROADS">{mapLang === 'ta' ? 'நெடுஞ்சாலை & சாலைகள்' : 'Highways & Roads'}</option>
              <option value="SANITATION">{mapLang === 'ta' ? 'துப்புரவு & குப்பை மேலாண்மை' : 'Sanitation & Garbage'}</option>
              <option value="DRAINAGE">{mapLang === 'ta' ? 'மழைநீர் வடிகால்' : 'Storm Water Drainage'}</option>
              <option value="ELECTRICITY">{mapLang === 'ta' ? 'மின்சார வாரியம் (TANGEDCO)' : 'TANGEDCO Electricity'}</option>
              <option value="HEALTH">{mapLang === 'ta' ? 'பொது சுகாதாரம்' : 'Public Health'}</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              {mapLang === 'ta' ? 'கால அளவு' : 'Time Horizon'}
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">{mapLang === 'ta' ? 'அனைத்து காலம்' : 'All Time'}</option>
              <option value="today">{mapLang === 'ta' ? 'இன்று' : 'Today'}</option>
              <option value="7d">{mapLang === 'ta' ? 'கடந்த 7 நாட்கள்' : 'Last 7 Days'}</option>
              <option value="30d">{mapLang === 'ta' ? 'கடந்த 30 நாட்கள்' : 'Last 30 Days'}</option>
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              {mapLang === 'ta' ? 'வார்டு எண்' : 'Ward Number'}
            </label>
            <input
              type="number"
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              placeholder="e.g. 114"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedPriority('');
                setSelectedStatus('');
                setSelectedDept('');
                setDateRange('all');
                setWardFilter('');
              }}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {mapLang === 'ta' ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 w-full min-h-[420px]">
        <LeafletMapWrapper
          center={DISTRICT_COORDINATES[selectedDistrict] || [10.8505, 78.6500]}
          zoom={selectedDistrict === 'All Tamil Nadu' ? 8 : 12}
          restrictToTN={true}
          className="w-full h-full"
          onMapReady={handleMapReady}
        />

        {/* Tamil Nadu Geographic District & Place Labels Layer */}
        <DistrictLabelsLayer
          map={mapInstance || mapRef.current}
          lang={mapLang}
          onSelectPlace={(place) => {
            const matched = TN_DISTRICTS.find((d) => d.toLowerCase() === place.nameEn.toLowerCase());
            if (matched) setSelectedDistrict(matched);
          }}
        />

        {/* Dynamic Layer Rendering */}
        {viewMode === 'clusters' && !isTourActive && (
          <ClusterLayer
            map={mapInstance || mapRef.current}
            clusters={clusters}
            individual={complaints}
            activeComplaintId={activeTourComplaint?.id}
            onSelectComplaint={handleSelectComplaint}
            lang={mapLang}
          />
        )}
        {(viewMode === 'markers' || isTourActive) && (
          <ClusterLayer
            map={mapInstance || mapRef.current}
            clusters={[]}
            individual={complaints}
            activeComplaintId={activeTourComplaint?.id || activeTourComplaint?.tracking_id}
            onSelectComplaint={handleSelectComplaint}
            lang={mapLang}
          />
        )}
        {viewMode === 'heatmap' && !isTourActive && (
          <HeatmapLayer map={mapInstance || mapRef.current} points={heatmapPoints} />
        )}

        {/* Floating In-Map Language Toggle (ENG / தமிழ் directly on the map canvas) */}
        <div className="absolute top-4 right-14 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setMapLang(mapLang === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 hover:border-emerald-500 shadow-xl text-xs font-bold transition-all cursor-pointer"
            title={mapLang === 'en' ? 'வரைபடத்தை தமிழுக்கு மாற்றவும் (Switch to Tamil Map)' : 'Switch Map to English'}
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span className={mapLang === 'en' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-normal'}>ENG</span>
            <span className="text-slate-600 font-light">/</span>
            <span className={mapLang === 'ta' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-normal'}>தமிழ்</span>
          </button>
        </div>

        {/* KPI Summary Floating Drawer (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">{mapLang === 'ta' ? 'வரம்பில்:' : 'In Scope:'}</span>
            <span className="font-bold text-slate-100">
              {stats.total} {mapLang === 'ta' ? 'புகார்கள்' : 'Grievances'}
            </span>
          </div>

          {stats.urgent > 0 && (
            <div className="pointer-events-auto bg-rose-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-800/80 shadow-lg flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{stats.urgent} {mapLang === 'ta' ? 'அவசரம்' : 'Urgent'}</span>
            </div>
          )}

          {stats.slaBreached > 0 && (
            <div className="pointer-events-auto bg-amber-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-800/80 shadow-lg flex items-center gap-2 text-xs text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.slaBreached} {mapLang === 'ta' ? 'காலக்கெடு மீறியவை' : 'SLA Breached'}</span>
            </div>
          )}
        </div>

        {/* Heatmap Spectrum HUD (Bottom-Right when in Heatmap mode) */}
        {viewMode === 'heatmap' && !isTourActive && (
          <div className="absolute bottom-4 right-4 z-20 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-2xl space-y-2 max-w-xs text-xs animate-in fade-in">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>{mapLang === 'ta' ? 'வெப்ப வரைபட அடர்த்தி நிறமாலை' : 'Heatmap Density Spectrum'}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                {heatmapPoints.length} {mapLang === 'ta' ? 'புள்ளிகள்' : 'Points'}
              </span>
            </div>
            {/* Color spectrum gradient bar */}
            <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner"></div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{mapLang === 'ta' ? 'குறைவு (0.2)' : 'Low (0.2)'}</span>
              <span>{mapLang === 'ta' ? 'நடுத்தரம் (0.5)' : 'Moderate (0.5)'}</span>
              <span>{mapLang === 'ta' ? 'அதிகம் (0.8)' : 'High (0.8)'}</span>
              <span className="text-rose-400 font-bold">{mapLang === 'ta' ? 'தீவிரம் (1.0)' : 'Severe (1.0)'}</span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* INTERACTIVE CIVIC AUTO-TOUR HUD / CONTROL BAR */}
        {/* =================================================================== */}
        {isTourActive && activeTourComplaint && (
          <div className="civic-tour-hud absolute bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-md z-30 animate-in fade-in slide-in-from-bottom-3">
            <div className="bg-slate-950/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-2xl p-4 text-slate-200 space-y-3">
              {/* Tour Header & Status */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isTourPaused ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isTourPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <span>{mapLang === 'ta' ? 'குடிமக்கள் உலா' : 'Civic Tour'}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-slate-300">
                      {tourIndex + 1} {mapLang === 'ta' ? '/' : 'of'} {complaints.length}
                    </span>
                  </span>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-semibold">
                  {activeTourComplaint.tracking_id}
                </span>
              </div>

              {/* Complaint Title & Priority */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      activeTourComplaint.priority.toLowerCase() === 'urgent'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : activeTourComplaint.priority.toLowerCase() === 'high'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                    }`}
                  >
                    {mapLang === 'ta'
                      ? (PRIORITY_TAMIL[activeTourComplaint.priority.toLowerCase()] || activeTourComplaint.priority)
                      : activeTourComplaint.priority}
                  </span>
                  <span className="text-[11px] text-slate-400 capitalize font-medium">
                    {mapLang === 'ta' ? 'நிலை:' : 'Status:'}{' '}
                    <strong className="text-slate-200">
                      {mapLang === 'ta'
                        ? (STATUS_TAMIL[activeTourComplaint.status.toLowerCase()] || activeTourComplaint.status.replace('_', ' '))
                        : activeTourComplaint.status.replace('_', ' ')}
                    </strong>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100 line-clamp-2 leading-tight">
                  {mapLang === 'ta'
                    ? translateComplaintTitleToTamil(
                        activeTourComplaint.title,
                        activeTourComplaint.department_code,
                        activeTourComplaint.category_name
                      )
                    : activeTourComplaint.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {mapLang === 'ta' ? 'வார்டு' : 'Ward'} {activeTourComplaint.ward || 'N/A'},{' '}
                    {mapLang === 'ta'
                      ? (TN_DISTRICTS_TAMIL[activeTourComplaint.district || ''] || activeTourComplaint.district || 'தமிழ்நாடு')
                      : (activeTourComplaint.district || 'Tamil Nadu')}
                  </span>
                </p>
              </div>

              {/* Progress Countdown Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      isTourPaused ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{
                      width:
                        isTourPaused && autoResumeTimeLeft !== null
                          ? `${Math.max(0, Math.min(100, (autoResumeTimeLeft / 4.0) * 100))}%`
                          : `${Math.max(0, Math.min(100, (tourTimeLeft / (4.5 / tourSpeed)) * 100))}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>
                    {isTourPaused
                      ? autoResumeTimeLeft !== null
                        ? mapLang === 'ta'
                          ? `⏸ இடைநிறுத்தப்பட்டது • ${autoResumeTimeLeft.toFixed(1)}வி-ல் தொடங்கும்...`
                          : `⏸ Paused • Auto-resuming in ${autoResumeTimeLeft.toFixed(1)}s...`
                        : mapLang === 'ta'
                        ? '⏸ இடைநிறுத்தப்பட்டது (ஆராய வரைபடத்தில் சொடுக்கவும்)'
                        : '⏸ Paused (Click map to explore)'
                      : mapLang === 'ta'
                      ? `அடுத்தது ${tourTimeLeft.toFixed(1)}வி-ல்`
                      : `Next in ${tourTimeLeft.toFixed(1)}s`}
                  </span>
                  <span>
                    {Math.round(((tourIndex + 1) / complaints.length) * 100)}
                    {mapLang === 'ta' ? '% நிறைவு' : '% Complete'}
                  </span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevTourItem}
                    title={mapLang === 'ta' ? 'முந்தைய புகார்' : 'Previous Complaint'}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isTourPaused) resumeAutoTour();
                      else pauseAutoTour();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isTourPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {isTourPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isTourPaused ? (mapLang === 'ta' ? 'தொடங்கு' : 'Resume') : (mapLang === 'ta' ? 'நிறுத்து' : 'Pause')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextTourItem}
                    title={mapLang === 'ta' ? 'அடுத்த புகார்' : 'Next Complaint'}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTourSpeed(tourSpeed === 1 ? 1.5 : 1)}
                    className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {tourSpeed}x
                  </button>

                  <a
                    href={`/track/${activeTourComplaint.tracking_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>{mapLang === 'ta' ? 'கண்காணி' : 'Track'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={stopAutoTour}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {mapLang === 'ta' ? 'வெளியேறு' : 'Exit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
