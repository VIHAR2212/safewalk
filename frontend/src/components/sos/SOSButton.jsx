import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function SOSButton({ onSOS, onResolve, status }) {
  const [held, setHeld] = useState(false);
  const [progress, setProgress] = useState(0);
  const [holdTimer, setHoldTimer] = useState(null);
  const [progressInterval, setProgressInterval] = useState(null);

  const HOLD_MS = 2000;

  const startHold = () => {
    if (status === 'active') return;
    setHeld(true);
    setProgress(0);
    const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(((Date.now() - start) / HOLD_MS) * 100, 100);
      setProgress(p);
    }, 16);
    const t = setTimeout(() => {
      clearInterval(iv);
      setHeld(false);
      setProgress(0);
      onSOS?.();
    }, HOLD_MS);
    setHoldTimer(t);
    setProgressInterval(iv);
  };

  const cancelHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    if (progressInterval) clearInterval(progressInterval);
    setHeld(false);
    setProgress(0);
  };

  useEffect(() => () => { cancelHold(); }, []);

  const isActive = status === 'active';
  const circumference = 2 * Math.PI * 52;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* SVG ring progress */}
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} width="140" height="140">
          <circle cx="70" cy="70" r="52" fill="none" stroke="var(--bg-raised)" strokeWidth="6" />
          {held && (
            <circle cx="70" cy="70" r="52" fill="none" stroke="#D62828"
              strokeWidth="6" strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              strokeLinecap="round" style={{ transition: 'none' }}
            />
          )}
          {isActive && (
            <circle cx="70" cy="70" r="52" fill="none" stroke="#D62828"
              strokeWidth="6" strokeDasharray="8 6"
              style={{ animation: 'spinRing 2s linear infinite' }}
            />
          )}
        </svg>

        <style>{`
          @keyframes spinRing { to { stroke-dashoffset: -60; } }
          @keyframes sosGlow { 0%,100%{box-shadow:0 0 0 0 rgba(214,40,40,0.4)} 50%{box-shadow:0 0 0 20px rgba(214,40,40,0)} }
        `}</style>

        <button
          onMouseDown={!isActive ? startHold : undefined}
          onMouseUp={!isActive ? cancelHold : undefined}
          onMouseLeave={!isActive ? cancelHold : undefined}
          onTouchStart={!isActive ? startHold : undefined}
          onTouchEnd={!isActive ? cancelHold : undefined}
          onClick={isActive ? onResolve : undefined}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 100, height: 100, borderRadius: '50%', border: 'none',
            background: isActive ? '#D62828' : '#1A1A1A',
            color: isActive ? '#fff' : '#D62828',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4,
            boxShadow: isActive
              ? '0 0 0 4px rgba(214,40,40,0.3), 0 8px 32px rgba(214,40,40,0.3)'
              : '0 4px 20px rgba(0,0,0,0.4)',
            animation: isActive ? 'sosGlow 2s ease-in-out infinite' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            outline: 'none',
          }}
          aria-label={isActive ? 'Resolve emergency' : 'Hold to trigger SOS'}
        >
          {isActive
            ? <><CheckCircle size={24} /><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>RESOLVE</span></>
            : <><AlertTriangle size={24} /><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>SOS</span></>
          }
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', maxWidth: 160 }}>
        {isActive ? 'Tap to mark yourself safe' : 'Hold 2 seconds to trigger emergency'}
      </p>
    </div>
  );
}
