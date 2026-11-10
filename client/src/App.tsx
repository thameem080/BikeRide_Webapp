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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-velo-lime selection:text-black">
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
      <footer className="border-t border-white/10 bg-[#06080c] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-slate-400">
            &copy; 2026 Uber Moto Platform &bull; Real-time GPS & Google Maps Engine &bull; Chennai Cluster
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => navigate('/login')} className="hover:text-velo-lime transition-colors">
              Switch Persona
            </button>
            <span>&bull;</span>
            <button onClick={() => setSosModalOpen(true)} className="text-rose-400 hover:text-rose-300 transition-colors">
              Safety Support & SOS
            </button>
            <span>&bull;</span>
            <button onClick={() => navigate('/bookings')} className="hover:text-slate-300 transition-colors">
              Ride Receipts
            </button>
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
