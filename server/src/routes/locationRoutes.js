import express from 'express';
import { searchLocations, CHENNAI_LOCATIONS } from '../services/locationService.js';

const router = express.Router();

router.get('/autocomplete', (req, res) => {
  const { q } = req.query;
  const results = searchLocations(q);
  return res.json({ success: true, data: results });
});

router.get('/popular', (req, res) => {
  return res.json({ success: true, data: CHENNAI_LOCATIONS.slice(0, 8) });
});

router.get('/reverse-geocode', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required' });
  }

  const pLat = parseFloat(lat);
  const pLng = parseFloat(lng);

  // Find closest pre-defined location or default
  let closest = CHENNAI_LOCATIONS[0];
  let minDiff = 999999;

  for (const loc of CHENNAI_LOCATIONS) {
    const diff = Math.hypot(loc.lat - pLat, loc.lng - pLng);
    if (diff < minDiff) {
      minDiff = diff;
      closest = loc;
    }
  }

  return res.json({
    success: true,
    data: {
      address: closest.name,
      shortName: closest.shortName,
      lat: pLat,
      lng: pLng
    }
  });
});

export default router;
