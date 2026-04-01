import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

// Inject Leaflet CSS once
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

// Fetch road route from OSRM (free, no key needed)
const fetchRoute = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      // Returns array of [lat, lng] waypoints along the road
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (e) {
    console.warn('OSRM routing failed, using straight line:', e);
  }
  // Fallback: straight line with midpoint
  return [
    [fromLat, fromLng],
    [(fromLat + toLat) / 2, (fromLng + toLng) / 2],
    [toLat, toLng],
  ];
};

// Animate marker along an array of [lat,lng] waypoints
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
  const containerRef   = useRef(null);
  const mapRef         = useRef(null);
  const tileLayerRef   = useRef(null);
  const userMarkerRef  = useRef(null);
  const volMarkersRef  = useRef([]);
  const routeLinesRef  = useRef([]);
  const arrivedRef     = useRef(0);
  const LRef           = useRef(null);

  // Load Leaflet dynamically
  useEffect(() => {
    import('leaflet').then((L) => {
      LRef.current = L.default || L;
      initMap();
    });
  }, []);

  const initMap = () => {
    const L = LRef.current;
    if (!L || !containerRef.current || mapRef.current) return;

    const center = userLocation ? [userLocation.lat, userLocation.lng] : [21.1458, 79.0882];

    const map = L.map(containerRef.current, {
      center, zoom: 15, zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tiles = L.tileLayer(theme === 'dark' ? DARK_TILES : LIGHT_TILES, {
      attribution: ATTRIBUTION, maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapRef.current = map;
  };

  // Theme swap
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(theme === 'dark' ? DARK_TILES : LIGHT_TILES);
  }, [theme]);

  // Inject CSS animations once
  useEffect(() => {
    if (document.getElementById('sw-map-css')) return;
    const s = document.createElement('style');
    s.id = 'sw-map-css';
    s.textContent = `
      @keyframes pulse-user {
        0%,100% { box-shadow: 0 0 0 4px rgba(232,93,4,0.4); }
        50%      { box-shadow: 0 0 0 12px rgba(232,93,4,0.05); }
      }
      @keyframes pulse-sos {
        0%,100% { box-shadow: 0 0 0 6px rgba(214,40,40,0.5); }
        50%      { box-shadow: 0 0 0 20px rgba(214,40,40,0.05); }
      }
      .vol-marker {
        width:38px; height:38px; background:#1A1A1A;
        border:2.5px solid #E85D04; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:19px; box-shadow:0 2px 10px rgba(0,0,0,0.5);
      }
      .vol-marker.arrived { border-color:#22c55e; }
      .user-dot {
        width:18px; height:18px; background:#E85D04;
        border-radius:50%; border:3px solid #fff;
        animation: pulse-user 2s infinite;
      }
      .user-dot.sos {
        background:#D62828;
        animation: pulse-sos 1.5s infinite;
      }
      .sw-popup .leaflet-popup-content-wrapper {
        background:#1A1A1A; color:#F5F5F5;
        border:1px solid rgba(255,255,255,0.1);
        border-radius:8px; font-family:'Space Grotesk',sans-serif;
        font-size:13px; font-weight:600;
      }
      .sw-popup .leaflet-popup-tip { background:#1A1A1A; }
    `;
    document.head.appendChild(s);
  }, []);

  // User location marker
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !userLocation) return;

    const el = document.createElement('div');
    el.className = `user-dot${sosActive ? ' sos' : ''}`;

    const icon = L.divIcon({ html: el, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      // Update class for SOS pulse
      userMarkerRef.current.getElement()?.querySelector('div')?.classList.toggle('sos', sosActive);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    }

    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
  }, [userLocation, sosActive]);

  // Volunteer markers + OSRM road routing
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Clean up previous volunteer markers and route lines
    volMarkersRef.current.forEach(m => m.remove());
    routeLinesRef.current.forEach(l => l.remove());
    volMarkersRef.current = [];
    routeLinesRef.current = [];
    arrivedRef.current = 0;

    if (!sosActive || !volunteers?.length || !userLocation) return;

    volunteers.forEach((vol, i) => {
      // Create volunteer marker element
      const el = document.createElement('div');
      el.className = 'vol-marker';
      el.textContent = '🚶';

      const icon = L.divIcon({ html: el, className: '', iconSize: [38, 38], iconAnchor: [19, 19] });

      const marker = L.marker([vol.currentLat, vol.currentLng], { icon })
        .bindPopup(
          `<b>${vol.name}${vol.isVerified ? ' ✓' : ''}</b><br>⭐ ${vol.rating} &nbsp;📍 ${vol.distance} km`,
          { className: 'sw-popup', closeButton: false }
        )
        .addTo(map);

      volMarkersRef.current.push(marker);

      // Draw dashed route preview line
      const routeLine = L.polyline(
        [[vol.currentLat, vol.currentLng], [userLocation.lat, userLocation.lng]],
        { color: '#E85D04', weight: 2, opacity: 0.3, dashArray: '6 8' }
      ).addTo(map);
      routeLinesRef.current.push(routeLine);

      // After stagger delay: fetch real road route then animate along it
      setTimeout(async () => {
        const targetLat = userLocation.lat + (Math.random() - 0.5) * 0.0005;
        const targetLng = userLocation.lng + (Math.random() - 0.5) * 0.0005;

        // Fetch road waypoints from OSRM
        const waypoints = await fetchRoute(vol.currentLat, vol.currentLng, targetLat, targetLng);

        // Update route line to actual road path
        routeLine.setLatLngs(waypoints);
        routeLine.setStyle({ opacity: 0.5 });

        // Animate marker along road
        animateAlongRoute(marker, waypoints, 6000 + i * 1000, () => {
          el.textContent = '🟢';
          el.classList.add('arrived');
          routeLine.setStyle({ color: '#22c55e', opacity: 0.4 });
          arrivedRef.current++;
          if (arrivedRef.current === volunteers.length) {
            onVolunteerArrived?.();
          }
        });
      }, 400 + i * 300);
    });
  }, [sosActive, volunteers, userLocation]);

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(() => mapRef.current?.invalidateSize());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
    </div>
  );
}
