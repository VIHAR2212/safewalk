import { useState, useEffect, useCallback } from 'react';
import { MapPin, Users, Activity, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/ui/Navbar';
import MapView from '../components/map/MapView';
import SOSButton from '../components/sos/SOSButton';
import VolunteerPanel from '../components/sos/VolunteerPanel';
import RiskPanel from '../components/dashboard/RiskPanel';
import { useUserLocation } from '../hooks/useLocation';
import api from '../services/api';

// phases: idle | active | arrived | safe
export default function DashboardPage() {
  const { location, locLoading, getLocation } = useUserLocation();
  const [sosStatus, setSosStatus] = useState('idle'); // idle | active
  const [emergencyId, setEmergencyId] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [volCount, setVolCount] = useState(0);
  const [volPhase, setVolPhase] = useState(null); // dispatched | arrived | safe
  const [sidePanel, setSidePanel] = useState('risk'); // risk | sos
  const [sosLoading, setSosLoading] = useState(false);

  // Get location on mount
  useEffect(() => { getLocation(); }, []);

  // Fetch volunteer count (not locations — privacy)
  useEffect(() => {
    api.get('/volunteers').then(r => setVolCount(r.data.availableCount)).catch(() => {});
    const iv = setInterval(() => {
      api.get('/volunteers').then(r => setVolCount(r.data.availableCount)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // Check for active emergency on load
  useEffect(() => {
    api.get('/sos/active').then(r => {
      if (r.data.emergency) {
        setSosStatus('active');
        setEmergencyId(r.data.emergency.id);
        setVolPhase('dispatched');
        setSidePanel('sos');
        const vols = r.data.assignments?.map(a => ({
          id: a.volunteer_id,
          name: a.volunteers?.users?.name || 'Volunteer',
          isVerified: a.volunteers?.is_verified,
          rating: a.volunteers?.rating,
          distance: '?',
          currentLat: a.volunteers?.last_lat || location?.lat || 21.1458,
          currentLng: a.volunteers?.last_lng || location?.lng || 79.0882,
        })) || [];
        setVolunteers(vols);
      }
    }).catch(() => {});
  }, []);

  const handleSOS = useCallback(async () => {
    if (!location) { toast.error('Getting your location...'); getLocation(); return; }
    setSosLoading(true);
    try {
      const res = await api.post('/sos', { lat: location.lat, lng: location.lng });
      const { emergency, volunteers: vols, message } = res.data;
      setEmergencyId(emergency.id);
      setSosStatus('active');
      setVolunteerList(vols);
      setVolPhase('dispatched');
      setSidePanel('sos');
      if (vols.length === 0) {
        toast(message || 'No volunteers nearby. Stay safe — authorities alerted.', { icon: '⚠️', duration: 6000 });
      } else {
        toast.success(`SOS triggered! ${vols.length} volunteer(s) dispatched.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'SOS failed. Try again.');
    } finally {
      setSosLoading(false);
    }
  }, [location]);

  const setVolunteerList = (vols) => {
    setVolunteers(vols.map(v => ({
      ...v,
      currentLat: v.currentLat || (location?.lat || 21.1458) + (Math.random() - 0.5) * 0.02,
      currentLng: v.currentLng || (location?.lng || 79.0882) + (Math.random() - 0.5) * 0.02,
    })));
  };

  const handleVolunteerArrived = useCallback(() => {
    setVolPhase('arrived');
    toast('🟢 Volunteer is with you!', { duration: 5000, style: { background: '#1A1A1A', color: '#F5F5F5' } });
    setTimeout(() => setVolPhase('safe'), 4000);
  }, []);

  const handleResolve = useCallback(async () => {
    if (!emergencyId) return;
    try {
      await api.post('/sos/resolve', { emergencyId });
      setSosStatus('idle');
      setEmergencyId(null);
      setVolunteers([]);
      setVolPhase(null);
      setSidePanel('risk');
      toast.success('You are safe now. Emergency resolved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resolve. Try again.');
    }
  }, [emergencyId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Navbar volunteerCount={volCount} />

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar */}
        <aside style={{
          width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}>
          {/* Status bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sosStatus === 'active' ? '#D62828' : '#22c55e', animation: sosStatus === 'active' ? 'sosGlow 1.5s infinite' : 'none' }} />
              <style>{`@keyframes sosGlow{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              <span style={{ fontSize: 13, fontWeight: 600, color: sosStatus === 'active' ? '#D62828' : 'var(--fg)' }}>
                {sosStatus === 'active' ? 'EMERGENCY ACTIVE' : 'All Clear'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> {volCount} online
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {location ? 'Located' : locLoading ? 'Locating...' : 'No location'}
              </div>
            </div>
          </div>

          {/* SOS button section */}
          <div style={{ padding: '28px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
            {sosLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ width: 32, height: 32, border: '3px solid var(--bg-raised)', borderTop: '3px solid #D62828', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Alerting volunteers...</p>
              </div>
            ) : (
              <SOSButton
                status={sosStatus}
                onSOS={handleSOS}
                onResolve={handleResolve}
              />
            )}
          </div>

          {/* Panel tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            {['risk', 'sos'].map(p => (
              <button key={p} onClick={() => setSidePanel(p)} style={{
                flex: 1, padding: '10px', border: 'none', background: 'transparent',
                borderBottom: sidePanel === p ? '2px solid var(--accent)' : '2px solid transparent',
                color: sidePanel === p ? 'var(--accent)' : 'var(--fg-muted)',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
                transition: 'color var(--t-fast)',
              }}>
                {p === 'risk' ? '⚠ Risk' : '🚨 Response'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px' }}>
            {sidePanel === 'risk' && <RiskPanel />}
            {sidePanel === 'sos' && (
              sosStatus === 'active'
                ? <VolunteerPanel volunteers={volunteers} phase={volPhase} />
                : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                    <Activity size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ fontSize: 13 }}>No active emergency. Hold the SOS button if you need help.</p>
                  </div>
                )
            )}
          </div>
        </aside>

        {/* Map */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapView
            userLocation={location}
            volunteers={volunteers}
            sosActive={sosStatus === 'active'}
            onVolunteerArrived={handleVolunteerArrived}
          />

          {/* SOS active overlay banner */}
          {sosStatus === 'active' && volPhase === 'safe' && (
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              background: '#D62828', color: '#fff', padding: '12px 24px',
              borderRadius: 'var(--r-full)', fontWeight: 700, fontSize: 15,
              boxShadow: '0 4px 20px rgba(214,40,40,0.5)',
              animation: 'fadeIn 0.5s ease',
              zIndex: 10,
            }}>
              ✅ You are safe now — tap RESOLVE to close
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
            </div>
          )}

          {/* Location button */}
          <button onClick={getLocation} style={{
            position: 'absolute', bottom: 80, right: 16,
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--r-md)', padding: '10px 14px', cursor: 'pointer',
            color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            zIndex: 5,
          }}>
            <MapPin size={14} color="var(--accent)" /> My Location
          </button>
        </main>
      </div>
    </div>
  );
}
