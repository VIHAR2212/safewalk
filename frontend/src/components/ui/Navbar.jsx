import { Shield, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar({ volunteerCount }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out safely');
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60,
      background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>SafeWalk</span>
        {volunteerCount > 0 && (
          <span style={{ fontSize: 12, color: 'var(--fg-muted)', background: 'var(--bg-raised)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
            {volunteerCount} volunteers online
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={14} /> {user?.name}
          {user?.role === 'volunteer' && (
            <span style={{ fontSize: 11, background: 'rgba(232,93,4,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 'var(--r-full)', fontWeight: 600 }}>VOLUNTEER</span>
          )}
        </span>

        <button onClick={toggle} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '7px', cursor: 'pointer', color: 'var(--fg)', display: 'flex', alignItems: 'center' }} title="Toggle theme">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', fontSize: 13 }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
}
