import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import api from '../services/api';
import logoImg from '../assets/safewalk-logo.png';

const INPUT_STYLE = {
  width: '100%', padding: '12px 16px', background: 'var(--bg-raised)',
  border: '1px solid var(--border-color)', borderRadius: 'var(--r-md)',
  color: 'var(--fg)', fontFamily: 'var(--font)', fontSize: '14px',
  outline: 'none', transition: 'border-color var(--t-fast)',
};

const BTN_PRIMARY = {
  width: '100%', padding: '13px', background: 'var(--accent)', border: 'none',
  borderRadius: 'var(--r-md)', color: '#fff', fontFamily: 'var(--font)',
  fontSize: '15px', fontWeight: 600, cursor: 'pointer',
};

const BTN_OUTLINE = {
  width: '100%', padding: '12px', background: 'transparent',
  borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)',
  color: 'var(--fg)', fontFamily: 'var(--font)', fontSize: '13px',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 8,
};

export default function LoginPage() {
  const { saveAuth } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('email');
  const [form, setForm] = useState({ name: '', email: '', password: '', demoRole: 'user' });
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('Signing you in...');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (overrideRole) => {
    setLoading(true);
    setLoadMsg(overrideRole ? 'Loading demo account...' : isRegister ? 'Creating your account...' : 'Signing you in...');
    try {
      let res;
      const role = overrideRole || form.demoRole;
      if (overrideRole) {
        res = await api.post('/auth/demo', { role });
      } else if (isRegister) {
        res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      } else {
        res = await api.post('/auth/login', { email: form.email, password: form.password });
      }
      setLoadMsg('Welcome to SafeWalk!');
      await new Promise(r => setTimeout(r, 800)); // show welcome briefly
      saveAuth(res.data);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'volunteer' ? '/volunteer' : '/dashboard');
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <>
      {loading && <LoadingScreen message={loadMsg} />}

      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Theme toggle */}
        <button onClick={toggle} style={{ position: 'fixed', top: 20, right: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-full)', padding: '8px 14px', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <img
              src={logoImg}
              alt="SafeWalk Logo"
              style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: '50%', marginBottom: 12 }}
            />
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
              Safe<span style={{ color: 'var(--accent)' }}>Walk</span>
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginTop: 6 }}>Personal safety, always with you</p>
          </div>

          {/* Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', padding: '32px 28px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: 4 }}>
              {['email', 'phone', 'demo'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--r-sm)',
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--fg-muted)',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'background var(--t-fast)',
                }}>
                  {t === 'demo' ? '⚡ Demo' : t === 'email' ? '✉ Email' : '📱 Phone'}
                </button>
              ))}
            </div>

            {/* Email */}
            {tab === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isRegister && <input style={INPUT_STYLE} placeholder="Full name" value={form.name} onChange={set('name')} />}
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
                  <input style={{ ...INPUT_STYLE, paddingLeft: 38 }} type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
                  <input style={{ ...INPUT_STYLE, paddingLeft: 38, paddingRight: 42 }} type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                  <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button style={BTN_PRIMARY} onClick={() => handleSubmit()}>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)', margin: 0 }}>
                  {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                  <button onClick={() => setIsRegister(r => !r)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600 }}>
                    {isRegister ? 'Sign in' : 'Register'}
                  </button>
                </p>
              </div>
            )}

            {/* Phone */}
            {tab === 'phone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '14px 16px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                </div>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
                  <input style={{ ...INPUT_STYLE, paddingLeft: 38 }} type="tel" placeholder="+91 98765 43210" />
                </div>
                <button style={{ ...BTN_PRIMARY, opacity: 0.5 }} disabled>Send OTP (configure Supabase)</button>
              </div>
            )}

            {/* Demo */}
            {tab === 'demo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center', margin: 0 }}>Login instantly with a demo account</p>
                <button style={{ ...BTN_OUTLINE, borderColor: 'var(--accent)', color: 'var(--accent)', padding: '13px' }} onClick={() => handleSubmit('user')}>
                  <img src={logoimg} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: '50%' }} />
                  Demo User Account
                </button>
                <button style={{ ...BTN_OUTLINE, padding: '13px' }} onClick={() => handleSubmit('volunteer')}>
                  <img src={logoimg} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: '50%' }} />
                  Demo Volunteer Account
                </button>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', margin: 0 }}>
                  Password: <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: 4 }}>password</code>
                </p>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 12, marginTop: 20 }}>
            Your location is only shared during an SOS. 
          </p>
        </div>
      </div>
    </>
  );
}
