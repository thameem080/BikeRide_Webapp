import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Info
} from 'lucide-react';
import {
  getStoredGoogleMapsApiKey,
  setStoredGoogleMapsApiKey,
  hasValidGoogleMapsKey
} from '../services/googleMapsLoader';

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: (hasKey: boolean) => void;
}

export const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGoogleMapsApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredGoogleMapsApiKey(apiKey.trim());
    setSavedSuccess(true);
    if (onKeyUpdated) {
      onKeyUpdated(Boolean(apiKey.trim()));
    }
    setTimeout(() => {
      onClose();
      // Optional reload to clean slate if necessary
      window.location.reload();
    }, 900);
  };

  const handleClear = () => {
    setStoredGoogleMapsApiKey('');
    setApiKey('');
    if (onKeyUpdated) {
      onKeyUpdated(false);
    }
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 600);
  };

  const handleCopyEnvString = () => {
    const envString = `VITE_GOOGLE_MAPS_API_KEY=${apiKey.trim() || 'your_google_maps_api_key_here'}`;
    navigator.clipboard.writeText(envString);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const isConfigured = hasValidGoogleMapsKey();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e121a] p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-velo-lime/20 border border-velo-lime/30 text-velo-lime">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Google Maps Configuration
              {isConfigured && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Enable native Google Maps, live traffic, and turn-by-turn routing
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-5 rounded-2xl p-4 border text-xs flex items-start gap-3 ${
          isConfigured
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
        }`}>
          {isConfigured ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold text-white">
              {isConfigured ? 'Google Maps Engine is Ready' : 'Fallback Map (OpenStreetMap) Currently Active'}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {isConfigured
                ? 'Your Google Maps API key is configured. The app will render native vector maps, custom Uber dark styling, and directions.'
                : 'Enter your Google Maps API key below to switch from Leaflet to high-performance Google Maps with live traffic and turn-by-turn routing.'}
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Google Maps JavaScript API Key</span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] font-mono text-velo-lime hover:underline"
              >
                {showKey ? 'Hide Key' : 'Reveal Key'}
              </button>
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3.5 h-4 w-4 text-slate-500" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-2xl border border-white/10 bg-black/60 py-3 pl-10 pr-4 text-xs font-mono text-white placeholder-slate-600 focus:border-velo-lime focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Quick instructions */}
          <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2 text-[11px] text-slate-300">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-velo-lime" />
              Required Google Cloud APIs:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li><strong className="text-slate-200">Maps JavaScript API</strong> (interactive vector map)</li>
              <li><strong className="text-slate-200">Directions API</strong> (turn-by-turn road route)</li>
              <li><strong className="text-slate-200">Places API</strong> (autocomplete & address geocoding)</li>
            </ul>
            <div className="pt-1 flex items-center justify-between">
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-velo-lime hover:underline"
              >
                Open Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={handleCopyEnvString}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white"
              >
                <Copy className="h-3 w-3" />
                {copiedEnv ? 'Copied to clipboard!' : 'Copy .env snippet'}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {savedSuccess && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-center text-xs text-emerald-400 font-semibold animate-pulse">
            ✓ Key saved! Reloading map engine...
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          {apiKey ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Key
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex items-center gap-2 rounded-xl bg-velo-lime px-5 py-2 text-xs font-bold text-black shadow-lg shadow-velo-lime/20 hover:bg-velo-lime-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

