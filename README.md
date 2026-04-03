# 🛡️ SafeWalk — Real-Time Personal Safety Platform

> A privacy-first, full-stack web application designed to provide real-time assistance and geographic safety awareness. Built with React, Node/Express, Supabase, and Mapbox GL JS.

---

## ✨ Key Features

* **Real-Time SOS Dispatch:** A hold-to-trigger SOS button that instantly alerts the system and dispatches nearby volunteers.
* **Live Volunteer Tracking:** During an emergency, users receive dispatched volunteer cards and can see their live approach on the map.
* **Risk Zone Awareness:** A dedicated dashboard panel displaying mock risk zones and safe navigational routes.
* **Privacy-First Architecture:** Location data is never continuously tracked; it is only shared with the backend during an active SOS, and volunteer locations are never exposed until they accept a dispatch.
* **Role-Based Access Control:** Secure JWT authentication separating standard users from verified community volunteers.
* **Adaptive UI:** A sleek, accessible interface featuring a seamless dark/light mode toggle integrated with the interactive Mapbox interface.

## 💻 Tech Stack

| Category | Technology | Function in SafeWalk |
| :--- | :--- | :--- |
| **Core Languages** | **JavaScript (ES6+)** | The foundational programming language powering both the React frontend and the Node.js backend. |
| **Markup & Style** | **HTML5 & CSS3** | Structures the web application and applies the custom CSS design tokens for the high-contrast emergency UI. |
| **Frontend** | **React.js (Vite)** | Powers the reactive user interface, state management, and mobile-responsive dashboards. |
| **Maps & Geospatial** | **Mapbox GL JS** | Renders the interactive dark/light maps, mock risk zones, and live volunteer tracking markers. |
| **Backend API** | **Node.js & Express** | Handles the core business logic, SOS trigger routing, and secure JWT verification. |
| **Database & Auth** | **Supabase** | Serves as the PostgreSQL database for users, volunteers, and forum posts. Manages Row Level Security (RLS). |
| **Frontend Deployment**| **Vercel** | Hosts the React frontend on a blazing-fast global edge network with automated CI/CD from GitHub. |
| **Backend Deployment** | **Render** | Hosts the Express backend as a continuous web service to ensure 24/7 uptime for emergency SOS requests. |

---

## 🌍 Deployment Architecture

SafeWalk is designed with a decoupled, modern architecture, optimized for reliable cloud hosting:

* **Frontend Hosting (Vercel):** The React (Vite) frontend is deployed on Vercel. This provides blazing-fast edge caching for the user interface, automated CI/CD directly from GitHub, and secure client-side management of environment variables like the Mapbox tokens.
* **Backend Hosting (Render):** The Node.js and Express REST API is hosted on Render as a web service. Render provides a highly reliable, always-on environment to handle critical SOS triggers, calculate volunteer distances, and securely interface with the Supabase PostgreSQL database using server-side secrets.

---
## 📁 Folder Structure 
safewalk/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js             ← Supabase client connection setup
│   │   ├── controllers/
│   │   │   ├── authController.js       ← Handles user/volunteer login and registration
│   │   │   ├── forumController.js      ← Handles local safety forum API (GET/POST)
│   │   │   ├── riskZoneController.js   ← Logic for fetching and checking risk zones
│   │   │   ├── sosController.js        ← Manages active emergencies and SOS dispatch
│   │   │   └── volunteerController.js  ← Updates volunteer location and availability
│   │   ├── middleware/
│   │   │   └── auth.js                 ← JWT verification and role-based access guard
│   │   ├── routes/
│   │   │   └── index.js                ← Express API routing hub
│   │   └── index.js                    ← Main Node.js/Express server entry point
│   ├── .env                            ← Backend environment variables (ignored in git)
│   ├── .env.example                    ← Template for backend env variables
│   ├── package-lock.json
│   ├── package.json                    ← Backend dependencies
│   └── schema.sql                      ← Supabase DB schema and mass seed data
│
├── frontend/
│   ├── src/
│   │   ├── assets/                     ← Static images, SVGs, and icons
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── ForumPanel.jsx      ← UI for the local community safety forum
│   │   │   │   └── RiskPanel.jsx       ← UI displaying nearby mock risk zones
│   │   │   ├── map/
│   │   │   │   ├── MapView.jsx         ← Main Mapbox GL JS map interface
│   │   │   │   └── RiskZoneMap.jsx     ← Specialized map overlay for risk zones
│   │   │   ├── sos/
│   │   │   │   ├── SOSButton.jsx       ← The central hold-to-trigger SOS button
│   │   │   │   └── VolunteerPanel.jsx  ← Displays dispatched volunteer information
│   │   │   └── ui/
│   │   │       ├── LoadingScreen.jsx   ← App loading state UI
│   │   │       └── Navbar.jsx          ← Top navigation and dark/light theme toggle
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         ← Global React context for user state
│   │   │   └── ThemeContext.jsx        ← Global React context for theming
│   │   ├── hooks/
│   │   │   └── useLocation.js          ← Custom hook for browser geolocation API
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx       ← Main map and control screen for users
│   │   │   ├── LoginPage.jsx           ← Authentication and demo login screen
│   │   │   └── VolunteerPage.jsx       ← Control panel and stats for active volunteers
│   │   ├── services/
│   │   │   └── api.js                  ← Axios instance with JWT interceptors
│   │   ├── App.jsx                     ← Main React component and route definitions
│   │   ├── index.css                   ← Global styles and design tokens
│   │   └── main.jsx                    ← React DOM entry point
│   ├── .env.example                    ← Template for frontend env variables
│   ├── index.html                      ← Main HTML template
│   ├── package-lock.json
│   ├── package.json                    ← Frontend dependencies (Vite, React, Mapbox)
│   ├── vercel.json                     ← Vercel deployment and routing configuration
│   └── vite.config.js                  ← Vite bundler configuration
│
└── README.md                           ← Project documentation


---

## 🔑 Usage & Login

Once the application is deployed, you can easily test the platform's roles using the built-in demo credentials:

1. **Demo User**: Navigate to the login screen, click the "Demo" tab, and select "Demo User Account".
2. **Demo Volunteer**: Navigate to the login screen, click the "Demo" tab, and select "Demo Volunteer Account".
3. **New Registration**: Click the "Email" tab and use the Register link to create a fresh account.

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

SafeWalk uses a high-contrast, accessible design system tailored for high-stress emergency situations.

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

Protecting user data is the core foundation of SafeWalk:
* User location is **never continuously tracked**.
* Location is only transmitted to the backend the moment an SOS is triggered.
* Volunteer locations are **not exposed to users** until they are actively dispatched to an SOS.
* Only a highly restricted selection of 2–3 nearby volunteers receive the user's location.
* Strict JWT authentication guards all protected routes and API endpoints.
  
