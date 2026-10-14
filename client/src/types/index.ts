export type UserRole = 'customer' | 'driver' | 'admin';

export type Language = 'en' | 'ta';

export interface LocationPoint {
  id?: string;
  name: string;
  shortName?: string;
  tamilName?: string;
  category?: string;
  lat: number;
  lng: number;
}

export interface FareBreakdown {
  baseFare: number;
  baseDistanceKm: number;
  extraDistanceKm: number;
  distanceFare: number;
  timeFare: number;
  subtotal: number;
  surgeMultiplier: number;
  isNightTime: boolean;
  nightMultiplier: number;
  minFare: number;
  estimatedTotal: number;
}

export interface Vehicle {
  make: string;
  model: string;
  regNumber: string;
  color: string;
  helmetProvided: boolean;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  isOnline: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  licenseNumber: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicle: Vehicle;
}

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Ride {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  driverId: string | null;
  driver?: Partial<Driver> | null;
  status: RideStatus;
  pickup: LocationPoint;
  destination: LocationPoint;
  distanceKm: number;
  estimatedDurationMins: number;
  baseFare: number;
  estimatedFare: number;
  finalFare: number | null;
  fareBreakdown?: FareBreakdown;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  otp: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  driverLocation?: { lat: number; lng: number; address?: string } | null;
  rating?: number;
  feedback?: string;
}

export interface FareRules {
  id: string;
  city: string;
  baseFare: number;
  baseDistanceKm: number;
  perKmRate: number;
  perMinRate: number;
  minFare: number;
  surgeMultiplier: number;
  nightChargeMultiplier: number;
  isActive: boolean;
  updatedAt: string;
}

export interface AiVoiceResponse {
  reply: string;
  intent: string;
  language: Language;
  pickup: string | null;
  destination: string | null;
  missingFields: string[];
  isConfirmed: boolean;
  action: 'none' | 'calculate_fare' | 'create_booking' | 'cancel_booking';
  audioSpeechText: string;
  calculatedFare?: FareBreakdown;
  distanceKm?: number;
  durationMins?: number;
  pickupCoords?: LocationPoint;
  destinationCoords?: LocationPoint;
}
