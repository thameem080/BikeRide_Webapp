import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Ride } from '../types';
import {
  History,
  Bike,
  MapPin,
  Navigation,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Receipt,
  ArrowRight,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

interface BookingsProps {
  onNavigate: (path: string) => void;
}

export const Bookings: React.FC<BookingsProps> = ({ onNavigate }) => {
  const { user, language } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRides = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomerRides(user.id);
      setRides(data);
    } catch (err) {
      console.warn('Failed to fetch rides:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [user.id]);

  const filteredRides = rides.filter((r) => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black border border-velo-lime/30 text-velo-lime shadow-md">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">
              {language === 'ta' ? 'எனது பயண வரலாறு' : 'Your Uber Activity'}
            </h1>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'கடந்த சவாரிகள், ரசீதுகள் மற்றும் ஓட்டுநர் மதிப்பாய்வு'
                : 'Past bike trips, receipts, and captain ratings'}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-2xl bg-black/60 p-1 border border-white/10">
          {(['all', 'completed', 'cancelled'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                filter === type
                  ? 'bg-white text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Rides List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-velo-lime border-t-transparent mb-3" />
          <span>Loading activity history...</span>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0e121a]/60 p-12 text-center">
          <Bike className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-base font-bold text-white">No trips found</p>
          <p className="text-xs text-slate-400 mt-1 mb-5">You have no ride history in this category yet.</p>
          <button
            onClick={() => onNavigate('/')}
            className="rounded-2xl bg-velo-lime px-5 py-2.5 text-xs font-bold text-black hover:bg-velo-lime-hover shadow-lg shadow-velo-lime/20"
          >
            Book Your First Ride
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="rounded-3xl border border-white/10 bg-[#0e121a]/95 p-5 shadow-xl hover:border-white/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(ride.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}{' '}
                    &bull;{' '}
                    {new Date(ride.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize border ${
                      ride.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : ride.status === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-extrabold text-white">
                    ₹{ride.finalFare || ride.estimatedFare}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({ride.paymentMethod})
                  </span>
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-velo-lime bg-black mt-1 shrink-0"></div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Pickup</span>
                    <p className="text-xs font-bold text-white">{ride.pickup.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-3.5 w-3.5 rounded-[3px] bg-rose-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Dropoff</span>
                    <p className="text-xs font-bold text-white">{ride.destination.name}</p>
                  </div>
                </div>
              </div>

              {/* Footer info: Captain, distance, rating */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs text-slate-400">
                <div className="flex items-center gap-3 font-medium">
                  {ride.driver && (
                    <span>Captain: <strong className="text-white">{ride.driver.name}</strong></span>
                  )}
                  <span>&bull;</span>
                  <span>{ride.distanceKm} km</span>
                  {ride.rating && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {ride.rating}/5
                      </span>
                    </>
                  )}
                </div>

                {/* Track active */}
                <div>
                  {['requested', 'accepted', 'arriving', 'in_progress'].includes(ride.status) && (
                    <button
                      onClick={() => onNavigate(`/ride/${ride.id}`)}
                      className="flex items-center gap-1.5 rounded-xl bg-velo-lime px-3.5 py-1.5 text-xs font-bold text-black hover:bg-velo-lime-hover shadow-md"
                    >
                      <span>Track Active Trip</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
