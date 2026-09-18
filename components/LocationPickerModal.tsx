'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Restaurant Coordinates (Bokundara / Piliyandala)
const RESTAURANT_COORDS: [number, number] = [6.8018, 79.9227];

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLocation: (distanceKm: number, lat: number, lng: number) => void;
}

// Map Component that automatically zooms/pans to fit both pins and the road path
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

  // Attach click listener for manually dropping a pin
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onLocationSelect]);

  // Adjust camera bounds whenever user pin or route line updates
  useEffect(() => {
    if (userLat !== null && userLng !== null) {
      const bounds = L.latLngBounds([
        RESTAURANT_COORDS,
        [userLat, userLng],
      ]);

      // Expand bounds if route coordinates exist
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger GPS detection immediately every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        setLoadingDistance(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setSelectedLat(pos.coords.latitude);
            setSelectedLng(pos.coords.longitude);
          },
          (err) => {
            console.warn('Geolocation warning/error:', err.message);
            setLoadingDistance(false);
            setErrorMsg('Could not detect GPS location automatically. Please click on the map to set your pin.');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    }
  }, [isOpen]);

  // Calculate road distance & fetch geometry path from OSRM whenever coordinates update
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
          setErrorMsg('Could not calculate driving distance.');
        }
      } catch (err) {
        console.error('OSRM API Error:', err);
        setErrorMsg('Failed to calculate route distance.');
      } finally {
        setLoadingDistance(false);
      }
    };

    calculateRoadDistance();
  }, [selectedLat, selectedLng]);

  if (!isOpen) return null;

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingDistance(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedLat(pos.coords.latitude);
        setSelectedLng(pos.coords.longitude);
      },
      () => {
        setLoadingDistance(false);
        alert('Unable to retrieve your location. Please drop a pin manually on the map.');
      },
      { enableHighAccuracy: true }
    );
  };

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
            <h3 className="text-lg font-extrabold text-[#ffbd18]">Delivery Location & Road Route</h3>
            <p className="text-xs text-gray-400">Click anywhere on the map to manually set or adjust your delivery pin</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentGPS}
          className="w-full py-2.5 bg-[#181818] border border-[#333] hover:border-[#ffbd18] text-xs font-bold uppercase rounded-xl transition-all text-[#ffbd18] flex items-center justify-center gap-2"
        >
          <span>🎯</span> Re-detect GPS Location
        </button>

        {/* Leaflet Map Canvas */}
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

            {/* Restaurant Fixed Pin */}
            <Marker position={RESTAURANT_COORDS} icon={customIcon} />

            {/* User Selected Delivery Pin */}
            {selectedLat !== null && selectedLng !== null && (
              <Marker position={[selectedLat, selectedLng]} icon={customIcon} />
            )}

            {/* Road Path Highlight Line */}
            {routePolyline.length > 0 && (
              <Polyline positions={routePolyline} color="#ffbd18" weight={5} opacity={0.8} />
            )}

            {/* Camera View Bounds Controller */}
            <MapController
              userLat={selectedLat}
              userLng={selectedLng}
              routeCoords={routePolyline}
              onLocationSelect={(lat, lng) => {
                setSelectedLat(lat);
                setSelectedLng(lng);
              }}
            />
          </MapContainer>
        </div>

        {/* Distance Info & Validation Bar */}
        {loadingDistance && <p className="text-xs text-gray-400 animate-pulse">Detecting location & calculating driving route...</p>}

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