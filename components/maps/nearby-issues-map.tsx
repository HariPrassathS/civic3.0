'use client';

// =============================================================================
// CivicConnect TN — Interactive Nearby Public Issues Leaflet Map
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import type * as L from 'leaflet';
import { LeafletMapWrapper } from './leaflet-map-wrapper';
import { Navigation, Crosshair, MapPin, ExternalLink, ThumbsUp } from 'lucide-react';
import { SpatialComplaintItem } from '@/lib/spatial/spatial-engine';

interface NearbyIssuesMapProps {
  userLat: number;
  userLng: number;
  radiusKm: number;
  issues: SpatialComplaintItem[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issue: SpatialComplaintItem) => void;
  onRecenter?: () => void;
}

export function NearbyIssuesMap({
  userLat,
  userLng,
  radiusKm,
  issues,
  selectedIssueId,
  onSelectIssue,
  onRecenter,
}: NearbyIssuesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeIssue, setActiveIssue] = useState<SpatialComplaintItem | null>(null);

  const handleMapReady = (map: L.Map, L: typeof import('leaflet')) => {
    mapRef.current = map;
    leafletRef.current = L;
    updateUserAndRadius(map, L);
    renderMarkers(map, L);
  };

  const updateUserAndRadius = (map: L.Map, L: typeof import('leaflet')) => {
    // 1. User Location Pulse Pin
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    const userIcon = L.divIcon({
      className: 'user-pulse-icon',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; border-radius: 50%; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 10;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const userMarker = L.marker([userLat, userLng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    userMarkerRef.current = userMarker;

    // 2. Radius Circle
    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);

    const radiusCircle = L.circle([userLat, userLng], {
      radius: radiusKm * 1000,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 6',
    }).addTo(map);

    radiusCircleRef.current = radiusCircle;
  };

  const renderMarkers = (map: L.Map, L: typeof import('leaflet')) => {
    if (markersGroupRef.current) {
      map.removeLayer(markersGroupRef.current);
    }

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    for (const issue of issues) {
      const p = (issue.priority || 'medium').toLowerCase();
      const isSelected = selectedIssueId === issue.id;

      let color = '#3b82f6';
      if (issue.status === 'resolved' || issue.status === 'closed') color = '#10b981';
      else if (p === 'urgent') color = '#ef4444';
      else if (p === 'high') color = '#f59e0b';

      const icon = L.divIcon({
        className: 'nearby-issue-pin',
        html: `
          <div style="
            position: relative;
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            transition: transform 0.2s;
            cursor: pointer;
          ">
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: ${color};
              border: 2px solid ${isSelected ? '#ffffff' : '#0f172a'};
              box-shadow: 0 4px 12px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
            ">
              📍
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon });

      // Popup content
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 230px; color: #f8fafc; background: #0f172a; padding: 12px; border-radius: 12px; border: 1px solid #334155;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: 700; color: #34d399; background: #064e3b; padding: 2px 6px; border-radius: 4px;">
              ${issue.tracking_id}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
              ${issue.status}
            </span>
          </div>
          <div style="font-weight: 600; font-size: 13px; line-height: 1.3; margin-bottom: 4px; color: #f8fafc;">
            ${issue.title}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            📏 ${(issue.distance_km || 0).toFixed(1)} km away • Ward ${issue.ward || 'N/A'}
          </div>
          <div style="display: flex; gap: 6px; border-top: 1px solid #1e293b; padding-top: 8px;">
            <a href="/track/${issue.tracking_id}" style="
              flex: 1;
              text-align: center;
              background: #059669;
              color: white;
              text-decoration: none;
              font-size: 11px;
              font-weight: 600;
              padding: 6px 10px;
              border-radius: 8px;
            ">
              Track Details →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'civic-dark-popup', closeButton: false });

      marker.on('click', () => {
        setActiveIssue(issue);
        if (onSelectIssue) onSelectIssue(issue);
      });

      markersGroup.addLayer(marker);
    }
  };

  // Re-run updates on prop changes
  useEffect(() => {
    if (mapRef.current && leafletRef.current) {
      updateUserAndRadius(mapRef.current, leafletRef.current);
      renderMarkers(mapRef.current, leafletRef.current);
    }
  }, [userLat, userLng, radiusKm, issues, selectedIssueId]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          if (markersGroupRef.current) mapRef.current.removeLayer(markersGroupRef.current);
          if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
          if (radiusCircleRef.current) mapRef.current.removeLayer(radiusCircleRef.current);
        } catch {
          // Guard against unmounted map
        }
      }
    };
  }, []);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <LeafletMapWrapper
        center={[userLat, userLng]}
        zoom={radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 11}
        className="w-full h-full"
        onMapReady={handleMapReady}
      />

      {/* Top Overlay Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>
            {issues.length} Issues within {radiusKm} km radius
          </span>
        </div>
      </div>

      {/* Recenter Button */}
      <button
        type="button"
        onClick={() => {
          if (mapRef.current) {
            mapRef.current.setView([userLat, userLng], 13, { animate: true });
          }
          if (onRecenter) onRecenter();
        }}
        className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-xs font-medium text-emerald-400 flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
      >
        <Crosshair className="w-3.5 h-3.5" />
        <span>Center on Me</span>
      </button>
    </div>
  );
}
