import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

// Leaflet is loaded via CDN in index.html — no npm import needed for the map tiles
// We import the L global after ensuring the script is loaded
const getL = () => window.L;

// Animate a marker from current to target position
const animateMarker = (marker, fromLat, fromLng, toLat, toLng, durationMs = 4000, onComplete) => {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const lat = fromLat + (toLat - fromLat) * ease;
    const lng = fromLng + (toLng - fromLng) * ease;
    marker.setLatLng([lat, lng]);
    if (t < 1) requestAnimationFrame(step);
    else onComplete?.();
  };
  requestAnimationFrame(step);
};

// Dark tile layer (CartoDB Dark Matter — free, no key)
const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// Light tile layer (CartoDB Positron — free, no key)
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

export default function MapView({ userLocation, volunteers, sosActive, onVolunteerArrived }) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const volMarkersRef = useRef([]);
  const arrivedCountRef = useRef(0);

  // Inject Leaflet CSS once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Inject custom animation CSS
    if (!document.getElementById('sw-map-css')) {
      const s = document.createElement('style');
      s.id = 'sw-map-css';
      s.textContent = `
        @keyframes pulse-user {
          0%,100% { box-shadow: 0 0 0 4px rgba(232,93,4,0.35); }
          50%      { box-shadow: 0 0 0 12px rgba(232,93,4,0.05); }
        }
        @keyframes pulse-sos {
          0%,100% { box-shadow: 0 0 0 6px rgba(214,40,40,0.45); }
          50%      { box-shadow: 0 0 0 20px rgba(214,40,40,0.05); }
        }
        .sw-user-marker {
          width: 20px; height: 20px;
          background: #E85D04;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 0 0 4px rgba(232,93,4,0.35);
          animation: pulse-user 2s infinite;
        }
        .sw-user-marker.sos {
          background: #D62828;
          animation: pulse-sos 1.2s infinite;
        }
        .sw-vol-marker {
          width: 36px; height: 36px;
          background: #1A1A1A;
          border: 2px solid #E85D04;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; cursor: default;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .leaflet-popup-content-wrapper {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
        }
        .leaflet-control-zoom a {
          font-family: sans-serif !important;
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // Load Leaflet JS dynamically if not already present, then init map
  useEffect(() => {
    const initMap = () => {
      const L = getL();
      if (!L || !containerRef.current || mapRef.current) return;

      const center = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [21.1458, 79.0882]; // Nagpur default

      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
      });

      // Add zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add tile layer
      const tiles = L.tileLayer(
        theme === 'dark' ? DARK_TILES : LIGHT_TILES,
        { attribution: ATTRIBUTION, maxZoom: 19 }
      );
      tiles.addTo(map);
      tileLayerRef.current = tiles;

      mapRef.current = map;
    };

    if (window.L) {
      initMap();
    } else {
      // Load Leaflet JS from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        userMarkerRef.current = null;
        volMarkersRef.current = [];
      }
    };
  }, []);

  // Swap tile layer on theme change
  useEffect(() => {
    const L = getL();
    const map = mapRef.current;
    if (!L || !map || !tileLayerRef.current) return;

    map.removeLayer(tileLayerRef.current);
    const tiles = L.tileLayer(
      theme === 'dark' ? DARK_TILES : LIGHT_TILES,
      { attribution: ATTRIBUTION, maxZoom: 19 }
    );
    tiles.addTo(map);
    tileLayerRef.current = tiles;
  }, [theme]);

  // User location marker
  useEffect(() => {
    const L = getL();
    const map = mapRef.current;
    if (!L || !map || !userLocation) return;

    const el = document.createElement('div');
    el.className = `sw-user-marker${sosActive ? ' sos' : ''}`;

    const icon = L.divIcon({ html: el, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      // Update class for SOS state
      const existingEl = userMarkerRef.current.getElement();
      if (existingEl) {
        if (sosActive) existingEl.classList.add('sos');
        else existingEl.classList.remove('sos');
      }
    } else {
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 });
      marker.addTo(map);
      userMarkerRef.current = marker;
    }

    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
  }, [userLocation, sosActive]);

  // Volunteer markers — only shown during SOS
  useEffect(() => {
    const L = getL();
    const map = mapRef.current;
    if (!L || !map) return;

    // Remove old volunteer markers
    volMarkersRef.current.forEach(m => m.remove());
    volMarkersRef.current = [];
    arrivedCountRef.current = 0;

    if (!sosActive || !volunteers?.length || !userLocation) return;

    volunteers.forEach((vol, i) => {
      const el = document.createElement('div');
      el.className = 'sw-vol-marker';
      el.textContent = '🚶';

      const icon = L.divIcon({ html: el, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });

      const marker = L.marker([vol.currentLat, vol.currentLng], { icon })
        .bindPopup(`<b>${vol.name}${vol.isVerified ? ' ✓' : ''}</b> — ${vol.distance}km`, {
          closeButton: false,
          offset: [0, -10],
        })
        .addTo(map);

      volMarkersRef.current.push(marker);

      // Animate toward user with staggered delay
      setTimeout(() => {
        const targetLat = userLocation.lat + (Math.random() - 0.5) * 0.001;
        const targetLng = userLocation.lng + (Math.random() - 0.5) * 0.001;
        animateMarker(
          marker,
          vol.currentLat, vol.currentLng,
          targetLat, targetLng,
          5000 + i * 800,
          () => {
            const markerEl = marker.getElement();
            if (markerEl) {
              const inner = markerEl.querySelector('.sw-vol-marker');
              if (inner) inner.textContent = '🟢';
            }
            arrivedCountRef.current++;
            if (arrivedCountRef.current === volunteers.length) {
              onVolunteerArrived?.();
            }
          }
        );
      }, 300 + i * 200);
    });
  }, [sosActive, volunteers, userLocation]);

  // Resize map when container changes
  useEffect(() => {
    const obs = new ResizeObserver(() => mapRef.current?.invalidateSize());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      />
    </div>
  );
}
