import { AlertTriangle, TrendingUp, MapPin } from 'lucide-react';

const RISK_ZONES = [
  { name: 'Vidhyavardhini college road', risk: 'high', time: '10PM–2AM', color: '#D62828' },
  { name: 'Vasai Station', risk: 'medium', time: '8PM–12AM', color: '#E85D04' },
  { name: 'KT Marg', risk: 'low', time: 'All day', color: '#22c55e' },
  { name: 'VASAI LINK ROAD', risk: 'low', time: 'All day', color: '#22c55e' },
];

const SAFE_ROUTES = [
  { from: 'Your location', to: 'Vidhyavardhini College of Engineering & Technology', via: 'Residency Rd', safe: true },
  { from: 'Your location', to: 'Vasai', via: 'Wardha Rd', safe: true },
];

export default function RiskPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Risk zones */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <AlertTriangle size={14} color="var(--accent)" />
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--fg-muted)' }}>Risk Zones (Mock)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RISK_ZONES.map((z, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${z.color}` }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{z.name}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>{z.time}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: z.color, textTransform: 'uppercase' }}>{z.risk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safe routes */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <MapPin size={14} color="var(--accent)" />
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--fg-muted)' }}>Safe Routes (Mock)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SAFE_ROUTES.map((r, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', borderLeft: '3px solid #22c55e' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{r.from} → {r.to}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)' }}>via {r.via}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
