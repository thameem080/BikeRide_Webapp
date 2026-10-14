import express from 'express';
import { store } from '../services/store.js';
import { calculateDistanceKm, estimateDurationMins, calculateFare } from '../services/fareService.js';

const router = express.Router();

// 1. Calculate fare estimate
router.post('/estimate', (req, res) => {
  try {
    const { pickup, destination } = req.body;
    if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({ error: 'Pickup and destination coordinates (lat, lng) are required' });
    }

    const distanceKm = calculateDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const durationMins = estimateDurationMins(distanceKm);
    const fare = calculateFare(distanceKm, durationMins);

    return res.json({
      success: true,
      data: {
        distanceKm,
        durationMins,
        fare
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Create new ride request
router.post('/', (req, res) => {
  try {
    const {
      customerId = 'c0000000-0000-0000-0000-000000000001',
      customerName = 'Karthik Subramanian',
      customerPhone = '+91 98401 23456',
      pickup,
      destination,
      paymentMethod = 'UPI'
    } = req.body;

    if (!pickup?.lat || !destination?.lat) {
      return res.status(400).json({ error: 'Valid pickup and destination locations are required' });
    }

    const distanceKm = calculateDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const durationMins = estimateDurationMins(distanceKm);
    const fare = calculateFare(distanceKm, durationMins);

    // Generate 4-digit security PIN/OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newRide = {
      id: `ride-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      customerName,
      customerPhone,
      driverId: null,
      driver: null,
      status: 'requested', // requested -> accepted -> arriving -> in_progress -> completed | cancelled
      pickup,
      destination,
      distanceKm,
      estimatedDurationMins: durationMins,
      baseFare: fare.baseFare,
      estimatedFare: fare.estimatedTotal,
      finalFare: null,
      fareBreakdown: fare,
      paymentMethod,
      paymentStatus: 'pending',
      otp,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      driverLocation: null
    };

    store.rides.unshift(newRide);

    return res.status(201).json({
      success: true,
      data: newRide
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Get single ride by ID
router.get('/:id', (req, res) => {
  const ride = store.rides.find((r) => r.id === req.params.id);
  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  // Populate driver details if assigned
  let driverData = null;
  if (ride.driverId) {
    const d = store.drivers.find((dr) => dr.id === ride.driverId);
    if (d) {
      driverData = {
        id: d.id,
        name: d.name,
        phone: d.phone,
        avatar: d.avatar,
        rating: d.rating,
        vehicle: d.vehicle,
        location: d.location
      };
    }
  }

  return res.json({
    success: true,
    data: {
      ...ride,
      driver: driverData || ride.driver
    }
  });
});

// 4. Customer ride history
router.get('/customer/:customerId', (req, res) => {
  const list = store.rides.filter((r) => r.customerId === req.params.customerId);
  return res.json({ success: true, data: list });
});

// 5. Driver incoming ride requests (Rides in 'requested' state)
router.get('/driver/available-requests', (req, res) => {
  const requestedRides = store.rides.filter((r) => r.status === 'requested');
  return res.json({ success: true, data: requestedRides });
});

// 6. Driver accepts ride
router.post('/:id/accept', (req, res) => {
  const { driverId } = req.body;
  const ride = store.rides.find((r) => r.id === req.params.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }
  if (ride.status !== 'requested') {
    return res.status(400).json({ error: `Ride cannot be accepted. Current status: ${ride.status}` });
  }

  const driver = store.drivers.find((d) => d.id === driverId) || store.drivers[0];
  ride.status = 'accepted';
  ride.driverId = driver.id;
  ride.driver = {
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    avatar: driver.avatar,
    rating: driver.rating,
    vehicle: driver.vehicle,
    location: driver.location
  };
  ride.acceptedAt = new Date().toISOString();

  return res.json({ success: true, data: ride });
});

// 7. Verify OTP & Start Ride
router.post('/:id/verify-otp', (req, res) => {
  const { otp } = req.body;
  const ride = store.rides.find((r) => r.id === req.params.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }
  if (ride.otp !== otp) {
    return res.status(400).json({ error: 'Invalid 4-digit PIN / OTP. Please ask customer to confirm.' });
  }

  ride.status = 'in_progress';
  ride.startedAt = new Date().toISOString();

  return res.json({ success: true, data: ride });
});

// 8. Update status (arriving, in_progress, completed)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validTransitions = ['requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'];

  if (!validTransitions.includes(status)) {
    return res.status(400).json({ error: 'Invalid ride status transition' });
  }

  const ride = store.rides.find((r) => r.id === req.params.id);
  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  ride.status = status;
  if (status === 'completed') {
    ride.completedAt = new Date().toISOString();
    ride.finalFare = ride.estimatedFare;
    ride.paymentStatus = 'completed';

    // Update driver earnings & ride count
    if (ride.driverId) {
      const driver = store.drivers.find((d) => d.id === ride.driverId);
      if (driver) {
        driver.totalRides += 1;
        driver.totalEarnings += ride.finalFare;
      }
    }
  }

  return res.json({ success: true, data: ride });
});

// 9. Cancel ride
router.post('/:id/cancel', (req, res) => {
  const { reason = 'Customer cancelled', cancelledBy = 'customer' } = req.body;
  const ride = store.rides.find((r) => r.id === req.params.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }
  if (ride.status === 'completed' || ride.status === 'cancelled') {
    return res.status(400).json({ error: `Cannot cancel ride already in ${ride.status} state` });
  }

  ride.status = 'cancelled';
  ride.cancelledAt = new Date().toISOString();
  ride.cancellationReason = reason;
  ride.cancelledBy = cancelledBy;

  return res.json({ success: true, data: ride });
});

// 10. Rate ride
router.post('/:id/rate', (req, res) => {
  const { rating, feedback } = req.body;
  const ride = store.rides.find((r) => r.id === req.params.id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  ride.rating = rating;
  ride.feedback = feedback;

  return res.json({ success: true, message: 'Rating recorded successfully' });
});

export default router;
