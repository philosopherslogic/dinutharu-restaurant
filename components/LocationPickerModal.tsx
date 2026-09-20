'use client';

import { useState, useEffect, useRef, FC } from 'react';
import dynamic from 'next/dynamic';
import { getSavedCustomerProfile } from '@/lib/customerIdentity';

const RESTAURANT_COORDS: [number, number] = [6.8221006502870924, 79.92155467055221];

function ThickGoldArrow() {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-10 h-10 sm:w-14 sm:h-14 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGradientModal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE072"/>
          <stop offset="40%" stopColor="#FFBD18"/>
          <stop offset="75%" stopColor="#E0A410"/>
          <stop offset="100%" stopColor="#996A00"/>
        </linearGradient>

        <filter id="goldGlowModal" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#goldGlowModal)">
        <path 
          d="M 80 15 
             L 52 43 
             L 62 53 
             L 20 60 
             L 27 18 
             L 37 28 
             L 65 0 
             Z" 
          fill="url(#goldGradientModal)" 
          stroke="#050505" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLocation: (distanceKm: number, lat: number, lng: number) => void;
}

interface MapContentProps {
  selectedLat: number | null;
  selectedLng: number | null;
  routePolyline: [number, number][];
  onLocationSelect: (lat: number, lng: number) => void;
  leafletIcons: { restaurant: any; customer: any };
  isManualTapRef: React.MutableRefObject<boolean>;
}

const LeafletMapInner: FC<MapContentProps> = ({
  selectedLat,
  selectedLng,
  routePolyline,
  onLocationSelect,
  leafletIcons,
  isManualTapRef,
}) => {
  const { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } = require('react-leaflet');
  const L = require('leaflet');

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        // Flag as manual tap before triggering coordinate change
        isManualTapRef.current = true;
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function MapBoundsController() {
    const map = useMap();
    useEffect(() => {
      // Only recalculate map zoom bounds if auto-detected or GPS re-detected
      if (!isManualTapRef.current && selectedLat !== null && selectedLng !== null) {
        const bounds = L.latLngBounds([
          RESTAURANT_COORDS,
          [selectedLat, selectedLng],
        ]);
        routePolyline.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }, [map, routePolyline]);
    return null;
  }

  return (
    <MapContainer
      center={RESTAURANT_COORDS}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler />
      <MapBoundsController />

      <Marker position={RESTAURANT_COORDS} icon={leafletIcons.restaurant} />

      {selectedLat !== null && selectedLng !== null && (
        <Marker position={[selectedLat, selectedLng]} icon={leafletIcons.customer} />
      )}

      {routePolyline.length > 0 && (
        <Polyline positions={routePolyline} color="#ffbd18" weight={5} opacity={0.8} />
      )}
    </MapContainer>
  );
};

const DynamicMapContainer = dynamic(() => Promise.resolve(LeafletMapInner), { ssr: false });

const LocationPickerModal: FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onConfirmLocation,
}) => {
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGpsGuide, setShowGpsGuide] = useState(false);
  const [leafletIcons, setLeafletIcons] = useState<{ restaurant: any; customer: any } | null>(null);

  const [activeStep, setActiveStep] = useState<'detect' | 'map' | 'confirm'>('detect');

  // Ref tracking if interaction is a manual tap vs auto/button GPS load
  const isManualTapRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        import('leaflet/dist/leaflet.css');
        
        const restaurant = L.divIcon({
          className: 'custom-restaurant-pin',
          html: `
            <div style="
              background-color: #e52a20;
              width: 42px;
              height: 42px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.6);
              overflow: hidden;
            ">
              <img 
                src="/logo.jpg" 
                alt="DinuTharu Logo" 
                style="
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  object-fit: cover;
                  transform: rotate(45deg);
                " 
              />
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 42],
        });

        const customer = L.divIcon({
          className: 'custom-customer-pin',
          html: `
            <div style="
              background-color: #ffbd18;
              width: 38px;
              height: 38px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #070707;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            ">
              <span style="transform: rotate(45deg); font-size: 18px;">📍</span>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
        });

        setLeafletIcons({ restaurant, customer });
      });
    }
  }, []);

  const requestGPSLocation = () => {
    // Reset tap ref to allow fitBounds to run for GPS auto-center
    isManualTapRef.current = false;

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionNotice('⚠️ Geolocation is not supported by your browser. Tap on the map to set location manually.');
      setActiveStep('map');
      return;
    }

    setLoadingDistance(true);
    setPermissionNotice(null);
    setShowGpsGuide(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLat(pos.coords.latitude);
        setSelectedLng(pos.coords.longitude);
        setPermissionNotice(null);
        setActiveStep('confirm');
      },
      (err) => {
        setLoadingDistance(false);
        setShowGpsGuide(true);
        setActiveStep('map');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionNotice('🔒 Location permission is blocked in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setPermissionNotice('📡 GPS/Location services are turned off on your phone.');
            break;
          case err.TIMEOUT:
            setPermissionNotice('⏱️ GPS request timed out. Please tap directly on the map.');
            break;
          default:
            setPermissionNotice('⚠️ Unable to detect GPS location automatically.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      const savedProfile = getSavedCustomerProfile();
      if (savedProfile && savedProfile.lat && savedProfile.lng) {
        isManualTapRef.current = false;
        setSelectedLat(savedProfile.lat);
        setSelectedLng(savedProfile.lng);
        setActiveStep('confirm');
      } else if (selectedLat === null || selectedLng === null) {
        setActiveStep('detect');
        requestGPSLocation();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedLat === null || selectedLng === null) return;

    const calculateRoadDistance = async () => {
      setLoadingDistance(true);
      setErrorMsg(null);

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_COORDS[1]},${RESTAURANT_COORDS[0]};${selectedLng},${selectedLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const meters = data.routes[0].distance;
          const km = meters / 1000;
          setDistanceKm(km);

          const geojsonCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          setRoutePolyline(geojsonCoords);

          if (km > 5) {
            setErrorMsg(`Selected location is ${km.toFixed(1)} km away via road. We only deliver within 5 km!`);
            setActiveStep('map');
          } else {
            setActiveStep('confirm');
          }
        } else {
          setErrorMsg('Could not calculate driving distance. Please tap another position on the map.');
          setActiveStep('map');
        }
      } catch (err) {
        console.error('OSRM API Error:', err);
        setErrorMsg('Failed to calculate route. Please tap manually on the map.');
        setActiveStep('map');
      } finally {
        setLoadingDistance(false);
      }
    };

    calculateRoadDistance();
  }, [selectedLat, selectedLng]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedLat === null || selectedLng === null || distanceKm === null) return;
    if (distanceKm > 5) {
      alert('Selected location exceeds our 5km delivery radius.');
      return;
    }
    onConfirmLocation(distanceKm, selectedLat, selectedLng);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#121212] border border-[#292929] rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div>
            <span className="text-[10px] text-[#ffbd18] font-black uppercase tracking-widest block">Step-by-Step Delivery Location</span>
            <h3 className="text-lg font-extrabold text-white mt-0.5">Select Delivery Location & View Route</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className={`p-2 rounded-xl border text-center transition-all ${
            activeStep === 'detect' ? 'bg-[#ffbd18]/10 border-[#ffbd18] text-[#ffbd18]' : 'bg-[#070707] border-[#222] text-gray-400'
          }`}>
            <span className="text-[10px] font-black uppercase block">Step 1</span>
            <span className="text-xs font-bold">1. Wait (Auto Location Detection)</span>
          </div>

          <div className={`p-2 rounded-xl border text-center transition-all ${
            activeStep === 'map' ? 'bg-[#ffbd18]/10 border-[#ffbd18] text-[#ffbd18]' : 'bg-[#070707] border-[#222] text-gray-400'
          }`}>
            <span className="text-[10px] font-black uppercase block">Step 2</span>
            <span className="text-xs font-bold">2. Tap on your house (if auto detection is inaccurate)</span>
          </div>

          <div className={`p-2 rounded-xl border text-center transition-all ${
            activeStep === 'confirm' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-[#070707] border-[#222] text-gray-400'
          }`}>
            <span className="text-[10px] font-black uppercase block">Step 3</span>
            <span className="text-xs font-bold">3. Click confirm location button</span>
          </div>
        </div>

        {/* Dynamic Context Guidance Banner */}
        <div className="bg-[#181818] border border-[#2e2e2e] p-3 rounded-xl flex items-center gap-3 shadow-md">
          <span className="text-2xl flex-shrink-0">
            {activeStep === 'detect' ? '🎯' : activeStep === 'map' ? '🗺️' : '✅'}
          </span>
          <div className="text-xs space-y-0.5">
            <p className="font-extrabold text-[#ffbd18] uppercase tracking-wide">
              {activeStep === 'detect' && 'Tap button below to detect GPS'}
              {activeStep === 'map' && 'Tap directly on your house/building on the map'}
              {activeStep === 'confirm' && 'Location detected! Tap "Confirm Location" below'}
            </p>
            <p className="text-gray-300">
              {activeStep === 'detect' && 'Allow browser location access when prompted.'}
              {activeStep === 'map' && 'You can zoom and drag the map to drop the gold pin exact on your doorstep.'}
              {activeStep === 'confirm' && 'Check the distance and estimated fee below, then click confirm.'}
            </p>
          </div>
        </div>

        {/* Location Permission Help */}
        {permissionNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>{permissionNotice}</span>
              <button
                onClick={() => setShowGpsGuide(!showGpsGuide)}
                className="text-[11px] font-bold text-[#ffbd18] underline hover:text-white"
              >
                {showGpsGuide ? 'Hide Instructions' : 'How to Turn On Location?'}
              </button>
            </div>

            {showGpsGuide && (
              <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-gray-300 space-y-2 bg-[#080808] p-3 rounded-lg">
                <p className="font-bold text-[#ffbd18] uppercase">📱 How to Enable Location Access:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="font-bold text-white">🤖 Android (Chrome):</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Tap 🔒 <b>Padlock icon</b> in URL bar.</li>
                      <li>Tap <b>Permissions</b> ➔ <b>Location</b>.</li>
                      <li>Select <b>Allow</b> & refresh page.</li>
                    </ol>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white">🍎 iPhone / iOS (Safari):</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Open iPhone <b>Settings</b> ➔ <b>Privacy & Security</b>.</li>
                      <li>Tap <b>Location Services</b> ➔ Turn ON.</li>
                      <li>Find Safari ➔ Select <b>While Using App</b>.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Detect GPS Button */}
        <div className="relative">
          {activeStep === 'detect' && (
            <div className="absolute -top-10 right-4 z-30 pointer-events-none animate-bounce-diagonal flex items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffbd18] bg-[#070707] px-2 py-0.5 rounded-full border border-[#ffbd18]">STEP 1</span>
              <ThickGoldArrow />
            </div>
          )}
          <button
            type="button"
            onClick={requestGPSLocation}
            className={`w-full py-3 px-4 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 border ${
              activeStep === 'detect' 
                ? 'bg-[#ffbd18] text-[#070707] border-[#ffbd18] shadow-lg shadow-[#ffbd18]/20 ring-2 ring-[#ffbd18]/50' 
                : 'bg-[#181818] border-[#333] hover:border-[#ffbd18] text-[#ffbd18]'
            }`}
          >
            <span>🎯</span> Re-Detect My Current Location
          </button>
        </div>

        {/* Step 2: Interactive Map Canvas */}
        <div className="relative">
          {activeStep === 'map' && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none bg-[#070707]/90 border border-[#ffbd18] text-[#ffbd18] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
              <span>👉 TAP ANYWHERE ON THE MAP</span>
            </div>
          )}

          <div className="h-72 sm:h-80 w-full rounded-xl overflow-hidden border border-[#222] relative">
            {leafletIcons && (
              <DynamicMapContainer
                selectedLat={selectedLat}
                selectedLng={selectedLng}
                routePolyline={routePolyline}
                leafletIcons={leafletIcons}
                isManualTapRef={isManualTapRef}
                onLocationSelect={(lat, lng) => {
                  setSelectedLat(lat);
                  setSelectedLng(lng);
                  setPermissionNotice(null);
                  setActiveStep('confirm');
                }}
              />
            )}
          </div>
        </div>

        {/* Distance Info & Fee Readout */}
        {loadingDistance && <p className="text-xs text-gray-400 animate-pulse text-center">Calculating driving route distance...</p>}

        {distanceKm !== null && !loadingDistance && (
          <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            distanceKm <= 5 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span>Road Distance: {distanceKm.toFixed(2)} km</span>
            <span>
              {distanceKm <= 5 
                ? `Est. Delivery Fee: LKR ${distanceKm <= 0.5 ? 100 : Math.round((100 + ((distanceKm - 0.5) / 4.5) * 250) / 5) * 5}` 
                : 'Out of 5km delivery range'}
            </span>
          </div>
        )}

        {errorMsg && !loadingDistance && <p className="text-xs text-red-400 font-semibold text-center">{errorMsg}</p>}

        {/* Step 3: Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 relative">
          {activeStep === 'confirm' && (
            <div className="absolute -top-10 right-2 z-30 pointer-events-none animate-bounce-diagonal flex items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffbd18] bg-[#070707] px-2 py-0.5 rounded-full border border-[#ffbd18]">CONFIRM HERE</span>
              <ThickGoldArrow />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedLat === null || selectedLng === null || distanceKm === null || distanceKm > 5}
            onClick={handleConfirm}
            className={`px-6 py-3 text-xs font-black uppercase rounded-xl transition-all shadow-lg ${
              selectedLat !== null && selectedLng !== null && distanceKm !== null && distanceKm <= 5
                ? 'bg-[#ffbd18] text-[#070707] hover:bg-[#e0a410] ring-2 ring-[#ffbd18]/50 scale-105'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm Location
          </button>
        </div>

      </div>

      <style jsx global>{`
        @keyframes bounceDiagonal {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-6px, 8px);
          }
        }
        .animate-bounce-diagonal {
          animation: bounceDiagonal 0.7s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LocationPickerModal;