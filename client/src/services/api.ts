import { LocationPoint, Ride, Driver, FareRules, AiVoiceResponse, Language } from '../types';

const API_BASE = '/api';

export const api = {
  // Voice AI
  sendAiVoiceQuery: async (
    message: string,
    language: Language = 'en',
    conversationHistory: any[] = [],
    currentDraft: any = {}
  ): Promise<AiVoiceResponse> => {
    const res = await fetch(`${API_BASE}/ai/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, conversationHistory, currentDraft })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to process voice intent');
    }
    const json = await res.json();
    return json.data;
  },

  // Location search
  searchLocations: async (query: string): Promise<LocationPoint[]> => {
    const res = await fetch(`${API_BASE}/locations/autocomplete?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search locations');
    const json = await res.json();
    return json.data;
  },

  getPopularLocations: async (): Promise<LocationPoint[]> => {
    const res = await fetch(`${API_BASE}/locations/popular`);
    if (!res.ok) throw new Error('Failed to fetch popular locations');
    const json = await res.json();
    return json.data;
  },

  reverseGeocode: async (lat: number, lng: number): Promise<LocationPoint> => {
    const res = await fetch(`${API_BASE}/locations/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error('Failed to reverse geocode');
    const json = await res.json();
    return json.data;
  },

  // Rides
  estimateFare: async (pickup: LocationPoint, destination: LocationPoint) => {
    const res = await fetch(`${API_BASE}/rides/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, destination })
    });
    if (!res.ok) throw new Error('Failed to calculate fare estimate');
    const json = await res.json();
    return json.data;
  },

  createRide: async (bookingData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    pickup: LocationPoint;
    destination: LocationPoint;
    paymentMethod: string;
  }): Promise<Ride> => {
    const res = await fetch(`${API_BASE}/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) throw new Error('Failed to create ride');
    const json = await res.json();
    return json.data;
  },

  getRideById: async (rideId: string): Promise<Ride> => {
    const res = await fetch(`${API_BASE}/rides/${rideId}`);
    if (!res.ok) throw new Error('Failed to fetch ride');
    const json = await res.json();
    return json.data;
  },

  getCustomerRides: async (customerId: string): Promise<Ride[]> => {
    const res = await fetch(`${API_BASE}/rides/customer/${customerId}`);
    if (!res.ok) throw new Error('Failed to fetch ride history');
    const json = await res.json();
    return json.data;
  },

  updateRideStatus: async (rideId: string, status: string): Promise<Ride> => {
    const res = await fetch(`${API_BASE}/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update ride status');
    const json = await res.json();
    return json.data;
  },

  verifyOtp: async (rideId: string, otp: string): Promise<Ride> => {
    const res = await fetch(`${API_BASE}/rides/${rideId}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify OTP');
    }
    const json = await res.json();
    return json.data;
  },

  cancelRide: async (rideId: string, reason: string): Promise<Ride> => {
    const res = await fetch(`${API_BASE}/rides/${rideId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to cancel ride');
    const json = await res.json();
    return json.data;
  },

  rateRide: async (rideId: string, rating: number, feedback: string) => {
    const res = await fetch(`${API_BASE}/rides/${rideId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, feedback })
    });
    if (!res.ok) throw new Error('Failed to record rating');
    const json = await res.json();
    return json.data;
  },

  // Drivers
  getDrivers: async (onlineOnly = false): Promise<Driver[]> => {
    const res = await fetch(`${API_BASE}/drivers?onlineOnly=${onlineOnly}`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    const json = await res.json();
    return json.data;
  },

  getDriverProfile: async (driverId: string): Promise<Driver> => {
    const res = await fetch(`${API_BASE}/drivers/${driverId}`);
    if (!res.ok) throw new Error('Failed to fetch driver profile');
    const json = await res.json();
    return json.data;
  },

  toggleDriverOnline: async (driverId: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/drivers/${driverId}/toggle-online`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to toggle status');
    const json = await res.json();
    return json.isOnline;
  },

  updateDriverLocation: async (driverId: string, lat: number, lng: number, address?: string) => {
    const res = await fetch(`${API_BASE}/drivers/${driverId}/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, address })
    });
    if (!res.ok) throw new Error('Failed to update driver location');
    const json = await res.json();
    return json.data;
  },

  getAvailableRequestsForDriver: async (): Promise<Ride[]> => {
    const res = await fetch(`${API_BASE}/rides/driver/available-requests`);
    if (!res.ok) throw new Error('Failed to fetch available ride requests');
    const json = await res.json();
    return json.data;
  },

  acceptRide: async (rideId: string, driverId: string): Promise<Ride> => {
    const res = await fetch(`${API_BASE}/rides/${rideId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to accept ride');
    }
    const json = await res.json();
    return json.data;
  },

  getDriverActiveRide: async (driverId: string): Promise<Ride | null> => {
    const res = await fetch(`${API_BASE}/drivers/${driverId}/active-ride`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  },

  // Admin
  getAdminMetrics: async () => {
    const res = await fetch(`${API_BASE}/admin/metrics`);
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    const json = await res.json();
    return json.data;
  },

  getAdminRides: async (status?: string): Promise<Ride[]> => {
    const res = await fetch(`${API_BASE}/admin/rides${status ? `?status=${status}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch rides');
    const json = await res.json();
    return json.data;
  },

  getFareRules: async (): Promise<FareRules> => {
    const res = await fetch(`${API_BASE}/admin/fare-rules`);
    if (!res.ok) throw new Error('Failed to fetch fare rules');
    const json = await res.json();
    return json.data;
  },

  updateFareRules: async (rules: Partial<FareRules>): Promise<FareRules> => {
    const res = await fetch(`${API_BASE}/admin/fare-rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
    if (!res.ok) throw new Error('Failed to update fare rules');
    const json = await res.json();
    return json.data;
  },

  getAdminDrivers: async (): Promise<Driver[]> => {
    const res = await fetch(`${API_BASE}/admin/drivers`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    const json = await res.json();
    return json.data;
  },

  verifyDriver: async (driverId: string, status: 'approved' | 'rejected'): Promise<Driver> => {
    const res = await fetch(`${API_BASE}/admin/drivers/${driverId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to verify driver');
    const json = await res.json();
    return json.data;
  },

  getComplaints: async () => {
    const res = await fetch(`${API_BASE}/admin/complaints`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    const json = await res.json();
    return json.data;
  }
};
