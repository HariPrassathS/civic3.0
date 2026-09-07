'use client';

// =============================================================================
// CivicConnect TN — Universal SSR-Safe Leaflet Map Container (Zero API Key)
// =============================================================================
// Uses pure OpenStreetMap tiles with dark CSS filter options.
// Zero external API keys required. 100% open-source and free.

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type * as L from 'leaflet';
import { Layers, Maximize2, Minimize2, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

export interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapReady?: (map: L.Map, L: typeof import('leaflet')) => void;
  children?: React.ReactNode;
  showControls?: boolean;
  minZoom?: number;
  maxZoom?: number;
  restrictToTN?: boolean;
  maxBounds?: L.LatLngBoundsExpression;
  maxBoundsViscosity?: number;
}

export function LeafletMapWrapper({
  center = [10.8505, 78.6500], // Default: Central Tamil Nadu (Trichy)
  zoom = 8,
  className = 'w-full h-96 rounded-2xl overflow-hidden',
  onMapReady,
  showControls = true,
  minZoom = 7,
  maxZoom = 19,
  restrictToTN = true,
  maxBounds,
  maxBoundsViscosity = 1.0,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'standard'>('dark');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    let isMounted = true;
    let localMap: L.Map | null = null;

    async function initLeaflet() {
      if (!containerRef.current) return;
      if (mapRef.current) return;

      try {
        const leafletMod = await import('leaflet');
        const L = (leafletMod as any).default || leafletMod;
        if (typeof window !== 'undefined') {
          (window as any).L = L;
        }

        if (!isMounted || !containerRef.current) return;

        // Clean container in case of Fast Refresh / Strict Mode
        if ((containerRef.current as any)._leaflet_id) {
          (containerRef.current as any)._leaflet_id = undefined;
        }

        try {
          if (L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
          }
        } catch {
          // Ignore icon override error
        }

        // Tamil Nadu strict geographic boundary
        const tnBounds: L.LatLngBoundsExpression = [
          [7.8, 75.8],
          [13.8, 80.8],
        ];

        const map = L.map(containerRef.current, {
          center,
          zoom,
          minZoom: restrictToTN ? 7 : minZoom,
          maxZoom: maxZoom || 19,
          maxBounds: restrictToTN ? tnBounds : maxBounds,
          maxBoundsViscosity: restrictToTN ? 1.0 : (maxBoundsViscosity || 0),
          zoomControl: false,
          attributionControl: false,
        });

        localMap = map;
        mapRef.current = map;

        const osmTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tileLayer = L.tileLayer(osmTileUrl, {
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
          className: 'civic-osm-dark-tiles',
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        setTimeout(() => {
          if (isMounted && mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 150);

        if (isMounted) {
          setIsLoaded(true);
          if (onMapReady) {
            onMapReady(map, L);
          }
        }
      } catch (err) {
        console.error('Leaflet initialization note:', err);
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (localMap) {
        try {
          localMap.stop();
          localMap.remove();
        } catch {
          // Guard
        }
      }
      mapRef.current = null;
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom, isLoaded]);

  const toggleTheme = async () => {
    if (!mapRef.current) return;
    const L = await import('leaflet');

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const nextTheme = mapTheme === 'dark' ? 'standard' : 'dark';
    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newLayer = L.tileLayer(osmUrl, {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      className: nextTheme === 'dark' ? 'civic-osm-dark-tiles' : '',
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
    setMapTheme(nextTheme);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 150);
  };

  return (
    <div
      className={`relative ${className} ${
        isFullscreen ? '!fixed !inset-0 !z-50 !h-screen !w-screen !rounded-none' : ''
      }`}
    >
      {/* Dark mode CSS tile filter injected inline for zero-key dark OpenStreetMap styling */}
      <style jsx global>{`
        .civic-osm-dark-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.85);
        }
      `}</style>

      {/* Map DOM Mount */}
      <div ref={containerRef} className="w-full h-full bg-slate-950 z-0" />

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs font-medium tracking-wide">Initializing OpenStreetMap GIS Engine...</span>
        </div>
      )}

      {/* Floating Control Toolbar */}
      {showControls && isLoaded && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Zoom In */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {/* Toggle Map Tiles Theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg flex items-center justify-center transition-colors cursor-pointer"
            title={`Switch to ${mapTheme === 'dark' ? 'Standard OSM' : 'Dark Mode'}`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
          </button>
          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Map Attribution Bar */}
      <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded bg-slate-950/70 text-[9px] text-slate-400 font-mono border border-slate-800 pointer-events-none">
        © OpenStreetMap • CivicConnect TN
      </div>
    </div>
  );
}
