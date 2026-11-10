import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LocationPoint, Driver } from '../types';
import { loadGoogleMapsScript, UBER_DARK_MAP_STYLES, getStoredGoogleMapsApiKey } from '../services/googleMapsLoader';
import { Layers, Crosshair, ZoomIn, ZoomOut, AlertCircle, Compass } from 'lucide-react';

interface GoogleMapComponentProps {
  pickup?: LocationPoint | null;
  destination?: LocationPoint | null;
  driverLocation?: { lat: number; lng: number; heading?: number } | null;
  nearbyDrivers?: Driver[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
  onError?: (error: string) => void;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  pickup,
  destination,
  driverLocation,
  nearbyDrivers = [],
  onMapClick,
  className = 'h-full w-full',
  zoom = 13,
  onError
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeBackingPolylineRef = useRef<google.maps.Polyline | null>(null);

  // Markers
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);

  // Center coords
  const centerLat = pickup?.lat || 13.0827;
  const centerLng = pickup?.lng || 80.2707;

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;

    // Listen for auth failure from Google Maps SDK
    (window as any).gm_authFailure = () => {
      const err = 'Google Maps API Key Authentication Failed. Please verify that your API key is valid and has Maps JavaScript API enabled.';
      setLoadError(err);
      if (onError) onError(err);
    };

    loadGoogleMapsScript()
      .then((gMaps) => {
        if (isCancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new gMaps.Map(mapContainerRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: zoom,
            styles: UBER_DARK_MAP_STYLES,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy'
          });

          mapInstanceRef.current = map;

          // Map click handler
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng && onMapClick) {
              onMapClick(e.latLng.lat(), e.latLng.lng());
            }
          });
        }

        setIsLoaded(true);
      })
      .catch((err) => {
        if (isCancelled) return;
        const msg = err.message || 'Failed to load Google Maps';
        setLoadError(msg);
        if (onError) onError(msg);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Traffic Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(window as any).google?.maps) return;

    if (trafficEnabled) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [trafficEnabled]);

  // Update Pickup & Destination Markers and Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const gMaps = (window as any).google?.maps;
    if (!map || !gMaps || !isLoaded) return;

    // 1. Pickup Marker
    if (pickup) {
      const pickupIconSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="#06110c" stroke="#10f575" stroke-width="3"/>
          <circle cx="18" cy="18" r="6" fill="#10f575"/>
        </svg>
      `)}`;

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new gMaps.Marker({
          map,
          position: { lat: pickup.lat, lng: pickup.lng },
          title: pickup.name || 'Pickup',
          icon: {
            url: pickupIconSvg,
            scaledSize: new gMaps.Size(36, 36),
            anchor: new gMaps.Point(18, 18)
          }
        });
      } else {
        pickupMarkerRef.current.setPosition({ lat: pickup.lat, lng: pickup.lng });
        pickupMarkerRef.current.setMap(map);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
    }

    // 2. Destination Marker
    if (destination) {
      const destIconSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="14" fill="#06110c" stroke="#f43f5e" stroke-width="3"/>
          <rect x="14" y="14" width="10" height="10" rx="2" fill="#f43f5e"/>
        </svg>
      `)}`;

      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = new gMaps.Marker({
          map,
          position: { lat: destination.lat, lng: destination.lng },
          title: destination.name || 'Destination',
          icon: {
            url: destIconSvg,
            scaledSize: new gMaps.Size(38, 38),
            anchor: new gMaps.Point(19, 19)
          }
        });
      } else {
        destinationMarkerRef.current.setPosition({ lat: destination.lat, lng: destination.lng });
        destinationMarkerRef.current.setMap(map);
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    // 3. Directions / Route Drawing
    if (pickup && destination) {
      const directionsService = new gMaps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: pickup.lat, lng: pickup.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: gMaps.TravelMode.DRIVING
        },
        (result: any, status: any) => {
          if (status === gMaps.DirectionsStatus.OK && result.routes?.length > 0) {
            const path = result.routes[0].overview_path;

            // Remove previous polylines
            if (routePolylineRef.current) routePolylineRef.current.setMap(null);
            if (routeBackingPolylineRef.current) routeBackingPolylineRef.current.setMap(null);

            // Backing glowing line (Uber lime aura)
            routeBackingPolylineRef.current = new gMaps.Polyline({
              path,
              geodesic: true,
              strokeColor: '#10f575',
              strokeOpacity: 0.35,
              strokeWeight: 9,
              map
            });

            // Primary sharp route line
            routePolylineRef.current = new gMaps.Polyline({
              path,
              geodesic: true,
              strokeColor: '#10f575',
              strokeOpacity: 0.95,
              strokeWeight: 4.5,
              map
            });

            // Adjust bounds to fit route nicely
            const bounds = new gMaps.LatLngBounds();
            path.forEach((pt: any) => bounds.extend(pt));
            map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
          } else {
            // Fallback straight line if directions routing fails
            const straightPath = [
              { lat: pickup.lat, lng: pickup.lng },
              { lat: (pickup.lat + destination.lat) / 2 + 0.003, lng: (pickup.lng + destination.lng) / 2 - 0.003 },
              { lat: destination.lat, lng: destination.lng }
            ];

            if (routePolylineRef.current) routePolylineRef.current.setMap(null);
            routePolylineRef.current = new gMaps.Polyline({
              path: straightPath,
              strokeColor: '#10f575',
              strokeOpacity: 0.9,
              strokeWeight: 4,
              map
            });

            const bounds = new gMaps.LatLngBounds();
            bounds.extend(straightPath[0]);
            bounds.extend(straightPath[2]);
            map.fitBounds(bounds, 80);
          }
        }
      );
    } else {
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
      if (routeBackingPolylineRef.current) routeBackingPolylineRef.current.setMap(null);

      if (pickup) {
        map.panTo({ lat: pickup.lat, lng: pickup.lng });
        map.setZoom(14);
      }
    }
  }, [pickup, destination, isLoaded]);

  // Update Live Driver Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const gMaps = (window as any).google?.maps;
    if (!map || !gMaps || !isLoaded) return;

    if (driverLocation) {
      const heading = driverLocation.heading || 0;
      const bikeIconSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="18" fill="#06110c" stroke="#10f575" stroke-width="2.5"/>
          <g transform="translate(10, 10) rotate(${heading} 11 11)">
            <path d="M4 14a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm14 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#10f575"/>
            <path d="M12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-2.5 7.5l-2-2 3-2.5 1.5 2h3" stroke="#10f575" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </svg>
      `)}`;

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new gMaps.Marker({
          map,
          position: { lat: driverLocation.lat, lng: driverLocation.lng },
          title: 'Captain Live Location',
          icon: {
            url: bikeIconSvg,
            scaledSize: new gMaps.Size(42, 42),
            anchor: new gMaps.Point(21, 21)
          }
        });
      } else {
        driverMarkerRef.current.setPosition({ lat: driverLocation.lat, lng: driverLocation.lng });
        driverMarkerRef.current.setIcon({
          url: bikeIconSvg,
          scaledSize: new gMaps.Size(42, 42),
          anchor: new gMaps.Point(21, 21)
        });
        driverMarkerRef.current.setMap(map);
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
    }
  }, [driverLocation, isLoaded]);

  // Update Nearby Drivers Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const gMaps = (window as any).google?.maps;
    if (!map || !gMaps || !isLoaded) return;

    // Clear old nearby markers
    nearbyMarkersRef.current.forEach((m) => m.setMap(null));
    nearbyMarkersRef.current = [];

    const miniBikeSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
        <circle cx="17" cy="17" r="14" fill="#0a1a13" stroke="#05d668" stroke-width="2"/>
        <circle cx="11" cy="20" r="3" fill="#10f575"/>
        <circle cx="23" cy="20" r="3" fill="#10f575"/>
        <path d="M14 11h3l2 4h4" stroke="#10f575" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)}`;

    nearbyDrivers.forEach((driver) => {
      const marker = new gMaps.Marker({
        map,
        position: { lat: driver.location.lat, lng: driver.location.lng },
        title: `${driver.name} (⭐ ${driver.rating})`,
        icon: {
          url: miniBikeSvg,
          scaledSize: new gMaps.Size(34, 34),
          anchor: new gMaps.Point(17, 17)
        }
      });
      nearbyMarkersRef.current.push(marker);
    });
  }, [nearbyDrivers, isLoaded]);

  // Control Handlers
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const current = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(current + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const current = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(current - 1);
    }
  }, []);

  const handleCenterOnPickup = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: centerLat, lng: centerLng });
      mapInstanceRef.current.setZoom(15);
    }
  }, [centerLat, centerLng]);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-forest-950 ${className}`}>
      {/* Google Maps Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Uber Map HUD Controls */}
      <div className="absolute right-3.5 top-3.5 z-20 flex flex-col gap-2">
        {/* Recenter Button */}
        <button
          onClick={handleCenterOnPickup}
          title="Recenter Map"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-900/90 text-slate-200 backdrop-blur-md border border-white/10 shadow-lg hover:bg-forest-800 hover:text-white transition-all active:scale-95"
        >
          <Crosshair className="h-4 w-4 text-velo-lime" />
        </button>

        {/* Traffic Layer Toggle */}
        <button
          onClick={() => setTrafficEnabled(!trafficEnabled)}
          title={trafficEnabled ? 'Hide Live Traffic' : 'Show Live Traffic'}
          className={`flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md border shadow-lg transition-all active:scale-95 ${
            trafficEnabled
              ? 'bg-velo-lime text-forest-950 border-velo-lime font-bold'
              : 'bg-forest-900/90 text-slate-200 border-white/10 hover:bg-forest-800'
          }`}
        >
          <Layers className="h-4 w-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl bg-forest-900/90 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-9 items-center justify-center text-slate-200 hover:bg-forest-800 hover:text-white transition-colors border-b border-white/5 active:scale-95"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-9 items-center justify-center text-slate-200 hover:bg-forest-800 hover:text-white transition-colors active:scale-95"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Map Engine Badge */}
      <div className="pointer-events-none absolute bottom-3.5 left-3.5 z-20 flex items-center gap-2 rounded-xl bg-forest-950/85 px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md border border-white/10 shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">Google Maps Engine</span>
        <span className="text-slate-500">&bull;</span>
        <span className="text-velo-lime">Dark Uber Theme</span>
        {trafficEnabled && (
          <span className="rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-300">
            TRAFFIC ON
          </span>
        )}
      </div>
    </div>
  );
};

