import express from 'express';
import { store } from '../services/store.js';

const router = express.Router();

// 1. System metrics
router.get('/metrics', (req, res) => {
  const totalRides = store.rides.length;
  const activeRides = store.rides.filter((r) => ['requested', 'accepted', 'arriving', 'in_progress'].includes(r.status)).length;
  const completedRides = store.rides.filter((r) => r.status === 'completed').length;
  const cancelledRides = store.rides.filter((r) => r.status === 'cancelled').length;

  const totalRevenue = store.rides
    .filter((r) => r.status === 'completed' && r.finalFare)
    .reduce((sum, r) => sum + r.finalFare, 0);

  const onlineDrivers = store.drivers.filter((d) => d.isOnline).length;
  const totalDrivers = store.drivers.length;
  const pendingApprovals = store.drivers.filter((d) => d.verificationStatus === 'pending').length;

  return res.json({
    success: true,
    data: {
      totalRides,
      activeRides,
      completedRides,
      cancelledRides,
      completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 100,
      totalRevenue: Math.round(totalRevenue),
      onlineDrivers,
      totalDrivers,
      pendingApprovals,
      fareRules: store.fareRules
    }
  });
});

// 2. Get all rides for admin monitor
router.get('/rides', (req, res) => {
  const { status } = req.query;
  let rides = store.rides;
  if (status) {
    rides = rides.filter((r) => r.status === status);
  }
  return res.json({ success: true, data: rides });
});

// 3. Get / update fare rules
router.get('/fare-rules', (req, res) => {
  return res.json({ success: true, data: store.fareRules });
});

router.put('/fare-rules', (req, res) => {
  const {
    baseFare,
    baseDistanceKm,
    perKmRate,
    perMinRate,
    minFare,
    surgeMultiplier,
    nightChargeMultiplier
  } = req.body;

  store.fareRules = {
    ...store.fareRules,
    baseFare: Number(baseFare ?? store.fareRules.baseFare),
    baseDistanceKm: Number(baseDistanceKm ?? store.fareRules.baseDistanceKm),
    perKmRate: Number(perKmRate ?? store.fareRules.perKmRate),
    perMinRate: Number(perMinRate ?? store.fareRules.perMinRate),
    minFare: Number(minFare ?? store.fareRules.minFare),
    surgeMultiplier: Number(surgeMultiplier ?? store.fareRules.surgeMultiplier),
    nightChargeMultiplier: Number(nightChargeMultiplier ?? store.fareRules.nightChargeMultiplier),
    updatedAt: new Date().toISOString()
  };

  return res.json({
    success: true,
    message: 'Fare rules updated successfully',
    data: store.fareRules
  });
});

// 4. Driver approvals
router.get('/drivers', (req, res) => {
  return res.json({ success: true, data: store.drivers });
});

router.patch('/drivers/:id/verify', (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  const driver = store.drivers.find((d) => d.id === req.params.id);

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  driver.verificationStatus = status;
  return res.json({ success: true, data: driver, message: `Driver verification set to ${status}` });
});

// 5. Customer complaints / support logs
router.get('/complaints', (req, res) => {
  const complaints = store.rides
    .filter((r) => r.rating && r.rating <= 3)
    .map((r) => ({
      id: `comp-${r.id}`,
      rideId: r.id,
      customerName: r.customerName,
      driverName: r.driver?.name || 'Assigned Driver',
      rating: r.rating,
      feedback: r.feedback || 'Driver arrived late and drove erratically.',
      date: r.completedAt || r.createdAt,
      status: 'under_review'
    }));

  return res.json({ success: true, data: complaints });
});

export default router;
