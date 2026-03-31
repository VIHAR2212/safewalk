import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
 
const animateMarker = (marker, fromLat, fromLng, toLat, toLng, durationMs = 4000, onComplete) => {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    marker.setLatLng([fromLat + (toLat - fromLat) * ease, fromLng + (toLng - fromLng) * ease]);
    if (t < 1) requestAnimationFrame(step);
    else onComplete?.();
  };
  requestAnimationFrame(step);
};
 
const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
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
  const [leafletReady, setLeafletReady] = useState(false);
 
  // Inject Leaflet CSS
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('sw-map-css')) {
      const s = document.createElement('style');
      s.id = 'sw-map-css';
      s.textContent = `
        @keyframes pulse-user { 0%,100%{box-shadow:0 0 0 4px rgba(232,93,4,0.35)} 50%{box-shadow:0 0 0 12px rgba(232,93,4,0.05)} }
        @keyframes pulse-sos  { 0%,100%{box-shadow:0 0 0 6px rgba(214,40,40,0.45)} 50%{box-shadow:0 0 0 20px rgba(214,40,40,0.05)} }
        .sw-user-marker { width:20px;height:20px;background:#E85D04;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(232,93,4,0.35);animation:pulse-user 2s infinite }
        .sw-user-marker.sos { background:#D62828;animation:pulse-sos 1.2s infinite }
        .sw-vol-marker { width:36px;height:36px;background:#1A1A1A;border:2px solid #E85D04;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4) }
        .leaflet-container:focus { outline:none }
        .leaflet-popup-content-wrapper { font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;border-radius:8px!important }
      `;
      document.head.appendChild(s);
    }
  }, []);
 
  // Dynamically import leaflet npm package
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      if (cancelled) return;
      const L = mod.default || mod;
      // Fix broken marker icons from bundler
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      window._L = L;
      setLeafletReady(true);
    });
    return () => { cancelled = true; };
  }, []);
 
  // Init map
  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return;
    const L = window._L;
    const center = userLocation ? [userLocation.lat, userLocation.lng] : [21.1458, 79.0882];
    const map = L.map(containerRef.current, { center, zoom: 14, zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const tiles = L.tileLayer(theme === 'dark' ? DARK_TILES : LIGHT_TILES, { attribution: ATTRIBUTION, maxZoom: 19 });
    tiles.addTo(map);
    tileLayerRef.current = tiles;
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null; tileLayerRef.current = null;
      userMarkerRef.current = null; volMarkersRef.current = [];
    };
  }, [leafletReady]);
 
  // Theme swap
  useEffect(() => {
    const L = window._L; const map = mapRef.current;
    if (!L || !map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);
    const tiles = L.tileLayer(theme === 'dark' ? DARK_TILES : LIGHT_TILES, { attribution: ATTRIBUTION, maxZoom: 19 });
    tiles.addTo(map);
    tileLayerRef.current = tiles;
  }, [theme]);
 
  // User marker
  useEffect(() => {
    const L = window._L; const map = mapRef.current;
    if (!L || !map || !userLocation) return;
    const el = document.createElement('div');
    el.className = `sw-user-marker${sosActive ? ' sos' : ''}`;
    const icon = L.divIcon({ html: el, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      const dot = userMarkerRef.current.getElement()?.querySelector('.sw-user-marker');
      if (dot) sosActive ? dot.classList.add('sos') : dot.classList.remove('sos');
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    }
    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
  }, [userLocation, sosActive]);
 
  // Volunteer markers
  useEffect(() => {
    const L = window._L; const map = mapRef.current;
    if (!L || !map) return;
    volMarkersRef.current.forEach(m => m.remove());
    volMarkersRef.current = []; arrivedCountRef.current = 0;
    if (!sosActive || !volunteers?.length || !userLocation) return;
    volunteers.forEach((vol, i) => {
      const el = document.createElement('div');
      el.className = 'sw-vol-marker'; el.textContent = '🚶';
      const icon = L.divIcon({ html: el, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
      const marker = L.marker([vol.currentLat, vol.currentLng], { icon })
        .bindPopup(`<b>${vol.name}${vol.isVerified ? ' ✓' : ''}</b> — ${vol.distance}km`, { closeButton: false, offset: [0, -10] })
        .addTo(map);
      volMarkersRef.current.push(marker);
      setTimeout(() => {
        const tLat = userLocation.lat + (Math.random() - 0.5) * 0.001;
        const tLng = userLocation.lng + (Math.random() - 0.5) * 0.001;
        animateMarker(marker, vol.currentLat, vol.currentLng, tLat, tLng, 5000 + i * 800, () => {
          const inner = marker.getElement()?.querySelector('.sw-vol-marker');
          if (inner) inner.textContent = '🟢';
          arrivedCountRef.current++;
          if (arrivedCountRef.current === volunteers.length) onVolunteerArrived?.();
        });
      }, 300 + i * 200);
    });
  }, [sosActive, volunteers, userLocation]);
 
  // Resize
  useEffect(() => {
    const obs = new ResizeObserver(() => mapRef.current?.invalidateSize());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);
 
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
      {!leafletReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-raised)', borderRadius: 'inherit' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--bg)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
 
