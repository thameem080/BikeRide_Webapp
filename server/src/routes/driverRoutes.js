import express from 'express';
import { store } from '../services/store.js';

const router = express.Router();

// 1. Get all drivers (optional online filter)
router.get('/', (req, res) => {
  const { onlineOnly } = req.query;
  let list = store.drivers;
  if (onlineOnly === 'true') {
    list = list.filter((d) => d.isOnline && d.verificationStatus === 'approved');
  }
  return res.json({ success: true, data: list });
});

// 2. Get single driver profile
router.get('/:id', (req, res) => {
  const driver = store.drivers.find((d) => d.id === req.params.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }
  return res.json({ success: true, data: driver });
});

// 3. Toggle online / offline
router.patch('/:id/toggle-online', (req, res) => {
  const driver = store.drivers.find((d) => d.id === req.params.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  driver.isOnline = !driver.isOnline;
  return res.json({ success: true, isOnline: driver.isOnline, message: `Driver is now ${driver.isOnline ? 'Online' : 'Offline'}` });
});

// 4. Update GPS location
router.patch('/:id/location', (req, res) => {
  const { lat, lng, address } = req.body;
  const driver = store.drivers.find((d) => d.id === req.params.id);

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  driver.location = {
    lat: Number(lat),
    lng: Number(lng),
    address: address || driver.location.address
  };

  // If driver has active ride, also update location in ride for live passenger tracking
  const activeRide = store.rides.find(
    (r) => r.driverId === driver.id && ['accepted', 'arriving', 'in_progress'].includes(r.status)
  );
  if (activeRide) {
    activeRide.driverLocation = driver.location;
  }

  return res.json({ success: true, data: driver.location });
});

// 5. Get current active ride for driver
router.get('/:id/active-ride', (req, res) => {
  const activeRide = store.rides.find(
    (r) => r.driverId === req.params.id && ['accepted', 'arriving', 'in_progress'].includes(r.status)
  );
  return res.json({ success: true, data: activeRide || null });
});

export default router;
