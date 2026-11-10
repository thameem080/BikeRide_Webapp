import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Map } from '../components/Map';
import { Ride, RideStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Bike,
  ShieldCheck,
  Phone,
  MessageSquare,
  Clock,
  Navigation,
  XCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  Share2,
  Lock,
  ArrowLeft,
  Sparkles,
  MapPin,
  CreditCard,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface RideTrackingProps {
  rideId: string;
  onNavigate: (path: string) => void;
  onOpenSos: () => void;
}

export const RideTracking: React.FC<RideTrackingProps> = ({ rideId, onNavigate, onOpenSos }) => {
  const { language } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [copiedShare, setCopiedShare] = useState(false);

  // Poll for ride status updates every 2.5 seconds
  useEffect(() => {
    let interval: any = null;

    const fetchRide = async () => {
      try {
        const data = await api.getRideById(rideId);
        setRide(data);
        setIsLoading(false);

        // If completed for the first time, trigger confetti
        if (data.status === 'completed' && !ratingSubmitted) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        console.warn('Failed to fetch active ride:', err);
      }
    };

    fetchRide();
    interval = setInterval(fetchRide, 2500);

    return () => clearInterval(interval);
  }, [rideId, ratingSubmitted]);

  // Demo simulation trigger: allow instant acceptance or status advance if in testing mode
  const handleSimulateStatusAdvance = async () => {
    if (!ride) return;
    const nextMap: Record<RideStatus, RideStatus> = {
      requested: 'accepted',
      accepted: 'arriving',
      arriving: 'in_progress',
      in_progress: 'completed',
      completed: 'completed',
      cancelled: 'cancelled'
    };
    const nextStatus = nextMap[ride.status];
    if (nextStatus === 'accepted' && !ride.driverId) {
      await api.acceptRide(ride.id, 'd0000000-0000-0000-0000-000000000001');
    } else {
      await api.updateRideStatus(ride.id, nextStatus);
    }
    const updated = await api.getRideById(ride.id);
    setRide(updated);
  };

  const handleCancel = async () => {
    if (!ride) return;
    try {
      await api.cancelRide(ride.id, cancelReason);
      const updated = await api.getRideById(ride.id);
      setRide(updated);
      setCancelModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ride');
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ride) return;
    try {
      await api.rateRide(ride.id, ratingValue, feedbackText);
      setRatingSubmitted(true);
    } catch (err: any) {
      alert('Error submitting rating');
    }
  };

  const handleShareTrip = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Uber Moto Live Ride Tracking',
        text: `Track my live Uber Moto ride from ${ride?.pickup.shortName || ride?.pickup.name} to ${ride?.destination.shortName || ride?.destination.name}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (isLoading || !ride) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <div className="h-10 w-10 rounded-full border-4 border-velo-lime border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Captain GPS Network...</p>
      </div>
    );
  }

  const statusStepOrder = ['requested', 'accepted', 'arriving', 'in_progress', 'completed'];
  const currentStepIndex = statusStepOrder.indexOf(ride.status);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0e121a]/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'ta' ? 'முகப்பு' : 'Back to Bookings'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share trip button */}
          <button
            onClick={handleShareTrip}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0e121a]/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <Share2 className="h-3.5 w-3.5 text-velo-lime" />
            <span className="hidden sm:inline">{copiedShare ? 'Copied!' : 'Share Trip'}</span>
          </button>

          {/* Simulation fast-forward button */}
          <button
            onClick={handleSimulateStatusAdvance}
            className="flex items-center gap-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-mono font-bold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all"
            title="Fast forward status for testing"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulate Step &gt;&gt;</span>
          </button>

          {/* SOS Shield */}
          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 rounded-2xl border border-rose-500/50 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white active:scale-95 transition-all"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Status, Captain Info & Interactive Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Ride Details & Captain Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Trip Status Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                TRIP #{ride.id.slice(-6).toUpperCase()}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize border ${
                  ride.status === 'requested'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                    : ride.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : ride.status === 'cancelled'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-velo-lime/10 text-velo-lime border-velo-lime/30'
                }`}
              >
                {ride.status.replace('_', ' ')}
              </span>
            </div>

            {/* Stepper Dots */}
            {ride.status !== 'cancelled' ? (
              <div className="grid grid-cols-5 gap-1 mb-4">
                {statusStepOrder.map((step, idx) => (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`h-2 w-full rounded-full transition-all ${
                        idx <= currentStepIndex ? 'bg-velo-lime shadow-sm' : 'bg-white/10'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 mt-1 capitalize truncate w-full text-center">
                      {step === 'in_progress' ? 'Riding' : step}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Ride was cancelled: {ride.cancellationReason || 'Customer cancelled'}</span>
              </div>
            )}

            {/* Status Heading & Description */}
            <div className="py-2 border-y border-white/10 my-2">
              <h2 className="text-base font-extrabold text-white">
                {ride.status === 'requested' && 'Matching nearest Captain...'}
                {ride.status === 'accepted' && 'Captain Confirmed • On the Way'}
                {ride.status === 'arriving' && 'Captain Arriving at Pickup Point'}
                {ride.status === 'in_progress' && 'Trip in Progress • Riding to Destination'}
                {ride.status === 'completed' && 'Trip Completed • Thank you for riding with us!'}
                {ride.status === 'cancelled' && 'Trip Cancelled'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {ride.status === 'requested' && 'Searching top-rated captains near your pickup location...'}
                {ride.status === 'accepted' && 'Your captain is en route. Expected arrival in 2-3 mins.'}
                {ride.status === 'arriving' && 'Captain has arrived outside. Put on your sanitized helmet and share your PIN.'}
                {ride.status === 'in_progress' && `Heading towards ${ride.destination.shortName || ride.destination.name}`}
                {ride.status === 'completed' && `Total fare ₹${ride.finalFare || ride.estimatedFare} charged via ${ride.paymentMethod}`}
              </p>
            </div>

            {/* Uber 4-Digit Security PIN (OTP) */}
            {['requested', 'accepted', 'arriving'].includes(ride.status) && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-black border border-velo-lime/40 p-4 shadow-lg shadow-velo-lime/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-velo-lime/20 text-velo-lime">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Start Ride PIN</p>
                    <p className="text-xs text-slate-200">Share with captain upon pickup</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-mono font-extrabold tracking-widest text-velo-lime">
                    {ride.otp}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Captain / Driver Card (when assigned) */}
          {ride.driver && (
            <div className="rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={ride.driver.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={ride.driver.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-velo-lime"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {ride.driver.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-white">{ride.driver.rating || 4.9}</span>
                      <span>&bull;</span>
                      <span>{ride.driver.totalRides || 1420}+ trips</span>
                    </p>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {ride.driver.vehicle?.make} {ride.driver.vehicle?.model}
                    </p>
                  </div>
                </div>

                {/* Call / Message Captain */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${ride.driver.phone || '+919841011111'}`}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-velo-lime hover:bg-white/20 transition-colors"
                    title="Call Captain"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => alert(`Opening chat with captain ${ride.driver?.name}...`)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
                    title="Message Captain"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* License Plate Banner (Indian format styling) */}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/60 p-3 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-black">
                    IND
                  </span>
                  <span className="font-mono text-sm font-extrabold tracking-widest text-white">
                    {ride.driver.vehicle?.regNumber || 'TN 07 BZ 4519'}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Verified Captain
                </span>
              </div>

              {/* Safety Badges */}
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-velo-lime">
                  <ShieldCheck className="h-4 w-4" />
                  Sanitized Helmet Provided
                </span>
                <span className="font-mono text-white font-bold">
                  ₹{ride.estimatedFare} ({ride.paymentMethod})
                </span>
              </div>
            </div>
          )}

          {/* Cancellation Option (if not completed or already cancelled) */}
          {['requested', 'accepted', 'arriving'].includes(ride.status) && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel Ride</span>
            </button>
          )}

          {/* Post-Ride Rating Modal (when completed) */}
          {ride.status === 'completed' && !ratingSubmitted && (
            <div className="rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-100">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Rate Your Ride with {ride.driver?.name || 'Captain'}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Your feedback helps us keep the Uber Moto community safe and pleasant.
              </p>

              {/* Star Selection */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= ratingValue
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Tip Selection */}
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-slate-300 mb-2">Add a Tip for Captain</p>
                <div className="flex gap-2">
                  {[0, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipAmount(amt)}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-bold border transition-colors ${
                        tipAmount === amt
                          ? 'bg-velo-lime text-black border-velo-lime'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {amt === 0 ? 'No Tip' : `₹${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitRating} className="space-y-3">
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Optional comment: polite captain, fast ride..."
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-velo-lime focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-velo-lime py-3 text-xs font-bold text-black shadow-lg shadow-velo-lime/20 hover:bg-velo-lime-hover transition-colors"
                >
                  Submit Review & Complete Trip
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Live Map */}
        <div className="lg:col-span-7 h-[560px] sm:h-[650px] lg:h-[780px] sticky top-20">
          <Map
            pickup={ride.pickup}
            destination={ride.destination}
            driverLocation={ride.driverLocation || (ride.driver?.location ? {
              lat: ride.driver.location.lat,
              lng: ride.driver.location.lng,
              heading: 45
            } : null)}
            className="h-full w-full shadow-2xl"
          />
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0e121a] p-5 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">Cancel your ride?</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please choose a cancellation reason. Free cancellation applies within 2 minutes.
            </p>
            <div className="space-y-2 mb-4">
              {['Captain took too long', 'Changed destination', 'Found alternate ride', 'Booked by mistake'].map((r) => (
                <button
                  key={r}
                  onClick={() => setCancelReason(r)}
                  className={`w-full rounded-xl p-2.5 text-left text-xs transition-colors ${
                    cancelReason === r
                      ? 'bg-velo-lime/10 text-velo-lime font-bold border border-velo-lime/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Keep Ride
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
