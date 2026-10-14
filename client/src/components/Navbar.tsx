import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bike,
  Mic,
  ShieldAlert,
  Globe,
  User,
  History,
  LayoutDashboard,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenSos }) => {
  const { user, role, switchRole, language, setLanguage } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { label: language === 'ta' ? 'புக் சவாரி' : 'Book Ride', path: '/', icon: Bike },
    { label: language === 'ta' ? 'பயணங்கள்' : 'My Rides', path: '/bookings', icon: History },
    { label: language === 'ta' ? 'கேப்டன் தளம்' : 'Driver Partner', path: '/driver', icon: Bike },
    { label: language === 'ta' ? 'நிர்வாகம்' : 'Admin Hub', path: '/admin', icon: LayoutDashboard },
  ];

  const handleRoleSelect = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleDropdownOpen(false);
    if (newRole === 'driver') onNavigate('/driver');
    else if (newRole === 'admin') onNavigate('/admin');
    else onNavigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-velo-border/40 bg-forest-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('/')}
          className="flex cursor-pointer items-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-velo-lime to-emerald-600 shadow-lime-glow">
            <Bike className="h-6 w-6 text-forest-950" strokeWidth={2.4} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-velo-lime opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-velo-lime"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white">
                VELO <span className="text-velo-lime">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-velo-lime/10 px-2 py-0.5 text-[10px] font-semibold text-velo-lime border border-velo-lime/25">
                <Sparkles className="mr-1 h-2.5 w-2.5" /> VOICE-FIRST
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {language === 'ta' ? 'அதிவேக பைக் டாக்ஸி' : 'Hyper-Speed Bike Taxi Platform'}
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
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-velo-surface2 text-velo-lime border border-velo-border-active shadow-sm'
                    : 'text-slate-300 hover:bg-forest-900/60 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-velo-lime' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Language Toggle (EN / TA) */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            title="Switch Language (English / தமிழ்)"
            className="flex items-center gap-1.5 rounded-xl border border-velo-border/60 bg-forest-900/60 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:border-velo-lime hover:text-velo-lime"
          >
            <Globe className="h-3.5 w-3.5 text-velo-lime" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* SOS Safety Button */}
          <button
            onClick={onOpenSos}
            title="Emergency SOS Assistance"
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-900/60 hover:text-rose-100 hover:shadow-lg shadow-rose-950"
          >
            <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-velo-border/50 bg-forest-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-velo-lime"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-velo-lime/50"
              />
              <div className="text-left hidden lg:block">
                <p className="text-[11px] font-bold leading-tight text-white">{user.name.split(' ')[0]}</p>
                <p className="text-[9px] uppercase tracking-wider text-velo-lime font-mono">{role}</p>
              </div>
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-velo-border bg-forest-900/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50">
                <div className="px-3 py-2 border-b border-velo-border/40">
                  <p className="text-xs text-slate-400">Current Role Mode</p>
                  <p className="text-sm font-bold text-white capitalize">{role}</p>
                </div>
                <div className="py-1">
                  {(['customer', 'driver', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-all ${
                        role === r
                          ? 'bg-velo-surface2 text-velo-lime border border-velo-border/60'
                          : 'text-slate-300 hover:bg-forest-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${role === r ? 'bg-velo-lime' : 'bg-slate-500'}`} />
                        {r === 'customer' ? 'Customer App' : r === 'driver' ? 'Driver Partner' : 'Admin Hub'}
                      </span>
                      {role === r && <span className="text-[10px] text-velo-lime font-mono">ACTIVE</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-velo-border/40 bg-forest-900 text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-velo-border/40 bg-forest-950 px-4 py-3 space-y-2">
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
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-velo-surface2 text-velo-lime border border-velo-border-active'
                    : 'text-slate-300 hover:bg-forest-900 text-left'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-velo-lime' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
