import { store } from './store.js';

// Haversine formula to compute great-circle distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;

  // Road curvature factor for Indian urban traffic (~1.3x Euclidean distance)
  const roadDistance = directDistance * 1.32;
  return Math.max(0.8, Math.round(roadDistance * 10) / 10);
}

// Estimate bike trip duration in minutes (average speed ~22-25 km/h + 3 min buffer for signals)
export function estimateDurationMins(distanceKm) {
  const avgSpeedKmh = 23;
  const transitMins = (distanceKm / avgSpeedKmh) * 60;
  return Math.max(5, Math.round(transitMins + 3));
}

// Check if current time qualifies for night charges (10:00 PM to 5:00 AM)
export function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
}

// Calculate server-authoritative fare breakdown
export function calculateFare(distanceKm, durationMins, customRules = null) {
  const rules = customRules || store.fareRules;
  const {
    baseFare = 25.0,
    baseDistanceKm = 1.5,
    perKmRate = 11.5,
    perMinRate = 1.5,
    minFare = 35.0,
    surgeMultiplier = 1.0,
    nightChargeMultiplier = 1.15
  } = rules;

  const extraDistance = Math.max(0, distanceKm - baseDistanceKm);
  const distanceFare = extraDistance * perKmRate;
  const timeFare = durationMins * perMinRate;
  const subtotal = baseFare + distanceFare + timeFare;

  const nightActive = isNightTime();
  const nightMultiplier = nightActive ? nightChargeMultiplier : 1.0;

  let totalBeforeMin = subtotal * surgeMultiplier * nightMultiplier;
  const finalFare = Math.max(minFare, Math.round(totalBeforeMin));

  return {
    baseFare: Math.round(baseFare),
    baseDistanceKm,
    extraDistanceKm: Math.round(extraDistance * 10) / 10,
    distanceFare: Math.round(distanceFare),
    timeFare: Math.round(timeFare),
    subtotal: Math.round(subtotal),
    surgeMultiplier,
    isNightTime: nightActive,
    nightMultiplier,
    minFare,
    estimatedTotal: finalFare
  };
}
