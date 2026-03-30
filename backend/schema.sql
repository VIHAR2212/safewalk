-- SafeWalk Database Schema
-- Run this in your Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'volunteer', 'admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteers table (extends users)
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_assists INTEGER DEFAULT 0,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergencies table
CREATE TABLE IF NOT EXISTS emergencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  user_lat DOUBLE PRECISION NOT NULL,
  user_lng DOUBLE PRECISION NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

-- Emergency volunteers (junction)
CREATE TABLE IF NOT EXISTS emergency_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES emergencies(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'arrived', 'completed'))
);

-- Seed demo users
INSERT INTO users (id, email, name, role, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@safewalk.app', 'Demo User', 'user', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('00000000-0000-0000-0000-000000000002', 'volunteer@safewalk.app', 'Demo Volunteer', 'volunteer', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Seed volunteers with locations around Nagpur, India
INSERT INTO volunteers (user_id, is_available, is_verified, rating, last_lat, last_lng) VALUES
  ('00000000-0000-0000-0000-000000000002', true, true, 4.8, 21.1458, 79.0882),
  (gen_random_uuid(), true, true, 4.9, 21.1528, 79.0940),
  (gen_random_uuid(), true, false, 4.5, 21.1398, 79.0822),
  (gen_random_uuid(), false, true, 4.7, 21.1600, 79.1000),
  (gen_random_uuid(), true, true, 5.0, 21.1480, 79.0860)
ON CONFLICT DO NOTHING;

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteers(last_lat, last_lng);
CREATE INDEX IF NOT EXISTS idx_emergencies_user ON emergencies(user_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);
