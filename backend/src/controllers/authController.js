import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password required' });

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash: hash, role })
      .select('id, email, name, role')
      .single();

    if (error) throw error;

    if (role === 'volunteer') {
      await supabase.from('volunteers').insert({
        user_id: user.id,
        last_lat: 21.1458,
        last_lng: 79.0882,
      });
    }

    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, is_active')
      .eq('email', email)
      .single();

    if (!user || !user.is_active)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, ...safeUser } = user;
    return res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/demo
export const demoLogin = async (req, res) => {
  try {
    const { role = 'user' } = req.body;
    const email = role === 'volunteer' ? 'volunteer@safewalk.app' : 'demo@safewalk.app';

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .single();

    if (!user) return res.status(404).json({ error: 'Demo account not found. Run schema.sql first.' });

    return res.json({ token: signToken(user), user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
