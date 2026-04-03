import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

if (!document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>';

// Extended bounds: Mumbai + Vasai + Virar + Palghar + Thane + Navi Mumbai
const BOUNDS = [
  [18.8500, 72.7500], // SW — Below Colaba
  [20.2000, 73.4000], // NE — Covers Vasai, Virar, Palghar
];
const DEFAULT_CENTER = [19.2900, 72.8500];

const randomNearby = (lat, lng, minKm = 0.3, maxKm = 1.8) => {
  const r = (minKm + Math.random() * (maxKm - minKm)) / 111;
  const a = Math.random() * 2 * Math.PI;
  return [lat + r * Math.cos(a), lng + r * Math.sin(a)];
};

const fetchRoute = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (e) {
    console.warn('OSRM failed, straight line fallback');
  }
  return [[fromLat, fromLng], [(fromLat + toLat) / 2, (fromLng + toLng) / 2], [toLat, toLng]];
};

const animateAlongRoute = (marker, waypoints, durationMs, onComplete) => {
  if (!waypoints?.length) { onComplete?.(); return; }
  const total = waypoints.length - 1;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const idx = eased * total;
    const i = Math.min(Math.floor(idx), total - 1);
    const frac = idx - i;
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[Math.min(i + 1, total)];
    marker.setLatLng([lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac]);
    if (t < 1) requestAnimationFrame(step);
    else { marker.setLatLng(waypoints[total]); onComplete?.(); }
  };
  requestAnimationFrame(step);
};

export default function MapView({ userLocation, volunteers, sosActive, onVolunteerArrived }) {
  const { theme } = useTheme();
  const containerRef       = useRef(null);
  const mapRef             = useRef(null);
  const tileLayerRef       = useRef(null);
  const userMarkerRef      = useRef(null);
  const allVolMarkersRef   = useRef([]);
  const allVolPositionsRef = useRef([]);
  const routeLinesRef      = useRef([]);
  const arrivedRef         = useRef(0);
  const LRef               = useRef(null);

  useEffect(() => {
    import('leaflet').then((mod) => {
      LRef.current = mod.default || mod;
      initMap();
    });
  }, []);

  const initMap = () => {
    const L = LRef.current;
    if (!L || !containerRef.current || mapRef.current) return;

    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: userLocation ? 15 : 10,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      maxBounds: BOUNDS,
      maxBoundsViscosity: 1.0,
      // Mobile touch optimizations
      tap: true,
      tapTolerance: 15,
      touchZoom: true,
      bounceAtZoomLimits: false,
    });

    // Move zoom control to bottom right (thumb friendly)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tiles = L.tileLayer(theme === 'dark' ? DARK_TILES : LIGHT_TILES, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
      // Better tile loading on mobile
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 2,
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapRef.current = map;
  };

  // Theme swap
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(theme === 'dark' ? DARK_TILES : LIGHT_TILES);
  }, [theme]);

  // Inject CSS
  useEffect(() => {
    if (document.getElementById('sw-map-css')) return;
    const s = document.createElement('style');
    s.id = 'sw-map-css';
    s.textContent = `
      @keyframes pulse-user {
        0%,100%{box-shadow:0 0 0 4px rgba(232,93,4,0.4)}
        50%{box-shadow:0 0 0 14px rgba(232,93,4,0.05)}
      }
      @keyframes pulse-sos {
        0%,100%{box-shadow:0 0 0 6px rgba(214,40,40,0.5)}
        50%{box-shadow:0 0 0 20px rgba(214,40,40,0.05)}
      }
      @keyframes pulse-idle {
        0%,100%{opacity:0.65;transform:scale(1)}
        50%{opacity:1;transform:scale(1.2)}
      }
      .user-dot{
        width:18px;height:18px;background:#E85D04;
        border-radius:50%;border:3px solid #fff;
        animation:pulse-user 2s infinite;
      }
      .user-dot.sos{background:#D62828;animation:pulse-sos 1.5s infinite;}
      .vol-idle{
        width:13px;height:13px;background:#E85D04;
        border-radius:50%;border:2px solid rgba(255,255,255,0.5);
        animation:pulse-idle 3s infinite;cursor:pointer;
      }
      .vol-idle.dispatched{
        width:44px;height:44px;background:#1A1A1A;
        border:2.5px solid #E85D04;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.5);
        animation:none;
      }
      .vol-idle.arrived{border-color:#22c55e;}
      .vol-idle.idle-during-sos{opacity:0.3;filter:grayscale(1);}
      .sw-popup .leaflet-popup-content-wrapper{
        background:#1A1A1A;color:#F5F5F5;
        border:1px solid rgba(255,255,255,0.1);border-radius:10px;
        font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;
      }
      .sw-popup .leaflet-popup-tip{background:#1A1A1A;}
      .idle-popup .leaflet-popup-content-wrapper{
        background:#1A1A1A;color:#A0A0A0;
        border:1px solid rgba(255,255,255,0.06);border-radius:8px;
        font-family:'Space Grotesk',sans-serif;font-size:12px;
      }
      .idle-popup .leaflet-popup-tip{background:#1A1A1A;}
      /* Mobile: bigger tap targets */
      @media(max-width:768px){
        .vol-idle{ width:16px;height:16px; }
        .leaflet-control-zoom a{ width:36px;height:36px;line-height:36px;font-size:18px; }
        .leaflet-popup-content{ margin:10px 14px; }
      }
    `;
    document.head.appendChild(s);
  }, []);

  // User marker
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !userLocation) return;

    const el = document.createElement('div');
    el.className = `user-dot${sosActive ? ' sos' : ''}`;
    const icon = L.divIcon({ html: el, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      const dotEl = userMarkerRef.current.getElement()?.firstChild;
      if (dotEl) dotEl.className = `user-dot${sosActive ? ' sos' : ''}`;
    } else {
      userMarkerRef.current = L.marker(
        [userLocation.lat, userLocation.lng],
        { icon, zIndexOffset: 1000 }
      ).addTo(map);
    }
    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
  }, [userLocation, sosActive]);

  // Spawn idle volunteer dots
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !userLocation || allVolMarkersRef.current.length > 0) return;

    const COUNT = 6;
    for (let i = 0; i < COUNT; i++) {
      const [lat, lng] = randomNearby(userLocation.lat, userLocation.lng, 0.3, 2.0);
      allVolPositionsRef.current.push({ lat, lng });

      const el = document.createElement('div');
      el.className = 'vol-idle';

      const icon = L.divIcon({ html: el, className: '', iconSize: [13, 13], iconAnchor: [6, 6] });

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 200 })
        .bindPopup('🛡️ Volunteer nearby', { className: 'idle-popup', closeButton: false })
        .addTo(map);

      allVolMarkersRef.current.push(marker);
    }
  }, [userLocation]);

  // SOS — upgrade markers + road routing
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    routeLinesRef.current.forEach(l => l.remove());
    routeLinesRef.current = [];
    arrivedRef.current = 0;

    if (!sosActive) {
      allVolMarkersRef.current.forEach((marker, idx) => {
        const el = marker.getElement()?.firstChild;
        if (el) { el.className = 'vol-idle'; el.textContent = ''; }
        marker.unbindPopup();
        const pos = allVolPositionsRef.current[idx];
        if (pos) marker.setLatLng([pos.lat, pos.lng]);
        marker.bindPopup('🛡️ Volunteer nearby', { className: 'idle-popup', closeButton: false });
      });
      return;
    }

    if (!volunteers?.length || !userLocation) return;

    const getMapTier = (assists, rating) => {
      if (assists >= 150 && rating >= 4.8) return { name: 'Guardian', color: '#8b5cf6' };
      if (assists >= 50  && rating >= 4.5) return { name: 'Gold',     color: '#eab308' };
      if (assists >= 11  && rating >= 4.2) return { name: 'Silver',   color: '#94a3b8' };
      return { name: 'Bronze', color: '#d97706' };
    };

    allVolMarkersRef.current.forEach((marker) => {
      const el = marker.getElement()?.firstChild;
      if (el) el.classList.add('idle-during-sos');
    });

    volunteers.forEach((vol, i) => {
      const marker = allVolMarkersRef.current[i];
      if (!marker) return;

      const tier = getMapTier(vol.total_assists || 0, vol.rating || 0);
      marker.setLatLng([vol.currentLat, vol.currentLng]);

      const el = marker.getElement()?.firstChild;
      if (el) {
        el.className = 'vol-idle dispatched';
        el.textContent = '🚶';
        el.classList.remove('idle-during-sos');
      }

      marker.unbindPopup();
      marker.bindPopup(`
        <div style="padding:4px;min-width:140px;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:6px;">
            <strong style="font-size:14px;">
              ${vol.name} ${vol.isVerified ? '<span style="color:#22c55e">✓</span>' : ''}
            </strong>
            <span style="font-size:10px;background:${tier.color};color:white;padding:2px 6px;border-radius:4px;font-weight:bold;">
              ${tier.name}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#A0A0A0;">
            <span>⭐ ${vol.rating || '?'}</span>
            <span>📍 ${vol.distance || '?'} km</span>
          </div>
        </div>
      `, { className: 'sw-popup', closeButton: false });

      const routeLine = L.polyline(
        [[vol.currentLat, vol.currentLng], [userLocation.lat, userLocation.lng]],
        { color: '#E85D04', weight: 2.5, opacity: 0.35, dashArray: '6 8' }
      ).addTo(map);
      routeLinesRef.current.push(routeLine);

      setTimeout(async () => {
        const targetLat = userLocation.lat + (Math.random() - 0.5) * 0.0004;
        const targetLng = userLocation.lng + (Math.random() - 0.5) * 0.0004;
        const waypoints = await fetchRoute(vol.currentLat, vol.currentLng, targetLat, targetLng);
        routeLine.setLatLngs(waypoints);
        routeLine.setStyle({ opacity: 0.6 });
        animateAlongRoute(marker, waypoints, 6000 + i * 1000, () => {
          const el2 = marker.getElement()?.firstChild;
          if (el2) { el2.textContent = '🟢'; el2.classList.add('arrived'); }
          routeLine.setStyle({ color: '#22c55e', opacity: 0.4 });
          arrivedRef.current++;
          if (arrivedRef.current === volunteers.length) onVolunteerArrived?.();
        });
      }, 400 + i * 300);
    });
  }, [sosActive, volunteers, userLocation]);

  // Resize observer — critical for mobile
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
        }}
      />
    </div>
  );
}
