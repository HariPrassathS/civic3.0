'use client';

// =============================================================================
// CivicConnect TN — Field Worker GPS Navigation & Task Map
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import type * as L from 'leaflet';
import { LeafletMapWrapper } from './leaflet-map-wrapper';
import {
  Navigation,
  Compass,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Crosshair,
  Loader2,
} from 'lucide-react';
import { calculateHaversineDistanceKm } from '@/lib/spatial/spatial-engine';

export interface WorkerTask {
  id: string;
  tracking_id: string;
  title: string;
  status: string;
  priority: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  ward?: number | null;
  sla_deadline?: string | null;
  sla_breached?: boolean;
}

interface FieldWorkerMapProps {
  tasks: WorkerTask[];
  onSelectTask?: (task: WorkerTask) => void;
  onUpdateStatus?: (task: WorkerTask, newStatus: string) => void;
  className?: string;
}

export function FieldWorkerMap({
  tasks,
  onSelectTask,
  onUpdateStatus,
  className = 'w-full h-[450px]',
}: FieldWorkerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const workerMarkerRef = useRef<L.Marker | null>(null);
  const taskMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Field Worker GPS state
  const [workerLat, setWorkerLat] = useState<number>(13.0418);
  const [workerLng, setWorkerLng] = useState<number>(80.2341);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkerTask | null>(tasks[0] || null);

  // Capture worker GPS
  const locateWorker = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setWorkerLat(lat);
        setWorkerLng(lng);
        setIsLocating(false);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 14, { animate: true });
        }
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapReady = (map: L.Map, L: typeof import('leaflet')) => {
    mapRef.current = map;
    leafletRef.current = L;
    updateWorkerMarker(map, L);
    renderTaskMarkers(map, L);
  };

  const updateWorkerMarker = (map: L.Map, L: typeof import('leaflet')) => {
    if (workerMarkerRef.current) map.removeLayer(workerMarkerRef.current);

    const workerIcon = L.divIcon({
      className: 'worker-location-pin',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(59, 130, 246, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; z-index: 10;">
            👷
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([workerLat, workerLng], {
      icon: workerIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    workerMarkerRef.current = marker;
  };

  const renderTaskMarkers = (map: L.Map, L: typeof import('leaflet')) => {
    if (taskMarkersGroupRef.current) {
      map.removeLayer(taskMarkersGroupRef.current);
    }

    const group = L.layerGroup().addTo(map);
    taskMarkersGroupRef.current = group;

    for (const task of tasks) {
      const isSelected = selectedTask?.id === task.id;
      const isUrgent = task.priority === 'urgent';
      const isBreached = task.sla_breached;

      const pinColor = isBreached || isUrgent ? '#ef4444' : task.status === 'in_progress' ? '#06b6d4' : '#f59e0b';

      const taskIcon = L.divIcon({
        className: 'field-task-marker',
        html: `
          <div style="
            position: relative;
            transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'};
            transition: transform 0.2s;
            cursor: pointer;
          ">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${pinColor};
              border: 2px solid ${isSelected ? '#ffffff' : '#0f172a'};
              box-shadow: 0 4px 12px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
              font-weight: bold;
            ">
              🔧
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([task.latitude, task.longitude], { icon: taskIcon });

      const dist = calculateHaversineDistanceKm(workerLat, workerLng, task.latitude, task.longitude);
      const isNear = dist < 0.1; // Within 100 meters

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 240px; color: #f8fafc; background: #0f172a; padding: 12px; border-radius: 12px; border: 1px solid #334155;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: 700; color: #38bdf8; background: #082f49; padding: 2px 6px; border-radius: 4px;">
              ${task.tracking_id}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: ${pinColor}; text-transform: uppercase;">
              ${task.priority}
            </span>
          </div>
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #f8fafc;">
            ${task.title}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
            📍 ${task.address || `Ward ${task.ward || 'N/A'}`}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #10b981; margin-bottom: 10px;">
            📏 ${dist.toFixed(2)} km away ${isNear ? '• 🎯 On Site (<100m)' : ''}
          </div>
          <div style="display: flex; gap: 6px; border-top: 1px solid #1e293b; padding-top: 8px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}" target="_blank" style="
              flex: 1;
              text-align: center;
              background: #2563eb;
              color: white;
              text-decoration: none;
              font-size: 11px;
              font-weight: 600;
              padding: 6px 10px;
              border-radius: 8px;
            ">
              🧭 Start Navigation
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'civic-dark-popup', closeButton: false });

      marker.on('click', () => {
        setSelectedTask(task);
        if (onSelectTask) onSelectTask(task);
        drawRouteLine(task.latitude, task.longitude);
      });

      group.addLayer(marker);
    }
  };

  const drawRouteLine = (destLat: number, destLng: number) => {
    if (!mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;

    if (routeLineRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
    }

    const polyline = L.polyline(
      [
        [workerLat, workerLng],
        [destLat, destLng],
      ],
      {
        color: '#38bdf8',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 8',
      }
    ).addTo(mapRef.current);

    routeLineRef.current = polyline;
  };

  useEffect(() => {
    if (mapRef.current && leafletRef.current) {
      updateWorkerMarker(mapRef.current, leafletRef.current);
      renderTaskMarkers(mapRef.current, leafletRef.current);
    }
  }, [workerLat, workerLng, tasks, selectedTask]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          if (taskMarkersGroupRef.current) mapRef.current.removeLayer(taskMarkersGroupRef.current);
          if (workerMarkerRef.current) mapRef.current.removeLayer(workerMarkerRef.current);
          if (routeLineRef.current) mapRef.current.removeLayer(routeLineRef.current);
        } catch {
          // Guard
        }
      }
    };
  }, []);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      <LeafletMapWrapper
        center={[workerLat, workerLng]}
        zoom={13}
        className="w-full h-full"
        onMapReady={handleMapReady}
      />

      {/* Top Banner Status Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Field Dispatch Navigator ({tasks.length} Assigned Work Orders)</span>
        </div>

        <button
          type="button"
          onClick={locateWorker}
          disabled={isLocating}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
        >
          {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          <span>{isLocating ? 'Locating...' : 'My Live Location'}</span>
        </button>
      </div>

      {/* Selected Task Bottom Float Card */}
      {selectedTask && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/60">
                  {selectedTask.tracking_id}
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  {selectedTask.priority}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{selectedTask.title}</h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{selectedTask.address || `Ward ${selectedTask.ward}`}</span>
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.latitude},${selectedTask.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shrink-0 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
