import { useState, useEffect } from 'react';
import { Shield, MapPin, Activity, ToggleLeft, ToggleRight, Star, Award, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/ui/Navbar';
import MapView from '../components/map/MapView';
import api from '../services/api';
import { useUserLocation } from '../hooks/useLocation';

// NEW: Helper function to determine the Volunteer Tier
const getVolunteerTier = (assists, rating) => {
  if (assists >= 150 && rating >= 4.8) return { name: 'Guardian', color: '#8b5cf6', icon: '💎' }; // Purple
  if (assists >= 50 && rating >= 4.5) return { name: 'Gold', color: '#eab308', icon: '🏆' }; // Yellow
  if (assists >= 11 && rating >= 4.2) return { name: 'Silver', color: '#94a3b8', icon: '🛡️' }; // Gray
  return { name: 'Bronze', color: '#d97706', icon: '🥉' }; // Bronze/Orange
};

// NEW: Helper function to format the join date
const formatJoinDate = (dateString) => {
  if (!dateString) return 'Recent';
  const options = { year: 'numeric', month: 'short' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

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

  // Calculate stats
  const assists = profile?.total_assists ?? 0;
  const rating = profile?.rating ?? 0;
  const tier = getVolunteerTier(assists, rating);
  const joinDate = formatJoinDate(profile?.created_at); // Ensure your backend sends created_at!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Volunteer sidebar */}
        <aside style={{ width: 300, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', overflowY: 'auto' }}>
            
            {/* Header with Tier Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, background: 'var(--bg-raised)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {tier.icon}
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Volunteer Dashboard</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                   <span style={{ fontSize: 11, background: tier.color, color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                     {tier.name}
                   </span>
                   <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                     {profile?.is_verified ? '✓ Verified' : 'Unverified'}
                   </span>
                </div>
              </div>
            </div>
                                     {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[
                { icon: <Activity size={14} />, label: 'Helped', val: assists },
                { icon: <Star size={14} />, label: 'Rating', val: rating || '—' },
                { icon: <Calendar size={14} />, label: 'Joined', val: joinDate },
                { icon: <Shield size={14} />, label: 'Status', val: available ? 'Online' : 'Offline' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--fg-muted)', marginBottom: 4 }}>
                    {s.icon} <span style={{ fontSize: 11 }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Level Up Progress Bar */}
            <div style={{ marginBottom: 20, padding: '12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                 <span style={{ color: 'var(--fg-muted)' }}>Next Tier Progress</span>
                 <span style={{ fontWeight: 'bold', color: tier.color }}>{assists} Assists</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                 <div style={{ width: `${Math.min((assists / 50) * 100, 100)}%`, height: '100%', background: tier.color, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 6, textAlign: 'center' }}>
                Keep responding to emergencies to level up!
              </p>
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
          <div style={{ position: 'absolute', top: 16, left: 16, background: available ? 'var(--accent)' : 'var(--bg-surface)', color: available ? '#fff' : 'var(--fg-muted)', padding: '8px 16px', borderRadius: 'var(--r-full)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border-color)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', zIndex: 1000 }}>
            {available ? '🟢 You are visible to the system' : '⚫ You are offline'}
          </div>
        </main>
      </div>
    </div>
  );
}
