'use client';

// =============================================================================
// CivicConnect TN — Interactive Nearby Spatial Map Component
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation, ExternalLink } from 'lucide-react';

interface MapIssue {
  id: string;
  tracking_id: string;
  title: string;
  status: string;
  priority?: string;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  distance_km?: number;
}

interface NearbyMapProps {
  userLat?: number;
  userLng?: number;
  issues: MapIssue[];
  onSelectIssue?: (issue: MapIssue) => void;
}

export function NearbyMap({
  userLat = 13.0418,
  userLng = 80.2341,
  issues,
  onSelectIssue,
}: NearbyMapProps) {
  const [selectedPin, setSelectedPin] = useState<MapIssue | null>(null);

  // SVG coordinate transformation centered around user location
  const centerLat = userLat;
  const centerLng = userLng;
  const scale = 800; // zoom factor

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col justify-between p-4">
      {/* Map Background Grid Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Top Map Overlay Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Radar Map ({issues.length} nearby pins)</span>
        </div>
        <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/50">
          📍 Center: {userLat.toFixed(4)}, {userLng.toFixed(4)}
        </div>
      </div>

      {/* Spatial Map Canvas Simulation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        {/* User Current Location Pulse Ring */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 animate-ping absolute" />
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/40 z-20">
            <div className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <span className="absolute -bottom-6 text-[10px] font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-800 shadow whitespace-nowrap z-20">
            Your Location
          </span>
        </div>

        {/* Issue Pins positioned relative to center */}
        {issues.map((issue, idx) => {
          const lat = issue.latitude || (centerLat + (idx % 2 === 0 ? 0.008 * (idx + 1) : -0.007 * (idx + 1)));
          const lng = issue.longitude || (centerLng + (idx % 3 === 0 ? 0.009 * (idx + 1) : -0.006 * (idx + 1)));

          const offsetX = (lng - centerLng) * scale;
          const offsetY = (centerLat - lat) * scale;

          const isSelected = selectedPin?.id === issue.id;

          return (
            <button
              key={issue.id || idx}
              type="button"
              onClick={() => {
                setSelectedPin(issue);
                if (onSelectIssue) onSelectIssue(issue);
              }}
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px)`,
              }}
              className={`absolute p-1 rounded-full transition-all group z-30 cursor-pointer ${
                isSelected
                  ? 'scale-125 z-40'
                  : 'hover:scale-110'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg ${
                  issue.priority === 'urgent'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                    : issue.status === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                }`}
              >
                {idx + 1}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Pin Details Card Popup */}
      {selectedPin && (
        <div className="relative z-20 mt-auto bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {selectedPin.tracking_id}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {selectedPin.address || 'Chennai'}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-100 truncate mt-1">
              {selectedPin.title}
            </h4>
          </div>

          <Link
            href={`/track/${encodeURIComponent(selectedPin.tracking_id)}`}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
