'use client';

// =============================================================================
// CivicConnect TN — Predictive Risk Radar & Future Problem Area Map
// =============================================================================
// Interactive Leaflet map visualizing potential problem areas, vulnerability
// buffers, and forward-looking hazard indicators.

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type * as L from 'leaflet';
import { FutureProblemArea, PredictiveRisk, RiskCategory } from '@/lib/predictive/types';
import {
  MapPin,
  Layers,
  AlertTriangle,
  Flame,
  Droplets,
  Zap,
  Trash2,
  Construction,
  Shield,
  CheckCircle2,
  Radio,
} from 'lucide-react';

const LeafletMapWrapper = dynamic(
  () => import('@/components/maps/leaflet-map-wrapper').then((mod) => mod.LeafletMapWrapper),
  { ssr: false, loading: () => <div className="w-full h-[520px] rounded-2xl bg-slate-900 animate-pulse" /> }
);

interface RiskRadarMapProps {
  risks: PredictiveRisk[];
  problemAreas: FutureProblemArea[];
  selectedRiskId?: string | null;
  onSelectRisk?: (risk: PredictiveRisk | null) => void;
  canDispatch?: boolean;
  onDispatchAction?: (actionId: string) => void;
  heightClass?: string;
}

const CATEGORY_COLORS: Record<RiskCategory | string, { stroke: string; fill: string; label: string }> = {
  DRAINAGE_FLOOD: { stroke: '#06b6d4', fill: '#0891b2', label: 'Drainage & Inundation' },
  ROAD_DETERIORATION: { stroke: '#f97316', fill: '#ea580c', label: 'Road Deterioration' },
  SANITATION_HEALTH: { stroke: '#f59e0b', fill: '#d97706', label: 'Sanitation Hazard' },
  WATER_SUPPLY_FAILURE: { stroke: '#10b981', fill: '#059669', label: 'Water Supply Risk' },
  ELECTRICAL_GRID_STRESS: { stroke: '#a855f7', fill: '#9333ea', label: 'Electrical Grid Stress' },
  PUBLIC_SAFETY: { stroke: '#f43f5e', fill: '#e11d48', label: 'Public Infrastructure' },
};

export function RiskRadarMap({
  risks,
  problemAreas,
  selectedRiskId,
  onSelectRisk,
  canDispatch = false,
  onDispatchAction,
  heightClass = 'h-[520px]',
}: RiskRadarMapProps) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showVulnerabilityBuffers, setShowVulnerabilityBuffers] = useState(true);
  const [showDirectivesInPopup, setShowDirectivesInPopup] = useState(true);

  // Handle map ready event
  const handleMapReady = (map: L.Map, LModule: typeof import('leaflet')) => {
    mapInstanceRef.current = map;
    leafletRef.current = LModule;

    if (!layerGroupRef.current) {
      layerGroupRef.current = LModule.layerGroup().addTo(map);
    }

    renderLayers();
  };

  // Re-render layers on data/filter changes
  useEffect(() => {
    if (mapInstanceRef.current && leafletRef.current) {
      renderLayers();
    }
  }, [risks, problemAreas, activeCategoryFilter, showVulnerabilityBuffers, selectedRiskId]);

  const renderLayers = () => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    layerGroupRef.current.clearLayers();

    const filteredRisks = risks.filter((r) => {
      if (activeCategoryFilter === 'all') return true;
      return r.risk_category === activeCategoryFilter;
    });

    const bounds = L.latLngBounds([]);

    // 1. Render Vulnerability Buffers (Problem Areas)
    if (showVulnerabilityBuffers) {
      for (const area of problemAreas) {
        if (activeCategoryFilter !== 'all' && area.dominant_risk_category !== activeCategoryFilter) {
          continue;
        }

        const catMeta = CATEGORY_COLORS[area.dominant_risk_category] || CATEGORY_COLORS.PUBLIC_SAFETY;
        const isCritical = area.compounded_risk_score >= 75;

        const circle = L.circle([area.latitude, area.longitude], {
          radius: area.radius_meters || 350,
          color: isCritical ? '#f43f5e' : catMeta.stroke,
          weight: 2,
          opacity: 0.85,
          fillColor: isCritical ? '#f43f5e' : catMeta.fill,
          fillOpacity: isCritical ? 0.25 : 0.15,
          dashArray: isCritical ? '6, 6' : undefined,
        });

        circle.bindTooltip(
          `<div class="text-xs font-semibold">
            <span class="${isCritical ? 'text-red-400' : 'text-cyan-400'} font-bold">POTENTIAL PROBLEM AREA: ${area.compounded_risk_score}/100</span><br/>
            ${area.locality} (${area.ward ? `Ward ${area.ward}` : area.district})
          </div>`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        layerGroupRef.current.addLayer(circle);
        bounds.extend([area.latitude, area.longitude]);
      }
    }

    // 2. Render Risk Markers
    for (const risk of filteredRisks) {
      const catMeta = CATEGORY_COLORS[risk.risk_category] || CATEGORY_COLORS.PUBLIC_SAFETY;
      const isSelected = selectedRiskId === risk.id;
      const isCritical = risk.risk_level === 'CRITICAL';

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transform ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        } transition-transform">
          ${
            isCritical
              ? `<div class="absolute -inset-2 rounded-full bg-red-500/30 animate-ping"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-xl backdrop-blur-md"
               style="background-color: ${catMeta.fill}dd; border-color: ${
        isSelected ? '#ffffff' : catMeta.stroke
      }; color: #ffffff;">
            ${risk.risk_score}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-predictive-risk-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([risk.coordinates.lat, risk.coordinates.lng], {
        icon: customIcon,
      });

      // Interactive Popup Content
      const actionsListHtml = risk.preventative_actions
        .map(
          (a) => `
          <div class="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-200">${a.title}</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${
                a.status === 'DISPATCHED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }">${a.status}</span>
            </div>
            <p class="text-slate-400 text-[10px] leading-tight">${a.instructions}</p>
            ${
              canDispatch && a.status !== 'DISPATCHED'
                ? `<button onclick="window.dispatchPredictiveAction && window.dispatchPredictiveAction('${a.id}')" 
                     class="w-full mt-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all cursor-pointer">
                     ⚡ Dispatch Work Order
                   </button>`
                : ''
            }
          </div>`
        )
        .join('');

      const popupHtml = `
        <div class="p-3 max-w-[280px] space-y-2 text-slate-200">
          <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              isCritical
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }">
              ${risk.risk_level} RISK (${risk.risk_score}/100)
            </span>
            <span class="text-[10px] font-semibold text-slate-400">
              ${risk.time_horizon_label}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-xs text-white leading-tight">${risk.title}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5">${risk.locality} (${
        risk.ward ? `Ward ${risk.ward}` : risk.district
      })</p>
          </div>

          <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Model Confidence:</span>
              <span class="text-emerald-400 font-bold">${risk.confidence_pct}% (${risk.confidence_tier})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Recurrence Index:</span>
              <span class="text-amber-400 font-semibold">${risk.risk_drivers.recurrence_score}/100</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Velocity Surge:</span>
              <span class="text-cyan-400 font-semibold">${risk.risk_drivers.velocity_score}/100</span>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preventative Directives:</span>
            <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              ${actionsListHtml}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'leaflet-dark-popup',
        maxWidth: 320,
      });

      marker.on('click', () => {
        if (onSelectRisk) onSelectRisk(risk);
      });

      layerGroupRef.current.addLayer(marker);
      bounds.extend([risk.coordinates.lat, risk.coordinates.lng]);
    }

    // Bind dispatch action to window for popup button trigger
    if (typeof window !== 'undefined') {
      (window as any).dispatchPredictiveAction = (actionId: string) => {
        if (onDispatchAction) onDispatchAction(actionId);
      };
    }

    // Auto fit bounds if points exist
    if (bounds.isValid() && filteredRisks.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl flex flex-col">
      {/* Map Control Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Risk Radar & Potential Problem Areas Map
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive Leaflet spatial vulnerability model
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Hazards
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('DRAINAGE_FLOOD')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryFilter === 'DRAINAGE_FLOOD'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-cyan-300 hover:bg-slate-700'
            }`}
          >
            <Droplets className="w-3 h-3" />
            Drainage
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('ROAD_DETERIORATION')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryFilter === 'ROAD_DETERIORATION'
                ? 'bg-orange-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-orange-300 hover:bg-slate-700'
            }`}
          >
            <Construction className="w-3 h-3" />
            Roads
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('SANITATION_HEALTH')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryFilter === 'SANITATION_HEALTH'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            Sanitation
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('ELECTRICAL_GRID_STRESS')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryFilter === 'ELECTRICAL_GRID_STRESS'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-slate-800/80 text-purple-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            Grid
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className={`relative ${heightClass} w-full bg-slate-950`}>
        <LeafletMapWrapper
          center={[13.0475, 80.22]}
          zoom={12}
          onMapReady={handleMapReady}
        />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[500] p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-md shadow-xl text-[11px] space-y-1.5 pointer-events-auto">
          <span className="font-bold text-slate-300 uppercase tracking-wider block text-[10px]">
            Risk Severity Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block" />
            <span className="text-red-300 font-semibold">Critical Risk (Score &ge; 75)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-300 font-semibold">High Risk (Score 50 – 74)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
            <span className="text-cyan-300 font-semibold">Moderate / Early (Score &lt; 50)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
