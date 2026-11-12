"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Crosshair, AlertCircle } from 'lucide-react';
import { useLeafletMap } from '@/components/map/leaflet/useLeafletMap';
import { useMapMarker } from '@/components/map/leaflet/useMapMarker';
import PlaceSearchInput from '@/components/map/leaflet/PlaceSearchInput';
import MapTypeControls from '@/components/map/controls/MapTypeControls';
import { getLeaflet } from '@/utils/map/leaflet';
import { geojsonBounds, pointInGeoJSON, toLatLngPolygons, worldMaskRings } from '@/utils/map/geometry';

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const BoundaryRestrictedLocationPicker = ({
  latitude,
  longitude,
  communityId, // NEW: Community ID to fetch geofence
  onLocationChange,
  className = ""
}) => {
  const [geofence, setGeofence] = useState(null);
  const [isLoadingGeofence, setIsLoadingGeofence] = useState(true);
  const [geofenceError, setGeofenceError] = useState(null);

  const [markerPosition, setMarkerPosition] = useState(
    latitude && longitude
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      : null
  );

  // Fetch geofence data
  useEffect(() => {
    const fetchGeofence = async () => {
      if (!communityId) {
        setGeofenceError('No community ID provided');
        setIsLoadingGeofence(false);
        return;
      }

      try {
        setIsLoadingGeofence(true);
        const response = await fetch(`/api/communities/${communityId}/geofence`);

        if (!response.ok) {
          throw new Error('Failed to fetch geofence');
        }

        const data = await response.json();

        if (data.geofence && data.geofence.geojson) {
          setGeofence(data.geofence);
        } else {
          setGeofenceError('No geofence data available for this community');
        }
      } catch (error) {
        console.error('Error fetching geofence:', error);
        setGeofenceError('Failed to load boundary data');
      } finally {
        setIsLoadingGeofence(false);
      }
    };

    fetchGeofence();
  }, [communityId]);

  // Check if a point is inside the geofence (replaces geometry.poly.containsLocation)
  const isPointInGeofence = (point) =>
    Boolean(geofence?.geojson) && pointInGeoJSON(point.lat, point.lng, geofence.geojson);

  const geofenceCenter =
    geofence?.center_lat && geofence?.center_lng
      ? { lat: parseFloat(geofence.center_lat), lng: parseFloat(geofence.center_lng) }
      : null;

  // Handle map click with boundary validation
  const handleMapClick = (event) => {
    const newPosition = { lat: event.latlng.lat, lng: event.latlng.lng };

    // Check if click is within geofence
    if (!isPointInGeofence(newPosition)) {
      alert('Please select a location within the community boundary (highlighted area).');
      return;
    }

    setMarkerPosition(newPosition);
    onLocationChange(newPosition.lat.toString(), newPosition.lng.toString());
  };

  const { containerRef, map } = useLeafletMap({
    enabled: !isLoadingGeofence && Boolean(geofence), // container renders once the boundary is loaded
    center: markerPosition ?? geofenceCenter ?? DEFAULT_CENTER,
    zoom: markerPosition ? 15 : 10,
    maxZoom: 19,
    zoomControl: 'bottomright',
    restrictToWorld: false,
    onClick: handleMapClick,
  });

  // Boundary outline, grey mask outside it, fit + restrict the view
  useEffect(() => {
    const L = getLeaflet();
    if (!map || !L || !geofence?.geojson) return;

    // Grayed out area outside boundary
    const mask = L.polygon(worldMaskRings(geofence.geojson), {
      stroke: false,
      fillColor: '#1f2937',
      fillOpacity: 0.5,
      interactive: false,
    }).addTo(map);

    // Community boundary
    const outlines = toLatLngPolygons(geofence.geojson).map((rings) =>
      L.polygon(rings, {
        color: '#16a34a',
        opacity: 1,
        weight: 3,
        fill: false,
        interactive: false,
      }).addTo(map)
    );

    const bounds = geojsonBounds(geofence.geojson);
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
      // Extend bounds ~20% on each side for some freedom while panning
      const [[south, west], [north, east]] = bounds;
      const latDiff = (north - south) * 0.2;
      const lngDiff = (east - west) * 0.2;
      map.setMaxBounds([[south - latDiff, west - lngDiff], [north + latDiff, east + lngDiff]]);
    }

    return () => {
      mask.remove();
      outlines.forEach((polygon) => polygon.remove());
    };
  }, [map, geofence]);

  // Update marker position when props change (only if within boundary)
  useEffect(() => {
    if (latitude && longitude && geofence) {
      const newPos = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      if (pointInGeoJSON(newPos.lat, newPos.lng, geofence.geojson)) {
        setMarkerPosition(newPos);
        map?.panTo([newPos.lat, newPos.lng]);
      }
    }
  }, [latitude, longitude, geofence, map]);

  // Draggable marker: follows the drag, validated on drop
  useMapMarker(map, markerPosition, {
    draggable: true,
    onDrag: (latLng) => setMarkerPosition({ lat: latLng.lat, lng: latLng.lng }),
    onDragEnd: (latLng) => {
      const newPosition = { lat: latLng.lat, lng: latLng.lng };
      if (!isPointInGeofence(newPosition)) {
        alert('Please place the marker within the community boundary (inside the green border).');
        // Reset to center of boundary if invalid, else remove the marker
        setMarkerPosition(geofenceCenter);
        return;
      }
      setMarkerPosition(newPosition);
      onLocationChange(newPosition.lat.toString(), newPosition.lng.toString());
    },
  });

  // Place selected from search suggestions (replaces Places Autocomplete / Geocoder)
  const handlePlaceSelect = (place) => {
    const newPosition = { lat: place.lat, lng: place.lng };
    if (!isPointInGeofence(newPosition)) {
      alert('The selected location is outside the community boundary. Please search for a location within the highlighted area.');
      return false;
    }
    setMarkerPosition(newPosition);
    onLocationChange(place.lat.toString(), place.lng.toString());
    map?.setView([place.lat, place.lng], 15);
    return true;
  };

  // Get current location with boundary validation
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = { lat: position.coords.latitude, lng: position.coords.longitude };

          // Check if current location is within geofence
          if (!isPointInGeofence(newPosition)) {
            alert('Your current location is outside the community boundary. Please select a location within the highlighted area manually.');
            // Still pan to show where user is, but don't set marker
            map?.setView([newPosition.lat, newPosition.lng], 12);
            return;
          }

          setMarkerPosition(newPosition);
          onLocationChange(newPosition.lat.toString(), newPosition.lng.toString());
          map?.setView([newPosition.lat, newPosition.lng], 15);
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

  if (isLoadingGeofence) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading boundary data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (geofenceError || !geofence) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Unable to load boundary</p>
            <p className="text-red-600 text-sm">{geofenceError || 'No boundary data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location <MapPin className="h-4 w-4 inline text-red-800 ml-1" />
      </label>

      {/* Boundary info */}
      {geofence.name && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-green-800">
            Please select a location within <span className="font-medium">{geofence.name}</span> boundary (highlighted in green)
          </p>
        </div>
      )}

      {/* Search and Current Location Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          <PlaceSearchInput
            onSelect={handlePlaceSelect}
            near={geofenceCenter ?? undefined}
            placeholder="Search within community boundary..."
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
            placeholder="Click on map within boundary"
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
            placeholder="Click on map within boundary"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">How to use:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>The green highlighted area shows your community boundary</li>
          <li>You can only select locations within this boundary</li>
          <li>Search, click, or drag the marker within the green area</li>
          <li>Areas outside the boundary are disabled (grayed out)</li>
        </ul>
      </div>
    </div>
  );
};

export default BoundaryRestrictedLocationPicker;
