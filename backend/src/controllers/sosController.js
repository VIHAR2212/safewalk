import { supabase } from '../config/supabase.js';

// Haversine formula – distance in km between two lat/lng points
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Mock notification (replace with Twilio/WhatsApp)
const mockNotify = (volunteer, emergency) => {
  console.log(`[NOTIFY] Volunteer ${volunteer.users?.name} → Emergency ${emergency.id}`);
  console.log(`[NOTIFY] User location: ${emergency.user_lat}, ${emergency.user_lng}`);
};

// POST /api/sos
export const triggerSOS = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng)
      return res.status(400).json({ error: 'Location (lat, lng) required' });

    // 1. Create emergency record
    const { data: emergency, error: eErr } = await supabase
      .from('emergencies')
      .insert({ user_id: req.user.id, user_lat: lat, user_lng: lng, status: 'active' })
      .select()
      .single();

    if (eErr) throw eErr;

    // 2. Get all available volunteers
    const { data: volunteers } = await supabase
      .from('volunteers')
      .select('*, users(id, name, phone, email)')
      .eq('is_available', true)
      .not('last_lat', 'is', null);

    if (!volunteers || volunteers.length === 0) {
      return res.json({
        emergency,
        volunteers: [],
        message: 'No volunteers available right now. Authorities have been notified.',
      });
    }

    // 3. Sort by distance, pick nearest 2–3
    const sorted = volunteers
      .map((v) => ({ ...v, distance: haversine(lat, lng, v.last_lat, v.last_lng) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.min(3, volunteers.length));

    // 4. Insert emergency_volunteers records
    const assignments = sorted.map((v) => ({
      emergency_id: emergency.id,
      volunteer_id: v.id,
      status: 'dispatched',
    }));

    await supabase.from('emergency_volunteers').insert(assignments);

    // 5. Send mock notifications
    sorted.forEach((v) => mockNotify(v, emergency));

    // 6. Format response (only share user location with selected volunteers, not to client)
    const safeVolunteers = sorted.map((v) => ({
      id: v.id,
      name: v.users?.name || 'Volunteer',
      isVerified: v.is_verified,
      rating: v.rating,
      distance: Math.round(v.distance * 10) / 10,
      // Start position for animation
      currentLat: v.last_lat,
      currentLng: v.last_lng,
    }));

    return res.status(201).json({
      emergency: { id: emergency.id, status: emergency.status },
      volunteers: safeVolunteers,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/sos/resolve
export const resolveEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.body;
    if (!emergencyId) return res.status(400).json({ error: 'emergencyId required' });

    const { data: emergency } = await supabase
      .from('emergencies')
      .select('user_id, status')
      .eq('id', emergencyId)
      .single();

    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });
    if (emergency.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await supabase
      .from('emergencies')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', emergencyId);

    await supabase
      .from('emergency_volunteers')
      .update({ status: 'completed' })
      .eq('emergency_id', emergencyId);

    // Increment total_assists for dispatched volunteers
    const { data: evs } = await supabase
      .from('emergency_volunteers')
      .select('volunteer_id')
      .eq('emergency_id', emergencyId);

    if (evs?.length) {
      for (const ev of evs) {
        const { data: vol } = await supabase
          .from('volunteers').select('total_assists').eq('id', ev.volunteer_id).single();
        if (vol) {
          await supabase
            .from('volunteers')
            .update({ total_assists: vol.total_assists + 1 })
            .eq('id', ev.volunteer_id);
        }
      }
    }

    return res.json({ message: 'Emergency resolved. You are safe.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/sos/active
export const getActiveEmergency = async (req, res) => {
  try {
    const { data: emergency } = await supabase
      .from('emergencies')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .single();

    if (!emergency) return res.json({ emergency: null });

    const { data: assignments } = await supabase
      .from('emergency_volunteers')
      .select('*, volunteers(*, users(name))')
      .eq('emergency_id', emergency.id);

    return res.json({ emergency, assignments });
  } catch {
    return res.json({ emergency: null });
  }
};
