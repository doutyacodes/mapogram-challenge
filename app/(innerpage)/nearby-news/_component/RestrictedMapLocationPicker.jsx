"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useLeafletMap } from '@/components/map/leaflet/useLeafletMap';
import { useMapMarker } from '@/components/map/leaflet/useMapMarker';
import PlaceSearchInput from '@/components/map/leaflet/PlaceSearchInput';
import MapTypeControls from '@/components/map/controls/MapTypeControls';
import { createDotIcon, getLeaflet } from '@/utils/map/leaflet';
import { haversineMeters } from '@/utils/map/geometry';

// Stable icon factory for the "you are here" dot (useMapMarker calls it once)
const createUserLocationIcon = (L) => createDotIcon(L, { color: '#3B82F6', size: 20 });

const RestrictedMapLocationPicker = ({
  latitude,
  longitude,
  onLocationChange,
  className = "",
  radiusKm = 10, // Default 10km radius
  isReadOnly = false // Add this new prop
}) => {
  const [userCurrentLocation, setUserCurrentLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const [markerPosition, setMarkerPosition] = useState(
    latitude && longitude
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      : null
  );

  const [validationError, setValidationError] = useState('');
  const [isWithinRadius, setIsWithinRadius] = useState(true);

  const radiusInMeters = radiusKm * 1000;

  // Validate if position is within radius
  const validatePosition = useCallback((lat, lng) => {
    if (!userCurrentLocation) return false;
    return haversineMeters(userCurrentLocation.lat, userCurrentLocation.lng, lat, lng) <= radiusInMeters;
  }, [userCurrentLocation, radiusInMeters]);

  const showTemporaryError = (message) => {
    setValidationError(message);
    setTimeout(() => setValidationError(''), 3000);
  };

  const requestLocation = useCallback((maximumAge) => {
    if (!navigator.geolocation) {
      setIsGettingLocation(false);
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsGettingLocation(false);
        setLocationError(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);

        let errorMessage = 'Unable to get your current location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access to use this feature.';
            setLocationPermissionDenied(true);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge,
      }
    );
  }, []);

  // Get user's current location once on mount
  useEffect(() => {
    requestLocation(60000);
  }, [requestLocation]);

  // An existing marker (edit mode) is checked once the user's location is known
  useEffect(() => {
    if (!userCurrentLocation || !markerPosition) return;
    const isValid = validatePosition(markerPosition.lat, markerPosition.lng);
    setIsWithinRadius(isValid);
    if (!isValid) setValidationError(`Selected location is outside the ${radiusKm}km allowed radius`);
    // only when the user's location arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCurrentLocation]);

  // Handle map click with validation
  const handleMapClick = (event) => {
    if (isReadOnly || !userCurrentLocation) return;
    const { lat, lng } = event.latlng;

    if (validatePosition(lat, lng)) {
      setMarkerPosition({ lat, lng });
      setValidationError('');
      setIsWithinRadius(true);
      onLocationChange(lat.toString(), lng.toString());
    } else {
      setIsWithinRadius(false);
      showTemporaryError(`Please select a location within ${radiusKm}km of your current position`);
    }
  };

  const mapReady = !isGettingLocation && !locationError && Boolean(userCurrentLocation);
  const { containerRef, map } = useLeafletMap({
    enabled: mapReady, // the map container only renders once the location is known
    center: userCurrentLocation,
    zoom: 12,
    minZoom: 12, // Prevent too much zoom out
    maxZoom: 20,
    zoomControl: 'bottomright',
    restrictToWorld: false,
    onClick: handleMapClick,
  });

  // Radius circle + keep the view around it (50% padding beyond the radius)
  useEffect(() => {
    const L = getLeaflet();
    if (!map || !L || !userCurrentLocation) return;
    const { lat, lng } = userCurrentLocation;

    const circle = L.circle([lat, lng], {
      radius: radiusInMeters,
      color: '#3B82F6',
      opacity: 0.8,
      weight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(map);

    const paddedRadiusInMeters = radiusInMeters * 1.5;
    const latOffset = paddedRadiusInMeters / 111320; // 1 degree lat ≈ 111.32 km
    const lngOffset = paddedRadiusInMeters / (111320 * Math.cos(lat * Math.PI / 180));
    map.setMaxBounds([[lat - latOffset, lng - lngOffset], [lat + latOffset, lng + lngOffset]]);

    return () => circle.remove();
  }, [map, userCurrentLocation, radiusInMeters]);

  // User's current location marker
  useMapMarker(map, userCurrentLocation, {
    title: 'Your current location',
    createIcon: createUserLocationIcon,
  });

  // Selected location marker (draggable unless read-only)
  const selectedMarkerRef = useMapMarker(map, markerPosition && isWithinRadius ? markerPosition : null, {
    title: 'Selected location',
    draggable: !isReadOnly,
    onDragEnd: (latLng) => {
      if (!userCurrentLocation) return;
      const { lat, lng } = latLng;
      if (validatePosition(lat, lng)) {
        setMarkerPosition({ lat, lng });
        setValidationError('');
        setIsWithinRadius(true);
        onLocationChange(lat.toString(), lng.toString());
      } else {
        // Snap back to the last valid position
        if (markerPosition) selectedMarkerRef.current?.setLatLng([markerPosition.lat, markerPosition.lng]);
        showTemporaryError(`Marker must be within ${radiusKm}km of your current location`);
      }
    },
  });

  // Place selected from search suggestions (replaces Places Autocomplete)
  const handlePlaceSelect = (place) => {
    if (!userCurrentLocation) return false;
    if (!validatePosition(place.lat, place.lng)) {
      setIsWithinRadius(false);
      showTemporaryError(`Selected location is outside the ${radiusKm}km allowed radius`);
      return false;
    }
    setMarkerPosition({ lat: place.lat, lng: place.lng });
    setValidationError('');
    setIsWithinRadius(true);
    onLocationChange(place.lat.toString(), place.lng.toString());
    map?.setView([place.lat, place.lng], 16);
    return true;
  };

  // Retry getting location
  const retryLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);
    setLocationPermissionDenied(false);
    requestLocation(0); // Force fresh location
  };

  // Show loading state while getting location
  if (isGettingLocation) {
    return (
      <div className={`space-y-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location <MapPin className="h-4 w-4 inline text-red-800 ml-1" />
        </label>
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Loader className="h-8 w-8 animate-spin text-red-600 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Getting your location...</p>
          <p className="text-sm text-gray-500 text-center max-w-md">
            We need your current location to ensure posts are made within the allowed {radiusKm}km radius.
          </p>
        </div>
      </div>
    );
  }

  // Show error state if location access failed
  if (locationError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location <MapPin className="h-4 w-4 inline text-red-800 ml-1" />
        </label>
        <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-lg border-2 border-dashed border-red-300">
          <AlertCircle className="h-8 w-8 text-red-600 mb-4" />
          <p className="text-lg font-medium text-red-700 mb-2">Location Access Required</p>
          <p className="text-sm text-red-600 text-center max-w-md mb-4">
            {locationError}
          </p>
          {!locationPermissionDenied && (
            <button
              onClick={retryLocation}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          {locationPermissionDenied && (
            <div className="text-xs text-red-500 text-center max-w-md">
              <p>Please enable location access in your browser settings and refresh the page.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location <MapPin className="h-4 w-4 inline text-red-800 ml-1" />
        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Within {radiusKm}km radius only
        </span>
      </label>

      {/* Validation Status */}
      {markerPosition && (
        <div className={`flex items-center gap-2 p-2 rounded-md ${isWithinRadius ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isWithinRadius ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Location is within allowed radius</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Location is outside allowed radius</span>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {validationError}
          </div>
        </div>
      )}

      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <PlaceSearchInput
            onSelect={handlePlaceSelect}
            near={userCurrentLocation}
            disabled={isReadOnly}
            showSearchButton={false}
            placeholder={isReadOnly ? "Location editing disabled" : `Search within ${radiusKm}km of your location...`}
            inputClassName="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

        {/* Read-only notice for edit mode */}
        {isReadOnly && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>
                Location cannot be changed in edit mode. If you need to change the location,
                please delete this article and create a new one.
              </span>
            </div>
          </div>
        )}

      {/* Map Container */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div ref={containerRef} style={{ width: '100%', height: '450px', borderRadius: '8px' }} />
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
            value={markerPosition && isWithinRadius ? markerPosition.lat.toFixed(6) : ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="Select location within radius"
          />
        </div>
        <div>
          <label htmlFor="display-longitude" className="block text-xs text-gray-500 mb-1">
            Longitude
          </label>
          <input
            type="text"
            id="display-longitude"
            value={markerPosition && isWithinRadius ? markerPosition.lng.toFixed(6) : ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="Select location within radius"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
        <p className="font-medium mb-1 text-blue-700">Location Guidelines:</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-600">
          <li>You can only select locations within {radiusKm}km of your current position</li>
          <li>The blue circle shows your allowed area</li>
          <li>Your current location is marked with a blue dot</li>
          <li>Search for places or click anywhere within the blue circle</li>
          <li>Drag the red marker to fine-tune your selection</li>
        </ul>
      </div>
    </div>
  );
};

export default RestrictedMapLocationPicker;
