'use client';

// =============================================================================
// CivicConnect TN — Dynamic Density Heatmap GIS Layer
// =============================================================================

import React, { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { HeatmapPoint } from '@/lib/spatial/spatial-engine';

interface HeatmapLayerProps {
  map: L.Map | null;
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  gradient?: { [key: number]: string };
}

export function HeatmapLayer({
  map,
  points,
  radius = 32,
  blur = 18,
  maxZoom = 17,
  gradient = {
    0.15: '#06b6d4', // Neon Cyan (Low density)
    0.35: '#10b981', // Emerald (Moderate density)
    0.55: '#facc15', // Vibrant Yellow
    0.75: '#f97316', // Vibrant Orange
    0.95: '#ef4444', // Crimson Red (Critical Grievance Hotspot)
  },
}: HeatmapLayerProps) {
  const heatLayerRef = useRef<any>(null);
  const fallbackMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    let isMounted = true;

    async function updateHeatLayer() {
      if (!map || !isMounted) return;
      try {
        const leafletMod = await import('leaflet');
        const L = (leafletMod as any).default || leafletMod;
        if (typeof window !== 'undefined') {
          (window as any).L = L;
        }

        // Clean up previous layers
        if (heatLayerRef.current) {
          try {
            map.removeLayer(heatLayerRef.current);
          } catch {
            // Guard
          }
          heatLayerRef.current = null;
        }

        if (fallbackMarkersGroupRef.current) {
          try {
            map.removeLayer(fallbackMarkersGroupRef.current);
          } catch {
            // Guard
          }
          fallbackMarkersGroupRef.current = null;
        }

        if (!points || points.length === 0) return;

        // Try leaflet.heat plugin
        let heatApplied = false;
        try {
          await import('leaflet.heat');
          const heatFn = (L as any).heatLayer || (window as any).L?.heatLayer;

          if (typeof heatFn === 'function') {
            const heatData = points.map((p) => [
              p.latitude,
              p.longitude,
              Math.max(0.3, p.weight || 0.5),
            ]);

            const heat = heatFn(heatData, {
              radius,
              blur,
              maxZoom,
              max: 1.0,
              gradient,
              minOpacity: 0.45,
            }).addTo(map);

            heatLayerRef.current = heat;
            heatApplied = true;
          }
        } catch (heatErr) {
          console.warn('leaflet.heat plugin load note, using SVG gradient layer:', heatErr);
        }

        // Add glowing hotspot beacon layer for urgent & high priority density
        const group = L.layerGroup().addTo(map);
        fallbackMarkersGroupRef.current = group;

        for (const p of points) {
          const weight = p.weight || 0.5;
          const isUrgent = (p.priority || '').toLowerCase() === 'urgent' || weight >= 0.8;
          const isHigh = (p.priority || '').toLowerCase() === 'high' || weight >= 0.6;

          let color = '#06b6d4';
          let glowColor = 'rgba(6, 182, 212, 0.4)';
          let size = 24;

          if (isUrgent) {
            color = '#ef4444';
            glowColor = 'rgba(239, 68, 68, 0.55)';
            size = 38;
          } else if (isHigh) {
            color = '#f97316';
            glowColor = 'rgba(249, 115, 22, 0.45)';
            size = 30;
          } else if (weight >= 0.4) {
            color = '#10b981';
            glowColor = 'rgba(16, 185, 129, 0.35)';
            size = 26;
          }

          const heatIcon = L.divIcon({
            className: 'custom-heatmap-beacon',
            html: `
              <div style="
                position: relative;
                width: ${size}px;
                height: ${size}px;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
              ">
                <div style="
                  position: absolute;
                  width: ${size}px;
                  height: ${size}px;
                  border-radius: 50%;
                  background: radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%);
                  ${isUrgent ? 'animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
                "></div>
                <div style="
                  width: ${Math.round(size * 0.45)}px;
                  height: ${Math.round(size * 0.45)}px;
                  border-radius: 50%;
                  background: ${color};
                  box-shadow: 0 0 12px ${color};
                  opacity: 0.85;
                "></div>
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([p.latitude, p.longitude], {
            icon: heatIcon,
            interactive: false,
          });

          group.addLayer(marker);
        }
      } catch (err) {
        console.warn('Heatmap layer render error:', err);
      }
    }

    updateHeatLayer();

    return () => {
      isMounted = false;
      if (map) {
        if (heatLayerRef.current) {
          try {
            map.removeLayer(heatLayerRef.current);
          } catch {
            // Guard
          }
          heatLayerRef.current = null;
        }
        if (fallbackMarkersGroupRef.current) {
          try {
            map.removeLayer(fallbackMarkersGroupRef.current);
          } catch {
            // Guard
          }
          fallbackMarkersGroupRef.current = null;
        }
      }
    };
  }, [map, points, radius, blur]);

  return null;
}
