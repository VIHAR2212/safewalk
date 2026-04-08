import { useLanguage } from '../../context/LanguageContext';

const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    sublabel: 'Continue in English',
    script: 'Latin',
  },
  {
    code: 'hi',
    label: 'हिंदी',
    sublabel: 'हिंदी में जारी रखें',
    script: 'Devanagari',
  },
  {
    code: 'mr',
    label: 'मराठी',
    sublabel: 'मराठीत पुढे जा',
    script: 'Devanagari',
  },
];

export default function LanguageSplash() {
  const { language, setLanguage } = useLanguage();

  // Already chosen — render nothing, let app load
  if (language) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0D0D0D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px',
    }}>

      {/* Logo mark */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '18px',
        background: 'rgba(232,93,4,0.15)',
        border: '1.5px solid rgba(232,93,4,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <span style={{ fontSize: 28 }}>🛡️</span>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        color: '#F5F5F5',
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
      }}>
        Safe<span style={{ color: '#E85D04' }}>Walk</span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 14,
        color: 'rgba(245,245,245,0.45)',
        margin: '0 0 48px',
        textAlign: 'center',
      }}>
        Choose your language to continue
      </p>

      {/* Language buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 320,
      }}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(232,93,4,0.12)';
              e.currentTarget.style.borderColor = 'rgba(232,93,4,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#F5F5F5',
                lineHeight: 1.2,
                marginBottom: 3,
              }}>
                {lang.label}
              </div>
              <div style={{
                fontSize: 12,
                color: 'rgba(245,245,245,0.4)',
              }}>
                {lang.sublabel}
              </div>
            </div>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(232,93,4,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#E85D04', fontSize: 16 }}>→</span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        fontSize: 11,
        color: 'rgba(245,245,245,0.2)',
        marginTop: 40,
        textAlign: 'center',
      }}>
        You can change this later from settings
      </p>
    </div>
  );
}
