'use client';

// =============================================================================
// CivicConnect TN — Spatial Cluster & Marker GIS Layer
// =============================================================================

import React, { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { SpatialCluster, SpatialComplaintItem } from '@/lib/spatial/spatial-engine';

export const TN_DISTRICTS_TAMIL: Record<string, string> = {
  'All Tamil Nadu': 'தமிழ்நாடு முழுவதும்',
  Ariyalur: 'அரியலூர்',
  Chengalpattu: 'செங்கல்பட்டு',
  Chennai: 'சென்னை',
  Coimbatore: 'கோயம்புத்தூர்',
  Cuddalore: 'கடலூர்',
  Dharmapuri: 'தர்மபுரி',
  Dindigul: 'திண்டுக்கல்',
  Erode: 'ஈரோடு',
  Kallakurichi: 'கள்ளக்குறிச்சி',
  Kanchipuram: 'காஞ்சிபுரம்',
  Kanniyakumari: 'கன்னியாகுமரி',
  Karur: 'கரூர்',
  Krishnagiri: 'கிருஷ்ணகிரி',
  Madurai: 'மதுரை',
  Mayiladuthurai: 'மயிலாடுதுறை',
  Nagapattinam: 'நாகப்பட்டினம்',
  Namakkal: 'நாமக்கல்',
  Perambalur: 'பெரம்பலூர்',
  Pudukkottai: 'புதுக்கோட்டை',
  Ramanathapuram: 'ராமநாதபுரம்',
  Ranipet: 'ராணிப்பேட்டை',
  Salem: 'சேலம்',
  Sivaganga: 'சிவகங்கை',
  Tenkasi: 'தென்காசி',
  Thanjavur: 'தஞ்சாவூர்',
  Theni: 'தேனி',
  'The Nilgiris': 'நீலகிரி',
  Thoothukudi: 'தூத்துக்குடி',
  Tiruchirappalli: 'திருச்சிராப்பள்ளி',
  Tirunelveli: 'திருநெல்வேலி',
  Tirupathur: 'திருப்பத்தூர்',
  Tiruppur: 'திருப்பூர்',
  Tiruvallur: 'திருவள்ளூர்',
  Tiruvarur: 'திருவாரூர்',
  Tiruvannamalai: 'திருவண்ணாமலை',
  Vellore: 'வேலூர்',
  Viluppuram: 'விழுப்புரம்',
  Virudhunagar: 'விருதுநகர்',
};

export const PRIORITY_TAMIL: Record<string, string> = {
  urgent: 'அவசரம்',
  high: 'அதிகம்',
  medium: 'நடுத்தரம்',
  low: 'குறைவு',
};

export const STATUS_TAMIL: Record<string, string> = {
  created: 'புகாரளிக்கப்பட்டது',
  assigned: 'ஒதுக்கப்பட்டது',
  in_progress: 'செயலில்',
  resolved: 'தீர்க்கப்பட்டது',
  escalated: 'மேலதிகாரிக்கு அனுப்பப்பட்டது',
  closed: 'முடிவுற்றது',
};

export function translateComplaintTitleToTamil(
  title?: string,
  deptCode?: string,
  categoryName?: string
): string {
  if (!title) return 'பொதுப் புகார்';
  const t = title.toLowerCase();

  if (
    t.includes('pipe burst') ||
    t.includes('water leak') ||
    t.includes('drinking water') ||
    t.includes('water supply') ||
    t.includes('water pipe')
  ) {
    if (t.includes('anna salai')) return 'அண்ணா சாலை குடிநீர் பிரதான குழாய் உடைப்பு';
    if (t.includes('gandhipuram')) return 'காந்திபுரம் குடிநீர் விநியோக தடை';
    if (t.includes('srirangam')) return 'ஸ்ரீரங்கம் குடிநீர் தட்டுப்பாடு';
    return 'குடிநீர் விநியோக குழாய் உடைப்பு / கசிவு';
  }
  if (t.includes('flyover') || t.includes('usman')) {
    return 'உஸ்மான் சாலை மேம்பால விரிசல் ஆபத்து';
  }
  if (
    t.includes('pothole') ||
    t.includes('road') ||
    t.includes('asphalt') ||
    t.includes('tar') ||
    t.includes('highway') ||
    t.includes('crater')
  ) {
    if (t.includes('rs puram')) return 'ஆர்.எஸ். புரம் சாலை பள்ளம் சீரமைப்பு';
    if (t.includes('meenakshi')) return 'மீனாட்சி அம்மன் கோவில் ரத வீதி பள்ளம்';
    if (t.includes('four roads')) return 'நான்கு ரோடு சந்திப்பு சாலை பள்ளம்';
    return 'சாலையில் ஆழமான பள்ளம் & விபத்து அபாயம்';
  }
  if (
    t.includes('garbage') ||
    t.includes('waste') ||
    t.includes('dump') ||
    t.includes('trash') ||
    t.includes('debris') ||
    t.includes('sanitation')
  ) {
    if (t.includes('velachery')) return 'வேளச்சேரி மெயின் ரோடு குப்பை தேக்கம்';
    if (t.includes('thillai nagar')) return 'தில்லை நகர் வணிக பகுதி குப்பை குவிப்பு';
    return 'துப்புரவு குறைபாடு & குப்பை தேக்கம்';
  }
  if (
    t.includes('drainage') ||
    t.includes('sewage') ||
    t.includes('drain') ||
    t.includes('overflow') ||
    t.includes('manhole') ||
    t.includes('gutter')
  ) {
    if (t.includes('hasthampatti')) return 'ஹஸ்தம்பட்டி கழிவுநீர் வடிகால் அடைப்பு';
    if (t.includes('kk nagar')) return 'கே.கே. நகர் மழைநீர் வடிகால் அடைப்பு';
    return 'மழைநீர் வடிகால் அடைப்பு & கழிவுநீர் தேக்கம்';
  }
  if (
    t.includes('light') ||
    t.includes('lamp') ||
    t.includes('dark') ||
    t.includes('illumination')
  ) {
    if (t.includes('palayamkottai')) return 'பாளையங்கோட்டை தெரு விளக்கு பழுது';
    if (t.includes('anna nagar')) return 'அண்ணா நகர் மேற்கு தெரு விளக்கு எரியவில்லை';
    return 'தெரு விளக்கு பழுது & இருள் பகுதி';
  }
  if (
    t.includes('wire') ||
    t.includes('electric') ||
    t.includes('power') ||
    t.includes('transformer') ||
    t.includes('pole') ||
    t.includes('tangedco')
  ) {
    return 'அபாயகரமான மின்சார கம்பி / டிரான்ஸ்பார்மர் பழுது';
  }
  if (
    t.includes('dengue') ||
    t.includes('fogging') ||
    t.includes('mosquito') ||
    t.includes('health') ||
    t.includes('fever')
  ) {
    return 'டெங்கு தடுப்பு கொசு மருந்து தெளிப்பு கோரிக்கை';
  }

  // Department code fallback
  if (deptCode === 'WATER') return 'குடிநீர் வழங்கல் சீரமைப்பு புகார்';
  if (deptCode === 'ROADS') return 'நெடுஞ்சாலை & சாலைகள் பழுது நீக்குதல்';
  if (deptCode === 'SANITATION') return 'துப்புரவு & திடக்கழிவு மேலாண்மை';
  if (deptCode === 'DRAINAGE') return 'மழைநீர் வடிகால் அடைப்பு சீரமைப்பு';
  if (deptCode === 'ELECTRICITY') return 'மின்சார வாரியம் & தெரு விளக்கு பழுது';
  if (deptCode === 'HEALTH') return 'பொது சுகாதாரம் & தூய்மைப் பணி';

  return title;
}

export function translateAddressToTamil(address?: string | null): string {
  if (!address) return 'தமிழ்நாடு';
  let a = address;
  const replacements: [RegExp, string][] = [
    [/Ripon Building/gi, 'ரிப்பன் கட்டிடம்'],
    [/Periamet/gi, 'பெரியமேடு'],
    [/Anna Salai/gi, 'அண்ணா சாலை'],
    [/Teynampet/gi, 'தேனாம்பேட்டை'],
    [/T\.?\s*Nagar/gi, 'தி. நகர்'],
    [/Panagal Park/gi, 'பனகல் பூங்கா'],
    [/Adyar/gi, 'அடையாறு'],
    [/Gandhi Nagar/gi, 'காந்தி நகர்'],
    [/Anna Nagar West/gi, 'அண்ணா நகர் மேற்கு'],
    [/Anna Nagar/gi, 'அண்ணா நகர்'],
    [/Velachery Main Road/gi, 'வேளச்சேரி பிரதான சாலை'],
    [/Velachery/gi, 'வேளச்சேரி'],
    [/Tambaram East/gi, 'தாம்பரம் கிழக்கு'],
    [/Tambaram/gi, 'தாம்பரம்'],
    [/Chromepet/gi, 'குரோம்பேட்டை'],
    [/GST Road/gi, 'ஜிஎஸ்டி சாலை'],
    [/Gandhipuram/gi, 'காந்திபுரம்'],
    [/Cross Cut Road/gi, 'கிராஸ் கட் ரோடு'],
    [/RS Puram/gi, 'ஆர்.எஸ். புரம்'],
    [/DB Road/gi, 'டிபி ரோடு'],
    [/Peelamedu/gi, 'பீளமேடு'],
    [/Avinashi Road/gi, 'அவினாசி ரோடு'],
    [/Singanallur/gi, 'சிங்காநல்லூர்'],
    [/Meenakshi Amman Temple Zone/gi, 'மீனாட்சி அம்மன் கோவில் பகுதி'],
    [/Goripalayam/gi, 'கோரிப்பாளையம்'],
    [/KK Nagar/gi, 'கே.கே. நகர்'],
    [/Lake Area/gi, 'ஏரி பகுதி'],
    [/Srirangam Temple Area/gi, 'ஸ்ரீரங்கம் கோவில் பகுதி'],
    [/Srirangam/gi, 'ஸ்ரீரங்கம்'],
    [/Thillai Nagar/gi, 'தில்லை நகர்'],
    [/Cantonment/gi, 'கன்டோன்மென்ட்'],
    [/Central Bus Stand/gi, 'மத்திய பேருந்து நிலையம்'],
    [/Hasthampatti/gi, 'ஹஸ்தம்பட்டி'],
    [/Four Roads/gi, 'நான்கு ரோடு'],
    [/Palayamkottai/gi, 'பாளையங்கோட்டை'],
    [/High Ground/gi, 'ஹை கிரவுண்ட்'],
    [/Town Junction/gi, 'டவுன் சந்திப்பு'],
    [/Chennai/gi, 'சென்னை'],
    [/Coimbatore/gi, 'கோயம்புத்தூர்'],
    [/Madurai/gi, 'மதுரை'],
    [/Tiruchirappalli/gi, 'திருச்சிராப்பள்ளி'],
    [/Salem/gi, 'சேலம்'],
    [/Tirunelveli/gi, 'திருநெல்வேலி'],
    [/Tamil Nadu/gi, 'தமிழ்நாடு'],
  ];

  for (const [re, rep] of replacements) {
    a = a.replace(re, rep);
  }
  return a;
}

interface ClusterLayerProps {
  map: L.Map | null;
  clusters: SpatialCluster[];
  individual: SpatialComplaintItem[];
  activeComplaintId?: string | null;
  onSelectComplaint?: (complaint: SpatialComplaintItem) => void;
  lang?: 'en' | 'ta';
}

export function ClusterLayer({
  map,
  clusters,
  individual,
  activeComplaintId,
  onSelectComplaint,
  lang = 'en',
}: ClusterLayerProps) {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    let isMounted = true;

    async function renderLayers() {
      const leafletMod = await import('leaflet');
      const L = (leafletMod as any).default || leafletMod;

      if (!isMounted || !map) return;

      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      // 1. Render Clusters
      for (const cluster of clusters) {
        const hasUrgent = cluster.priority_counts.urgent > 0;
        const hasHigh = cluster.priority_counts.high > 0;

        const ringColor = hasUrgent ? '#ef4444' : hasHigh ? '#f59e0b' : '#10b981';
        const bgColor = hasUrgent ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';

        const clusterIcon = L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div style="
              width: 46px;
              height: 46px;
              border-radius: 50%;
              background: ${bgColor};
              border: 2.5px solid ${ringColor};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 16px rgba(0,0,0,0.6);
              cursor: pointer;
              transition: transform 0.2s;
            ">
              <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #0f172a;
                color: #f8fafc;
                font-weight: 800;
                font-size: 13px;
                font-family: monospace;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255,255,255,0.15);
              ">
                ${cluster.count}
              </div>
            </div>
          `,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });

        const clusterMarker = L.marker([cluster.latitude, cluster.longitude], {
          icon: clusterIcon,
        });

        clusterMarker.on('click', () => {
          const latDelta = Math.abs(cluster.bounds.maxLat - cluster.bounds.minLat);
          const lngDelta = Math.abs(cluster.bounds.maxLng - cluster.bounds.minLng);

          if (latDelta < 0.0005 && lngDelta < 0.0005) {
            const currentZoom = map.getZoom() || 12;
            map.setView([cluster.latitude, cluster.longitude], Math.min(currentZoom + 2, 16), { animate: true });
          } else {
            map.fitBounds([
              [cluster.bounds.minLat, cluster.bounds.minLng],
              [cluster.bounds.maxLat, cluster.bounds.maxLng],
            ], { padding: [50, 50], maxZoom: 16 });
          }
        });

        layerGroup.addLayer(clusterMarker);
      }

      // 2. Render Individual Markers
      for (const item of individual) {
        const p = (item.priority || 'medium').toLowerCase();
        const isResolved = item.status === 'resolved' || item.status === 'closed';
        const isActive = activeComplaintId && (item.id === activeComplaintId || item.tracking_id === activeComplaintId);

        let pinBg = '#3b82f6'; // Blue
        if (isResolved) pinBg = '#10b981'; // Green
        else if (p === 'urgent') pinBg = '#ef4444'; // Red
        else if (p === 'high') pinBg = '#f59e0b'; // Amber

        const pinIcon = L.divIcon({
          className: 'custom-single-marker',
          html: `
            <div style="
              position: relative;
              width: ${isActive ? '42px' : '30px'};
              height: ${isActive ? '42px' : '30px'};
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${
                isActive
                  ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 3px solid #38bdf8; background: rgba(56, 189, 248, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>'
                  : p === 'urgent' && !isResolved
                  ? '<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>'
                  : ''
              }
              <div style="
                width: ${isActive ? '30px' : '26px'};
                height: ${isActive ? '30px' : '26px'};
                border-radius: 50%;
                background: ${isActive ? '#0284c7' : pinBg};
                border: 2px solid ${isActive ? '#38bdf8' : '#ffffff'};
                box-shadow: 0 4px 14px rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: ${isActive ? '13px' : '11px'};
                z-index: ${isActive ? '999' : '10'};
                cursor: pointer;
                transition: all 0.2s ease-in-out;
              ">
                📍
              </div>
            </div>
          `,
          iconSize: [isActive ? 42 : 30, isActive ? 42 : 30],
          iconAnchor: [isActive ? 21 : 15, isActive ? 21 : 15],
          popupAnchor: [0, isActive ? -21 : -15],
        });

        const marker = L.marker([item.latitude, item.longitude], {
          icon: pinIcon,
          zIndexOffset: isActive ? 1000 : 10,
        });

        // Interactive Popup Card & Marker Tooltip (Localized with English / Tamil toggle)
        const isTa = lang === 'ta';
        const districtDisplay = isTa && item.district
          ? (TN_DISTRICTS_TAMIL[item.district] || item.district)
          : (item.district || (isTa ? 'தமிழ்நாடு' : 'Tamil Nadu'));
        const priorityDisplay = isTa
          ? (PRIORITY_TAMIL[p] || item.priority)
          : item.priority;
        const wardLabel = isTa ? 'வார்டு' : 'Ward';
        const trackActionLabel = isTa ? 'பொது நிலையை கண்காணிக்க →' : 'Track Public Status →';
        const titleDisplay = isTa
          ? translateComplaintTitleToTamil(item.title, item.department_code, item.category_name)
          : item.title;

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 240px; max-width: 280px; color: #f8fafc; background: #090d16; padding: 14px; border-radius: 14px; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #34d399; background: #064e3b; padding: 2px 7px; border-radius: 6px; letter-spacing: 0.5px;">
                ${item.tracking_id}
              </span>
              <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: ${pinBg}; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px;">
                ${priorityDisplay}
              </span>
            </div>
            <div style="font-weight: 700; font-size: 13px; line-height: 1.4; margin-bottom: 6px; color: #f1f5f9;">
              ${titleDisplay}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
              <span>📍</span>
              <span>${wardLabel} ${item.ward || 'N/A'} • ${districtDisplay}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; border-top: 1px solid #1e293b; padding-top: 10px;">
              <a href="/track/${item.tracking_id}" style="
                flex: 1;
                text-align: center;
                background: #059669;
                hover: background: #10b981;
                color: white;
                text-decoration: none;
                font-size: 11px;
                font-weight: 700;
                padding: 7px 12px;
                border-radius: 8px;
                display: block;
                box-shadow: 0 2px 8px rgba(5,150,105,0.4);
              ">
                ${trackActionLabel}
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'civic-dark-popup',
          closeButton: true,
          autoPan: false,
        });

        marker.bindTooltip(titleDisplay, {
          direction: 'top',
          offset: [0, isActive ? -22 : -16],
          className: 'civic-marker-tooltip',
          opacity: 0.95,
        });

        marker.on('click', () => {
          if (onSelectComplaint) onSelectComplaint(item);
        });

        if (isActive) {
          setTimeout(() => {
            if (isMounted) marker.openPopup();
          }, 300);
        }

        layerGroup.addLayer(marker);
      }
    }

    renderLayers();

    return () => {
      isMounted = false;
      if (map && layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map, clusters, individual, activeComplaintId, lang]);

  return null;
}
