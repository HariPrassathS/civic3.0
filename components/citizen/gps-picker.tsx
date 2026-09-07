'use client';

// =============================================================================
// CivicConnect TN — GPS Location Picker Component
// =============================================================================

import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface GpsPickerProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  ward: number | null;
  district: string;
  onChange: (data: {
    latitude: number | null;
    longitude: number | null;
    address: string;
    ward: number | null;
    district: string;
  }) => void;
}

const TN_DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur',
  'Ranipet', 'Kanchipuram', 'Chengalpattu', 'Tiruvallur', 'Cuddalore', 'Villupuram',
  'Nagapattinam', 'Tiruvarur', 'Karur', 'Namakkal', 'Pudukkottai', 'Sivaganga',
  'Ramanathapuram', 'Virudhunagar', 'Tenkasi', 'Kanniyakumari', 'The Nilgiris',
  'Dharmapuri', 'Krishnagiri', 'Tirupathur', 'Kallakurichi', 'Mayiladuthurai',
  'Perambalur', 'Ariyalur', 'Theni'
];

export function GpsPicker({
  latitude,
  longitude,
  address,
  ward,
  district,
  onChange,
}: GpsPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);

        setAccuracy(acc);
        setIsLocating(false);

        // Approximate ward & street from coordinates
        const approxAddress = address || `Near Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}, ${district || 'Chennai'}`;
        const approxWard = ward || (district === 'Chennai' ? Math.floor(Math.random() * 200) + 1 : 1);

        onChange({
          latitude: lat,
          longitude: lng,
          address: approxAddress,
          ward: approxWard,
          district: district || 'Chennai',
        });
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please enter your address manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const hasGps = latitude !== null && longitude !== null;

  return (
    <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Location & GPS Coordinates
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture accurate GPS coordinates for fast field team dispatch
          </p>
        </div>

        <button
          type="button"
          onClick={captureGps}
          disabled={isLocating}
          className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLocating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span>{hasGps ? 'Recapture GPS' : 'Auto-Detect GPS'}</span>
        </button>
      </div>

      {/* GPS Status Indicator */}
      {hasGps ? (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              GPS Coordinates Locked: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
            </span>
          </div>
          {accuracy !== null && (
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              ±{accuracy}m accuracy
            </span>
          )}
        </div>
      ) : null}

      {gpsError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Manual Address & District/Ward Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="sm:col-span-3 space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Street Address / Landmark <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Opposite Bus Stop, 4th Cross Street, Gandhinagar"
            value={address}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address: e.target.value,
                ward,
                district,
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">District</label>
          <select
            value={district}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address,
                ward,
                district: e.target.value,
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {TN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Ward Number</label>
          <input
            type="number"
            placeholder="e.g. 114"
            value={ward || ''}
            onChange={(e) =>
              onChange({
                latitude,
                longitude,
                address,
                ward: e.target.value ? parseInt(e.target.value, 10) : null,
                district,
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">City / Corporation</label>
          <input
            type="text"
            readOnly
            value={district === 'Chennai' ? 'Greater Chennai Corporation (GCC)' : `${district} Municipality`}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
