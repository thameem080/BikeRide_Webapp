import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bike,
  ShieldAlert,
  Globe,
  User,
  History,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  Layers,
  Key,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../types';
import { hasValidGoogleMapsKey } from '../services/googleMapsLoader';
import { GoogleMapsModal } from './GoogleMapsModal';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenSos }) => {
  const { user, role, switchRole, language, setLanguage } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);

  useEffect(() => {
    setIsGoogleConfigured(hasValidGoogleMapsKey());
  }, []);

  const navItems = [
    { label: language === 'ta' ? 'புக் சவாரி' : 'Ride', path: '/', icon: Bike },
    { label: language === 'ta' ? 'பயணங்கள்' : 'Activity', path: '/bookings', icon: History },
    { label: language === 'ta' ? 'கேப்டன் தளம்' : 'Captain Partner', path: '/driver', icon: Bike },
    { label: language === 'ta' ? 'நிர்வாகம்' : 'Operations', path: '/admin', icon: LayoutDashboard },
  ];

  const handleRoleSelect = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleDropdownOpen(false);
    if (newRole === 'driver') onNavigate('/driver');
    else if (newRole === 'admin') onNavigate('/admin');
    else onNavigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090c12]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo - Uber Moto Style */}
          <div
            onClick={() => onNavigate('/')}
            className="flex cursor-pointer items-center gap-3 transition-transform hover:scale-[1.02]"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-black border border-velo-lime/40 shadow-lg shadow-velo-lime/20">
              <Bike className="h-6 w-6 text-velo-lime" strokeWidth={2.4} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-velo-lime opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-velo-lime"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Uber <span className="text-velo-lime font-black">MOTO</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-mono uppercase text-slate-300">
                  Chennai Hub
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                {language === 'ta' ? 'அதிவேக பைக் டாக்ஸி' : 'Instant City Bike Taxi & Courier'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/15'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-velo-lime' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Google Maps API Key Config Button */}
            <button
              onClick={() => setGoogleModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold border transition-all ${
                isGoogleConfigured
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Configure Google Maps API Key"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">
                {isGoogleConfigured ? 'Google Maps' : '+ Add Google Maps Key'}
              </span>
              <span className={`h-2 w-2 rounded-full ${isGoogleConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            </button>

            {/* Language Toggle (EN / TA) */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              title="Switch Language (English / தமிழ்)"
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{language === 'en' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={onOpenSos}
              title="Emergency SOS Support"
              className="group relative flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-md shadow-rose-950/40 active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <span>SOS</span>
            </button>

            {/* User Profile / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 pr-2.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-velo-lime to-emerald-400 text-black font-extrabold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-bold text-white leading-tight truncate max-w-[80px]">
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-slate-400 capitalize">
                    {role} &bull; ⭐ 4.96
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Role switcher dropdown */}
              {roleDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#121620] p-2 shadow-2xl z-50">
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400">{user.phone}</p>
                  </div>

                  <p className="px-2.5 pt-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Switch App Mode
                  </p>

                  <button
                    onClick={() => handleRoleSelect('customer')}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                      role === 'customer'
                        ? 'bg-velo-lime/10 text-velo-lime font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>Rider (Book Rides)</span>
                    {role === 'customer' && <span className="h-1.5 w-1.5 rounded-full bg-velo-lime"></span>}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('driver')}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                      role === 'driver'
                        ? 'bg-velo-lime/10 text-velo-lime font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>Captain (Drive & Earn)</span>
                    {role === 'driver' && <span className="h-1.5 w-1.5 rounded-full bg-velo-lime"></span>}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                      role === 'admin'
                        ? 'bg-velo-lime/10 text-velo-lime font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>Operations Hub (Admin)</span>
                    {role === 'admin' && <span className="h-1.5 w-1.5 rounded-full bg-velo-lime"></span>}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0e121a] px-4 py-3 md:hidden space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-xs font-bold ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 text-velo-lime" />
                  {item.label}
                </button>
              );
            })}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  setGoogleModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs text-velo-lime"
              >
                <Layers className="h-4 w-4" />
                <span>Google Maps Configuration</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Google Maps Configuration Modal */}
      <GoogleMapsModal
        isOpen={googleModalOpen}
        onClose={() => {
          setGoogleModalOpen(false);
          setIsGoogleConfigured(hasValidGoogleMapsKey());
        }}
        onKeyUpdated={(hasKey) => setIsGoogleConfigured(hasKey)}
      />
    </>
  );
};
