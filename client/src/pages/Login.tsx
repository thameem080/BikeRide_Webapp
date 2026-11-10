import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Bike,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { switchRole, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'quick' | 'email'>('quick');

  const handleQuickLogin = (selectedRole: UserRole) => {
    switchRole(selectedRole);
    if (selectedRole === 'driver') onNavigate('/driver');
    else if (selectedRole === 'admin') onNavigate('/admin');
    else onNavigate('/');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switchRole('customer');
    onNavigate('/');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-16">
      <div className="rounded-3xl border border-white/10 bg-[#0e121a]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-slate-100">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black border border-velo-lime/40 shadow-lg shadow-velo-lime/20 mb-3">
            <Bike className="h-8 w-8 text-velo-lime" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-extrabold text-white">
            Uber <span className="text-velo-lime">MOTO</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Professional Bike Ride & Courier Platform
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-2xl bg-black/60 p-1 mb-6 border border-white/10">
          <button
            onClick={() => setAuthMode('quick')}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              authMode === 'quick'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            One-Click Persona
          </button>
          <button
            onClick={() => setAuthMode('email')}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              authMode === 'email'
                ? 'bg-white text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email Login
          </button>
        </div>

        {authMode === 'quick' ? (
          <div className="space-y-3">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Select persona to test:
            </p>

            {/* Persona 1: Passenger */}
            <button
              onClick={() => handleQuickLogin('customer')}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:border-velo-lime ${
                role === 'customer'
                  ? 'border-velo-lime bg-white/[0.08] shadow-lg ring-1 ring-velo-lime'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-velo-lime">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Rider App (Passenger)</h3>
                  <p className="text-[11px] text-slate-400">Karthik Subramanian &bull; 4.9★</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-velo-lime" />
            </button>

            {/* Persona 2: Driver Partner */}
            <button
              onClick={() => handleQuickLogin('driver')}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:border-velo-lime ${
                role === 'driver'
                  ? 'border-velo-lime bg-white/[0.08] shadow-lg ring-1 ring-velo-lime'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-400">
                  <Bike className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Captain Partner Portal</h3>
                  <p className="text-[11px] text-slate-400">Senthil Kumar (TVS Apache 160)</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </button>

            {/* Persona 3: Administrator */}
            <button
              onClick={() => handleQuickLogin('admin')}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:border-velo-lime ${
                role === 'admin'
                  ? 'border-velo-lime bg-white/[0.08] shadow-lg ring-1 ring-velo-lime'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Operations & Fleet Dispatch</h3>
                  <p className="text-[11px] text-slate-400">Telemetry, Fare Engine, Verification</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rider@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-velo-lime focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-velo-lime focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-velo-lime py-3 text-xs font-bold text-black shadow-lg shadow-velo-lime/20 hover:bg-velo-lime-hover transition-colors"
            >
              Sign In to Uber Moto
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
