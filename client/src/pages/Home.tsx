import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Map } from '../components/Map';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { FareCard } from '../components/FareCard';
import { api } from '../services/api';
import { LocationPoint, FareBreakdown, Driver, AiVoiceResponse } from '../types';
import {
  MapPin,
  Navigation,
  Crosshair,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  X,
  Compass,
  Zap
} from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, language, setLanguage } = useAuth();

  // Location state
  const [pickup, setPickup] = useState<LocationPoint>({
    id: 'loc-01',
    name: 'Chennai Central Railway Station',
    shortName: 'Chennai Central',
    lat: 13.0827,
    lng: 80.2707
  });

  const [destination, setDestination] = useState<LocationPoint | null>(null);

  // Search autocomplete states
  const [pickupQuery, setPickupQuery] = useState('Chennai Central');
  const [destQuery, setDestQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationPoint[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationPoint[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  // Fare and Route
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMins, setDurationMins] = useState<number>(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Nearby available drivers
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);

  // Fetch nearby drivers on load
  useEffect(() => {
    api.getDrivers(true)
      .then((drivers) => setNearbyDrivers(drivers))
      .catch((err) => console.warn('Could not fetch drivers:', err));
  }, []);

  // Recalculate fare whenever pickup or destination changes
  useEffect(() => {
    if (pickup && destination) {
      setIsEstimating(true);
      api.estimateFare(pickup, destination)
        .then((res) => {
          setFareBreakdown(res.fare);
          setDistanceKm(res.distanceKm);
          setDurationMins(res.durationMins);
        })
        .catch((err) => console.error('Fare estimate failed:', err))
        .finally(() => setIsEstimating(false));
    } else {
      setFareBreakdown(null);
      setDistanceKm(0);
      setDurationMins(0);
    }
  }, [pickup, destination]);

  // Autocomplete debounced searches
  useEffect(() => {
    if (pickupQuery && isSearchingPickup) {
      api.searchLocations(pickupQuery).then(setPickupSuggestions);
    }
  }, [pickupQuery, isSearchingPickup]);

  useEffect(() => {
    if (destQuery && isSearchingDest) {
      api.searchLocations(destQuery).then(setDestSuggestions);
    }
  }, [destQuery, isSearchingDest]);

  // Use browser Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const point = await api.reverseGeocode(lat, lng);
          setPickup(point);
          setPickupQuery(point.name);
        } catch {
          setPickup({
            name: 'Current Live GPS Location',
            shortName: 'GPS Location',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setPickupQuery('Current GPS Location');
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback to Chennai Central
        setPickup({
          id: 'loc-01',
          name: 'Chennai Central Railway Station',
          shortName: 'Chennai Central',
          lat: 13.0827,
          lng: 80.2707
        });
      }
    );
  };

  // Quick chips
  const quickDestinations = [
    { label: 'Marina Beach', query: 'Marina Beach Light House' },
    { label: 'T. Nagar', query: 'T. Nagar Pondy Bazaar' },
    { label: 'Velachery Mall', query: 'Phoenix Mall Velachery' },
    { label: 'Airport', query: 'Chennai International Airport' },
    { label: 'Guindy', query: 'Guindy Kathipara' }
  ];

  const handleSelectQuickDest = async (item: { label: string; query: string }) => {
    setDestQuery(item.query);
    const matches = await api.searchLocations(item.query);
    if (matches.length > 0) {
      setDestination(matches[0]);
    }
  };

  // AI Voice Assistant callback
  const handleAiAction = (aiResult: AiVoiceResponse) => {
    // If AI identified destination
    if (aiResult.destinationCoords) {
      setDestination(aiResult.destinationCoords);
      setDestQuery(aiResult.destinationCoords.name);
    } else if (aiResult.destination) {
      setDestQuery(aiResult.destination);
      api.searchLocations(aiResult.destination).then((matches) => {
        if (matches.length > 0) setDestination(matches[0]);
      });
    }

    // If AI updated fare
    if (aiResult.calculatedFare) {
      setFareBreakdown(aiResult.calculatedFare);
      if (aiResult.distanceKm) setDistanceKm(aiResult.distanceKm);
      if (aiResult.durationMins) setDurationMins(aiResult.durationMins);
    }

    // If AI confirmed booking!
    if (aiResult.isConfirmed && aiResult.action === 'create_booking') {
      handleConfirmBooking();
    }
  };

  // Create real booking
  const handleConfirmBooking = async (paymentMethod = 'UPI') => {
    if (!pickup || !destination) {
      alert('Please specify both pickup and destination locations');
      return;
    }

    setIsBooking(true);
    try {
      const newRide = await api.createRide({
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        pickup,
        destination,
        paymentMethod
      });

      // Navigate to active tracking view
      onNavigate(`/ride/${newRide.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to book ride');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-5">
      {/* Top Banner / Hero Feature Announcement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-forest-900/90 via-forest-850 to-forest-900/90 border border-velo-border/50 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-velo-lime/20 border border-velo-lime/40 text-velo-lime">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              VELO AI Voice-First Bike Taxi
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-velo-lime/10 text-velo-lime border border-velo-lime/30">
                Chennai Central Hub
              </span>
            </h1>
            <p className="text-xs text-slate-300">
              {language === 'ta'
                ? 'மைக் பட்டனை அழுத்தி எங்கு செல்ல வேண்டும் என்று சொல்லுங்கள். உடனே பைக் வந்துவிடும்!'
                : 'Say "Book a bike to Central" or type below. Instant dispatch, zero wait.'}
            </p>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-forest-950/80 px-3 py-1.5 border border-velo-border/30 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300 font-mono text-[11px]">
            {nearbyDrivers.length} Captains Online Nearby
          </span>
        </div>
      </div>

      {/* Main Grid: Left Controls / Voice / Fare & Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Inputs, Voice, Fare): 5 Columns on Desktop */}
        <div className="lg:col-span-5 space-y-4">
          {/* Location Selection Card */}
          <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>{language === 'ta' ? 'பயண வழியைத் தேர்வு செய்யவும்' : 'Where are you riding?'}</span>
              <button
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1 text-[11px] font-semibold text-velo-lime hover:underline"
              >
                <Crosshair className="h-3 w-3" />
                {language === 'ta' ? 'என் இருப்பிடம்' : 'GPS Detect'}
              </button>
            </h2>

            {/* Pickup Input */}
            <div className="relative mb-3">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">
                {language === 'ta' ? 'புறப்படும் இடம் (Pickup)' : 'Pickup Location'}
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3.5 h-4 w-4 text-velo-lime" />
                <input
                  type="text"
                  value={pickupQuery}
                  onFocus={() => setIsSearchingPickup(true)}
                  onChange={(e) => {
                    setPickupQuery(e.target.value);
                    setIsSearchingPickup(true);
                  }}
                  placeholder="Enter pickup point..."
                  className="w-full rounded-2xl border border-velo-border/60 bg-forest-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-velo-lime focus:outline-none"
                />
              </div>

              {/* Pickup Suggestions dropdown */}
              {isSearchingPickup && pickupSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl border border-velo-border bg-forest-900 p-1.5 shadow-2xl">
                  {pickupSuggestions.map((s) => (
                    <button
                      key={s.id || s.name}
                      onClick={() => {
                        setPickup(s);
                        setPickupQuery(s.name);
                        setIsSearchingPickup(false);
                      }}
                      className="flex w-full items-start gap-2 rounded-xl p-2 text-left text-xs text-slate-200 hover:bg-forest-800"
                    >
                      <MapPin className="h-3.5 w-3.5 text-velo-lime mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{s.shortName || s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">
                {language === 'ta' ? 'இலக்கு (Destination)' : 'Drop Destination'}
              </label>
              <div className="relative flex items-center">
                <Navigation className="absolute left-3.5 h-4 w-4 text-rose-400" />
                <input
                  type="text"
                  value={destQuery}
                  onFocus={() => setIsSearchingDest(true)}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setIsSearchingDest(true);
                  }}
                  placeholder={
                    language === 'ta'
                      ? 'எங்கு செல்ல வேண்டும்? (உதா: மெரினா கடற்கரை)'
                      : 'Where to? (e.g. Marina Beach, Egmore)'
                  }
                  className="w-full rounded-2xl border border-velo-border/60 bg-forest-950/80 py-2.5 pl-10 pr-8 text-xs text-white placeholder-slate-500 focus:border-velo-lime focus:outline-none"
                />
                {destination && (
                  <button
                    onClick={() => {
                      setDestination(null);
                      setDestQuery('');
                    }}
                    className="absolute right-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Destination Suggestions dropdown */}
              {isSearchingDest && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl border border-velo-border bg-forest-900 p-1.5 shadow-2xl max-h-56 overflow-y-auto">
                  {destSuggestions.map((s) => (
                    <button
                      key={s.id || s.name}
                      onClick={() => {
                        setDestination(s);
                        setDestQuery(s.name);
                        setIsSearchingDest(false);
                      }}
                      className="flex w-full items-start gap-2 rounded-xl p-2 text-left text-xs text-slate-200 hover:bg-forest-800"
                    >
                      <Navigation className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{s.shortName || s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Destination Chips */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[10px] text-slate-400 font-mono shrink-0">Popular:</span>
              {quickDestinations.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuickDest(q)}
                  className="shrink-0 rounded-xl border border-velo-border/40 bg-forest-950/60 px-2 py-1 text-[11px] text-slate-300 hover:border-velo-lime hover:text-white transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Voice Assistant */}
          <VoiceAssistant
            language={language}
            pickup={pickup}
            destination={destination}
            fareBreakdown={fareBreakdown}
            onAiAction={handleAiAction}
            onClearRoute={() => {
              setDestination(null);
              setDestQuery('');
            }}
          />

          {/* Fare Estimate Card (if route defined) */}
          {fareBreakdown && (
            <FareCard
              fareBreakdown={fareBreakdown}
              distanceKm={distanceKm}
              durationMins={durationMins}
              language={language}
              onBookRide={handleConfirmBooking}
              isLoading={isBooking}
            />
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map (7 Columns on Desktop) */}
        <div className="lg:col-span-7 h-[540px] sm:h-[640px] lg:h-[760px] sticky top-20">
          <Map
            pickup={pickup}
            destination={destination}
            nearbyDrivers={nearbyDrivers}
            className="h-full w-full shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
