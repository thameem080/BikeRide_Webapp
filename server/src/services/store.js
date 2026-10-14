import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabaseClient = null;
if (config.supabaseUrl && config.supabaseKey) {
  try {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
    console.log('⚡ Connected to Supabase PostgreSQL at:', config.supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Supabase initialization warning:', err.message);
  }
}

// In-Memory Data Store (Provides guaranteed instantaneous responses and fallback)
export const store = {
  fareRules: {
    id: 'fare-rule-001',
    city: 'Chennai',
    baseFare: 25.00,
    baseDistanceKm: 1.5,
    perKmRate: 11.50,
    perMinRate: 1.50,
    minFare: 35.00,
    surgeMultiplier: 1.00,
    nightChargeMultiplier: 1.15,
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  drivers: [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Senthil Kumar',
      phone: '+91 98410 11111',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 4.92,
      totalRides: 432,
      totalEarnings: 38500,
      isOnline: true,
      verificationStatus: 'approved',
      licenseNumber: 'TN0120190012345',
      location: {
        lat: 13.0827,
        lng: 80.2707,
        address: 'Near Central Railway Station, Chennai'
      },
      vehicle: {
        make: 'TVS',
        model: 'Apache RTR 160',
        regNumber: 'TN-01-AB-1234',
        color: 'Midnight Black',
        helmetProvided: true
      }
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      name: 'Rajesh Raman',
      phone: '+91 98410 22222',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 4.88,
      totalRides: 310,
      totalEarnings: 27400,
      isOnline: true,
      verificationStatus: 'approved',
      licenseNumber: 'TN0920200023456',
      location: {
        lat: 13.0418,
        lng: 80.2341,
        address: 'Pondy Bazaar, T. Nagar, Chennai'
      },
      vehicle: {
        make: 'Honda',
        model: 'Activa 6G',
        regNumber: 'TN-09-CD-5678',
        color: 'Emerald Green',
        helmetProvided: true
      }
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      name: 'Vijay Anand',
      phone: '+91 98410 33333',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      rating: 4.95,
      totalRides: 520,
      totalEarnings: 49200,
      isOnline: true,
      verificationStatus: 'approved',
      licenseNumber: 'TN0720210034567',
      location: {
        lat: 12.9815,
        lng: 80.2180,
        address: '100 Feet Road, Velachery, Chennai'
      },
      vehicle: {
        make: 'Bajaj',
        model: 'Pulsar 150',
        regNumber: 'TN-07-EF-9012',
        color: 'Matte Grey',
        helmetProvided: true
      }
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      name: 'Arun Prakash',
      phone: '+91 98410 44444',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      isOnline: false,
      verificationStatus: 'pending',
      licenseNumber: 'TN0220220045678',
      location: {
        lat: 13.0604,
        lng: 80.2496,
        address: 'Nungambakkam High Road, Chennai'
      },
      vehicle: {
        make: 'Yamaha',
        model: 'FZS-FI',
        regNumber: 'TN-02-GH-3456',
        color: 'Racing Blue',
        helmetProvided: true
      }
    }
  ],

  rides: [
    {
      id: 'ride-mock-001',
      customerId: 'c0000000-0000-0000-0000-000000000001',
      customerName: 'Karthik Subramanian',
      customerPhone: '+91 98401 23456',
      driverId: 'd0000000-0000-0000-0000-000000000001',
      status: 'completed',
      pickup: {
        address: 'Chennai Central Railway Station',
        lat: 13.0827,
        lng: 80.2707
      },
      destination: {
        address: 'Marina Beach Light House',
        lat: 13.0398,
        lng: 80.2785
      },
      distanceKm: 5.4,
      estimatedDurationMins: 16,
      baseFare: 25.0,
      estimatedFare: 87.0,
      finalFare: 87.0,
      otp: '7842',
      paymentMethod: 'UPI',
      paymentStatus: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 4.5).toISOString(),
      rating: 5
    }
  ],

  customers: [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      name: 'Karthik Subramanian',
      email: 'karthik@example.com',
      phone: '+91 98401 23456',
      language: 'en',
      emergencyContact: {
        name: 'Priya (Sister)',
        phone: '+91 98409 87654'
      }
    }
  ]
};

export const getSupabase = () => supabaseClient;
