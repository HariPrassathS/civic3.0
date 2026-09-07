'use client';

// =============================================================================
// CivicConnect TN — Tamil Nadu Geographic Place & District Labels Overlay Layer
// =============================================================================
// Renders high-contrast, glowing Tamil typography labels for all 38 districts
// and major municipal corporations directly on the Leaflet map canvas.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import type * as L from 'leaflet';

export interface PlaceLabel {
  nameEn: string;
  nameTa: string;
  lat: number;
  lng: number;
  type: 'capital' | 'tier1' | 'district' | 'town';
  minZoom?: number;
}

export const TN_MAP_PLACES: PlaceLabel[] = [
  // State Capital
  { nameEn: 'Chennai (State Capital)', nameTa: 'சென்னை (தலைநகரம்)', lat: 13.0827, lng: 80.2707, type: 'capital', minZoom: 7 },

  // Tier-1 City Corporations
  { nameEn: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', lat: 11.0168, lng: 76.9558, type: 'tier1', minZoom: 7 },
  { nameEn: 'Madurai', nameTa: 'மதுரை', lat: 9.9252, lng: 78.1198, type: 'tier1', minZoom: 7 },
  { nameEn: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', lat: 10.7905, lng: 78.7047, type: 'tier1', minZoom: 7 },
  { nameEn: 'Salem', nameTa: 'சேலம்', lat: 11.6643, lng: 78.1460, type: 'tier1', minZoom: 7 },
  { nameEn: 'Tirunelveli', nameTa: 'திருநெல்வேலி', lat: 8.7139, lng: 77.7567, type: 'tier1', minZoom: 7 },
  { nameEn: 'Tiruppur', nameTa: 'திருப்பூர்', lat: 11.1085, lng: 77.3411, type: 'tier1', minZoom: 7 },
  { nameEn: 'Erode', nameTa: 'ஈரோடு', lat: 11.3410, lng: 77.7172, type: 'tier1', minZoom: 7 },
  { nameEn: 'Vellore', nameTa: 'வேலூர்', lat: 12.9165, lng: 79.1325, type: 'tier1', minZoom: 7 },
  { nameEn: 'Thanjavur', nameTa: 'தஞ்சாவூர்', lat: 10.7870, lng: 79.1378, type: 'tier1', minZoom: 7 },
  { nameEn: 'Thoothukudi', nameTa: 'தூத்துக்குடி', lat: 8.7642, lng: 78.1348, type: 'tier1', minZoom: 7 },

  // District Headquarters
  { nameEn: 'Dindigul', nameTa: 'திண்டுக்கல்', lat: 10.3673, lng: 77.9803, type: 'district', minZoom: 8 },
  { nameEn: 'Kanchipuram', nameTa: 'காஞ்சிபுரம்', lat: 12.8342, lng: 79.7036, type: 'district', minZoom: 8 },
  { nameEn: 'Chengalpattu', nameTa: 'செங்கல்பட்டு', lat: 12.6819, lng: 79.9888, type: 'district', minZoom: 8 },
  { nameEn: 'Tiruvallur', nameTa: 'திருவள்ளூர்', lat: 13.1432, lng: 79.9079, type: 'district', minZoom: 8 },
  { nameEn: 'Cuddalore', nameTa: 'கடலூர்', lat: 11.7480, lng: 79.7714, type: 'district', minZoom: 8 },
  { nameEn: 'Kanniyakumari', nameTa: 'கன்னியாகுமரி', lat: 8.0883, lng: 77.5385, type: 'district', minZoom: 8 },
  { nameEn: 'Karur', nameTa: 'கரூர்', lat: 10.9601, lng: 78.0766, type: 'district', minZoom: 8 },
  { nameEn: 'Namakkal', nameTa: 'நாமக்கல்', lat: 11.2189, lng: 78.1674, type: 'district', minZoom: 8 },
  { nameEn: 'Krishnagiri', nameTa: 'கிருஷ்ணகிரி', lat: 12.5186, lng: 78.2137, type: 'district', minZoom: 8 },
  { nameEn: 'Dharmapuri', nameTa: 'தர்மபுரி', lat: 12.1211, lng: 78.1582, type: 'district', minZoom: 8 },
  { nameEn: 'The Nilgiris (Ooty)', nameTa: 'நீலகிரி (உதகை)', lat: 11.4102, lng: 76.6950, type: 'district', minZoom: 8 },
  { nameEn: 'Theni', nameTa: 'தேனி', lat: 10.0104, lng: 77.4768, type: 'district', minZoom: 8 },
  { nameEn: 'Virudhunagar', nameTa: 'விருதுநகர்', lat: 9.5872, lng: 77.9514, type: 'district', minZoom: 8 },
  { nameEn: 'Sivaganga', nameTa: 'சிவகங்கை', lat: 9.8433, lng: 78.4809, type: 'district', minZoom: 8 },
  { nameEn: 'Ramanathapuram', nameTa: 'ராமநாதபுரம்', lat: 9.3639, lng: 78.8395, type: 'district', minZoom: 8 },
  { nameEn: 'Pudukkottai', nameTa: 'புதுக்கோட்டை', lat: 10.3833, lng: 78.8001, type: 'district', minZoom: 8 },
  { nameEn: 'Ariyalur', nameTa: 'அரியலூர்', lat: 11.1401, lng: 79.0786, type: 'district', minZoom: 8 },
  { nameEn: 'Perambalur', nameTa: 'பெரம்பலூர்', lat: 11.2342, lng: 78.8820, type: 'district', minZoom: 8 },
  { nameEn: 'Tiruvarur', nameTa: 'திருவாரூர்', lat: 10.7725, lng: 79.6365, type: 'district', minZoom: 8 },
  { nameEn: 'Nagapattinam', nameTa: 'நாகப்பட்டினம்', lat: 10.7672, lng: 79.8449, type: 'district', minZoom: 8 },
  { nameEn: 'Mayiladuthurai', nameTa: 'மயிலாடுதுறை', lat: 11.1075, lng: 79.6523, type: 'district', minZoom: 8 },
  { nameEn: 'Tiruvannamalai', nameTa: 'திருவண்ணாமலை', lat: 12.2253, lng: 79.0747, type: 'district', minZoom: 8 },
  { nameEn: 'Viluppuram', nameTa: 'விழுப்புரம்', lat: 11.9401, lng: 79.4861, type: 'district', minZoom: 8 },
  { nameEn: 'Kallakurichi', nameTa: 'கள்ளக்குறிச்சி', lat: 11.7384, lng: 78.9639, type: 'district', minZoom: 8 },
  { nameEn: 'Ranipet', nameTa: 'ராணிப்பேட்டை', lat: 12.9274, lng: 79.3330, type: 'district', minZoom: 8 },
  { nameEn: 'Tirupathur', nameTa: 'திருப்பத்தூர்', lat: 12.4958, lng: 78.5678, type: 'district', minZoom: 8 },
  { nameEn: 'Tenkasi', nameTa: 'தென்காசி', lat: 8.9594, lng: 77.3152, type: 'district', minZoom: 8 },

  // Key Municipalities & Historic Centers
  { nameEn: 'Kumbakonam', nameTa: 'கும்பகோணம்', lat: 10.9602, lng: 79.3845, type: 'town', minZoom: 9 },
  { nameEn: 'Sivakasi', nameTa: 'சிவகாசி', lat: 9.4533, lng: 77.7972, type: 'town', minZoom: 9 },
  { nameEn: 'Karaikudi', nameTa: 'காரைக்குடி', lat: 10.0673, lng: 78.7758, type: 'town', minZoom: 9 },
  { nameEn: 'Hosur', nameTa: 'ஓசூர்', lat: 12.7409, lng: 77.8253, type: 'town', minZoom: 9 },
  { nameEn: 'Pollachi', nameTa: 'பொள்ளாச்சி', lat: 10.6580, lng: 77.0080, type: 'town', minZoom: 9 },
  { nameEn: 'Nagercoil', nameTa: 'நாகர்கோவில்', lat: 8.1833, lng: 77.4119, type: 'town', minZoom: 9 },
  { nameEn: 'Rameswaram', nameTa: 'ராமேஸ்வரம்', lat: 9.2876, lng: 79.3129, type: 'town', minZoom: 9 },
  { nameEn: 'Tambaram', nameTa: 'தாம்பரம்', lat: 12.9249, lng: 80.1299, type: 'town', minZoom: 10 },
  { nameEn: 'Avadi', nameTa: 'ஆவடி', lat: 13.1147, lng: 80.1006, type: 'town', minZoom: 10 },
];

interface DistrictLabelsLayerProps {
  map: L.Map | null;
  lang?: 'en' | 'ta';
  onSelectPlace?: (place: PlaceLabel) => void;
}

export function DistrictLabelsLayer({
  map,
  lang = 'en',
  onSelectPlace,
}: DistrictLabelsLayerProps) {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    let isMounted = true;

    async function renderLabels() {
      const leafletMod = await import('leaflet');
      const L = (leafletMod as any).default || leafletMod;

      if (!isMounted || !map) return;

      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      const currentZoom = map.getZoom() || 8;
      const isTa = lang === 'ta';

      for (const place of TN_MAP_PLACES) {
        // Zoom filtering for crisp, non-cluttered typography
        const minZ = place.minZoom || 8;
        if (currentZoom < minZ && place.type === 'town') continue;
        if (currentZoom < 7 && place.type === 'district') continue;

        const displayName = isTa ? place.nameTa : place.nameEn;
        const isCapital = place.type === 'capital';
        const isTier1 = place.type === 'tier1';

        const dotColor = isCapital ? '#f59e0b' : isTier1 ? '#10b981' : '#38bdf8';
        const bgStyle = isCapital
          ? 'background: rgba(15, 23, 42, 0.92); border: 1.5px solid rgba(245, 158, 11, 0.7); color: #fef08a;'
          : isTier1
          ? 'background: rgba(15, 23, 42, 0.88); border: 1px solid rgba(16, 185, 129, 0.6); color: #ecfdf5;'
          : 'background: rgba(15, 23, 42, 0.82); border: 1px solid rgba(56, 189, 248, 0.4); color: #f1f5f9;';

        const labelIcon = L.divIcon({
          className: 'civic-district-map-label',
          html: `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              ${bgStyle}
              backdrop-filter: blur(8px);
              padding: ${isCapital ? '4px 10px' : isTier1 ? '3px 8px' : '2px 7px'};
              border-radius: 9999px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: ${isCapital ? '12px' : isTier1 ? '11px' : '10px'};
              font-weight: ${isCapital || isTier1 ? '800' : '600'};
              letter-spacing: 0.3px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.8);
              cursor: pointer;
              white-space: nowrap;
              pointer-events: auto;
              transform: translate(-50%, -50%);
              user-select: none;
              transition: transform 0.15s ease-in-out;
            "
            onmouseover="this.style.transform='translate(-50%, -50%) scale(1.08)'"
            onmouseout="this.style.transform='translate(-50%, -50%) scale(1.0)'"
            >
              <span style="
                width: ${isCapital ? '7px' : '5px'};
                height: ${isCapital ? '7px' : '5px'};
                border-radius: 50%;
                background: ${dotColor};
                box-shadow: 0 0 8px ${dotColor};
                display: inline-block;
              "></span>
              <span>${displayName}</span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const labelMarker = L.marker([place.lat, place.lng], {
          icon: labelIcon,
          interactive: true,
          zIndexOffset: isCapital ? 500 : isTier1 ? 400 : 300,
        });

        labelMarker.on('click', () => {
          map.flyTo([place.lat, place.lng], 13, { duration: 1.2 });
          if (onSelectPlace) onSelectPlace(place);
        });

        layerGroup.addLayer(labelMarker);
      }
    }

    renderLabels();

    const onZoom = () => {
      renderLabels();
    };

    map.on('zoomend', onZoom);

    return () => {
      isMounted = false;
      map.off('zoomend', onZoom);
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map, lang, onSelectPlace]);

  return null;
}
