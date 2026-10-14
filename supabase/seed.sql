-- ============================================================================
-- VELO AI — Seed Data for Chennai Bike Taxi Service
-- ============================================================================

-- 1. Default Fare Rules for Chennai
INSERT INTO public.fare_rules (city, base_fare, base_distance_km, per_km_rate, per_min_rate, min_fare, surge_multiplier, night_charge_multiplier, is_active)
VALUES 
  ('Chennai', 25.00, 1.5, 11.50, 1.50, 35.00, 1.00, 1.15, true)
ON CONFLICT DO NOTHING;

-- 2. Mock Admin Profile
INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Admin Velo', 'admin@veloai.com', '+91 98765 00001', 'admin', 'en')
ON CONFLICT DO NOTHING;

-- 3. Mock Customers
INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language, emergency_contact_name, emergency_contact_phone)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'Karthik Subramanian', 'karthik@example.com', '+91 98401 23456', 'customer', 'en', 'Priya (Sister)', '+91 98409 87654'),
  ('c0000000-0000-0000-0000-000000000002', 'Meena Ramesh', 'meena@example.com', '+91 98402 34567', 'customer', 'ta', 'Ramesh (Father)', '+91 98408 76543')
ON CONFLICT DO NOTHING;

-- 4. Mock Drivers Profiles & Vehicles
-- Driver 1: Senthil Kumar (Near Chennai Central)
INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language)
VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'Senthil Kumar', 'senthil.ride@veloai.com', '+91 98410 11111', 'driver', 'ta')
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicles (id, driver_id, make, model, registration_number, color, helmet_provided, is_verified)
VALUES 
  ('v0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'TVS', 'Apache RTR 160', 'TN-01-AB-1234', 'Midnight Black', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.driver_profiles (id, license_number, verification_status, is_online, current_lat, current_lng, heading, rating, total_rides, total_earnings, vehicle_id)
VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'TN0120190012345', 'approved', true, 13.0827, 80.2707, 45.0, 4.92, 432, 38500.00, 'v0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Driver 2: Rajesh Raman (T. Nagar)
INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language)
VALUES 
  ('d0000000-0000-0000-0000-000000000002', 'Rajesh Raman', 'rajesh.ride@veloai.com', '+91 98410 22222', 'driver', 'en')
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicles (id, driver_id, make, model, registration_number, color, helmet_provided, is_verified)
VALUES 
  ('v0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Honda', 'Activa 6G', 'TN-09-CD-5678', 'Emerald Green', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.driver_profiles (id, license_number, verification_status, is_online, current_lat, current_lng, heading, rating, total_rides, total_earnings, vehicle_id)
VALUES 
  ('d0000000-0000-0000-0000-000000000002', 'TN0920200023456', 'approved', true, 13.0418, 80.2341, 120.0, 4.88, 310, 27400.00, 'v0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Driver 3: Vijay Anand (Velachery)
INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language)
VALUES 
  ('d0000000-0000-0000-0000-000000000003', 'Vijay Anand', 'vijay.ride@veloai.com', '+91 98410 33333', 'driver', 'ta')
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicles (id, driver_id, make, model, registration_number, color, helmet_provided, is_verified)
VALUES 
  ('v0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Bajaj', 'Pulsar 150', 'TN-07-EF-9012', 'Matte Grey', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.driver_profiles (id, license_number, verification_status, is_online, current_lat, current_lng, heading, rating, total_rides, total_earnings, vehicle_id)
VALUES 
  ('d0000000-0000-0000-0000-000000000003', 'TN0720210034567', 'approved', true, 12.9815, 80.2180, 210.0, 4.95, 520, 49200.00, 'v0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Driver 4: Arun Prakash (Pending approval)
INSERT INTO public.profiles (id, full_name, email, phone, role, preferred_language)
VALUES 
  ('d0000000-0000-0000-0000-000000000004', 'Arun Prakash', 'arun.pending@veloai.com', '+91 98410 44444', 'driver', 'en')
ON CONFLICT DO NOTHING;

INSERT INTO public.driver_profiles (id, license_number, verification_status, is_online, current_lat, current_lng, rating, total_rides, total_earnings)
VALUES 
  ('d0000000-0000-0000-0000-000000000004', 'TN0220220045678', 'pending', false, 13.0604, 80.2496, 5.00, 0, 0.00)
ON CONFLICT DO NOTHING;
