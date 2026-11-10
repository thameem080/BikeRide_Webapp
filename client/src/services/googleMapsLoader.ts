// Google Maps JavaScript API Dynamic Loader & Key Manager

const LOCAL_STORAGE_KEY = 'velo_google_maps_api_key';

let loadPromise: Promise<typeof google.maps> | null = null;

export const getStoredGoogleMapsApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  const localKey = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localKey && localKey.trim()) return localKey.trim();
  
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey && envKey.trim() && !envKey.includes('your_google_maps_api_key')) {
    return envKey.trim();
  }
  return '';
};

export const setStoredGoogleMapsApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  const cleanKey = key.trim();
  if (cleanKey) {
    localStorage.setItem(LOCAL_STORAGE_KEY, cleanKey);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  // Reset load promise so next call reloads with new key
  loadPromise = null;
};

export const hasValidGoogleMapsKey = (): boolean => {
  const key = getStoredGoogleMapsApiKey();
  return Boolean(key && key.length > 10);
};

export const loadGoogleMapsScript = (apiKey?: string): Promise<typeof google.maps> => {
  const keyToUse = apiKey || getStoredGoogleMapsApiKey();

  if (!keyToUse) {
    return Promise.reject(new Error('No Google Maps API Key provided'));
  }

  // Already loaded
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return Promise.resolve((window as any).google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById('google-maps-sdk-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      keyToUse
    )}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if ((window as any).google?.maps) {
        resolve((window as any).google.maps);
      } else {
        reject(new Error('Google Maps SDK loaded, but window.google.maps is undefined'));
      }
    };

    script.onerror = (err) => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script. Check your API key or network.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

// Premium Uber Dark / Night Silver map theme styles for Google Maps
export const UBER_DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#161922' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#161922' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a93a2' }]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#dbe2ee' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6a7382' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#11221a' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2ed573' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#272d3b' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1b1f29' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ba4b5' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3b4356' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2430' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#212634' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10f575' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0b1017' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#405269' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0b1017' }]
  }
];

