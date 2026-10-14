import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Ride, Driver } from '../types';
import { Map } from '../components/Map';
import {
  Bike,
  Power,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Lock,
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface DriverDashboardProps {
  onNavigate: (path: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onNavigate }) => {
  const { user, switchRole, language } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Ride[]>([]);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch driver profile
  const fetchDriverData = async () => {
    try {
      const d = await api.getDriverProfile(user.id);
      setDriver(d);
      setIsOnline(d.isOnline);

      const active = await api.getDriverActiveRide(user.id);
      setActiveRide(active);

      if (d.isOnline && !active) {
        const reqs = await api.getAvailableRequestsForDriver();
        setIncomingRequests(reqs);
      } else {
        setIncomingRequests([]);
      }
    } catch (err) {
      console.warn('Driver data fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(fetchDriverData, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Toggle online/offline status
  const handleToggleOnline = async () => {
    try {
      const newStatus = await api.toggleDriverOnline(user.id);
      setIsOnline(newStatus);
      fetchDriverData();
    } catch (err) {
      alert('Could not update status');
    }
  };

  // Accept incoming ride request
  const handleAcceptRide = async (rideId: string) => {
    setActionLoading(true);
    try {
      const accepted = await api.acceptRide(rideId, user.id);
      setActiveRide(accepted);
      setIncomingRequests([]);
    } catch (err: any) {
      alert(err.message || 'Could not accept ride');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / dismiss incoming ride request
  const handleRejectRide = (rideId: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== rideId));
  };

  // Advance ride status: Arrived at pickup
  const handleMarkArrived = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      const updated = await api.updateRideStatus(activeRide.id, 'arriving');
      setActiveRide(updated);
    } finally {
      setActionLoading(false);
    }
  };

  // Verify OTP and start ride
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide || !otpInput) return;
    setActionLoading(true);
    setOtpError(null);
    try {
      const updated = await api.verifyOtp(activeRide.id, otpInput);
      setActiveRide(updated);
      setOtpInput('');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP code');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Ride
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      await api.updateRideStatus(activeRide.id, 'completed');
      setActiveRide(null);
      fetchDriverData();
      alert('Ride completed successfully! Earnings credited.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-5">
      {/* Top Driver Header: Online Toggle, Earnings, Ratings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={user.name}
            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-velo-lime/60"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">{user.name}</h1>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> VERIFIED CAPTAIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {driver?.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model} • ${driver.vehicle.regNumber}` : 'TVS Apache RTR 160 • TN-01-AB-1234'}
            </p>
          </div>
        </div>

        {/* Stats & Online Switch */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-left sm:text-right border-l sm:border-l-0 pl-3 sm:pl-0 border-velo-border/30">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Today's Earnings</p>
            <p className="text-xl font-extrabold text-velo-lime">
              ₹{driver?.totalEarnings || 38500}
            </p>
          </div>

          <div className="text-left sm:text-right border-l sm:border-l-0 pl-3 sm:pl-0 border-velo-border/30">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Rides</p>
            <p className="text-xl font-extrabold text-white">
              {driver?.totalRides || 432}
            </p>
          </div>

          {/* Big Toggle Button */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-extrabold transition-all shadow-lg active:scale-95 ${
              isOnline
                ? 'bg-gradient-to-r from-velo-lime to-emerald-500 text-forest-950 shadow-lime-glow'
                : 'bg-forest-800 text-slate-400 border border-velo-border/40 hover:text-white'
            }`}
          >
            <Power className="h-4 w-4" />
            <span>{isOnline ? 'CAPTAIN ONLINE' : 'CAPTAIN OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Trip / Incoming Request & Live Navigation Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Dispatch Operations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Case 1: Active Trip In Progress */}
          {activeRide ? (
            <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-velo-border/30">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-velo-lime animate-ping" />
                  Active Trip in Progress
                </span>
                <span className="text-xs font-mono font-bold text-velo-lime">
                  ₹{activeRide.estimatedFare} ({activeRide.paymentMethod})
                </span>
              </div>

              {/* Customer Info */}
              <div className="my-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{activeRide.customerName}</p>
                  <p className="text-xs text-slate-400 font-mono">{activeRide.customerPhone}</p>
                </div>
                <a
                  href={`tel:${activeRide.customerPhone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-800 border border-velo-border/50 text-velo-lime hover:bg-forest-750"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>

              {/* Route Details */}
              <div className="space-y-2 rounded-2xl bg-forest-950/70 p-3.5 border border-velo-border/30 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-velo-lime shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Pickup:</span>
                    <p className="font-semibold text-white">{activeRide.pickup.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Destination:</span>
                    <p className="font-semibold text-white">{activeRide.destination.name}</p>
                  </div>
                </div>
              </div>

              {/* Lifecycle Actions */}
              <div className="mt-4 space-y-3">
                {activeRide.status === 'accepted' && (
                  <button
                    onClick={handleMarkArrived}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 text-xs font-bold text-forest-950 hover:bg-amber-300 shadow-md"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>I Have Arrived at Pickup Location</span>
                  </button>
                )}

                {/* Arrived: Require OTP to start ride */}
                {activeRide.status === 'arriving' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 block">
                      Enter Customer's 4-Digit Security PIN (OTP):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="e.g. 1234"
                        className="flex-1 rounded-xl border border-velo-border bg-forest-950 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-white focus:border-velo-lime focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={actionLoading || otpInput.length < 4}
                        className="rounded-xl bg-velo-lime px-4 py-2 text-xs font-bold text-forest-950 hover:bg-velo-lime-hover disabled:opacity-50"
                      >
                        Start Ride
                      </button>
                    </div>
                    {otpError && (
                      <p className="text-[11px] text-rose-400 font-semibold">{otpError}</p>
                    )}
                  </form>
                )}

                {/* In Progress: Complete Ride Button */}
                {activeRide.status === 'in_progress' && (
                  <button
                    onClick={handleCompleteRide}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-velo-lime to-emerald-500 py-3.5 text-xs font-extrabold text-forest-950 hover:opacity-95 shadow-lime-glow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Drop Passenger & Collect ₹{activeRide.estimatedFare}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Case 2: No active trip - Waiting for or displaying incoming requests */
            <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span>Incoming Ride Requests</span>
                <span className="text-[10px] font-mono rounded-full bg-forest-800 px-2 py-0.5 text-slate-300">
                  {incomingRequests.length} AVAILABLE
                </span>
              </h2>

              {!isOnline ? (
                <div className="py-8 text-center">
                  <Power className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">You are currently offline</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Toggle your status to online above to receive nearby ride requests.
                  </p>
                </div>
              ) : incomingRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="relative mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-forest-800 text-velo-lime mb-3">
                    <Bike className="h-6 w-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">Waiting for ride requests...</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    You will hear an alert when a passenger books a bike taxi near your area.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-velo-border-active bg-forest-950 p-4 shadow-lime-glow space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white">
                          ₹{req.estimatedFare} &bull; {req.distanceKm} km
                        </span>
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                          NEW REQUEST
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <p className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 text-velo-lime shrink-0" />
                          <span className="font-semibold text-white">{req.pickup.name}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <Navigation className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <span>{req.destination.name}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleRejectRide(req.id)}
                          className="flex-1 rounded-xl bg-forest-800 py-2 text-xs font-bold text-slate-400 hover:text-white"
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => handleAcceptRide(req.id)}
                          disabled={actionLoading}
                          className="flex-1 rounded-xl bg-velo-lime py-2 text-xs font-extrabold text-forest-950 hover:bg-velo-lime-hover shadow-sm"
                        >
                          Accept Ride
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Driver Route Map (7 cols) */}
        <div className="lg:col-span-7 h-[540px] sm:h-[640px] sticky top-20">
          <Map
            pickup={activeRide?.pickup || (driver?.location ? { lat: driver.location.lat, lng: driver.location.lng, name: driver.location.address } : null)}
            destination={activeRide?.destination || null}
            driverLocation={driver?.location ? { lat: driver.location.lat, lng: driver.location.lng, heading: 45 } : null}
            className="h-full w-full shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
