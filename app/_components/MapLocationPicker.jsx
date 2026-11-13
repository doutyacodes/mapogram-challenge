"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Crosshair } from 'lucide-react';
import { useLeafletMap } from '@/components/map/leaflet/useLeafletMap';
import { useMapMarker } from '@/components/map/leaflet/useMapMarker';
import PlaceSearchInput from '@/components/map/leaflet/PlaceSearchInput';
import MapTypeControls from '@/components/map/controls/MapTypeControls';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi

const toPosition = (latitude, longitude) =>
  latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : null;

const MapLocationPicker = ({
  latitude,
  longitude,
  onLocationChange,
  className = ""
}) => {
  const [markerPosition, setMarkerPosition] = useState(() => toPosition(latitude, longitude));

  const setLocation = useCallback((lat, lng) => {
    setMarkerPosition({ lat, lng });
    // Call the parent callback with the new coordinates
    onLocationChange(lat.toString(), lng.toString());
  }, [onLocationChange]);

  const initialPosition = toPosition(latitude, longitude);
  const { containerRef, map } = useLeafletMap({
    center: initialPosition ?? DEFAULT_CENTER,
    zoom: initialPosition ? 15 : 10,
    maxZoom: 19,
    zoomControl: 'bottomright',
    restrictToWorld: false,
    // Click anywhere on the map to place the marker
    onClick: (e) => setLocation(e.latlng.lat, e.latlng.lng),
  });

  // Draggable marker (replaces <Marker draggable onDragEnd>)
  useMapMarker(map, markerPosition, {
    draggable: true,
    onDragEnd: (latLng) => setLocation(latLng.lat, latLng.lng),
  });

  // Update marker position when props change
  useEffect(() => {
    const next = toPosition(latitude, longitude);
    if (!next) return;
    setMarkerPosition(next);
    map?.panTo([next.lat, next.lng]);
  }, [latitude, longitude, map]);

  const focus = (lat, lng, zoom = 15) => {
    map?.setView([lat, lng], zoom);
  };

  // Place selected from search suggestions (replaces Places Autocomplete / Geocoder)
  const handlePlaceSelect = (place) => {
    setLocation(place.lat, place.lng);
    focus(place.lat, place.lng);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation(lat, lng);
          focus(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unable to get your current location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location <MapPin className="h-4 w-4 inline text-red-800 ml-1" />
      </label>

      {/* Search and Current Location Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          <PlaceSearchInput
            onSelect={handlePlaceSelect}
            near={markerPosition ?? undefined}
            placeholder="Search for a location... (try typing 'India' or 'New York')"
          />
        </div>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2 whitespace-nowrap"
        >
          <Crosshair className="h-4 w-4" />
          Current Location
        </button>
      </div>

      {/* Map Container */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div ref={containerRef} style={{ width: '100%', height: '400px', borderRadius: '8px' }} />
        <MapTypeControls mapRef={map} />
      </div>

      {/* Coordinates Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="display-latitude" className="block text-xs text-gray-500 mb-1">
            Latitude
          </label>
          <input
            type="text"
            id="display-latitude"
            value={markerPosition ? markerPosition.lat.toFixed(6) : ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="Click on map to set location"
          />
        </div>
        <div>
          <label htmlFor="display-longitude" className="block text-xs text-gray-500 mb-1">
            Longitude
          </label>
          <input
            type="text"
            id="display-longitude"
            value={markerPosition ? markerPosition.lng.toFixed(6) : ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="Click on map to set location"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">How to use:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Type in the search box to see location suggestions</li>
          <li>Click anywhere on the map to place a marker</li>
          <li>Drag the marker to fine-tune the location</li>
          <li>Use &quot;Current Location&quot; to auto-detect your position</li>
        </ul>
      </div>
    </div>
  );
};

export default MapLocationPicker;
