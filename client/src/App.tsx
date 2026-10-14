import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SosModal } from './components/SosModal';
import { Home } from './pages/Home';
import { RideTracking } from './pages/RideTracking';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Bookings } from './pages/Bookings';
import { Login } from './pages/Login';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const { role } = useAuth();

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  let renderedPage = <Home onNavigate={navigate} />;
  let activeRideIdForSos: string | null = null;

  if (currentPath === '/login') {
    renderedPage = <Login onNavigate={navigate} />;
  } else if (currentPath === '/bookings') {
    renderedPage = <Bookings onNavigate={navigate} />;
  } else if (currentPath === '/driver') {
    renderedPage = <DriverDashboard onNavigate={navigate} />;
  } else if (currentPath === '/admin') {
    renderedPage = <AdminDashboard />;
  } else if (currentPath.startsWith('/ride/')) {
    const rideId = currentPath.replace('/ride/', '');
    activeRideIdForSos = rideId;
    renderedPage = <RideTracking rideId={rideId} onNavigate={navigate} onOpenSos={() => setSosModalOpen(true)} />;
  }

  return (
    <div className="min-h-screen bg-forest-950 text-slate-100 flex flex-col font-sans selection:bg-velo-lime selection:text-forest-950">
      {/* Top Navbar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenSos={() => setSosModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {renderedPage}
      </main>

      {/* Emergency SOS Modal */}
      <SosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        activeRideId={activeRideIdForSos}
      />

      {/* Footer */}
      <footer className="border-t border-velo-border/30 bg-forest-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px]">
            &copy; 2026 VELO AI Technologies &bull; Powered by DeepMind &bull; Chennai Cluster
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => navigate('/login')} className="hover:text-velo-lime">
              Switch Persona
            </button>
            <span>&bull;</span>
            <button onClick={() => setSosModalOpen(true)} className="text-rose-400 hover:text-rose-300">
              Safety Support
            </button>
            <span>&bull;</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
