'use client';

// =============================================================================
// CivicConnect TN — Interactive Citizen Location Picker (Leaflet + PostGIS)
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Crosshair,
  RefreshCw,
  Info,
} from 'lucide-react';
import { LeafletMapWrapper } from './leaflet-map-wrapper';
import { TN_DISTRICTS } from '@/lib/spatial/spatial-engine';

export interface LocationPickerValue {
  latitude: number | null;
  longitude: number | null;
  address: string;
  ward: number | null;
  district: string;
}

interface CitizenLocationPickerProps {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  className?: string;
}

export function CitizenLocationPicker({
  value,
  onChange,
  className = '',
}: CitizenLocationPickerProps) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletLibRef = useRef<typeof import('leaflet') | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const defaultLat = value.latitude || 13.0827; // Chennai Ripon Building
  const defaultLng = value.longitude || 80.2755;

  // Custom pulsing pin icon
  const createPinIcon = (L: typeof import('leaflet')) => {
    return L.divIcon({
      className: 'custom-pin-container',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-emerald-500/30 animate-ping absolute"></div>
          <div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center z-10 text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  };

  // Perform reverse geocoding via API
  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/spatial/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          onChange({
            latitude: lat,
            longitude: lng,
            address: data.formatted_address || value.address,
            ward: data.ward || value.ward,
            district: data.district || value.district || 'Chennai',
          });
        }
      }
    } catch {
      // Fallback: update coordinates only
      onChange({
        ...value,
        latitude: lat,
        longitude: lng,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Setup Leaflet map listeners and marker
  const handleMapReady = (map: L.Map, L: typeof import('leaflet')) => {
    mapInstanceRef.current = map;
    leafletLibRef.current = L;

    // Create draggable marker
    const pinIcon = createPinIcon(L);
    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    markerRef.current = marker;

    // Marker Drag End Listener
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleReverseGeocode(pos.lat, pos.lng);
    });

    // Map Click Listener to move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handleReverseGeocode(lat, lng);
    });
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          if (markerRef.current) mapInstanceRef.current.removeLayer(markerRef.current);
          if (accuracyCircleRef.current) mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
        } catch {
          // Guard
        }
      }
    };
  }, []);

  // Browser Geolocation capture with permission error testing
  const captureGpsLocation = () => {
    if (!navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        setGpsAccuracy(accuracy);
        setIsLocating(false);

        // Update map & marker
        if (mapInstanceRef.current && markerRef.current && leafletLibRef.current) {
          const map = mapInstanceRef.current;
          const L = leafletLibRef.current;

          markerRef.current.setLatLng([lat, lng]);
          map.setView([lat, lng], 16, { animate: true });

          // Accuracy radius circle
          if (accuracyCircleRef.current) {
            map.removeLayer(accuracyCircleRef.current);
          }
          const circle = L.circle([lat, lng], {
            radius: Math.min(accuracy, 500),
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);

          accuracyCircleRef.current = circle;
        }

        handleReverseGeocode(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Unable to access your GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg =
            'Location access was denied. You can still pinpoint your exact location by clicking on the map or searching above.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS signal unavailable. Please select your location on the map manually.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again or drop a pin on the map.';
        }
        setPermissionError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Search places via geocoding API
  const handleSearchSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/spatial/geocode?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.results) {
          setSearchResults(json.data.results);
          if (json.data.results.length > 0) {
            selectSearchResult(json.data.results[0]);
          }
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = item.latitude;
    const lng = item.longitude;

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
    }

    onChange({
      latitude: lat,
      longitude: lng,
      address: item.formatted_address || value.address,
      ward: item.ward || value.ward,
      district: item.district || value.district,
    });

    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className={`space-y-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-lg ${className}`}>
      {/* Header with Title & GPS Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Pinpoint Incident Location (GIS Map)</span>
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Click anywhere on the map or drag the pin to set the exact civic issue coordinates.
          </p>
        </div>

        {/* Locate Me Action Button */}
        <button
          type="button"
          onClick={captureGpsLocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md shadow-emerald-950 transition-all cursor-pointer shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
        </button>
      </div>

      {/* Permission Denial / Warning Banner */}
      {permissionError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">Notice: </span>
            {permissionError}
          </div>
        </div>
      )}

      {/* Place Search Bar */}
      <div className="relative flex items-center" role="search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchSubmit(e);
            }
          }}
          placeholder="Search place in Tamil Nadu (e.g. T Nagar, Gandhipuram, Srirangam)..."
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5" />
        <button
          type="button"
          onClick={handleSearchSubmit}
          disabled={isSearching || !searchQuery.trim()}
          className="absolute right-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Search Autocomplete Suggestions */}
      {searchResults.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 shadow-xl">
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectSearchResult(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-slate-900 flex items-center gap-2 text-xs text-slate-300 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{item.formatted_address}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Leaflet Map Wrapper */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
        <LeafletMapWrapper
          center={[defaultLat, defaultLng]}
          zoom={14}
          className="w-full h-64 sm:h-72"
          onMapReady={handleMapReady}
        />

        {/* Reverse Geocoding Indicator */}
        {isReverseGeocoding && (
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[11px] text-emerald-400 flex items-center gap-2 shadow-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Resolving street & ward...</span>
          </div>
        )}
      </div>

      {/* Auto-filled Location Details Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Formatted Address */}
        <div className="sm:col-span-3">
          <label className="text-xs font-medium text-slate-400 block mb-1">
            Detected Address / Landmark
          </label>
          <input
            type="text"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="Street address or nearest landmark"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Ward Number */}
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Ward Number</label>
          <input
            type="number"
            value={value.ward ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                ward: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            placeholder="e.g. 114"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* District Selector */}
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">District</label>
          <select
            value={value.district || 'Chennai'}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {TN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Coordinates Readout */}
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">GPS Coordinates</label>
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>
              {value.latitude ? `${value.latitude.toFixed(4)}, ${value.longitude?.toFixed(4)}` : 'Not Set'}
            </span>
            {gpsAccuracy && (
              <span className="text-[10px] text-slate-400">±{gpsAccuracy}m</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
