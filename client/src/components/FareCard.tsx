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
  Info
} from 'lucide-react';
import { FareBreakdown, Language } from '../types';

interface FareCardProps {
  fareBreakdown: FareBreakdown;
  distanceKm: number;
  durationMins: number;
  language: Language;
  onBookRide: (paymentMethod: string) => void;
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
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');

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

  return (
    <div className="flex flex-col rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
      {/* Top Banner: Bike Taxi Header */}
      <div className="flex items-center justify-between pb-4 border-b border-velo-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 border border-velo-lime/40 text-velo-lime">
            <Bike className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">VELO Moto</h3>
              <span className="rounded-full bg-velo-lime/10 px-2 py-0.5 text-[10px] font-semibold text-velo-lime border border-velo-lime/30">
                FASTER IN TRAFFIC
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{durationMins} mins</span>
              <span>&bull;</span>
              <Navigation className="h-3.5 w-3.5 text-slate-400" />
              <span>{distanceKm} km</span>
            </p>
          </div>
        </div>

        {/* Total Price */}
        <div className="text-right">
          <p className="text-2xl font-extrabold text-white">₹{estimatedTotal}</p>
          <p className="text-[10px] font-mono text-slate-400">
            {language === 'ta' ? 'உத்தேச கட்டணம்' : 'Estimated Fare'}
          </p>
        </div>
      </div>

      {/* Highlights / Badges */}
      <div className="grid grid-cols-2 gap-2 my-3.5">
        <div className="flex items-center gap-2 rounded-xl bg-forest-950/60 p-2.5 border border-velo-border/30">
          <ShieldCheck className="h-4 w-4 text-velo-lime shrink-0" />
          <span className="text-[11px] text-slate-300 font-medium">
            {language === 'ta' ? 'ஹெல்மெட் கட்டாயம்' : 'Sanitized Helmet Included'}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-forest-950/60 p-2.5 border border-velo-border/30">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-[11px] text-slate-300 font-medium">
            {language === 'ta' ? '2 நிமிடங்களில் பிக்அப்' : 'Instant 2-Min Pickup'}
          </span>
        </div>
      </div>

      {/* Itemized Fare Breakdown Toggle */}
      <div className="rounded-2xl bg-forest-950/50 border border-velo-border/30 overflow-hidden mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-velo-lime" />
            {language === 'ta' ? 'கட்டண விவரம் காண்க' : 'Transparent Fare Breakdown'}
          </span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDetails && (
          <div className="px-3.5 pb-3 pt-1 text-xs space-y-1.5 border-t border-velo-border/20 text-slate-300 font-mono">
            <div className="flex justify-between">
              <span>Base Fare (incl. {baseDistanceKm} km):</span>
              <span>₹{baseFare}</span>
            </div>
            {extraDistanceKm > 0 && (
              <div className="flex justify-between">
                <span>Distance Rate ({extraDistanceKm} km × ₹11.50):</span>
                <span>₹{distanceFare}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Ride Time Charge ({durationMins} mins × ₹1.50):</span>
              <span>₹{timeFare}</span>
            </div>
            {isNightTime && (
              <div className="flex justify-between text-amber-300">
                <span>Night Charge (10 PM - 5 AM):</span>
                <span>×{nightMultiplier}</span>
              </div>
            )}
            {surgeMultiplier > 1.0 && (
              <div className="flex justify-between text-amber-300">
                <span>Demand Surge:</span>
                <span>×{surgeMultiplier}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-velo-border/30 text-white font-bold">
              <span>Total Estimated Fare:</span>
              <span className="text-velo-lime">₹{estimatedTotal}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Selection */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          {language === 'ta' ? 'கட்டண முறை' : 'Payment Method'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'UPI', label: 'UPI / GPay', icon: Smartphone },
            { id: 'Cash', label: 'Cash', icon: Banknote },
            { id: 'Card', label: 'Card', icon: CreditCard }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = paymentMethod === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPaymentMethod(item.id as any)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-velo-surface2 text-velo-lime border border-velo-border-active shadow-sm'
                    : 'bg-forest-950/70 text-slate-400 border border-velo-border/30 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Booking CTA Button */}
      <button
        onClick={() => onBookRide(paymentMethod)}
        disabled={isLoading}
        className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-velo-lime to-emerald-500 py-3.5 text-sm font-extrabold text-forest-950 shadow-lime-glow transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-forest-950 border-t-transparent animate-spin" />
            {language === 'ta' ? 'கேப்டனை தேடுகிறோம்...' : 'Finding Nearest Captain...'}
          </span>
        ) : (
          <>
            <Bike className="h-5 w-5" />
            <span>
              {language === 'ta'
                ? `₹${estimatedTotal} - பைக் சவாரி உறுதி செய்`
                : `Book VELO Moto • ₹${estimatedTotal}`}
            </span>
          </>
        )}
      </button>

      <p className="mt-2 text-center text-[10px] text-slate-500">
        Prices are calculated dynamically on server rules. OTP verification required before ride start.
      </p>
    </div>
  );
};
