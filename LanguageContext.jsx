import { createContext, useContext, useState } from 'react';

// ── Translation Dictionary ─────────────────────────────────────────────────────
const translations = {
  en: {
    // Splash
    'splash.title': 'SafeWalk',
    'splash.subtitle': 'Choose your language to continue',
    'splash.en': 'English',
    'splash.hi': 'हिंदी',
    'splash.mr': 'मराठी',

    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.volunteer': 'Volunteer',
    'nav.logout': 'Logout',

    // Dashboard tabs
    'tabs.map': 'Map',
    'tabs.risk': 'Risk',
    'tabs.sos': 'SOS',
    'tabs.forum': 'Forum',

    // SOS
    'sos.hold': 'Hold to Trigger SOS',
    'sos.active': 'SOS Active',
    'sos.cancel': 'Cancel SOS',
    'sos.dispatching': 'Dispatching volunteers...',
    'sos.volunteers': 'volunteers nearby',

    // Forum
    'forum.title': 'Community Safety Forum',
    'forum.empty': 'No updates in this area yet. Be the first to post!',
    'forum.placeholder': 'Message',
    'forum.locating': 'Locating...',
    'forum.loading': 'Loading',
    'forum.select_zone': 'Select Zone',
    'forum.select_suburb': 'Select Suburb',
    'forum.which_side': 'Which side?',
    'forum.tap_select': 'tap to select',

    // Volunteer page
    'vol.tabs.dashboard': 'Dashboard',
    'vol.tabs.forum': 'Forum',
    'vol.status.online': 'Online',
    'vol.status.offline': 'Offline',
    'vol.stats.helped': 'People Helped',
    'vol.stats.rating': 'Rating',
    'vol.stats.joined': 'Joined',
    'vol.tier.bronze': 'Bronze',
    'vol.tier.silver': 'Silver',
    'vol.tier.gold': 'Gold',
    'vol.tier.guardian': 'Guardian',
    'vol.next_tier': 'Next Tier',

    // Risk panel
    'risk.title': 'Risk Zones',
    'risk.safe': 'Safe',
    'risk.moderate': 'Moderate',
    'risk.high': 'High Risk',

    // Locality names
    'loc.Colaba': 'Colaba',
    'loc.Worli': 'Worli',
    'loc.Chembur': 'Chembur',
    'loc.Mumbai General': 'Mumbai General',
    'loc.Mira Bhayandar': 'Mira Bhayandar',
    'loc.Powai': 'Powai',
    'loc.Borivali': 'Borivali',
    'loc.Kandivali': 'Kandivali',
    'loc.Malad': 'Malad',
    'loc.Goregaon': 'Goregaon',
    'loc.Bandra': 'Bandra',
    'loc.Vile Parle': 'Vile Parle',
    'loc.Andheri': 'Andheri',
    'loc.Dadar': 'Dadar',
    'loc.Kurla': 'Kurla',
    'loc.Ghatkopar': 'Ghatkopar',
    'loc.Mulund': 'Mulund',
    'loc.Thane': 'Thane',
    'loc.Borivali West': 'Borivali West',
    'loc.Borivali East': 'Borivali East',
    'loc.Kandivali West': 'Kandivali West',
    'loc.Kandivali East': 'Kandivali East',
    'loc.Malad West': 'Malad West',
    'loc.Malad East': 'Malad East',
    'loc.Goregaon West': 'Goregaon West',
    'loc.Goregaon East': 'Goregaon East',
    'loc.Bandra West': 'Bandra West',
    'loc.Bandra East': 'Bandra East',
    'loc.Vile Parle West': 'Vile Parle West',
    'loc.Vile Parle East': 'Vile Parle East',
    'loc.Andheri West': 'Andheri West',
    'loc.Andheri East': 'Andheri East',
    'loc.Dadar West': 'Dadar West',
    'loc.Dadar East': 'Dadar East',
    'loc.Kurla West': 'Kurla West',
    'loc.Kurla East': 'Kurla East',
    'loc.Ghatkopar West': 'Ghatkopar West',
    'loc.Ghatkopar East': 'Ghatkopar East',
    'loc.Mulund West': 'Mulund West',
    'loc.Mulund East': 'Mulund East',

    // Zone names
    'zone.South Mumbai': 'South Mumbai',
    'zone.North Mumbai': 'North Mumbai',
    'zone.West Mumbai': 'West Mumbai',
    'zone.East Mumbai': 'East Mumbai',
  },

  hi: {
    // Splash
    'splash.title': 'सेफवॉक',
    'splash.subtitle': 'जारी रखने के लिए भाषा चुनें',
    'splash.en': 'English',
    'splash.hi': 'हिंदी',
    'splash.mr': 'मराठी',

    // Navbar
    'nav.dashboard': 'डैशबोर्ड',
    'nav.volunteer': 'स्वयंसेवक',
    'nav.logout': 'लॉगआउट',

    // Dashboard tabs
    'tabs.map': 'नक्शा',
    'tabs.risk': 'जोखिम',
    'tabs.sos': 'SOS',
    'tabs.forum': 'फोरम',

    // SOS
    'sos.hold': 'SOS के लिए दबाए रखें',
    'sos.active': 'SOS सक्रिय',
    'sos.cancel': 'SOS रद्द करें',
    'sos.dispatching': 'स्वयंसेवक भेजे जा रहे हैं...',
    'sos.volunteers': 'स्वयंसेवक पास में',

    // Forum
    'forum.title': 'सामुदायिक सुरक्षा फोरम',
    'forum.empty': 'इस क्षेत्र में अभी कोई अपडेट नहीं। पहले पोस्ट करें!',
    'forum.placeholder': 'संदेश',
    'forum.locating': 'स्थान ढूंढ रहे हैं...',
    'forum.loading': 'लोड हो रहा है',
    'forum.select_zone': 'क्षेत्र चुनें',
    'forum.select_suburb': 'उपनगर चुनें',
    'forum.which_side': 'कौन सी तरफ?',
    'forum.tap_select': 'चुनने के लिए टैप करें',

    // Volunteer page
    'vol.tabs.dashboard': 'डैशबोर्ड',
    'vol.tabs.forum': 'फोरम',
    'vol.status.online': 'ऑनलाइन',
    'vol.status.offline': 'ऑफलाइन',
    'vol.stats.helped': 'लोगों की मदद',
    'vol.stats.rating': 'रेटिंग',
    'vol.stats.joined': 'जुड़े',
    'vol.tier.bronze': 'कांस्य',
    'vol.tier.silver': 'रजत',
    'vol.tier.gold': 'स्वर्ण',
    'vol.tier.guardian': 'संरक्षक',
    'vol.next_tier': 'अगला स्तर',

    // Risk panel
    'risk.title': 'जोखिम क्षेत्र',
    'risk.safe': 'सुरक्षित',
    'risk.moderate': 'मध्यम',
    'risk.high': 'उच्च जोखिम',

    // Locality names
    'loc.Colaba': 'कोलाबा',
    'loc.Worli': 'वर्ली',
    'loc.Chembur': 'चेंबूर',
    'loc.Mumbai General': 'मुंबई सामान्य',
    'loc.Mira Bhayandar': 'मीरा भायंदर',
    'loc.Powai': 'पवई',
    'loc.Borivali': 'बोरीवली',
    'loc.Kandivali': 'कांदिवली',
    'loc.Malad': 'मलाड',
    'loc.Goregaon': 'गोरेगांव',
    'loc.Bandra': 'बांद्रा',
    'loc.Vile Parle': 'विले पार्ले',
    'loc.Andheri': 'अंधेरी',
    'loc.Dadar': 'दादर',
    'loc.Kurla': 'कुर्ला',
    'loc.Ghatkopar': 'घाटकोपर',
    'loc.Mulund': 'मुलुंड',
    'loc.Thane': 'ठाणे',
    'loc.Borivali West': 'बोरीवली पश्चिम',
    'loc.Borivali East': 'बोरीवली पूर्व',
    'loc.Kandivali West': 'कांदिवली पश्चिम',
    'loc.Kandivali East': 'कांदिवली पूर्व',
    'loc.Malad West': 'मलाड पश्चिम',
    'loc.Malad East': 'मलाड पूर्व',
    'loc.Goregaon West': 'गोरेगांव पश्चिम',
    'loc.Goregaon East': 'गोरेगांव पूर्व',
    'loc.Bandra West': 'बांद्रा पश्चिम',
    'loc.Bandra East': 'बांद्रा पूर्व',
    'loc.Vile Parle West': 'विले पार्ले पश्चिम',
    'loc.Vile Parle East': 'विले पार्ले पूर्व',
    'loc.Andheri West': 'अंधेरी पश्चिम',
    'loc.Andheri East': 'अंधेरी पूर्व',
    'loc.Dadar West': 'दादर पश्चिम',
    'loc.Dadar East': 'दादर पूर्व',
    'loc.Kurla West': 'कुर्ला पश्चिम',
    'loc.Kurla East': 'कुर्ला पूर्व',
    'loc.Ghatkopar West': 'घाटकोपर पश्चिम',
    'loc.Ghatkopar East': 'घाटकोपर पूर्व',
    'loc.Mulund West': 'मुलुंड पश्चिम',
    'loc.Mulund East': 'मुलुंड पूर्व',

    // Zone names
    'zone.South Mumbai': 'दक्षिण मुंबई',
    'zone.North Mumbai': 'उत्तर मुंबई',
    'zone.West Mumbai': 'पश्चिम मुंबई',
    'zone.East Mumbai': 'पूर्व मुंबई',
  },

  mr: {
    // Splash
    'splash.title': 'सेफवॉक',
    'splash.subtitle': 'पुढे जाण्यासाठी भाषा निवडा',
    'splash.en': 'English',
    'splash.hi': 'हिंदी',
    'splash.mr': 'मराठी',

    // Navbar
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.volunteer': 'स्वयंसेवक',
    'nav.logout': 'लॉगआउट',

    // Dashboard tabs
    'tabs.map': 'नकाशा',
    'tabs.risk': 'धोका',
    'tabs.sos': 'SOS',
    'tabs.forum': 'फोरम',

    // SOS
    'sos.hold': 'SOS साठी दाबून ठेवा',
    'sos.active': 'SOS सक्रिय',
    'sos.cancel': 'SOS रद्द करा',
    'sos.dispatching': 'स्वयंसेवक पाठवले जात आहेत...',
    'sos.volunteers': 'स्वयंसेवक जवळ आहेत',

    // Forum
    'forum.title': 'सामुदायिक सुरक्षा फोरम',
    'forum.empty': 'या भागात अद्याप कोणतेही अपडेट नाही. पहिली पोस्ट करा!',
    'forum.placeholder': 'संदेश',
    'forum.locating': 'स्थान शोधत आहे...',
    'forum.loading': 'लोड होत आहे',
    'forum.select_zone': 'झोन निवडा',
    'forum.select_suburb': 'उपनगर निवडा',
    'forum.which_side': 'कोणती बाजू?',
    'forum.tap_select': 'निवडण्यासाठी टॅप करा',

    // Volunteer page
    'vol.tabs.dashboard': 'डॅशबोर्ड',
    'vol.tabs.forum': 'फोरम',
    'vol.status.online': 'ऑनलाइन',
    'vol.status.offline': 'ऑफलाइन',
    'vol.stats.helped': 'मदत केलेले लोक',
    'vol.stats.rating': 'रेटिंग',
    'vol.stats.joined': 'सामील झाले',
    'vol.tier.bronze': 'कांस्य',
    'vol.tier.silver': 'रौप्य',
    'vol.tier.gold': 'सुवर्ण',
    'vol.tier.guardian': 'संरक्षक',
    'vol.next_tier': 'पुढील स्तर',

    // Risk panel
    'risk.title': 'धोका क्षेत्रे',
    'risk.safe': 'सुरक्षित',
    'risk.moderate': 'मध्यम',
    'risk.high': 'उच्च धोका',

    // Locality names
    'loc.Colaba': 'कुलाबा',
    'loc.Worli': 'वरळी',
    'loc.Chembur': 'चेंबूर',
    'loc.Mumbai General': 'मुंबई सामान्य',
    'loc.Mira Bhayandar': 'मीरा भाईंदर',
    'loc.Powai': 'पवई',
    'loc.Borivali': 'बोरिवली',
    'loc.Kandivali': 'कांदिवली',
    'loc.Malad': 'मालाड',
    'loc.Goregaon': 'गोरेगाव',
    'loc.Bandra': 'वांद्रे',
    'loc.Vile Parle': 'विलेपार्ले',
    'loc.Andheri': 'अंधेरी',
    'loc.Dadar': 'दादर',
    'loc.Kurla': 'कुर्ला',
    'loc.Ghatkopar': 'घाटकोपर',
    'loc.Mulund': 'मुलुंड',
    'loc.Thane': 'ठाणे',
    'loc.Borivali West': 'बोरिवली पश्चिम',
    'loc.Borivali East': 'बोरिवली पूर्व',
    'loc.Kandivali West': 'कांदिवली पश्चिम',
    'loc.Kandivali East': 'कांदिवली पूर्व',
    'loc.Malad West': 'मालाड पश्चिम',
    'loc.Malad East': 'मालाड पूर्व',
    'loc.Goregaon West': 'गोरेगाव पश्चिम',
    'loc.Goregaon East': 'गोरेगाव पूर्व',
    'loc.Bandra West': 'वांद्रे पश्चिम',
    'loc.Bandra East': 'वांद्रे पूर्व',
    'loc.Vile Parle West': 'विलेपार्ले पश्चिम',
    'loc.Vile Parle East': 'विलेपार्ले पूर्व',
    'loc.Andheri West': 'अंधेरी पश्चिम',
    'loc.Andheri East': 'अंधेरी पूर्व',
    'loc.Dadar West': 'दादर पश्चिम',
    'loc.Dadar East': 'दादर पूर्व',
    'loc.Kurla West': 'कुर्ला पश्चिम',
    'loc.Kurla East': 'कुर्ला पूर्व',
    'loc.Ghatkopar West': 'घाटकोपर पश्चिम',
    'loc.Ghatkopar East': 'घाटकोपर पूर्व',
    'loc.Mulund West': 'मुलुंड पश्चिम',
    'loc.Mulund East': 'मुलुंड पूर्व',

    // Zone names
    'zone.South Mumbai': 'दक्षिण मुंबई',
    'zone.North Mumbai': 'उत्तर मुंबई',
    'zone.West Mumbai': 'पश्चिम मुंबई',
    'zone.East Mumbai': 'पूर्व मुंबई',
  },
};

// ── Context ────────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('sw_language') || null
  );

  const setLanguage = (lang) => {
    localStorage.setItem('sw_language', lang);
    setLanguageState(lang);
  };

  // t() — translate a key, falls back to English if key missing
  const t = (key) => {
    if (!language) return translations.en[key] || key;
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // tLoc() — translate a locality name
  const tLoc = (name) => t(`loc.${name}`);

  // tZone() — translate a zone name
  const tZone = (name) => t(`zone.${name}`);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tLoc, tZone }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
