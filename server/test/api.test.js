/**
 * VELO AI — Comprehensive End-to-End API Test Suite
 * Tests full lifecycle: Voice AI -> Fare Engine -> Dispatch -> OTP -> Rating -> Admin
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting VELO AI End-to-End Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    console.log('1. Testing System Health API');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with 200');
    assert(healthJson.status === 'healthy', 'System status is healthy');

    // 2. Location Autocomplete
    console.log('\n2. Testing Location Autocomplete & Geocoding');
    const locRes = await fetch(`${BASE_URL}/api/locations/autocomplete?q=central`);
    const locJson = await locRes.json();
    assert(locJson.success === true, 'Location search succeeds');
    assert(locJson.data.length > 0, 'Found matching locations for "central"');
    assert(locJson.data[0].lat && locJson.data[0].lng, 'Location has valid coordinates');

    // 3. Fare Estimation Engine
    console.log('\n3. Testing Server-Authoritative Fare Estimation');
    const estimateRes = await fetch(`${BASE_URL}/api/rides/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup: { lat: 13.0827, lng: 80.2707 },
        destination: { lat: 13.0418, lng: 80.2341 }
      })
    });
    const estimateJson = await estimateRes.json();
    assert(estimateRes.status === 200, 'Estimate endpoint responds with 200');
    assert(estimateJson.data.distanceKm > 0, `Computed distance: ${estimateJson.data.distanceKm} km`);
    assert(estimateJson.data.fare.estimatedTotal >= 25, `Calculated fare: ₹${estimateJson.data.fare.estimatedTotal}`);

    // 4. Voice AI Intent Engine (English & Tamil)
    console.log('\n4. Testing Voice AI Intent Engine');
    
    // Test 4a: Disambiguation for "railway station"
    const aiClarifyRes = await fetch(`${BASE_URL}/api/ai/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Book a bike to the railway station',
        language: 'en'
      })
    });
    const clarifyJson = await aiClarifyRes.json();
    assert(clarifyJson.data.intent === 'clarify', 'Correctly asks for disambiguation when station is ambiguous');

    // Test 4b: Destination provided in Tamil
    const aiTamilRes = await fetch(`${BASE_URL}/api/ai/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'சென்னை சென்ட்ரல் போகணும்',
        language: 'ta'
      })
    });
    const tamilJson = await aiTamilRes.json();
    assert(tamilJson.data.destination !== null, 'Extracted Tamil destination successfully');
    assert(tamilJson.data.isConfirmed === false, 'Strictly requires explicit confirmation before booking');

    // Test 4c: Explicit Confirmation
    const aiConfirmRes = await fetch(`${BASE_URL}/api/ai/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Yes, book it',
        language: 'en',
        currentDraft: {
          pickup: 'Chennai Central',
          destination: 'Marina Beach',
          estimatedFare: 87
        }
      })
    });
    const confirmJson = await aiConfirmRes.json();
    assert(confirmJson.data.isConfirmed === true, 'Explicit booking confirmation verified');
    assert(confirmJson.data.action === 'create_booking', 'Generated booking creation action');

    // 5. Complete Ride Lifecycle
    console.log('\n5. Testing End-to-End Ride Lifecycle (Booking -> Dispatch -> OTP -> Completion)');
    // 5a. Create Ride
    const createRideRes = await fetch(`${BASE_URL}/api/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'c0000000-0000-0000-0000-000000000001',
        customerName: 'Karthik Subramanian',
        customerPhone: '+91 98401 23456',
        pickup: { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
        destination: { name: 'Marina Beach', lat: 13.0398, lng: 80.2785 },
        paymentMethod: 'UPI'
      })
    });
    const rideJson = await createRideRes.json();
    const createdRide = rideJson.data;
    assert(createRideRes.status === 201, 'Ride created successfully');
    assert(createdRide.status === 'requested', 'Initial ride status is "requested"');
    assert(createdRide.otp.length === 4, `Security PIN (OTP) generated: ${createdRide.otp}`);

    // 5b. Driver accepts ride
    const acceptRes = await fetch(`${BASE_URL}/api/rides/${createdRide.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: 'd0000000-0000-0000-0000-000000000001'
      })
    });
    const acceptJson = await acceptRes.json();
    assert(acceptJson.data.status === 'accepted', 'Driver accepted ride');
    assert(acceptJson.data.driver.name === 'Senthil Kumar', 'Assigned captain is Senthil Kumar');

    // 5c. Driver arrives at pickup
    const arriveRes = await fetch(`${BASE_URL}/api/rides/${createdRide.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'arriving' })
    });
    const arriveJson = await arriveRes.json();
    assert(arriveJson.data.status === 'arriving', 'Status transitioned to "arriving"');

    // 5d. Verify OTP to start ride
    const otpVerifyRes = await fetch(`${BASE_URL}/api/rides/${createdRide.id}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: createdRide.otp })
    });
    const otpVerifyJson = await otpVerifyRes.json();
    assert(otpVerifyJson.data.status === 'in_progress', 'OTP verified & ride started (in_progress)');

    // 5e. Complete ride
    const completeRes = await fetch(`${BASE_URL}/api/rides/${createdRide.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const completeJson = await completeRes.json();
    assert(completeJson.data.status === 'completed', 'Ride successfully completed');
    assert(completeJson.data.paymentStatus === 'completed', 'Payment status updated to completed');

    // 5f. Post rating
    const rateRes = await fetch(`${BASE_URL}/api/rides/${createdRide.id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 5,
        feedback: 'Super fast bike ride through traffic!'
      })
    });
    const rateJson = await rateRes.json();
    assert(rateJson.success === true, 'Customer feedback recorded');

    // 6. Admin Metrics & Dynamic Fare Calibration
    console.log('\n6. Testing Admin Operations');
    const adminMetricsRes = await fetch(`${BASE_URL}/api/admin/metrics`);
    const adminMetrics = await adminMetricsRes.json();
    assert(adminMetrics.data.totalRides > 0, 'Admin telemetry reports total rides');

    const updateFareRes = await fetch(`${BASE_URL}/api/admin/fare-rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseFare: 28.0,
        perKmRate: 12.0
      })
    });
    const updateFareJson = await updateFareRes.json();
    assert(updateFareJson.data.baseFare === 28.0, 'Dynamic base fare successfully calibrated');

    console.log(`\n===========================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`===========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
