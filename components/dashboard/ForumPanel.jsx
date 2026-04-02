import { useState, useEffect, useRef } from 'react';
import { Send, MapPin, ShieldCheck, User } from 'lucide-react';

// 1. Define the Localities (Center Coordinates)
const MUMBAI_LOCALITIES = [
  { name: 'Colaba', lat: 18.920, lng: 72.830, noSplit: true },
  { name: 'Worli', lat: 19.000, lng: 72.815, noSplit: true },
  { name: 'Powai', lat: 19.120, lng: 72.900, noSplit: true },
  { name: 'Mira Bhayandar', lat: 19.290, lng: 72.850, noSplit: true },
  { name: 'Chembur', lat: 19.050, lng: 72.895, noSplit: true },
  // East/West Splittable Localities
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
  { name: 'Thane', lat: 19.200, lng: 72.970 }
];

// 2. Find closest locality + East/West math
const getLocality = (lat, lng) => {
  if (!lat || !lng) return "Mumbai General";
  // Bounding box for Mumbai limits
  if (lat < 18.85 || lat > 19.35 || lng < 72.75 || lng > 73.10) return "Mumbai General";

  let closest = MUMBAI_LOCALITIES[0];
  let minDistance = Infinity;

  MUMBAI_LOCALITIES.forEach(loc => {
    const dist = Math.hypot(lat - loc.lat, lng - loc.lng);
    if (dist < minDistance) { minDistance = dist; closest = loc; }
  });

  if (closest.noSplit) return closest.name;
  return `${closest.name} ${lng < closest.lng ? 'West' : 'East'}`;
};

// 3. Dynamic Mock Data Generator (Keeps file size small!)
const generateMockPosts = (locality) => {
  const names = ["Rahul", "Priya S.", "Amit", "Sneha", "Vikram", "Neha", "Karan"];
  const scenarios = [
    `Streetlights are out near the main market in ${locality}. Be careful walking alone!`,
    `I'm patrolling the station area. Let me know if anyone needs an escort.`,
    `Heavy waterlogging reported on the main road, take the flyover.`,
    `Is the shortcut near the park safe right now?`,
    `Just saw a group of aggressive stray dogs near the ATM. Watch out.`,
    `I can verify that the park shortcut is well-lit and safe tonight.`,
    `Avoid the subway, there is a lot of crowd due to train delays.`
  ];
  
  return scenarios.map((text, i) => ({
    id: `mock-${i}`,
    locality: locality,
    author: names[i % names.length],
    role: i % 2 === 1 ? 'volunteer' : 'user',
    time: `${(i + 1) * 12}m ago`,
    content: text
  })).reverse();
};
export default function ForumPanel({ userLocation, userRole = "user", userName = "You" }) {
  const [locality, setLocality] = useState("Locating...");
  const [feed, setFeed] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    // 1. Figure out where we are
    const currentLocality = userLocation 
      ? getLocality(userLocation.lat, userLocation.lng) 
      : "Mumbai General";
      
    setLocality(currentLocality);
    
    // 2. Load our generated Mocks
    const baseMocks = generateMockPosts(currentLocality);
    
    // 3. Look in LocalStorage to see if we saved any custom messages here before
    const savedKey = `safewalk_forum_${currentLocality.replace(/\s/g, '_')}`;
    const savedPosts = JSON.parse(localStorage.getItem(savedKey)) || [];

    // Combine them (Mocks first, then our real saved messages at the bottom)
    setFeed([...baseMocks, ...savedPosts]);
  }, [userLocation]);

  useEffect(() => {
    // Auto-scroll to latest message
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [feed]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      locality: locality,
      author: userName,
      role: userRole,
      time: "Just now",
      content: input.trim()
    };

    const updatedFeed = [...feed, newPost];
    setFeed(updatedFeed);
    setInput("");

    // MAGIC: Save just the user's custom messages to LocalStorage!
    const savedKey = `safewalk_forum_${locality.replace(/\s/g, '_')}`;
    const existingSaved = JSON.parse(localStorage.getItem(savedKey)) || [];
    localStorage.setItem(savedKey, JSON.stringify([...existingSaved, newPost]));
  };
    return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: '-16px' }}>
      
      {/* Forum Header */}
      <div style={{ padding: '16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,93,4,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={18} color="var(--accent)" />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{locality} Forum</p>
          <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>Live safety updates</p>
        </div>
      </div>

      {/* Chat Feed */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {feed.map(post => (
          <div key={post.id} style={{ 
            background: post.author === userName ? 'rgba(232,93,4,0.1)' : (post.role === 'volunteer' ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-raised)'), 
            border: post.author === userName ? '1px solid rgba(232,93,4,0.3)' : (post.role === 'volunteer' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--border-color)'), 
            padding: '12px', borderRadius: '12px',
            alignSelf: post.author === userName ? 'flex-end' : 'flex-start',
            width: '85%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: post.role === 'volunteer' ? '#22c55e' : (post.author === userName ? 'var(--accent)' : 'var(--fg)') }}>
                {post.role === 'volunteer' ? <ShieldCheck size={14} /> : <User size={14} />}
                {post.author}
              </span>
              <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{post.time}</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-muted)', margin: 0 }}>{post.content}</p>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', gap: 8 }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${locality}...`} 
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '10px 16px', color: 'var(--fg)', fontSize: 13, outline: 'none' }}
        />
        <button type="submit" disabled={!input.trim()} style={{ background: input.trim() ? 'var(--accent)' : 'var(--bg-raised)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: input.trim() ? '#fff' : 'var(--fg-muted)', cursor: input.trim() ? 'pointer' : 'default', transition: 'background 0.2s', flexShrink: 0 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
