'use client';

// =============================================================================
// CivicConnect TN — Nearby Public Issues Page (/nearby)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  List,
  RefreshCw,
  CheckCircle2,
  PlusCircle,
  Filter,
  Crosshair,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { ComplaintCard } from '@/components/citizen/complaint-card';
import { NearbyIssuesMap } from '@/components/maps/nearby-issues-map';
import { SpatialComplaintItem } from '@/lib/spatial/spatial-engine';

export default function NearbyIssuesPage() {
  const [userLat, setUserLat] = useState<number>(13.0418); // Default: Chennai T. Nagar
  const [userLng, setUserLng] = useState<number>(80.2341);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [issues, setIssues] = useState<SpatialComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load nearby issues from PostGIS / Server Spatial API
  const loadNearbyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(userLat),
        lng: String(userLng),
        radius_km: String(maxRadiusKm),
      });
      if (selectedCategory) params.set('category_id', selectedCategory);
      if (selectedStatus) params.set('status', selectedStatus);

      const res = await fetch(`/api/spatial/nearby?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.issues) {
          setIssues(json.data.issues);
        }
      }
    } catch (err) {
      console.error('Failed to load nearby spatial issues:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userLat, userLng, maxRadiusKm, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadNearbyData();
  }, [loadNearbyData]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Unable to detect your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Showing default Chennai neighborhood.';
        }
        setPermissionError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 sm:pb-8 selection:bg-emerald-500 selection:text-white justify-between transition-colors">
      <div>
        <CitizenHeader />

        <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <Compass className="w-3.5 h-3.5 animate-spin" />
                <span>PostGIS Spatial Discovery</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Issues Near My Location
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Explore, upvote, and monitor civic grievances verified within your neighborhood radius.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={detectLocation}
                disabled={isLocating}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950 transition-all cursor-pointer"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>

              <Link
                href="/submit-issue"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Report Issue</span>
              </Link>
            </div>
          </div>

          {/* Location Permission Notice Banner */}
          {permissionError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Filter & Radius Controls Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-lg">
            {/* Radius Selector Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Radius:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {[1, 2, 5, 10, 25].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setMaxRadiusKm(km)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      maxRadiusKm === km
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle (Map vs List) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Map View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadNearbyData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title="Refresh nearby issues"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Map View Rendering */}
          {viewMode === 'map' && (
            <div className="space-y-4">
              <NearbyIssuesMap
                userLat={userLat}
                userLng={userLng}
                radiusKm={maxRadiusKm}
                issues={issues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                onRecenter={detectLocation}
              />
            </div>
          )}

          {/* Grievance Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>
                Found <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{issues.length}</strong> public complaints within {maxRadiusKm}km
              </span>
              <span>Sorted by nearest distance</span>
            </div>

            {issues.length === 0 && !isLoading ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">No Complaints in this Radius</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Try expanding the search radius (e.g. 10km or 25km) or reporting a new civic grievance.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`rounded-2xl transition-all cursor-pointer ${
                      selectedIssueId === issue.id
                        ? 'ring-2 ring-emerald-500 shadow-xl'
                        : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <ComplaintCard
                      complaint={{
                        id: issue.id,
                        tracking_id: issue.tracking_id,
                        title: issue.title,
                        description: issue.address || `Ward ${issue.ward || 'N/A'}, ${issue.district || 'Tamil Nadu'}`,
                        status: issue.status,
                        priority: issue.priority,
                        address: issue.address,
                        ward: issue.ward,
                        district: issue.district,
                        created_at: issue.created_at,
                        distance_km: issue.distance_km,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CitizenBottomNav />
    </div>
  );
}
