'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSavedCustomerProfile } from '@/lib/customerIdentity';

// Update these to your exact copied coordinates from Google Maps
const RESTAURANT_COORDS: [number, number] = [6.8018, 79.9227];

// Custom Red Store Marker with Restaurant Icon
const restaurantIcon = L.divIcon({
  className: 'custom-restaurant-pin',
  html: `
    <div style="
      background-color: #e52a20;
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">🏪</span>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

// Custom Gold/Amber Customer Delivery Marker with Home/User Icon
const customerIcon = L.divIcon({
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

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLocation: (distanceKm: number, lat: number, lng: number) => void;
}

function MapController({
  userLat,
  userLng,
  routeCoords,
  onLocationSelect,
}: {
  userLat: number | null;
  userLng: number | null;
  routeCoords: [number, number][];
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onLocationSelect]);

  useEffect(() => {
    if (userLat !== null && userLng !== null) {
      const bounds = L.latLngBounds([
        RESTAURANT_COORDS,
        [userLat, userLng],
      ]);

      routeCoords.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, userLat, userLng, routeCoords]);

  return null;
}

export default function LocationPickerModal({ isOpen, onClose, onConfirmLocation }: LocationPickerProps) {
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestGPSLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionNotice('⚠️ Geolocation is not supported by your browser. Tap on the map to set location manually.');
      return;
    }

    setLoadingDistance(true);
    setPermissionNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLat(pos.coords.latitude);
        setSelectedLng(pos.coords.longitude);
        setPermissionNotice(null);
      },
      (err) => {
        setLoadingDistance(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionNotice('🔒 Location permission denied. Allow access in settings or tap the map manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setPermissionNotice('📡 GPS is turned off on your device. Please enable Location services.');
            break;
          case err.TIMEOUT:
            setPermissionNotice('⏱️ GPS request timed out. Please tap directly on the map.');
            break;
          default:
            setPermissionNotice('⚠️ Unable to detect GPS location. Tap directly on the map.');
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
        setSelectedLat(savedProfile.lat);
        setSelectedLng(savedProfile.lng);
      } else if (selectedLat === null || selectedLng === null) {
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
          }
        } else {
          setErrorMsg('Could not calculate driving distance. Please tap another position.');
        }
      } catch (err) {
        console.error('OSRM API Error:', err);
        setErrorMsg('Failed to calculate route. Please tap manually on the map.');
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121212] border border-[#292929] rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-[#ffbd18]">Delivery Location & Map Route</h3>
            <p className="text-xs text-gray-400">Tap on the map or detect GPS to place your delivery pin</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>

        {/* Permission Banner */}
        {permissionNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center justify-between gap-2">
            <span>{permissionNotice}</span>
            <button
              onClick={requestGPSLocation}
              className="px-3 py-1 bg-[#ffbd18] text-[#070707] font-extrabold rounded-lg hover:bg-[#e0a410] flex-shrink-0 text-[11px]"
            >
              Retry GPS
            </button>
          </div>
        )}

        {/* GPS Button */}
        <button
          type="button"
          onClick={requestGPSLocation}
          className="w-full py-2.5 bg-[#181818] border border-[#333] hover:border-[#ffbd18] text-xs font-bold uppercase rounded-xl transition-all text-[#ffbd18] flex items-center justify-center gap-2"
        >
          <span>🎯</span> Detect My Current GPS Location
        </button>

        {/* Map Canvas */}
        <div className="h-80 w-full rounded-xl overflow-hidden border border-[#222] relative">
          <MapContainer
            center={RESTAURANT_COORDS}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Red Restaurant Pin */}
            <Marker position={RESTAURANT_COORDS} icon={restaurantIcon} />

            {/* Gold Customer Pin */}
            {selectedLat !== null && selectedLng !== null && (
              <Marker position={[selectedLat, selectedLng]} icon={customerIcon} />
            )}

            {/* Route Polyline */}
            {routePolyline.length > 0 && (
              <Polyline positions={routePolyline} color="#ffbd18" weight={5} opacity={0.8} />
            )}

            <MapController
              userLat={selectedLat}
              userLng={selectedLng}
              routeCoords={routePolyline}
              onLocationSelect={(lat, lng) => {
                setSelectedLat(lat);
                setSelectedLng(lng);
                setPermissionNotice(null);
              }}
            />
          </MapContainer>
        </div>

        {/* Distance Info */}
        {loadingDistance && <p className="text-xs text-gray-400 animate-pulse">Calculating road route...</p>}

        {distanceKm !== null && !loadingDistance && (
          <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            distanceKm <= 5 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span>Road Distance: {distanceKm.toFixed(1)} km</span>
            <span>{distanceKm <= 5 ? `Est. Delivery Fee: LKR ${Math.ceil(distanceKm) * 100}` : 'Out of delivery range'}</span>
          </div>
        )}

        {errorMsg && !loadingDistance && <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
            className="px-6 py-2.5 bg-[#ffbd18] text-[#070707] text-xs font-black uppercase rounded-xl hover:bg-[#e0a410] disabled:opacity-50"
          >
            Confirm Location
          </button>
        </div>

      </div>
    </div>
  );
}