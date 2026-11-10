import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Map } from '../components/Map';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { FareCard, RideTier } from '../components/FareCard';
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
  Zap,
  ArrowUpDown,
  Clock,
  Home as HomeIcon,
  Briefcase,
  Plane,
  Building,
  Mic,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user, language } = useAuth();

  // Ride Mode Tab
  const [activeTab, setActiveTab] = useState<'ride' | 'package'>('ride');
  const [rideSchedule, setRideSchedule] = useState<'now' | 'reserve'>('now');
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);

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

  // Swap pickup & dropoff
  const handleSwapLocations = () => {
    if (!destination) return;
    const tempPickup = pickup;
    const tempPickupQuery = pickupQuery;
    setPickup(destination);
    setPickupQuery(destQuery);
    setDestination(tempPickup);
    setDestQuery(tempPickupQuery);
  };

  // Quick destinations (Uber Saved Places)
  const savedPlaces = [
    { label: 'Marina Beach', query: 'Marina Beach Light House', icon: Compass },
    { label: 'T. Nagar', query: 'T. Nagar Pondy Bazaar', icon: Building },
    { label: 'Airport', query: 'Chennai International Airport', icon: Plane },
    { label: 'Velachery', query: 'Phoenix Mall Velachery', icon: Building },
    { label: 'Guindy', query: 'Guindy Kathipara', icon: Building }
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
    if (aiResult.destinationCoords) {
      setDestination(aiResult.destinationCoords);
      setDestQuery(aiResult.destinationCoords.name);
    } else if (aiResult.destination) {
      setDestQuery(aiResult.destination);
      api.searchLocations(aiResult.destination).then((matches) => {
        if (matches.length > 0) setDestination(matches[0]);
      });
    }

    if (aiResult.calculatedFare) {
      setFareBreakdown(aiResult.calculatedFare);
      if (aiResult.distanceKm) setDistanceKm(aiResult.distanceKm);
      if (aiResult.durationMins) setDurationMins(aiResult.durationMins);
    }

    if (aiResult.isConfirmed && aiResult.action === 'create_booking') {
      handleConfirmBooking('UPI');
    }
  };

  // Create real booking
  const handleConfirmBooking = async (paymentMethod = 'UPI', selectedTier: RideTier = 'moto') => {
    if (!pickup || !destination) {
      alert('Please select both pickup and destination locations');
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
      {/* Top Uber Announcement Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-[#0e121a]/95 border border-white/10 p-4 shadow-xl text-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black border border-velo-lime/40 text-velo-lime shadow-md shadow-velo-lime/20">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              Uber Moto &bull; Beat The Traffic
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                FASTER &bull; CHEAPER
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'சென்னையின் அதிவேக பைக் டாக்ஸி. குரல் மூலமாகவும் புக் செய்யலாம்.'
                : 'Hop on, breeze through Chennai streets. AI Voice booking & live GPS tracking enabled.'}
            </p>
          </div>
        </div>

        {/* Live Captains Badge & Voice Dispatcher Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setVoiceDrawerOpen(!voiceDrawerOpen)}
            className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold transition-all ${
              voiceDrawerOpen
                ? 'bg-velo-lime text-black shadow-lg shadow-velo-lime/30'
                : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-velo-lime group-hover:text-black" />
            <span>AI Voice Dispatch</span>
          </button>

          <div className="flex items-center gap-2 rounded-2xl bg-black/60 px-3 py-1.5 border border-white/10 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono text-[11px]">
              {nearbyDrivers.length} Captains Nearby
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left Controls (5 cols) & Right Map (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Inputs, Voice, Ride Selector) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Uber "Where to?" Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-100">
            {/* Top Tabs: Ride vs Package */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
              <div className="flex items-center gap-1 rounded-2xl bg-black/60 p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab('ride')}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    activeTab === 'ride'
                      ? 'bg-white text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ride
                </button>
                <button
                  onClick={() => setActiveTab('package')}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    activeTab === 'package'
                      ? 'bg-white text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Package
                </button>
              </div>

              {/* Schedule Pill */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <Clock className="h-3.5 w-3.5 text-velo-lime" />
                <span>Ride now</span>
              </div>
            </div>

            {/* Uber Connecting Route Inputs */}
            <div className="relative space-y-3">
              {/* Connecting Visual Track Line */}
              <div className="absolute left-[21px] top-[26px] bottom-[26px] w-[2px] bg-white/20 z-0"></div>

              {/* Pickup Input */}
              <div className="relative z-10 flex items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-velo-lime bg-black shadow-sm shadow-velo-lime/50"></div>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={pickupQuery}
                    onFocus={() => setIsSearchingPickup(true)}
                    onChange={(e) => {
                      setPickupQuery(e.target.value);
                      setIsSearchingPickup(true);
                    }}
                    placeholder="Enter pickup point..."
                    className="w-full rounded-2xl border border-white/10 bg-black/70 py-3 pl-3.5 pr-20 text-xs font-semibold text-white placeholder-slate-500 focus:border-velo-lime focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleGetCurrentLocation}
                    title="Detect Current GPS Location"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-xl bg-white/10 px-2 py-1 text-[10px] font-mono font-bold text-velo-lime hover:bg-white/20 transition-all"
                  >
                    <Crosshair className="h-3 w-3" />
                    <span>GPS</span>
                  </button>
                </div>

                {/* Pickup Autocomplete Suggestions */}
                {isSearchingPickup && pickupSuggestions.length > 0 && (
                  <div className="absolute left-11 right-0 top-full mt-1.5 z-40 rounded-2xl border border-white/15 bg-[#141924] p-1.5 shadow-2xl">
                    {pickupSuggestions.map((s) => (
                      <button
                        key={s.id || s.name}
                        onClick={() => {
                          setPickup(s);
                          setPickupQuery(s.name);
                          setIsSearchingPickup(false);
                        }}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left text-xs text-slate-200 hover:bg-white/10 transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-velo-lime mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-white">{s.shortName || s.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div className="relative z-10 flex items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <div className="h-3.5 w-3.5 rounded-[3px] bg-rose-500 shadow-sm shadow-rose-500/50"></div>
                </div>
                <div className="relative flex-1">
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
                        : 'Where to? (e.g. Marina Beach, Airport, T. Nagar)'
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/70 py-3 pl-3.5 pr-16 text-xs font-semibold text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none transition-colors"
                  />
                  {destination && (
                    <button
                      onClick={() => {
                        setDestination(null);
                        setDestQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Swap button */}
                <button
                  onClick={handleSwapLocations}
                  title="Swap Pickup and Dropoff"
                  className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>

                {/* Destination Autocomplete Suggestions */}
                {isSearchingDest && destSuggestions.length > 0 && (
                  <div className="absolute left-11 right-0 top-full mt-1.5 z-40 rounded-2xl border border-white/15 bg-[#141924] p-1.5 shadow-2xl max-h-56 overflow-y-auto">
                    {destSuggestions.map((s) => (
                      <button
                        key={s.id || s.name}
                        onClick={() => {
                          setDestination(s);
                          setDestQuery(s.name);
                          setIsSearchingDest(false);
                        }}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left text-xs text-slate-200 hover:bg-white/10 transition-colors"
                      >
                        <Navigation className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-white">{s.shortName || s.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Uber Saved Places Quick Chips */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Popular Destinations
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {savedPlaces.map((q, idx) => {
                  const SIcon = q.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuickDest(q)}
                      className="flex items-center gap-1.5 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 hover:border-velo-lime hover:bg-white/10 hover:text-white transition-all"
                    >
                      <SIcon className="h-3.5 w-3.5 text-velo-lime" />
                      <span>{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Voice Assistant Drawer/Widget */}
          {voiceDrawerOpen && (
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
          )}

          {/* Uber Ride Options Card (FareCard) */}
          {fareBreakdown ? (
            <FareCard
              fareBreakdown={fareBreakdown}
              distanceKm={distanceKm}
              durationMins={durationMins}
              language={language}
              onBookRide={handleConfirmBooking}
              isLoading={isBooking}
            />
          ) : (
            /* Empty State Guide Card */
            <div className="rounded-3xl border border-white/10 bg-[#0e121a]/60 p-5 text-center text-slate-400 space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-velo-lime">
                <Navigation className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Select a Drop Destination</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Type an address above or choose from popular places to view live fare estimates, ETA, and ride options.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Full Interactive Map */}
        <div className="lg:col-span-7 h-[560px] sm:h-[650px] lg:h-[780px] sticky top-20">
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
