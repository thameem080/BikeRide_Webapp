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
  Sparkles
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

  if (isLoading || !ride) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <div className="h-10 w-10 rounded-full border-4 border-velo-lime border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Loading active ride session...</p>
      </div>
    );
  }

  const statusStepOrder = ['requested', 'accepted', 'arriving', 'in_progress', 'completed'];
  const currentStepIndex = statusStepOrder.indexOf(ride.status);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 rounded-xl border border-velo-border/40 bg-forest-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'ta' ? 'முகப்பு' : 'Back to Home'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Simulation fast-forward button */}
          <button
            onClick={handleSimulateStatusAdvance}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-mono text-amber-300 hover:bg-amber-500/20"
            title="Fast forward status for testing"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulate Step &gt;&gt;</span>
          </button>

          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900"
          >
            Emergency SOS
          </button>
        </div>
      </div>

      {/* Main Grid: Status, Driver Info & Interactive Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Ride Details & Status (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Status Progress Card */}
          <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Ride ID: {ride.id.slice(-8)}
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
                        idx <= currentStepIndex ? 'bg-velo-lime shadow-sm' : 'bg-forest-800'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 mt-1 capitalize truncate w-full text-center">
                      {step === 'in_progress' ? 'Riding' : step}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Ride was cancelled: {ride.cancellationReason || 'Customer cancelled'}</span>
              </div>
            )}

            {/* Status Heading & Description */}
            <div className="py-2 border-y border-velo-border/30 my-2">
              <h2 className="text-base font-extrabold text-white">
                {ride.status === 'requested' && 'Searching for Nearest Captain...'}
                {ride.status === 'accepted' && 'Captain Assigned & En Route to Pickup'}
                {ride.status === 'arriving' && 'Captain is Arriving at Pickup Point'}
                {ride.status === 'in_progress' && 'Ride in Progress • Heading to Destination'}
                {ride.status === 'completed' && 'Trip Completed • Hope you enjoyed the ride!'}
                {ride.status === 'cancelled' && 'Trip Cancelled'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {ride.status === 'requested' && 'Notifying top-rated bike captains near Chennai Central...'}
                {ride.status === 'accepted' && 'Your captain is heading towards you. Estimated arrival in 3 mins.'}
                {ride.status === 'arriving' && 'Please be ready with your helmet. Meet your captain outside.'}
                {ride.status === 'in_progress' && `Reaching ${ride.destination.shortName || ride.destination.name}`}
                {ride.status === 'completed' && `Final fare: ₹${ride.finalFare || ride.estimatedFare} paid via ${ride.paymentMethod}`}
              </p>
            </div>

            {/* Prominent 4-Digit Security OTP (Crucial Rapido/Ola pattern) */}
            {['requested', 'accepted', 'arriving'].includes(ride.status) && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-forest-950 to-forest-850 border border-velo-lime/40 p-3.5 shadow-lime-glow">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-velo-lime/20 text-velo-lime">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Start Ride PIN (OTP)</p>
                    <p className="text-xs text-slate-200">Share with captain upon arrival</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-extrabold tracking-widest text-velo-lime">
                    {ride.otp}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Captain / Driver Card (when assigned) */}
          {ride.driver && (
            <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={ride.driver.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={ride.driver.name}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-velo-lime/50"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {ride.driver.name}
                      <span className="rounded-full bg-velo-lime/20 p-0.5 text-velo-lime">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-slate-200">{ride.driver.rating || 4.9}</span>
                      <span>&bull;</span>
                      <span>{ride.driver.totalRides || 420}+ rides</span>
                    </p>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      {ride.driver.vehicle?.make} {ride.driver.vehicle?.model} &bull;{' '}
                      <span className="text-velo-lime font-bold">{ride.driver.vehicle?.regNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Call / Message Captain */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${ride.driver.phone || '+919841011111'}`}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-800 border border-velo-border/50 text-velo-lime hover:bg-forest-750"
                    title="Call Driver"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => alert(`Calling captain ${ride.driver?.name} on ${ride.driver?.phone}...`)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-800 border border-velo-border/50 text-slate-300 hover:text-white"
                    title="Message Driver"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Safety Badges */}
              <div className="mt-4 flex items-center justify-between border-t border-velo-border/30 pt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-velo-lime">
                  <ShieldCheck className="h-4 w-4" />
                  Sanitized Helmet Available
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Fare: ₹{ride.estimatedFare} ({ride.paymentMethod})
                </span>
              </div>
            </div>
          )}

          {/* Cancellation Option (if not completed or already cancelled) */}
          {['requested', 'accepted', 'arriving'].includes(ride.status) && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-forest-950/60 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:border-rose-500"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel this ride request</span>
            </button>
          )}

          {/* Post-Ride Rating Modal (when completed) */}
          {ride.status === 'completed' && !ratingSubmitted && (
            <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
              <h3 className="text-sm font-bold text-white mb-2">Rate Your Captain</h3>
              <p className="text-xs text-slate-400 mb-3">
                How was your ride with {ride.driver?.name || 'your captain'}?
              </p>

              <form onSubmit={handleSubmitRating} className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-slate-300 ml-2">{ratingValue}/5 Stars</span>
                </div>

                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Leave brief feedback (e.g. smooth ride, safe driving)..."
                  className="w-full rounded-xl border border-velo-border/50 bg-forest-950 px-3 py-2 text-xs text-white"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-velo-lime py-2 text-xs font-bold text-forest-950 hover:bg-velo-lime-hover"
                >
                  Submit Rating
                </button>
              </form>
            </div>
          )}

          {ratingSubmitted && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Thank you! Your feedback helps us maintain captain safety & quality standards.</span>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Map with Driver Live Pin (7 cols) */}
        <div className="lg:col-span-7 h-[540px] sm:h-[640px] sticky top-20">
          <Map
            pickup={ride.pickup}
            destination={ride.destination}
            driverLocation={ride.driverLocation || (ride.driver?.location ? { lat: ride.driver.location.lat, lng: ride.driver.location.lng, heading: 45 } : null)}
            className="h-full w-full shadow-2xl"
          />
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-forest-950 p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Cancel Ride Request?</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please choose a reason for cancelling. No fee is charged if cancelled within 2 minutes of booking.
            </p>

            <div className="space-y-2 mb-4">
              {[
                'Change of plans',
                'Driver is taking too long to arrive',
                'Expected shorter fare',
                'Booked by mistake',
                'Other reason'
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer ${
                    cancelReason === reason
                      ? 'border-rose-500 bg-rose-950/30 text-rose-200'
                      : 'border-velo-border/40 bg-forest-900/60 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 rounded-xl bg-forest-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-forest-750"
              >
                Keep Ride
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow-lg"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
