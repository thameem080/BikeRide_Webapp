import React, { useState } from 'react';
import {
  Bike,
  ShieldCheck,
  Clock,
  Navigation,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  Info,
  Zap,
  Package,
  Award,
  Leaf,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { FareBreakdown, Language } from '../types';

export type RideTier = 'moto' | 'comfort' | 'electric' | 'package';

interface FareCardProps {
  fareBreakdown: FareBreakdown;
  distanceKm: number;
  durationMins: number;
  language: Language;
  onBookRide: (paymentMethod: string, selectedTier?: RideTier) => void;
  isLoading?: boolean;
}

export const FareCard: React.FC<FareCardProps> = ({
  fareBreakdown,
  distanceKm,
  durationMins,
  language,
  onBookRide,
  isLoading = false
}) => {
  const [selectedTier, setSelectedTier] = useState<RideTier>('moto');
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'UberCash' | 'Card' | 'Cash'>('UPI');
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);

  const {
    baseFare,
    baseDistanceKm,
    extraDistanceKm,
    distanceFare,
    timeFare,
    surgeMultiplier,
    isNightTime,
    nightMultiplier,
    minFare,
    estimatedTotal
  } = fareBreakdown;

  // Calculate pricing & arrival times for each ride tier
  const now = new Date();
  const formatDropTime = (extraMinutes = 0) => {
    const dropDate = new Date(now.getTime() + (durationMins + extraMinutes) * 60000);
    return dropDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const rideOptions = [
    {
      id: 'moto' as RideTier,
      name: 'Uber Moto',
      subtitle: language === 'ta' ? 'மலிவான & அதிவேக சவாரி' : 'Affordable, fast bike rides',
      badge: language === 'ta' ? 'சிறந்த மதிப்பு' : 'Best Value',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      price: estimatedTotal,
      etaMins: 2,
      dropoffTime: formatDropTime(2),
      capacity: '1',
      icon: Bike,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    },
    {
      id: 'comfort' as RideTier,
      name: 'Moto Comfort',
      subtitle: language === 'ta' ? 'சிறந்த ஓட்டுநர்கள் & புதிய பைக்குகள்' : 'Top rated captains (4.8★+), newer bikes',
      badge: language === 'ta' ? 'பிரீமியம்' : 'Top Rated',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      price: Math.max(minFare, Math.round(estimatedTotal * 1.25)),
      etaMins: 3,
      dropoffTime: formatDropTime(3),
      capacity: '1',
      icon: Award,
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    },
    {
      id: 'electric' as RideTier,
      name: 'Eco Moto EV',
      subtitle: language === 'ta' ? '100% மின்சார பைக் (ஜீரோ புகை)' : '100% Electric (Ather/Ola), zero carbon',
      badge: language === 'ta' ? 'சுற்றுச்சூழல்' : '100% Electric',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      price: Math.max(minFare, Math.round(estimatedTotal * 1.08)),
      etaMins: 2,
      dropoffTime: formatDropTime(2),
      capacity: '1',
      icon: Leaf,
      iconBg: 'bg-teal-500/20 text-teal-400 border-teal-500/40'
    },
    {
      id: 'package' as RideTier,
      name: 'Uber Connect (Courier)',
      subtitle: language === 'ta' ? 'பொருட்கள் விரைவு பார்சல் டெலிவரி' : 'Send parcels & packages fast',
      badge: language === 'ta' ? 'பார்சல்' : 'Parcel Delivery',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      price: Math.max(minFare, Math.round(estimatedTotal * 1.15)),
      etaMins: 4,
      dropoffTime: formatDropTime(4),
      capacity: '10kg',
      icon: Package,
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
    }
  ];

  const currentOption = rideOptions.find((o) => o.id === selectedTier) || rideOptions[0];

  const paymentMethods = [
    { id: 'UPI' as const, label: 'Google Pay / PhonePe (UPI)', icon: Smartphone },
    { id: 'UberCash' as const, label: 'Uber Cash (₹250 balance)', icon: Zap },
    { id: 'Card' as const, label: 'HDFC Bank Visa •••• 4092', icon: CreditCard },
    { id: 'Cash' as const, label: 'Cash to Captain', icon: Banknote }
  ];

  const activePayment = paymentMethods.find((p) => p.id === paymentMethod) || paymentMethods[0];
  const PaymentIcon = activePayment.icon;

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-2xl backdrop-blur-2xl text-slate-100">
      {/* Header: Available Ride Tiers */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight">
            {language === 'ta' ? 'பயண வகையைத் தேர்வு செய்யவும்' : 'Choose a Ride'}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{durationMins} mins</span>
            <span>&bull;</span>
            <Navigation className="h-3.5 w-3.5 text-slate-400" />
            <span>{distanceKm} km</span>
          </p>
        </div>

        {/* Safety PIN Badge Notice */}
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          <Lock className="h-3 w-3" />
          <span>4-Digit PIN Protected</span>
        </div>
      </div>

      {/* Ride Options Selection Grid */}
      <div className="space-y-2 mb-4">
        {rideOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedTier === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => setSelectedTier(opt.id)}
              className={`relative flex items-center justify-between rounded-2xl p-3.5 cursor-pointer border transition-all ${
                isSelected
                  ? 'border-velo-lime bg-white/[0.06] shadow-lg shadow-black/40 ring-1 ring-velo-lime'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${opt.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{opt.name}</span>
                    <span className="text-[11px] text-slate-400 font-medium">👤 {opt.capacity}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {opt.etaMins} mins away &bull; Dropoff {opt.dropoffTime}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-base font-extrabold text-white">₹{opt.price}</p>
                {opt.id === 'comfort' && (
                  <p className="text-[10px] text-slate-500 line-through">₹{Math.round(opt.price * 1.15)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety & Perks Pill Bar */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] p-2.5 border border-white/5 text-[11px] text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Sanitized Helmet Included</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] p-2.5 border border-white/5 text-[11px] text-slate-300">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Instant 2-Min Dispatch</span>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-200 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <PaymentIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-white">{activePayment.label}</p>
              <p className="text-[10px] text-slate-400">Tap to switch payment method</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {paymentDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl border border-white/10 bg-[#141924] p-1.5 shadow-2xl">
            {paymentMethods.map((pm) => {
              const PIcon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => {
                    setPaymentMethod(pm.id);
                    setPaymentDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left text-xs transition-colors ${
                    paymentMethod === pm.id
                      ? 'bg-velo-lime/10 text-velo-lime font-bold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <PIcon className="h-4 w-4" />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Transparent Itemized Fare Breakdown Accordion */}
      <div className="rounded-2xl bg-black/40 border border-white/5 overflow-hidden mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-velo-lime" />
            {language === 'ta' ? 'கட்டண விவரம் காண்க' : 'Detailed Fare Breakdown'}
          </span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDetails && (
          <div className="px-3.5 pb-3 pt-1 text-xs space-y-1.5 border-t border-white/5 text-slate-300 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Fare (First {baseDistanceKm} km):</span>
              <span>₹{baseFare}</span>
            </div>
            {extraDistanceKm > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Distance ({extraDistanceKm.toFixed(1)} km @ ₹10/km):</span>
                <span>₹{distanceFare}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Ride Time ({durationMins} mins @ ₹1.5/min):</span>
              <span>₹{timeFare}</span>
            </div>
            {surgeMultiplier > 1 && (
              <div className="flex justify-between text-amber-400">
                <span>Peak Traffic Surge ({surgeMultiplier}x):</span>
                <span>Active</span>
              </div>
            )}
            {isNightTime && (
              <div className="flex justify-between text-indigo-400">
                <span>Night Charge ({nightMultiplier}x):</span>
                <span>Active</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-white/10 flex justify-between font-bold text-white text-sm">
              <span>Total Estimated Fare:</span>
              <span className="text-velo-lime">₹{currentOption.price}</span>
            </div>
          </div>
        )}
      </div>

      {/* Uber CTA Booking Button */}
      <button
        onClick={() => onBookRide(paymentMethod, selectedTier)}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-velo-lime py-3.5 px-4 font-bold text-black text-sm shadow-xl shadow-velo-lime/20 hover:bg-velo-lime-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-black">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
            <span>Finding Nearby Captains...</span>
          </div>
        ) : (
          <span>
            {language === 'ta'
              ? `உடனடி சவாரி புக் செய் • ₹${currentOption.price}`
              : `Confirm ${currentOption.name} • ₹${currentOption.price}`}
          </span>
        )}
      </button>

      <p className="mt-2 text-center text-[10px] text-slate-500 font-mono">
        Free cancellation within 2 mins &bull; 4-digit ride OTP sent on dispatch
      </p>
    </div>
  );
};
