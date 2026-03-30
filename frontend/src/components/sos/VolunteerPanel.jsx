import { Shield, Star, MapPin } from 'lucide-react';

export default function VolunteerPanel({ volunteers, phase }) {
  if (!volunteers?.length) return null;

  const phaseText = {
    dispatched: 'Volunteers are on their way',
    arrived: '🟢 Volunteer is with you',
    safe: '✅ You are safe now',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Dispatched Volunteers</span>
        {phase && (
          <span style={{
            fontSize: 12, padding: '3px 10px',
            background: phase === 'safe' ? 'rgba(232,93,4,0.15)' : 'rgba(214,40,40,0.15)',
            color: phase === 'safe' ? 'var(--accent)' : '#D62828',
            borderRadius: 'var(--r-full)', fontWeight: 600,
          }}>
            {phaseText[phase]}
          </span>
        )}
      </div>
      {volunteers.map((v, i) => (
        <div key={i} style={{
          background: 'var(--bg-raised)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--r-md)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🚶
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</span>
              {v.isVerified && <Shield size={12} color="var(--accent)" />}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={11} /> {v.rating}
              </span>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={11} /> {v.distance} km away
              </span>
            </div>
          </div>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: phase === 'safe' ? '#22c55e' : '#E85D04', boxShadow: '0 0 6px currentColor' }} />
        </div>
      ))}
    </div>
  );
}
