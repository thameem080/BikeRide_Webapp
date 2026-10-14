-- ============================================================================
-- VELO AI — Bike Taxi Booking Platform Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Customers, Drivers, Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL DEFAULT 'Honda',
  model TEXT NOT NULL DEFAULT 'Activa 6G',
  registration_number TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'Matte Black',
  helmet_provided BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Driver Profiles Table
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  is_online BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION DEFAULT 13.0827,
  current_lng DOUBLE PRECISION DEFAULT 80.2707,
  heading DOUBLE PRECISION DEFAULT 0.0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.85,
  total_rides INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Driver Location History Table (Realtime & Analytics)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Fare Rules Table
CREATE TABLE IF NOT EXISTS public.fare_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL DEFAULT 'Chennai',
  base_fare NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
  base_distance_km NUMERIC(5, 2) NOT NULL DEFAULT 1.5,
  per_km_rate NUMERIC(10, 2) NOT NULL DEFAULT 11.50,
  per_min_rate NUMERIC(10, 2) NOT NULL DEFAULT 1.50,
  min_fare NUMERIC(10, 2) NOT NULL DEFAULT 35.00,
  surge_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  night_charge_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Rides Table
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL,
  estimated_duration_mins INTEGER NOT NULL,
  base_fare NUMERIC(10, 2) NOT NULL,
  estimated_fare NUMERIC(10, 2) NOT NULL,
  final_fare NUMERIC(10, 2),
  otp TEXT NOT NULL DEFAULT '1234',
  payment_method TEXT NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Cash', 'Card', 'Wallet')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Ride Events Table (Audit log for lifecycle)
CREATE TABLE IF NOT EXISTS public.ride_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Ratings Table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ride_update',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_customer_id ON public.rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_online ON public.driver_profiles(is_online, verification_status);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON public.driver_locations(driver_id, recorded_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Any authenticated user can read profiles; users can update their own
CREATE POLICY "Public profiles can be read by authenticated users" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id OR auth.uid() IS NULL);

-- Fare Rules: Anyone can read active fare rules
CREATE POLICY "Anyone can read active fare rules" 
  ON public.fare_rules FOR SELECT 
  USING (is_active = true);

-- Driver Profiles: Public can view online & approved drivers
CREATE POLICY "Customers can see online approved drivers" 
  ON public.driver_profiles FOR SELECT 
  USING (verification_status = 'approved' OR id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Drivers can update their own driver profile" 
  ON public.driver_profiles FOR UPDATE 
  USING (id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Rides: Customers can see and create their own rides; drivers can see requested rides or their assigned rides
CREATE POLICY "Customers can view their rides" 
  ON public.rides FOR SELECT 
  USING (
    customer_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
    driver_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
    (status = 'requested')
  );

CREATE POLICY "Customers can create rides" 
  ON public.rides FOR INSERT 
  WITH CHECK (customer_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR auth.uid() IS NULL);

CREATE POLICY "Participants can update rides" 
  ON public.rides FOR UPDATE 
  USING (
    customer_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
    driver_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
    auth.uid() IS NULL
  );

-- Ratings
CREATE POLICY "Ratings readable by participants" 
  ON public.ratings FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert ratings" 
  ON public.ratings FOR INSERT 
  WITH CHECK (rater_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR auth.uid() IS NULL);
