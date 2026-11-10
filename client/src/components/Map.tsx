import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationPoint, Driver } from '../types';
import { hasValidGoogleMapsKey } from '../services/googleMapsLoader';
import { GoogleMapComponent } from './GoogleMapComponent';
import { GoogleMapsModal } from './GoogleMapsModal';
import { Layers, Settings, Sparkles, AlertCircle } from 'lucide-react';

// Custom SVG Icons for Leaflet to avoid missing asset issues
const createPulseIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: pulse 2s infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #06110c; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); color: ${color}; font-weight: 800; font-size: 13px;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createBikeIcon = (heading = 0) => {
  return L.divIcon({
    className: 'custom-bike-marker',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease; background: #06110c; border: 2px solid #10f575; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(16, 245, 117, 0.6);">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10f575" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5"/>
          <circle cx="18.5" cy="17.5" r="3.5"/>
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h4"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19]
  });
};

const pickupIcon = createPulseIcon('#10f575', 'P');
const dropoffIcon = createPulseIcon('#f43f5e', 'D');

// Component to dynamically fit bounds in Leaflet
function FitBounds({ pickup, destination }: { pickup?: LocationPoint | null; destination?: LocationPoint | null }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    }
  }, [pickup, destination, map]);

  return null;
}

// Click listener to set point on Leaflet map
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onMapClick]);
  return null;
}

export interface MapProps {
  pickup?: LocationPoint | null;
  destination?: LocationPoint | null;
  driverLocation?: { lat: number; lng: number; heading?: number } | null;
  nearbyDrivers?: Driver[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

export const Map: React.FC<MapProps> = ({
  pickup,
  destination,
  driverLocation,
  nearbyDrivers = [],
  onMapClick,
  className = 'h-full w-full',
  zoom = 13
}) => {
  const [googleKeyActive, setGoogleKeyActive] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [forcedEngine, setForcedEngine] = useState<'auto' | 'leaflet' | 'google'>('auto');

  useEffect(() => {
    setGoogleKeyActive(hasValidGoogleMapsKey());
  }, []);

  const shouldUseGoogle =
    (forcedEngine === 'google' || (forcedEngine === 'auto' && googleKeyActive)) &&
    !googleError;

  const centerLat = pickup?.lat || 13.0827; // Default Chennai Central
  const centerLng = pickup?.lng || 80.2707;

  // Build curved road-like polyline points for Leaflet
  const routePoints: [number, number][] = [];
  if (pickup && destination) {
    const midLat = (pickup.lat + destination.lat) / 2 + 0.003;
    const midLng = (pickup.lng + destination.lng) / 2 - 0.003;
    routePoints.push([pickup.lat, pickup.lng]);
    routePoints.push([midLat, midLng]);
    routePoints.push([destination.lat, destination.lng]);
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-forest-950 ${className}`}>
      {/* Top Engine Pill & Settings Trigger */}
      <div className="absolute left-3.5 top-3.5 z-30 flex items-center gap-2">
        <button
          onClick={() => setConfigModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#0e121a]/90 px-3.5 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-xl border border-white/10 shadow-xl hover:border-velo-lime/50 hover:text-white transition-all group"
        >
          {shouldUseGoogle ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Google Maps</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Live
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="font-semibold text-slate-200">OpenStreetMap</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-velo-lime group-hover:bg-velo-lime group-hover:text-black transition-colors">
                + Add Google Key
              </span>
            </>
          )}
          <Settings className="h-3.5 w-3.5 text-slate-400 group-hover:text-velo-lime group-hover:rotate-45 transition-all" />
        </button>

        {/* Engine switcher toggle if Google key is active */}
        {googleKeyActive && (
          <div className="flex rounded-xl bg-[#0e121a]/90 p-1 border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setForcedEngine('google')}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                shouldUseGoogle ? 'bg-velo-lime text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setForcedEngine('leaflet')}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                !shouldUseGoogle ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leaflet
            </button>
          </div>
        )}
      </div>

      {/* Render Google Maps Component if configured */}
      {shouldUseGoogle ? (
        <GoogleMapComponent
          pickup={pickup}
          destination={destination}
          driverLocation={driverLocation}
          nearbyDrivers={nearbyDrivers}
          onMapClick={onMapClick}
          className="h-full w-full"
          zoom={zoom}
          onError={(err) => {
            console.warn('Google Maps load issue:', err);
            setGoogleError(err);
          }}
        />
      ) : (
        /* Render Leaflet Dark Matter Map as Fallback */
        <div className="relative h-full w-full">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={zoom}
            scrollWheelZoom={true}
            className="h-full w-full carto-dark"
          >
            {/* CartoDB Dark Matter free high-performance tiles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            <FitBounds pickup={pickup} destination={destination} />
            <MapClickHandler onMapClick={onMapClick} />

            {/* Pickup Marker */}
            {pickup && (
              <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                <Popup>
                  <div className="text-xs font-semibold text-slate-100">
                    <span className="text-velo-lime">📍 Pickup:</span> {pickup.name || 'Pickup Point'}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Marker */}
            {destination && (
              <Marker position={[destination.lat, destination.lng]} icon={dropoffIcon}>
                <Popup>
                  <div className="text-xs font-semibold text-slate-100">
                    <span className="text-rose-400">🏁 Drop:</span> {destination.name || 'Destination'}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route Line */}
            {routePoints.length > 0 && (
              <>
                {/* Glow backing line */}
                <Polyline
                  positions={routePoints}
                  pathOptions={{ color: '#10f575', weight: 8, opacity: 0.35 }}
                />
                {/* Solid vibrant line */}
                <Polyline
                  positions={routePoints}
                  pathOptions={{ color: '#10f575', weight: 4, dashArray: '6, 6' }}
                />
              </>
            )}

            {/* Live Assigned Driver Marker */}
            {driverLocation && (
              <Marker
                position={[driverLocation.lat, driverLocation.lng]}
                icon={createBikeIcon(driverLocation.heading || 0)}
              >
                <Popup>
                  <div className="text-xs font-bold text-velo-lime">
                    🏍️ Captain Live Location
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Nearby Available Seeded Drivers */}
            {nearbyDrivers.map((d) => (
              <Marker
                key={d.id}
                position={[d.location.lat, d.location.lng]}
                icon={createBikeIcon(45)}
              >
                <Popup>
                  <div className="text-xs text-slate-200">
                    <p className="font-bold text-velo-lime">{d.name} (⭐ {d.rating})</p>
                    <p className="text-[11px] text-slate-400">{d.vehicle.make} {d.vehicle.model}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Leaflet map control badge */}
          <div className="pointer-events-none absolute bottom-3.5 left-3.5 z-[400] flex items-center gap-2 rounded-xl bg-forest-950/85 px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-velo-lime animate-ping"></span>
            VELO Fast Map Engine &bull; Chennai
          </div>
        </div>
      )}

      {/* Google Maps Configuration Modal */}
      <GoogleMapsModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onKeyUpdated={(hasKey) => {
          setGoogleKeyActive(hasKey);
          setGoogleError(null);
        }}
      />
    </div>
  );
};
