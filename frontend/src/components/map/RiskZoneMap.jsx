import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, Plus, X, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

if (!document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const ZONE_COLORS = {
  high:     { fill: 'rgba(214,40,40,0.18)',  stroke: '#D62828', label: '🔴 High Risk' },
  moderate: { fill: 'rgba(232,93,4,0.15)',   stroke: '#E85D04', label: '🟡 Moderate'  },
  low:      { fill: 'rgba(34,197,94,0.12)',  stroke: '#22c55e', label: '🟢 Safe Zone' },
};

export default function RiskZoneMap({ userLocation }) {
  const { theme }         = useTheme();
  const containerRef      = useRef(null);
  const mapRef            = useRef(null);
  const tileLayerRef      = useRef(null);
  const userMarkerRef     = useRef(null);
  const zoneLayersRef     = useRef([]);
  const LRef              = useRef(null);
  const [zones, setZones] = useState([]);
  const [reporting, setReporting]   = useState(false);
  const [reportPos, setReportPos]   = useState(null);
  const [riskLevel, setRiskLevel]   = useState('moderate');
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [inDanger, setInDanger]     = useState(null);
  const checkIntervalRef = useRef(null);

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then(mod => {
      LRef.current = mod.default || mod;
      initMap();
    });
  }, []);

  const initMap = () => {
    const L = LRef.current;
    if (!L || !containerRef.current || mapRef.current) return;
    const center = userLocation ? [userLocation.lat, userLocation.lng] : [21.1458, 79.0882];
    const map = L.map(containerRef.current, { center, zoom: 14, zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const tiles = L.tileLayer(theme === 'dark' ? DARK_TILES : LIGHT_TILES, {
      attribution: '© OSM © CARTO', maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tiles;
    mapRef.current = map;

    // Click to report zone
    map.on('click', e => {
      if (reporting) {
        setReportPos({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
  };

  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(theme === 'dark' ? DARK_TILES : LIGHT_TILES);
  }, [theme]);

  // Fetch nearby zones when location available
  useEffect(() => {
    if (!userLocation) return;
    fetchZones();
    // Check zone entry every 30 seconds
    checkIntervalRef.current = setInterval(() => checkZoneEntry(), 30000);
    return () => clearInterval(checkIntervalRef.current);
  }, [userLocation]);

  const fetchZones = async () => {
    if (!userLocation) return;
    try {
      const res = await api.get('/risk-zones', {
        params: { lat: userLocation.lat, lng: userLocation.lng, radius: 5000 }
      });
      setZones(res.data.zones || []);
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    }
  };

  const checkZoneEntry = async () => {
    if (!userLocation) return;
    try {
      const res = await api.post('/risk-zones/check-entry', {
        lat: userLocation.lat, lng: userLocation.lng
      });
      if (res.data.inDangerZone && !res.data.alreadyNotified) {
        setInDanger(res.data.zone);
        toast.error(`🚨 You entered HIGH RISK zone: ${res.data.zone.name}`, { duration: 8000 });
      }
    } catch {}
  };

  // Draw zone circles on map
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !zones.length) return;

    // Remove old circles
    zoneLayersRef.current.forEach(l => l.remove());
    zoneLayersRef.current = [];

    zones.forEach(zone => {
      const colors = ZONE_COLORS[zone.risk_level];

      // Outer glow circle
      const glow = L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 1.3,
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: 0.06,
        weight: 0,
      }).addTo(map);

      // Main zone circle
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: 1,
        weight: 2,
        dashArray: zone.risk_level === 'high' ? '6 4' : 'none',
      }).addTo(map);

      // Popup
      circle.bindPopup(`
        <div style="font-family:'Space Grotesk',sans-serif;padding:4px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">
            ${colors.label} — ${zone.name}
          </div>
          <div style="font-size:12px;color:#A0A0A0">${zone.description || ''}</div>
          ${zone.report_count > 1 ? `<div style="font-size:11px;margin-top:4px;color:#E85D04">⚠️ Reported ${zone.report_count} times</div>` : ''}
          ${zone.verified ? '<div style="font-size:11px;color:#22c55e;margin-top:2px">✓ Verified</div>' : '<div style="font-size:11px;color:#A0A0A0;margin-top:2px">User reported</div>'}
        </div>
      `, { className: 'zone-popup' });

      zoneLayersRef.current.push(glow, circle);
    });

    // Inject popup style
    if (!document.getElementById('zone-popup-css')) {
      const s = document.createElement('style');
      s.id = 'zone-popup-css';
      s.textContent = `
        .zone-popup .leaflet-popup-content-wrapper {
          background: #1A1A1A; color: #F5F5F5;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .zone-popup .leaflet-popup-tip { background: #1A1A1A; }
      `;
      document.head.appendChild(s);
    }
  }, [zones]);

  // User marker
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !userLocation) return;

    if (!document.getElementById('sw-pulse-css')) {
      const s = document.createElement('style');
      s.id = 'sw-pulse-css';
      s.textContent = `
        @keyframes pulseUser{0%,100%{box-shadow:0 0 0 4px rgba(232,93,4,0.4)}50%{box-shadow:0 0 0 14px rgba(232,93,4,0.05)}}
        .user-pin{width:18px;height:18px;background:#E85D04;border-radius:50%;border:3px solid #fff;animation:pulseUser 2s infinite}
        @keyframes pulseDanger{0%,100%{box-shadow:0 0 0 6px rgba(214,40,40,0.5)}50%{box-shadow:0 0 0 20px rgba(214,40,40,0.05)}}
        .user-pin.danger{background:#D62828;animation:pulseDanger 1s infinite}
      `;
      document.head.appendChild(s);
    }

    const el = document.createElement('div');
    el.className = `user-pin${inDanger ? ' danger' : ''}`;
    const icon = L.divIcon({ html: el, className: '', iconSize: [18,18], iconAnchor: [9,9] });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 }).addTo(map);
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1 });
    }
  }, [userLocation, inDanger]);

  // Report pin on map
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !reportPos) return;
    // Show temp marker
    const el = document.createElement('div');
    el.style.cssText = 'width:14px;height:14px;background:#E85D04;border-radius:50%;border:2px solid #fff';
    const icon = L.divIcon({ html: el, className: '', iconSize: [14,14], iconAnchor: [7,7] });
    const m = L.marker([reportPos.lat, reportPos.lng], { icon }).addTo(map);
    return () => m.remove();
  }, [reportPos]);

  const submitReport = async () => {
    if (!reportPos) { toast.error('Tap on the map to select location'); return; }
    try {
      await api.post('/risk-zones/report', {
        lat: reportPos.lat, lng: reportPos.lng,
        name: reportName || 'User Reported Zone',
        description: reportDesc,
        riskLevel: riskLevel,
      });
      toast.success('Zone reported! Thank you for keeping SafeWalk safe. 🛡️');
      setReporting(false);
      setReportPos(null);
      setReportName('');
      setReportDesc('');
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report zone');
    }
  };

  useEffect(() => {
    const obs = new ResizeObserver(() => mapRef.current?.invalidateSize());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Risk Zones</p>
        {Object.entries(ZONE_COLORS).map(([level, c]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.stroke, opacity: 0.9 }} />
            <span style={{ fontSize: 12, color: '#F5F5F5' }}>{c.label}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: '#A0A0A0', margin: '4px 0 0' }}>{zones.length} zones nearby</p>
      </div>

      {/* Danger banner */}
      {inDanger && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1001, background: '#D62828', color: '#fff',
          padding: '10px 20px', borderRadius: 'var(--r-full)',
          fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(214,40,40,0.5)',
          animation: 'fadeIn 0.4s ease',
        }}>
          <AlertTriangle size={16} />
          ⚠️ You are in a HIGH RISK zone — {inDanger.name}
          <button onClick={() => setInDanger(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Report button */}
      <button
        onClick={() => { setReporting(r => !r); setReportPos(null); }}
        style={{
          position: 'absolute', bottom: 80, right: 16, zIndex: 1000,
          background: reporting ? '#D62828' : 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 10, padding: '10px 14px',
          cursor: 'pointer', color: reporting ? '#fff' : 'var(--fg)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}>
        {reporting ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Report Zone</>}
      </button>

      {/* Report form */}
      {reporting && (
        <div style={{
          position: 'absolute', bottom: 130, right: 16, zIndex: 1001,
          background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: 16, width: 240,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#F5F5F5' }}>
            {reportPos ? '✅ Location selected' : '👆 Tap map to select location'}
          </p>

          <input
            placeholder="Zone name (optional)"
            value={reportName}
            onChange={e => setReportName(e.target.value)}
            style={{
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 10px', color: '#F5F5F5',
              fontFamily: 'var(--font)', fontSize: 13, outline: 'none',
            }}
          />

          <input
            placeholder="Description (optional)"
            value={reportDesc}
            onChange={e => setReportDesc(e.target.value)}
            style={{
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 10px', color: '#F5F5F5',
              fontFamily: 'var(--font)', fontSize: 13, outline: 'none',
            }}
          />

          {/* Risk level selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['high', 'moderate', 'low'].map(level => (
              <button key={level} onClick={() => setRiskLevel(level)} style={{
                flex: 1, padding: '7px 4px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: riskLevel === level
                  ? level === 'high' ? '#D62828' : level === 'moderate' ? '#E85D04' : '#22c55e'
                  : '#1A1A1A',
                color: '#fff', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
                textTransform: 'capitalize',
              }}>
                {level === 'high' ? '🔴' : level === 'moderate' ? '🟡' : '🟢'} {level}
              </button>
            ))}
          </div>

          <button onClick={submitReport} style={{
            background: '#E85D04', border: 'none', borderRadius: 8,
            padding: '10px', color: '#fff', fontFamily: 'var(--font)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Check size={14} /> Submit Report
          </button>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}
