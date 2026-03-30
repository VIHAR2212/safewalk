import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Phone, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const INPUT_STYLE = {
  width: '100%', padding: '12px 16px', background: 'var(--bg-raised)',
  border: '1px solid var(--border-color)', borderRadius: 'var(--r-md)',
  color: 'var(--fg)', fontFamily: 'var(--font)', fontSize: '14px',
  outline: 'none', transition: 'border-color var(--t-fast)',
};

const BTN = {
  primary: {
    width: '100%', padding: '13px', background: 'var(--accent)', border: 'none',
    borderRadius: 'var(--r-md)', color: '#fff', fontFamily: 'var(--font)',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'opacity var(--t-fast)',
  },
  outline: {
    padding: '10px 16px', background: 'transparent', borderRadius: 'var(--r-md)',
    border: '1px solid var(--border-color)', color: 'var(--fg)', fontFamily: 'var(--font)',
    fontSize: '13px', cursor: 'pointer', transition: 'background var(--t-fast)',
    display: 'flex', alignItems: 'center', gap: 8,
  },
};

export default function LoginPage() {
  const { saveAuth } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('email'); // email | phone | demo
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'demo') {
        res = await api.post('/auth/demo', { role: form.demoRole || 'user' });
      } else if (isRegister) {
        res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      } else {
        res = await api.post('/auth/login', { email: form.email, password: form.password });
      }
      saveAuth(res.data);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'volunteer' ? '/volunteer' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Theme toggle */}
      <button onClick={toggle} style={{ position: 'fixed', top: 20, right: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-full)', padding: '8px 14px', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'var(--accent)', borderRadius: 'var(--r-lg)', marginBottom: 16 }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>SafeWalk</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginTop: 6 }}>Personal safety, always with you</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-xl)', padding: '32px 28px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: 4 }}>
            {['email', 'phone', 'demo'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--r-sm)',
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--fg-muted)',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'background var(--t-fast)',
              }}>
                {t === 'demo' ? '⚡ Demo' : t === 'email' ? '✉ Email' : '📱 Phone'}
              </button>
            ))}
          </div>

          {/* Email/Password */}
          {tab === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isRegister && (
                <input style={INPUT_STYLE} placeholder="Full name" value={form.name} onChange={set('name')} />
              )}
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
              <button style={{ ...BTN.primary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={() => setIsRegister(r => !r)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600 }}>
                  {isRegister ? 'Sign in' : 'Register'}
                </button>
              </p>
            </div>
          )}

          {/* Phone / OTP (mock) */}
          {tab === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '14px 16px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
                📱 Phone/OTP authentication requires <strong style={{ color: 'var(--fg)' }}>Supabase Phone Auth</strong> to be enabled. Configure it in your Supabase dashboard → Authentication → Providers → Phone.
              </div>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }} />
                <input style={{ ...INPUT_STYLE, paddingLeft: 38 }} type="tel" placeholder="+91 98765 43210" />
              </div>
              <button style={{ ...BTN.primary, opacity: 0.5 }} disabled>Send OTP (configure Supabase)</button>
            </div>
          )}

          {/* Demo */}
          {tab === 'demo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>Login instantly with a demo account</p>
              <button style={{ ...BTN.outline, justifyContent: 'center', padding: '12px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                onClick={() => { setForm(f => ({ ...f, demoRole: 'user' })); setTimeout(handleSubmit, 0); }}>
                <Shield size={16} /> Demo User Account
              </button>
              <button style={{ ...BTN.outline, justifyContent: 'center', padding: '12px' }}
                onClick={() => { setForm(f => ({ ...f, demoRole: 'volunteer' })); setTimeout(handleSubmit, 0); }}>
                <Zap size={16} /> Demo Volunteer Account
              </button>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center' }}>
                Password for both: <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: 4 }}>password</code>
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 12, marginTop: 20 }}>
          Your location is only shared during an SOS. We never track you otherwise.
        </p>
      </div>
    </div>
  );
}
