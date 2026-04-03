import { useState, useEffect, useRef } from 'react';
import { Send, MapPin, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';

// ── Locality Data structured by Zone → Suburb → Side ──────────────────────────
const ZONE_DATA = {
  'South Mumbai': {
    noSplit: ['Colaba', 'Worli', 'Chembur','Mumbai General'],
  },
  'North Mumbai': {
    noSplit: ['Mira Bhayandar', 'Powai'],
    split: ['Borivali', 'Kandivali', 'Malad', 'Goregaon'],
  },
  'West Mumbai': {
    split: ['Bandra', 'Vile Parle', 'Andheri'],
  },
  'East Mumbai': {
    split: ['Dadar', 'Kurla', 'Ghatkopar', 'Mulund'],
    noSplit: ['Thane'],
  },
};

// ── GPS-based locality detection (kept for auto-detect) ────────────────────────
const MUMBAI_LOCALITIES = [
  { name: 'Colaba', lat: 18.920, lng: 72.830, noSplit: true },
  { name: 'Worli', lat: 19.000, lng: 72.815, noSplit: true },
  { name: 'Powai', lat: 19.120, lng: 72.900, noSplit: true },
  { name: 'Mira Bhayandar', lat: 19.290, lng: 72.850, noSplit: true },
  { name: 'Chembur', lat: 19.050, lng: 72.895, noSplit: true },
  { name: 'Dadar', lat: 19.020, lng: 72.840 },
  { name: 'Bandra', lat: 19.050, lng: 72.835 },
  { name: 'Kurla', lat: 19.070, lng: 72.880 },
  { name: 'Vile Parle', lat: 19.100, lng: 72.840 },
  { name: 'Andheri', lat: 19.120, lng: 72.840 },
  { name: 'Ghatkopar', lat: 19.080, lng: 72.910 },
  { name: 'Goregaon', lat: 19.160, lng: 72.845 },
  { name: 'Malad', lat: 19.190, lng: 72.845 },
  { name: 'Kandivali', lat: 19.200, lng: 72.850 },
  { name: 'Borivali', lat: 19.230, lng: 72.855 },
  { name: 'Mulund', lat: 19.170, lng: 72.950 },
  { name: 'Thane', lat: 19.200, lng: 72.970 },
];

const getLocality = (lat, lng) => {
  if (!lat || !lng) return 'Mumbai General';
  if (lat < 18.85 || lat > 19.35 || lng < 72.75 || lng > 73.10) return 'Mumbai General';
  let closest = MUMBAI_LOCALITIES[0];
  let minDistance = Infinity;
  MUMBAI_LOCALITIES.forEach(loc => {
    const dist = Math.hypot(lat - loc.lat, lng - loc.lng);
    if (dist < minDistance) { minDistance = dist; closest = loc; }
  });
  if (closest.noSplit) return closest.name;
  return `${closest.name} ${lng < closest.lng ? 'West' : 'East'}`;
};

// ── Cascading Selector Component ───────────────────────────────────────────────
function LocalitySelector({ currentLocality, onSelect }) {
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedSuburb, setSelectedSuburb] = useState(null);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleZone = (zone) => { setSelectedZone(zone); setSelectedSuburb(null); };

  const handleSuburb = (suburb, isNoSplit) => {
    if (isNoSplit) {
      onSelect(suburb);
      setOpen(false);
      setSelectedZone(null);
      setSelectedSuburb(null);
    } else {
      setSelectedSuburb(suburb);
    }
  };

  const handleSide = (side) => {
    onSelect(`${selectedSuburb} ${side}`);
    setOpen(false);
    setSelectedZone(null);
    setSelectedSuburb(null);
  };

  const panelStyle = {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    background: 'var(--bg-surface)',
    border: '1px solid rgba(232,93,4,0.3)',
    borderRadius: '12px',
    zIndex: 100,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  };

  const itemStyle = (active) => ({
    padding: '11px 14px',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: active ? 'rgba(232,93,4,0.15)' : 'transparent',
    color: active ? '#E85D04' : 'var(--fg)',
    transition: 'background 0.15s',
  });

  const zones = Object.keys(ZONE_DATA);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(232,93,4,0.1)',
          border: '1px solid rgba(232,93,4,0.3)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--fg)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={13} color="#E85D04" />
          {currentLocality}
        </span>
        <ChevronDown size={14} color="#E85D04" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={panelStyle}>
          {/* Level 1: No zone selected — show zones */}
          {!selectedZone && (
            <div>
              <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--fg-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Select Zone
              </div>
              {zones.map(zone => (
                <div
                  key={zone}
                  style={itemStyle(false)}
                  onClick={() => handleZone(zone)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,93,4,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {zone}
                  <ChevronRight size={13} color="var(--fg-muted)" />
                </div>
              ))}
            </div>
          )}

          {/* Level 2: Zone selected — show suburbs */}
          {selectedZone && !selectedSuburb && (
            <div>
              <div
                style={{ padding: '8px 14px', fontSize: 12, color: '#E85D04', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => setSelectedZone(null)}
              >
                ← {selectedZone}
              </div>
              <div style={{ padding: '4px 14px 4px', fontSize: 10, color: 'var(--fg-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Select Suburb
              </div>
              {(ZONE_DATA[selectedZone].noSplit || []).map(suburb => (
                <div
                  key={suburb}
                  style={itemStyle(false)}
                  onClick={() => handleSuburb(suburb, true)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,93,4,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {suburb}
                  <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>tap to select</span>
                </div>
              ))}
              {(ZONE_DATA[selectedZone].split || []).map(suburb => (
                <div
                  key={suburb}
                  style={itemStyle(false)}
                  onClick={() => handleSuburb(suburb, false)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,93,4,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {suburb}
                  <ChevronRight size={13} color="var(--fg-muted)" />
                </div>
              ))}
            </div>
          )}

          {/* Level 3: Suburb selected — show East/West */}
          {selectedZone && selectedSuburb && (
            <div>
              <div
                style={{ padding: '8px 14px', fontSize: 12, color: '#E85D04', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => setSelectedSuburb(null)}
              >
                ← {selectedSuburb}
              </div>
              <div style={{ padding: '4px 14px 4px', fontSize: 10, color: 'var(--fg-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Which side?
              </div>
              {['West', 'East'].map(side => (
                <div
                  key={side}
                  style={itemStyle(false)}
                  onClick={() => handleSide(side)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,93,4,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {selectedSuburb} {side}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ForumPanel ─────────────────────────────────────────────────────────────
export default function ForumPanel({ userLocation, userRole = 'user', userName = 'You' }) {
  const [locality, setLocality] = useState('Locating...');
  const [feed, setFeed] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const fetchPosts = async (currentLocality) => {
    try {
      const encoded = encodeURIComponent(currentLocality);
      const res = await api.get(`/forum/${encoded}`);
      setFeed(res.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect locality from GPS on mount
  useEffect(() => {
    const currentLocality = userLocation
      ? getLocality(userLocation.lat, userLocation.lng)
      : 'Mumbai General';
    setLocality(currentLocality);
    setLoading(true);
    fetchPosts(currentLocality);
  }, [userLocation]);

  // Re-fetch when locality changes (manual selection)
  const handleLocalityChange = (newLocality) => {
    setLocality(newLocality);
    setLoading(true);
    setFeed([]);
    fetchPosts(newLocality);
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [feed]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newPost = {
      locality,
      author_name: userName,
      author_role: userRole,
      content: input.trim(),
    };

    // Optimistic UI
    const optimisticPost = { ...newPost, id: Date.now().toString(), created_at: new Date().toISOString() };
    setFeed([...feed, optimisticPost]);
    setInput('');

    try {
      await api.post('/forum', newPost);
      fetchPosts(locality);
    } catch (error) {
      console.error('Failed to send post:', error);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header with cascading selector */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,93,4,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={16} color="#E85D04" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: 'var(--fg-muted)', margin: 0 }}>Community Safety Forum</p>
          </div>
        </div>
        <LocalitySelector currentLocality={locality} onSelect={handleLocalityChange} />
      </div>

      {/* Feed */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)', fontSize: 13 }}>
            Loading {locality}...
          </div>
        )}
        {!loading && feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)', fontSize: 13 }}>
            No updates in {locality} yet. Be the first to post!
          </div>
        )}
        {feed.map(post => (
          <div
            key={post.id}
            style={{
              background: post.author_name === userName ? 'rgba(232,93,4,0.1)' : 'rgba(255,255,255,0.04)',
              border: post.author_name === userName ? '1px solid rgba(232,93,4,0.2)' : '1px solid rgba(255,255,255,0.06)',
              padding: '10px 12px',
              borderRadius: '12px',
              alignSelf: post.author_name === userName ? 'flex-end' : 'flex-start',
              width: '85%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                {post.author_role === 'volunteer' ? <ShieldCheck size={12} color="#E85D04" /> : null}
                {post.author_name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{formatTime(post.created_at)}</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg)', margin: 0 }}>{post.content}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${locality}...`}
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'var(--fg)', fontSize: 13, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{ background: input.trim() ? '#E85D04' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
        >
          <Send size={16} color={input.trim() ? '#fff' : 'var(--fg-muted)'} />
        </button>
      </form>
    </div>
  );
        }
