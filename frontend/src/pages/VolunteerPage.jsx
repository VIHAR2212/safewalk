import { useState, useEffect } from 'react';
import { Shield, MapPin, Activity, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/ui/Navbar';
import MapView from '../components/map/MapView';
import api from '../services/api';
import { useUserLocation } from '../hooks/useLocation';

export default function VolunteerPage() {
  const { location, getLocation } = useUserLocation();
  const [profile, setProfile] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    api.get('/volunteers/profile')
      .then(r => { if (r.data) { setProfile(r.data); setAvailable(r.data.is_available); }})
      .catch(() => {});
  }, []);

  // Push location to backend every 30s when available
  useEffect(() => {
    if (!location || !available) return;
    const push = () => api.patch('/volunteers/location', { lat: location.lat, lng: location.lng }).catch(() => {});
    push();
    const iv = setInterval(push, 30000);
    return () => clearInterval(iv);
  }, [location, available]);

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      const next = !available;
      await api.patch('/volunteers/availability', { isAvailable: next });
      setAvailable(next);
      toast.success(next ? 'You are now available for dispatch' : 'You are now offline');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Volunteer sidebar */}
        <aside style={{ width: 300, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, background: 'var(--bg-raised)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🚶</div>
              <div>
                <p style={{ fontWeight: 600 }}>Volunteer Dashboard</p>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {profile?.is_verified ? '✓ Verified' : 'Unverified'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[
                { icon: <Activity size={14} />, label: 'Total Assists', val: profile?.total_assists ?? 0 },
                { icon: <Star size={14} />, label: 'Rating', val: profile?.rating ?? '—' },
                { icon: <MapPin size={14} />, label: 'Location', val: location ? 'Active' : 'Pending' },
                { icon: <Shield size={14} />, label: 'Status', val: available ? 'Online' : 'Offline' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--fg-muted)', marginBottom: 4 }}>
                    {s.icon} <span style={{ fontSize: 11 }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Availability toggle */}
            <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>Availability</p>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{available ? 'Ready for dispatch' : 'Currently offline'}</p>
              </div>
              <button onClick={toggleAvailability} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: available ? 'var(--accent)' : 'var(--fg-muted)', transition: 'color var(--t-fast)' }}>
                {available ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            {/* Info */}
            <div style={{ marginTop: 20, padding: '14px', background: 'rgba(232,93,4,0.08)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)' }}>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                When a user triggers SOS near you, you'll receive a notification (WhatsApp/SMS). Accept and head to their location. Your location is only shared with the system when you're available.
              </p>
            </div>
          </div>
        </aside>

        {/* Map */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapView userLocation={location} volunteers={[]} sosActive={false} />
          <div style={{ position: 'absolute', top: 16, left: 16, background: available ? 'var(--accent)' : 'var(--bg-surface)', color: available ? '#fff' : 'var(--fg-muted)', padding: '8px 16px', borderRadius: 'var(--r-full)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            {available ? '🟢 You are visible to the system' : '⚫ You are offline'}
          </div>
        </main>
      </div>
    </div>
  );
}
