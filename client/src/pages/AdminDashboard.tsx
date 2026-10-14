import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Ride, Driver, FareRules } from '../types';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Bike,
  DollarSign,
  ShieldCheck,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Save
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fareRules, setFareRules] = useState<FareRules | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'monitor' | 'drivers' | 'fares' | 'complaints'>('monitor');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form state for fare rules
  const [baseFareInput, setBaseFareInput] = useState('25');
  const [perKmInput, setPerKmInput] = useState('11.5');
  const [surgeInput, setSurgeInput] = useState('1.0');
  const [nightInput, setNightInput] = useState('1.15');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, r, d, f, c] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminRides(),
        api.getAdminDrivers(),
        api.getFareRules(),
        api.getComplaints()
      ]);
      setMetrics(m);
      setRides(r);
      setDrivers(d);
      setFareRules(f);
      setComplaints(c);

      setBaseFareInput(String(f.baseFare));
      setPerKmInput(String(f.perKmRate));
      setSurgeInput(String(f.surgeMultiplier));
      setNightInput(String(f.nightChargeMultiplier));
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyDriver = async (driverId: string, status: 'approved' | 'rejected') => {
    try {
      await api.verifyDriver(driverId, status);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Driver verification failed');
    }
  };

  const handleSaveFareRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateFareRules({
        baseFare: parseFloat(baseFareInput),
        perKmRate: parseFloat(perKmInput),
        surgeMultiplier: parseFloat(surgeInput),
        nightChargeMultiplier: parseFloat(nightInput)
      });
      setFareRules(updated);
      setSaveSuccessMsg('Fare rules updated across all city clusters!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Failed to update fare rules');
    }
  };

  const filteredRides = statusFilter
    ? rides.filter((r) => r.status === statusFilter)
    : rides;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 border border-velo-lime/40 text-velo-lime">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              VELO AI Operations & Dispatch Command
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Live Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time trip telemetry, driver onboarding verifications, dynamic fare controls.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-velo-border/50 bg-forest-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-velo-border/50 bg-forest-900/80 p-4 shadow-lg">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Trips</p>
          <p className="text-2xl font-extrabold text-white mt-1">{metrics?.totalRides ?? 0}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{metrics?.activeRides ?? 0} currently active</span>
          </p>
        </div>

        <div className="rounded-2xl border border-velo-border/50 bg-forest-900/80 p-4 shadow-lg">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Gross Platform Revenue</p>
          <p className="text-2xl font-extrabold text-velo-lime mt-1">₹{metrics?.totalRevenue ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">100% digital settlement</p>
        </div>

        <div className="rounded-2xl border border-velo-border/50 bg-forest-900/80 p-4 shadow-lg">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Captains Online</p>
          <p className="text-2xl font-extrabold text-white mt-1">{metrics?.onlineDrivers ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Out of {metrics?.totalDrivers ?? 0} total fleet</p>
        </div>

        <div className="rounded-2xl border border-velo-border/50 bg-forest-900/80 p-4 shadow-lg">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Trip Completion</p>
          <p className="text-2xl font-extrabold text-white mt-1">{metrics?.completionRate ?? 100}%</p>
          <p className="text-[11px] text-amber-400 mt-1">
            {metrics?.pendingApprovals ?? 0} pending captain verifications
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-velo-border/40 space-x-2">
        {[
          { id: 'monitor', label: 'Trips Monitor', icon: LayoutDashboard },
          { id: 'drivers', label: 'Captain Approvals', icon: Bike },
          { id: 'fares', label: 'Dynamic Fare Engine', icon: Sliders },
          { id: 'complaints', label: 'Safety & Grievances', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                isActive
                  ? 'border-velo-lime text-velo-lime bg-forest-900/50 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Trips Monitor */}
      {activeTab === 'monitor' && (
        <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Live Rides Feed</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-velo-border/60 bg-forest-950 px-3 py-1.5 text-xs text-white"
            >
              <option value="">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="accepted">Accepted</option>
              <option value="arriving">Arriving</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-forest-950/80 text-[10px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="p-3">Ride ID</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Captain</th>
                  <th className="p-3">Pickup & Drop</th>
                  <th className="p-3">Fare</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-velo-border/20">
                {filteredRides.map((r) => (
                  <tr key={r.id} className="hover:bg-forest-800/40">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{r.id.slice(-8)}</td>
                    <td className="p-3 font-semibold text-white">{r.customerName}</td>
                    <td className="p-3 text-slate-200">{r.driver?.name || 'Unassigned'}</td>
                    <td className="p-3">
                      <p className="truncate max-w-[200px] text-white">{r.pickup.name}</p>
                      <p className="truncate max-w-[200px] text-slate-400">{r.destination.name}</p>
                    </td>
                    <td className="p-3 font-mono font-bold text-velo-lime">₹{r.estimatedFare}</td>
                    <td className="p-3">
                      <span className="capitalize rounded-full px-2 py-0.5 text-[10px] font-bold bg-forest-800 border border-velo-border/40">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Driver Approvals */}
      {activeTab === 'drivers' && (
        <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
          <h2 className="text-sm font-bold text-white mb-4">Captain Fleet Verification</h2>
          <div className="space-y-3">
            {drivers.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-velo-border/40 bg-forest-950 p-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={d.avatar}
                    alt={d.name}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-velo-lime"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {d.name}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                          d.verificationStatus === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : d.verificationStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {d.verificationStatus}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      License: {d.licenseNumber} &bull; {d.vehicle ? `${d.vehicle.make} (${d.vehicle.regNumber})` : 'Vehicle Verification'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {d.verificationStatus === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleVerifyDriver(d.id, 'approved')}
                        className="flex items-center gap-1.5 rounded-xl bg-velo-lime px-3 py-1.5 text-xs font-bold text-forest-950 hover:bg-velo-lime-hover"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve License
                      </button>
                      <button
                        onClick={() => handleVerifyDriver(d.id, 'rejected')}
                        className="flex items-center gap-1.5 rounded-xl bg-forest-800 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-forest-750"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">
                      Status: {d.verificationStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Fare Engine */}
      {activeTab === 'fares' && (
        <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Dynamic City Fare Calibration</h2>
              <p className="text-xs text-slate-400">Configure base fares, per-kilometer rates, and surge multipliers.</p>
            </div>
            {saveSuccessMsg && (
              <span className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                ✓ {saveSuccessMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveFareRules} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Base Fare (Includes first 1.5 km):
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500">₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={baseFareInput}
                  onChange={(e) => setBaseFareInput(e.target.value)}
                  className="w-full rounded-xl border border-velo-border/60 bg-forest-950 py-2 pl-8 pr-3 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Per-Kilometer Distance Rate:
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500">₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={perKmInput}
                  onChange={(e) => setPerKmInput(e.target.value)}
                  className="w-full rounded-xl border border-velo-border/60 bg-forest-950 py-2 pl-8 pr-3 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Surge Multiplier (1.0x to 2.5x):
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={surgeInput}
                onChange={(e) => setSurgeInput(e.target.value)}
                className="w-full rounded-xl border border-velo-border/60 bg-forest-950 py-2 px-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Night Charge Multiplier (10 PM - 5 AM):
              </label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="2.0"
                value={nightInput}
                onChange={(e) => setNightInput(e.target.value)}
                className="w-full rounded-xl border border-velo-border/60 bg-forest-950 py-2 px-3 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-velo-lime py-3 px-6 text-xs font-bold text-forest-950 hover:bg-velo-lime-hover shadow-lime-glow"
              >
                <Save className="h-4 w-4" />
                <span>Save and Propagate Fare Rules</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Safety & Grievances */}
      {activeTab === 'complaints' && (
        <div className="rounded-3xl border border-velo-border/60 bg-forest-900/90 p-5 shadow-2xl backdrop-blur-2xl">
          <h2 className="text-sm font-bold text-white mb-3">Passenger Safety Escalations & Grievances</h2>
          {complaints.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No active safety escalations.</p>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="rounded-2xl border border-rose-500/30 bg-forest-950 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{c.customerName}</span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                      UNDER INVESTIGATION
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 italic">&ldquo;{c.feedback}&rdquo;</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-2">
                    Ride ID: {c.rideId} &bull; Captain: {c.driverName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
