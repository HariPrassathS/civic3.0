'use client';

// =============================================================================
// CivicConnect TN — 4-Layer Interactive DBSCAN & Density Heatmap Explorer
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type * as L from 'leaflet';
import { DBSCANCluster, DataPoint, GeographicHotspot, HeatmapPoint } from '@/lib/data-mining/types';
import { Layers, Flame, MapPin, Sparkles, Sliders, Radio, Eye } from 'lucide-react';

const LeafletMapWrapper = dynamic(
  () => import('@/components/maps/leaflet-map-wrapper').then((mod) => mod.LeafletMapWrapper),
  { ssr: false, loading: () => <div className="w-full h-96 rounded-2xl bg-slate-900 animate-pulse" /> }
);

interface ClusterMapProps {
  clusters: DBSCANCluster[];
  noisePoints: DataPoint[];
  hotspots?: GeographicHotspot[];
  heatmapPoints?: HeatmapPoint[];
  selectedClusterId?: number | null;
  onSelectCluster?: (cluster: DBSCANCluster | null) => void;
  heightClass?: string;
}

const CLUSTER_COLORS = [
  { stroke: '#10b981', fill: '#059669', name: 'Emerald' },
  { stroke: '#38bdf8', fill: '#0284c7', name: 'Sky' },
  { stroke: '#f59e0b', fill: '#d97706', name: 'Amber' },
  { stroke: '#ec4899', fill: '#db2777', name: 'Pink' },
  { stroke: '#a855f7', fill: '#9333ea', name: 'Purple' },
  { stroke: '#06b6d4', fill: '#0891b2', name: 'Cyan' },
  { stroke: '#84cc16', fill: '#65a30d', name: 'Lime' },
  { stroke: '#f97316', fill: '#ea580c', name: 'Orange' },
];

export function DBSCANClusterMap({
  clusters,
  noisePoints,
  hotspots = [],
  heatmapPoints = [],
  selectedClusterId,
  onSelectCluster,
  heightClass = 'h-[520px]',
}: ClusterMapProps) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const vectorLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);

  const [activeCluster, setActiveCluster] = useState<DBSCANCluster | null>(null);

  // Layer Visibility Toggles
  const [showClusters, setShowClusters] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showNoise, setShowNoise] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    // Reset Vector Layers
    if (vectorLayerRef.current) {
      vectorLayerRef.current.clearLayers();
    } else {
      vectorLayerRef.current = L.layerGroup().addTo(map);
    }
    const group = vectorLayerRef.current;

    // Remove old heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // 1. RENDER DENSITY HEATMAP LAYER
    if (showHeatmap && heatmapPoints.length > 0) {
      import('leaflet.heat').then(() => {
        if (!mapInstanceRef.current) return;
        const heatData = heatmapPoints.map((p) => [p.lat, p.lng, p.intensity]);
        if ((L as any).heatLayer) {
          const heat = (L as any).heatLayer(heatData, {
            radius: 28,
            blur: 16,
            maxZoom: 17,
            gradient: {
              0.2: '#38bdf8',
              0.4: '#10b981',
              0.6: '#eab308',
              0.8: '#f97316',
              1.0: '#ef4444',
            },
          });
          heat.addTo(mapInstanceRef.current);
          heatLayerRef.current = heat;
        }
      });
    }

    // 2. RENDER DBSCAN CLUSTERS
    if (showClusters) {
      clusters.forEach((cluster) => {
        const palette = CLUSTER_COLORS[cluster.cluster_id % CLUSTER_COLORS.length];
        const isSelected = selectedClusterId === cluster.cluster_id || activeCluster?.cluster_id === cluster.cluster_id;

        // Bounding circle
        const radiusMeters = Math.max(80, cluster.radius_km * 1000);
        const circle = L.circle([cluster.centroid_latitude, cluster.centroid_longitude], {
          radius: radiusMeters,
          color: palette.stroke,
          weight: isSelected ? 3.5 : 2,
          fillColor: palette.fill,
          fillOpacity: isSelected ? 0.35 : 0.16,
          dashArray: isSelected ? undefined : '4, 4',
        });

        circle.bindTooltip(
          `<div class="text-xs font-bold text-slate-900">${cluster.name}</div>
           <div class="text-[11px] text-slate-700">${cluster.total_points} complaints • ${cluster.density_pts_per_sqkm} pts/km²</div>`,
          { permanent: false, direction: 'top' }
        );

        circle.on('click', () => {
          setActiveCluster(cluster);
          onSelectCluster?.(cluster);
        });

        circle.addTo(group);

        // Centroid Number Badge
        const centroidIcon = L.divIcon({
          className: 'custom-cluster-centroid',
          html: `
            <div style="
              background: ${palette.stroke};
              color: #020617;
              font-weight: 800;
              font-size: 11px;
              width: 32px;
              height: 32px;
              border-radius: 9999px;
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              cursor: pointer;
            ">
              ${cluster.total_points}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([cluster.centroid_latitude, cluster.centroid_longitude], {
          icon: centroidIcon,
        });

        marker.on('click', () => {
          setActiveCluster(cluster);
          onSelectCluster?.(cluster);
        });

        marker.addTo(group);

        // Individual Complaint Pins
        if (showMarkers) {
          cluster.points.forEach((pt) => {
            const ptColor = pt.point_type === 'core' ? palette.stroke : '#94a3b8';
            const ptCircle = L.circleMarker([pt.latitude, pt.longitude], {
              radius: pt.point_type === 'core' ? 5.5 : 4,
              fillColor: ptColor,
              color: '#ffffff',
              weight: 1.5,
              fillOpacity: 0.9,
            });

            ptCircle.bindPopup(`
              <div class="p-1 space-y-1 text-slate-900">
                <div class="font-bold text-xs">${pt.title}</div>
                <div class="text-[11px] text-slate-600 font-mono">${pt.tracking_id}</div>
                <div class="text-[11px] text-slate-700">${pt.address}</div>
                <div class="text-[10px] text-emerald-700 font-semibold uppercase">${pt.point_type} Point • Cluster #${cluster.cluster_id + 1}</div>
              </div>
            `);

            ptCircle.addTo(group);
          });
        }
      });
    }

    // 3. RENDER NOISE POINTS
    if (showNoise && noisePoints.length > 0) {
      noisePoints.forEach((pt) => {
        const noiseMarker = L.circleMarker([pt.latitude, pt.longitude], {
          radius: 4,
          fillColor: '#64748b',
          color: '#334155',
          weight: 1,
          fillOpacity: 0.7,
        });

        noiseMarker.bindPopup(`
          <div class="p-1 space-y-1 text-slate-900">
            <div class="font-bold text-xs text-slate-800">${pt.title}</div>
            <div class="text-[11px] text-slate-600 font-mono">${pt.tracking_id}</div>
            <div class="text-[11px] text-slate-700">${pt.address}</div>
            <div class="text-[10px] text-slate-500 font-semibold uppercase">DBSCAN Noise Outlier (Isolated)</div>
          </div>
        `);

        noiseMarker.addTo(group);
      });
    }

    // Auto fit bounds
    if (clusters.length > 0) {
      const bounds = L.latLngBounds(clusters.map((c) => [c.centroid_latitude, c.centroid_longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2));
      }
    }
  }, [clusters, noisePoints, heatmapPoints, selectedClusterId, showClusters, showHeatmap, showMarkers, showNoise, showHotspots]);

  return (
    <div className="space-y-3">
      {/* Map Layer Toolbar */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Spatial Intelligence Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowClusters(!showClusters)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showClusters
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>DBSCAN Clusters ({clusters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/60 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Density Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showMarkers
                ? 'bg-sky-950/80 text-sky-300 border-sky-800/60 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Complaint Markers</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNoise(!showNoise)}
            className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showNoise
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>Noise ({noisePoints.length})</span>
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className={`relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl ${heightClass}`}>
        <LeafletMapWrapper
          className="w-full h-full"
          onMapReady={(map, L) => {
            mapInstanceRef.current = map;
            leafletRef.current = L;
          }}
        />

        {/* Floating Cluster Detail Panel */}
        {activeCluster && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 p-4 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs space-y-2.5 z-[1000] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  CLUSTER #{activeCluster.cluster_id + 1}
                </span>
                <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                  {activeCluster.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveCluster(null)}
                className="text-slate-400 hover:text-white text-base font-bold leading-none p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500">Total Grievances</div>
                <div className="text-base font-extrabold text-white mt-0.5">{activeCluster.total_points}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500">Cluster Density</div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                  {activeCluster.density_pts_per_sqkm} <span className="text-[10px] text-slate-500 font-normal">/km²</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Dominant Issue:</span>
                <span className="font-semibold text-slate-200">{activeCluster.dominant_category}</span>
              </div>
              <div className="flex justify-between">
                <span>Bounding Radius:</span>
                <span className="font-semibold text-slate-200">{activeCluster.radius_km.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Core / Border Points:</span>
                <span className="font-semibold text-slate-200">{activeCluster.core_points_count} / {activeCluster.border_points_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cluster Quick Badges Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-500">Active Epicenters:</span>
        {clusters.slice(0, 6).map((c) => {
          const color = CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length];
          return (
            <span
              key={c.cluster_id}
              onClick={() => {
                setActiveCluster(c);
                onSelectCluster?.(c);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color.stroke }} />
              <span className="text-slate-300 font-medium">#{c.cluster_id + 1} {c.dominant_category}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
