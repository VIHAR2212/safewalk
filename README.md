# 🛡️ SafeWalk — Real-Time Personal Safety Platform

> Full-stack web app: React + Node/Express + Supabase + Mapbox GL JS

---

## 📁 Folder Structure

```
safewalk/
├── backend/
│   ├── src/
│   │   ├── config/supabase.js        ← Supabase client
│   │   ├── controllers/
│   │   │   ├── authController.js     ← Register, login, demo
│   │   │   ├── sosController.js      ← SOS trigger, resolve, active
│   │   │   └── volunteerController.js← Availability, location
│   │   ├── middleware/auth.js         ← JWT verify, role guard
│   │   ├── routes/index.js           ← All API routes
│   │   └── index.js                  ← Express app entry
│   ├── schema.sql                    ← Run in Supabase SQL editor
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── map/MapView.jsx        ← Mapbox, dark/light, volunteer animation
    │   │   ├── sos/SOSButton.jsx      ← Hold-to-trigger SOS
    │   │   ├── sos/VolunteerPanel.jsx ← Dispatched volunteer cards
    │   │   ├── dashboard/RiskPanel.jsx← Mock risk zones + safe routes
    │   │   └── ui/Navbar.jsx         ← Nav with theme toggle
    │   ├── context/
    │   │   ├── AuthContext.jsx        ← Global auth state
    │   │   └── ThemeContext.jsx       ← Dark/light mode
    │   ├── hooks/useLocation.js       ← Browser geolocation
    │   ├── pages/
    │   │   ├── LoginPage.jsx          ← Email / phone / demo login
    │   │   ├── DashboardPage.jsx      ← Main user dashboard
    │   │   └── VolunteerPage.jsx      ← Volunteer control panel
    │   ├── services/api.js            ← Axios with JWT interceptor
    │   ├── App.jsx                    ← Routes + protected routes
    │   ├── main.jsx
    │   └── index.css                  ← Design tokens (black/orange/red)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## ⚙️ Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A free [Mapbox](https://mapbox.com) account (public token)

---

## 🚀 Setup in 5 Steps

### Step 1 — Supabase Setup

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** → paste the contents of `backend/schema.sql` → Run
3. Copy your **Project URL** and **service_role key** from:
   Settings → API → Project URL + service_role secret

### Step 2 — Mapbox Token

1. Create account at https://mapbox.com
2. Copy your **Default public token** from the Tokens page

### Step 3 — Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values:
# SUPABASE_URL=https://xxxx.supabase.co
# SUPABASE_SERVICE_KEY=eyJ...
# JWT_SECRET=any-random-32-char-string

npm install
npm run dev
# ✅ Running on http://localhost:5000
```

### Step 4 — Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in:
# VITE_MAPBOX_TOKEN=pk.eyJ...
# VITE_API_URL=http://localhost:5000/api

npm install
npm run dev
# ✅ Running on http://localhost:3000
```

### Step 5 — Login

Open http://localhost:3000

- **Demo User**: Click "Demo" tab → "Demo User Account"
- **Demo Volunteer**: Click "Demo" tab → "Demo Volunteer Account"
- **Register**: Click "Email" tab → Register link

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login with email/password |
| POST | `/api/auth/demo` | None | Demo login (role: user/volunteer) |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/sos` | JWT | Trigger SOS (send lat/lng) |
| POST | `/api/sos/resolve` | JWT | Resolve active emergency |
| GET | `/api/sos/active` | JWT | Check for active emergency |
| GET | `/api/volunteers` | JWT | Get available volunteer count |
| PATCH | `/api/volunteers/availability` | JWT+volunteer | Update availability |
| PATCH | `/api/volunteers/location` | JWT+volunteer | Update location |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0D0D0D` (dark) / `#F5F5F5` (light) |
| Surface | `#1A1A1A` (dark) / `#FFFFFF` (light) |
| Accent (orange) | `#E85D04` |
| Danger (red) | `#D62828` |
| Text | `#F5F5F5` (dark) / `#0D0D0D` (light) |
| Font | Space Grotesk + JetBrains Mono |

---

## 🔒 Privacy Design

- User location is **never continuously tracked**
- Location is only sent to backend when SOS is triggered
- Volunteer locations are **not exposed to users** until SOS
- Only selected 2–3 volunteers see the user's location
- JWT auth on all protected routes

---

## 🧩 Extending the App

| Feature | Where |
|---------|-------|
| Real SMS alerts | `backend/src/controllers/sosController.js` → `mockNotify()` |
| WhatsApp (Twilio) | Install `twilio`, replace `mockNotify` |
| Google OAuth | Supabase Auth → Providers → Google |
| Phone OTP | Supabase Auth → Providers → Phone |
| Real heatmap data | `frontend/src/components/dashboard/RiskPanel.jsx` |
| Push notifications | Add Firebase Cloud Messaging |

---

## 🐛 Troubleshooting

**Map is blank** → Check `VITE_MAPBOX_TOKEN` in frontend `.env`

**Login fails** → Run `schema.sql` in Supabase SQL editor first

**CORS error** → Check `FRONTEND_URL` in backend `.env` matches your frontend port

**Demo accounts missing** → The seed inserts in `schema.sql` use `ON CONFLICT DO NOTHING`. Run the SQL again if needed.
