import { useState, useEffect, useCallback } from 'react';
import { MapPin, Users, Activity, X, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/ui/Navbar';
import MapView from '../components/map/MapView';
import SOSButton from '../components/sos/SOSButton';
import RiskPanel from '../components/dashboard/RiskPanel';
import VolunteerPanel from '../components/sos/VolunteerPanel';
import ForumPanel from '../components/dashboard/ForumPanel';
import { useUserLocation } from '../hooks/useLocation';
import api from '../services/api';

export default function DashboardPage() {
  const { location, locLoading, getLocation } = useUserLocation();
  const [sosStatus, setSosStatus] = useState('idle');
  const [emergencyId, setEmergencyId] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [volCount, setVolCount] = useState(0);
  const [volPhase, setVolPhase] = useState(null);
  const [sidePanel, setSidePanel] = useState('risk');
  const [sosLoading, setSosLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    api.get('/volunteers').then(r => setVolCount(r.data.availableCount)).catch(() => {});
    const iv = setInterval(() => {
      api.get('/volunteers').then(r => setVolCount(r.data.availableCount)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    api.get('/sos/active').then(r => {
      if (!r.data.emergency) return;
      const triggered = new Date(r.data.emergency.triggered_at);
      const ageMinutes = (Date.now() - triggered) / 1000 / 60;
      if (ageMinutes > 30) {
        api.post('/sos/resolve', { emergencyId: r.data.emergency.id }).catch(() => {});
        return;
      }
      setSosStatus('active');
      setEmergencyId(r.data.emergency.id);
      setVolPhase('dispatched');
      setSidePanel('sos');
      setIsMobileMenuOpen(true);
      const vols = (r.data.assignments || []).map(a => ({
        id: a.volunteer_id,
        name: a.volunteers?.users?.name || 'Volunteer',
        isVerified: a.volunteers?.is_verified,
        rating: a.volunteers?.rating,
        distance: '?',
        currentLat: a.volunteers?.last_lat || 19.0760,
        currentLng: a.volunteers?.last_lng || 72.8777,
      }));
      setVolunteers(vols);
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
      if (!vols || vols.length === 0) {
        toast(message || 'No volunteers nearby. Stay safe.', { icon: '⚠️', duration: 6000 });
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
    setVolunteers((vols || []).map(v => ({
      ...v,
      currentLat: v.currentLat || (location?.lat || 19.0760) + (Math.random() - 0.5) * 0.02,
      currentLng: v.currentLng || (location?.lng || 72.8777) + (Math.random() - 0.5) * 0.02,
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
      setIsMobileMenuOpen(false);
      toast.success('You are safe now. Emergency resolved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resolve. Try again.');
    }
  }, [emergencyId]);

  const sidebarStyle = {
    width: isMobile ? '85vw' : 300,
    maxWidth: isMobile ? '400px' : 'none',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-color)',
    overflow: 'hidden',
    position: isMobile ? 'absolute' : 'relative',
    top: 0, bottom: 0, left: 0,
    zIndex: 1000,
    transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
    transition: 'transform 0.3s ease-in-out',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <Navbar volunteerCount={volCount} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Mobile backdrop */}
        {isMobile && isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }}
          />
        )}

        {/* Sidebar */}
        <aside style={sidebarStyle}>

          {/* Mobile close button */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 15px', borderBottom: '1px solid var(--border-color)' }}>
              <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={24} />
              </button>
            </div>
          )}

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

          {/* SOS button — desktop only in sidebar */}
          {!isMobile && (
            <div style={{ padding: '28px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
              {sosLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid var(--bg-raised)', borderTop: '3px solid #D62828', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Alerting volunteers...</p>
                </div>
              ) : (
                <SOSButton status={sosStatus} onSOS={handleSOS} onResolve={handleResolve} />
              )}
            </div>
          )}

          {/* Panel tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
            {['risk', 'sos', 'zones', 'forum'].map(p => (
              <button key={p} onClick={() => setSidePanel(p)} style={{
                flex: 1, padding: '10px 5px', border: 'none', background: 'transparent',
                borderBottom: sidePanel === p ? '2px solid var(--accent)' : '2px solid transparent',
                color: sidePanel === p ? 'var(--accent)' : 'var(--fg-muted)',
                fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
                transition: 'color var(--t-fast)', whiteSpace: 'nowrap',
              }}>
                {p === 'risk' ? '⚠ Risk' : p === 'sos' ? '🚨 SOS' : p === 'zones' ? '🗺 Zones' : '💬 Forum'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative', minHeight: 0 }}>
            {sidePanel === 'risk' && <RiskPanel />}
            {sidePanel === 'forum' && <ForumPanel userLocation={location} userRole="user" userName="Demo User" />}
            {sidePanel === 'zones' && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>🗺️</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 8 }}>Risk Zones Active</p>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Colored zones are visible on the main map.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                  {[['🔴','High Risk','#D62828'],['🟡','Moderate','#E85D04'],['🟢','Safe','#22c55e']].map(([e,l,c])=>(
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-raised)', padding:'6px 12px', borderRadius:20, border:`1px solid ${c}33` }}>
                      <span>{e}</span>
                      <span style={{ fontSize:12, color:'var(--fg)', fontWeight:600 }}>{l}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 16 }}>
                  Tap any circle on the map for details
                </p>
              </div>
            )}
            {sidePanel === 'sos' && (
              sosStatus === 'active' ? (
                <VolunteerPanel volunteers={volunteers} phase={volPhase} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                  <Activity size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 13 }}>No active emergency. Hold the SOS button if you need help.</p>
                </div>
              )
            )}
          </div>
        </aside>

        {/* Main map area */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>

          {/* Map */}
          <MapView
            userLocation={location}
            volunteers={volunteers}
            sosActive={sosStatus === 'active'}
            onVolunteerArrived={handleVolunteerArrived}
            showZones={sidePanel === 'zones'}
          />

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                position: 'absolute', top: 16, left: 16,
                background: '#1A1A1A', border: '2px solid #E85D04',
                borderRadius: 8, padding: 10, cursor: 'pointer',
                color: '#E85D04', display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.8)', zIndex: 500,
              }}
            >
              <Menu size={24} />
            </button>
          )}

          {/* Mobile floating SOS — always visible bottom center */}
          {isMobile && (
            <div style={{
              position: 'absolute', bottom: 40, left: '50%',
              transform: 'translateX(-50%)', zIndex: 500,
            }}>
              {sosLoading ? (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: '#1A1A1A', border: '3px solid #D62828',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 28, height: 28, border: '3px solid rgba(214,40,40,0.3)', borderTop: '3px solid #D62828', borderRadius: '50%', animation: 'spin2 0.7s linear infinite' }} />
                  <style>{`@keyframes spin2{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : (
                <SOSButton status={sosStatus} onSOS={handleSOS} onResolve={handleResolve} />
              )}
            </div>
          )}

          {/* Safe banner */}
          {sosStatus === 'active' && volPhase === 'safe' && (
            <div style={{
              position: 'absolute', top: 16, left: '50%',
              transform: 'translateX(-50%)',
              background: '#D62828', color: '#fff',
              padding: '12px 20px', borderRadius: 99,
              fontWeight: 700, fontSize: 14,
              boxShadow: '0 4px 20px rgba(214,40,40,0.5)',
              zIndex: 10, whiteSpace: 'nowrap',
              animation: 'fadeInBanner 0.5s ease',
            }}>
              ✅ You are safe now — tap RESOLVE to close
              <style>{`@keyframes fadeInBanner{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
            </div>
          )}

          {/* My location button */}
          <button onClick={getLocation} style={{
            position: 'absolute',
            bottom: isMobile ? 160 : 80,
            right: 16,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
            cursor: 'pointer', color: 'var(--fg)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)', zIndex: 5,
          }}>
            <MapPin size={14} color="var(--accent)" /> My Location
          </button>

        </main>
      </div>
    </div>
  );
}
