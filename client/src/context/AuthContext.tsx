import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Language } from '../types';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  avatar: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
}

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  language: Language;
  setLanguage: (lang: Language) => void;
  switchRole: (role: UserRole) => void;
  updateEmergencyContact: (name: string, phone: string) => void;
}

const PRESET_USERS: Record<UserRole, UserProfile> = {
  customer: {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Karthik Subramanian',
    phone: '+91 98401 23456',
    email: 'karthik@example.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    emergencyContact: {
      name: 'Priya (Sister)',
      phone: '+91 98409 87654'
    }
  },
  driver: {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'Senthil Kumar (Captain)',
    phone: '+91 98410 11111',
    email: 'senthil.ride@veloai.com',
    role: 'driver',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    emergencyContact: {
      name: 'Muthu (Brother)',
      phone: '+91 98410 99999'
    }
  },
  admin: {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Admin Velo',
    phone: '+91 98765 00001',
    email: 'admin@veloai.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    emergencyContact: {
      name: 'Emergency Dispatch Ops',
      phone: '112'
    }
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('velo_role') as UserRole) || 'customer';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('velo_lang') as Language) || 'en';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    return PRESET_USERS[role] || PRESET_USERS.customer;
  });

  useEffect(() => {
    setUser(PRESET_USERS[role]);
    localStorage.setItem('velo_role', role);
  }, [role]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('velo_lang', lang);
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const updateEmergencyContact = (name: string, phone: string) => {
    setUser((prev) => ({
      ...prev,
      emergencyContact: { name, phone }
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        language,
        setLanguage,
        switchRole,
        updateEmergencyContact
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
