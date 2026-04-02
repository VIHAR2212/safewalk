import { supabase } from '../config/supabase.js';

// Haversine distance in meters
const distanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Mock WhatsApp notification (replace with Twilio when ready)
const sendWhatsAppAlert = async (user, zone) => {
  console.log(`[WHATSAPP ALERT] → ${user.phone || user.email}`);
  console.log(`[WHATSAPP ALERT] You entered a HIGH RISK zone: ${zone.name}`);
  console.log(`[WHATSAPP ALERT] ${zone.description}`);
  console.log(`[WHATSAPP ALERT] Stay alert and move to a safer area.`);

  // ── Twilio WhatsApp (uncomment when you have credentials) ──
  // import twilio from 'twilio';
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:${user.phone}`,
  //   body: `🚨 SafeWalk Alert!\n\nYou have entered a HIGH RISK area:\n📍 ${zone.name}\n⚠️ ${zone.description}\n\nPlease stay alert and move to a safer location.\n\nStay safe! 🛡️`
  // });
};

// GET /api/risk-zones?lat=xx&lng=xx&radius=5000
export const getNearbyZones = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const { data: zones, error } = await supabase
      .from('risk_zones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter zones within radius
    const nearby = zones.filter(z => {
      const dist = distanceMeters(userLat, userLng, z.lat, z.lng);
      return dist <= parseFloat(radius);
    });

    return res.json({ zones: nearby });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/risk-zones/report
export const reportZone = async (req, res) => {
  try {
    const { lat, lng, name, description, riskLevel } = req.body;
    if (!lat || !lng || !riskLevel)
      return res.status(400).json({ error: 'lat, lng and riskLevel required' });

    // Check if zone already exists nearby (within 200m)
    const { data: existing } = await supabase
      .from('risk_zones')
      .select('*');

    const nearby = existing?.find(z =>
      distanceMeters(lat, lng, z.lat, z.lng) < 200 &&
      z.risk_level === riskLevel
    );

    if (nearby) {
      // Increment report count instead of creating duplicate
      await supabase
        .from('risk_zones')
        .update({
          report_count: nearby.report_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', nearby.id);

      return res.json({ zone: nearby, merged: true });
    }

    // Create new zone
    const { data: zone, error } = await supabase
      .from('risk_zones')
      .insert({
        lat, lng,
        name: name || 'User Reported Zone',
        description: description || 'Reported by SafeWalk user',
        risk_level: riskLevel,
        radius: riskLevel === 'high' ? 300 : riskLevel === 'moderate' ? 250 : 200,
        reported_by: req.user.id,
        verified: false,
        report_count: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ zone });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/risk-zones/check-entry
// Called when user moves — checks if they entered a red zone
export const checkZoneEntry = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const { data: zones } = await supabase
      .from('risk_zones')
      .select('*')
      .eq('risk_level', 'high');

    if (!zones?.length) return res.json({ inDangerZone: false });

    // Check if user is inside any high risk zone
    const enteredZone = zones.find(z =>
      distanceMeters(lat, lng, z.lat, z.lng) <= z.radius
    );

    if (!enteredZone) return res.json({ inDangerZone: false });

    // Check if already alerted recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAlert } = await supabase
      .from('zone_alerts')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('zone_id', enteredZone.id)
      .gte('alerted_at', oneHourAgo)
      .single();

    if (recentAlert) return res.json({ inDangerZone: true, zone: enteredZone, alreadyNotified: true });

    // Get user details for notification
    const { data: user } = await supabase
      .from('users')
      .select('name, email, phone')
      .eq('id', req.user.id)
      .single();

    // Send WhatsApp alert
    await sendWhatsAppAlert(user, enteredZone);

    // Record alert
    await supabase
      .from('zone_alerts')
      .upsert({
        user_id: req.user.id,
        zone_id: enteredZone.id,
        alerted_at: new Date().toISOString()
      }, { onConflict: 'user_id,zone_id' });

    return res.json({
      inDangerZone: true,
      zone: enteredZone,
      notificationSent: true
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
