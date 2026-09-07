'use client';

// =============================================================================
// CivicConnect TN — Spatial Intelligence & GIS Map Page (/map)
// =============================================================================

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { AdminSpatialMap } from '@/components/maps/admin-spatial-map';
import { MapPin, Navigation, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

function MapContent() {
  const searchParams = useSearchParams();
  const districtParam = searchParams.get('district') || 'All Tamil Nadu';
  const deptParam = searchParams.get('department') || '';
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <CitizenHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Breadcrumb & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>CivicConnect TN</span>
                <span>/</span>
                <span className="text-emerald-400">Spatial Intelligence GIS</span>
              </div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
                <MapPin className="w-6 h-6 text-emerald-400" />
                <span>Tamil Nadu Civic Spatial Map</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-1.5 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>PostGIS Spatial Engine Active</span>
              </div>
            </div>
          </div>

          {/* Privacy & Aggregation Notice for Public */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p>
              This spatial console visualizes public civic issues reported across Tamil Nadu municipalities and corporations.
              Personal citizen data is strictly redacted to preserve privacy.
            </p>
          </div>

          {/* Full Admin / Public Spatial Map Component */}
          <AdminSpatialMap
            initialDistrict={districtParam}
            initialDepartment={deptParam}
            userRole={user?.role || 'citizen'}
            className="w-full h-[650px]"
          />
        </main>
      </div>

      <div className="pb-16 sm:pb-0">
        <CitizenBottomNav />
      </div>
    </div>
  );
}

export default function SpatialMapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading GIS Map...</div>}>
      <MapContent />
    </Suspense>
  );
}
