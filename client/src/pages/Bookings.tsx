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
  RefreshCw
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
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 border border-velo-lime/40 text-velo-lime">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">
              {language === 'ta' ? 'எனது பயண வரலாறு' : 'Your Ride History'}
            </h1>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'கடந்த சவாரிகள், ரசீதுகள் மற்றும் ஓட்டுநர் மதிப்பாய்வு'
                : 'All your past trips, digital receipts, and captain ratings'}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-forest-950 p-1 border border-velo-border/30">
          {(['all', 'completed', 'cancelled'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                filter === type
                  ? 'bg-velo-surface2 text-velo-lime border border-velo-border-active'
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
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading past rides...
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="rounded-3xl border border-velo-border/40 bg-forest-900/40 p-12 text-center">
          <Bike className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-sm font-bold text-white">No rides found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">You have not taken any rides in this category yet.</p>
          <button
            onClick={() => onNavigate('/')}
            className="rounded-xl bg-velo-lime px-4 py-2 text-xs font-bold text-forest-950 hover:bg-velo-lime-hover shadow-lime-glow"
          >
            Book Your First Ride
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="rounded-3xl border border-velo-border/50 bg-forest-900/80 p-5 shadow-xl hover:border-velo-border-active transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-velo-border/30">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      ride.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : ride.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-white">
                    ₹{ride.finalFare || ride.estimatedFare}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({ride.paymentMethod})
                  </span>
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-velo-lime shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Pickup</span>
                    <p className="text-xs font-semibold text-white">{ride.pickup.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Navigation className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Drop</span>
                    <p className="text-xs font-semibold text-white">{ride.destination.name}</p>
                  </div>
                </div>
              </div>

              {/* Footer info: Captain, distance, rating */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-velo-border/20 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  {ride.driver && (
                    <span>Captain: <strong className="text-slate-200">{ride.driver.name}</strong></span>
                  )}
                  <span>Distance: {ride.distanceKm} km</span>
                  {ride.rating && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {ride.rating}/5
                    </span>
                  )}
                </div>

                {/* Track active or View Receipt */}
                <div className="flex items-center gap-2">
                  {['requested', 'accepted', 'arriving', 'in_progress'].includes(ride.status) && (
                    <button
                      onClick={() => onNavigate(`/ride/${ride.id}`)}
                      className="rounded-xl bg-velo-lime px-3 py-1.5 text-xs font-bold text-forest-950 hover:bg-velo-lime-hover"
                    >
                      Track Active Trip &rarr;
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
