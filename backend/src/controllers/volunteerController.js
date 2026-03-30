import { supabase } from '../config/supabase.js';

// GET /api/volunteers — count only (privacy: no locations shared before SOS)
export const getVolunteerStats = async (req, res) => {
  try {
    const { count } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true);

    return res.json({ availableCount: count || 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/volunteers/availability — volunteer updates own availability
export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const { data: vol } = await supabase
      .from('volunteers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!vol) return res.status(404).json({ error: 'Volunteer profile not found' });

    await supabase
      .from('volunteers')
      .update({ is_available: isAvailable, last_seen: new Date().toISOString() })
      .eq('id', vol.id);

    return res.json({ isAvailable });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/volunteers/location — volunteer updates their location
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const { data: vol } = await supabase
      .from('volunteers')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!vol) return res.status(404).json({ error: 'Volunteer profile not found' });

    await supabase
      .from('volunteers')
      .update({ last_lat: lat, last_lng: lng, last_seen: new Date().toISOString() })
      .eq('id', vol.id);

    return res.json({ updated: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/volunteers/my-profile
export const getMyVolunteerProfile = async (req, res) => {
  try {
    const { data } = await supabase
      .from('volunteers')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    return res.json(data || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
