import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Phone,
  Share2,
  AlertTriangle,
  X,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRideId?: string | null;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, activeRideId }) => {
  const { user, updateEmergencyContact, language } = useAuth();
  const [editingContact, setEditingContact] = useState(false);
  const [contactName, setContactName] = useState(user.emergencyContact.name);
  const [contactPhone, setContactPhone] = useState(user.emergencyContact.phone);
  const [alertSent, setAlertSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyContact(contactName, contactPhone);
    setEditingContact(false);
  };

  const handleTriggerSimulatedAlert = () => {
    setAlertSent(true);
    setTimeout(() => {
      setAlertSent(false);
    }, 5000);
  };

  const handleShareTrip = () => {
    const text = `I am riding with VELO AI. Active Ride ID: ${activeRideId || 'VELO-DEMO-RIDE'}. Track live on https://veloai.app/ride/${activeRideId || 'demo'}`;
    if (navigator.share) {
      navigator.share({ title: 'My VELO Ride Tracking', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Trip tracking link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-forest-950 p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-forest-900 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              VELO Safety & Emergency Shield
            </h2>
            <p className="text-xs text-rose-300 font-medium">
              24×7 Passenger Rapid Assistance Console
            </p>
          </div>
        </div>

        {/* Important Real-World Disclaimer */}
        <div className="my-4 flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300">Safety Notice:</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-100">
              This demo application provides fast SOS coordination. For immediate physical emergencies, always dial <strong>112 (National Emergency Number)</strong> directly on your mobile device.
            </p>
          </div>
        </div>

        {/* Primary Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Call National Emergency 112 */}
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950 hover:bg-rose-500 transition-all text-center"
          >
            <Phone className="h-4 w-4" />
            <span>Call 112 (Police / Medical)</span>
          </a>

          {/* Share Live Ride Location */}
          <button
            onClick={handleShareTrip}
            className="flex items-center justify-center gap-2 rounded-2xl bg-forest-800 border border-velo-border/60 px-4 py-3 text-xs font-bold text-velo-lime hover:bg-forest-750 transition-all"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Trip with Family</span>
          </button>
        </div>

        {/* Configured Emergency Contact */}
        <div className="rounded-2xl bg-forest-900/70 border border-velo-border/30 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">
              Trusted Emergency Contact
            </span>
            <button
              onClick={() => setEditingContact(!editingContact)}
              className="text-[11px] font-semibold text-velo-lime hover:underline"
            >
              {editingContact ? 'Cancel' : 'Edit Contact'}
            </button>
          </div>

          {editingContact ? (
            <form onSubmit={handleSaveContact} className="space-y-2 mt-2">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact Name (e.g. Sister, Dad)"
                className="w-full rounded-xl border border-velo-border/50 bg-forest-950 px-3 py-1.5 text-xs text-white"
                required
              />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone Number (+91 ...)"
                className="w-full rounded-xl border border-velo-border/50 bg-forest-950 px-3 py-1.5 text-xs text-white"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-velo-lime py-1.5 text-xs font-bold text-forest-950"
              >
                Save Emergency Contact
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <div>
                <p className="text-sm font-bold text-white">{user.emergencyContact.name}</p>
                <p className="text-xs text-slate-400 font-mono">{user.emergencyContact.phone}</p>
              </div>
              <a
                href={`tel:${user.emergencyContact.phone}`}
                className="flex items-center gap-1.5 rounded-xl bg-forest-800 border border-velo-border/50 px-3 py-1.5 text-xs font-bold text-white hover:text-velo-lime"
              >
                <Phone className="h-3.5 w-3.5 text-velo-lime" />
                Call Now
              </a>
            </div>
          )}
        </div>

        {/* Simulated Internal Ops Alert */}
        <div className="text-center">
          {alertSent ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>Simulated alert dispatched to VELO Safety Response Team!</span>
            </div>
          ) : (
            <button
              onClick={handleTriggerSimulatedAlert}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-4"
            >
              Test simulated silent SOS alert to VELO Ops
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
