import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete, Polygon } from '@react-google-maps/api';
import { MapPin, Search, Crosshair, X, AlertCircle } from 'lucide-react';

const BoundaryRestrictedLocationPicker = ({ 
  latitude, 
  longitude, 
  communityId, // NEW: Community ID to fetch geofence
  onLocationChange, 
  className = "" 
}) => {
    
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const [geofence, setGeofence] = useState(null);
  const [isLoadingGeofence, setIsLoadingGeofence] = useState(true);
  const [geofenceError, setGeofenceError] = useState(null);
  
  const [mapCenter, setMapCenter] = useState({
    lat: latitude ? parseFloat(latitude) : 28.6139,
    lng: longitude ? parseFloat(longitude) : 77.2090
  });
  
  const [markerPosition, setMarkerPosition] = useState(
    latitude && longitude 
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      : null
  );
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);
  
  const libraries = ['places'];
  
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px'
  };
  
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    clickableIcons: true,
    draggableCursor: 'default',
    draggingCursor: 'default',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      }
    ]
  };

  // Polygon styling for the geofence boundary
  const polygonOptions = {
    fillColor: '#22c55e',
    fillOpacity: 0,
    strokeColor: '#16a34a',
    strokeOpacity: 1,
    strokeWeight: 3,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1
  };

  // Outside boundary styling (grayed out effect)
  const outsidePolygonOptions = {
    fillColor: '#1f2937',
    fillOpacity: 0.5,
    strokeColor: '#000000',
    strokeOpacity: 0,
    strokeWeight: 0,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 2
  };

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
          
          // Set map center to geofence center if available
          if (data.geofence.center_lat && data.geofence.center_lng) {
            const center = {
              lat: parseFloat(data.geofence.center_lat),
              lng: parseFloat(data.geofence.center_lng)
            };
            setMapCenter(center);
            
            // If no initial marker position, don't set one yet
            // User must select within boundary
          }
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

  // Update marker position when props change (only if within boundary)
  useEffect(() => {
    if (latitude && longitude && geofence) {
      const newPos = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      if (isPointInGeofence(newPos)) {
        setMarkerPosition(newPos);
        setMapCenter(newPos);
      }
    }
  }, [latitude, longitude, geofence]);

  // Fit map to geofence bounds when loaded
  useEffect(() => {
    if (geofence && mapRef.current && mapRef.current.state && mapRef.current.state.map) {
      const map = mapRef.current.state.map;
      const bounds = calculateBounds(geofence.geojson);
      if (bounds) {
        // Add padding to show more context around the boundary
        map.fitBounds(bounds, {
          padding: { top: 50, right: 50, bottom: 50, left: 50 }
        });
        
        // Extend bounds slightly for restriction (allow some panning outside)
        const extendedBounds = new window.google.maps.LatLngBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Extend by ~20% on each side
        const latDiff = (ne.lat() - sw.lat()) * 0.2;
        const lngDiff = (ne.lng() - sw.lng()) * 0.2;
        
        extendedBounds.extend({
          lat: ne.lat() + latDiff,
          lng: ne.lng() + lngDiff
        });
        extendedBounds.extend({
          lat: sw.lat() - latDiff,
          lng: sw.lng() - lngDiff
        });
        
        // Set restriction with extended bounds for some freedom
        map.setOptions({
          restriction: {
            latLngBounds: extendedBounds,
            strictBounds: false // Allow some flexibility
          }
        });
      }
    }
  }, [geofence, isMapLoaded]);

  // Calculate bounds from GeoJSON
  const calculateBounds = (geojson) => {
    if (!window.google || !geojson || !geojson.geometry) return null;

    const bounds = new window.google.maps.LatLngBounds();
    const coordinates = geojson.geometry.coordinates;

    const addCoordinatesToBounds = (coords) => {
      if (Array.isArray(coords) && coords.length > 0) {
        if (typeof coords[0] === 'number') {
          // This is a [lng, lat] pair
          bounds.extend({ lat: coords[1], lng: coords[0] });
        } else {
          // This is an array of coordinates, recurse
          coords.forEach(addCoordinatesToBounds);
        }
      }
    };

    addCoordinatesToBounds(coordinates);
    return bounds;
  };

  // Convert GeoJSON to Google Maps polygon paths
  const convertGeoJSONToPolygonPaths = (geojson) => {
    if (!geojson || !geojson.geometry) return [];

    const coordinates = geojson.geometry.coordinates;
    const paths = [];

    if (geojson.geometry.type === 'Polygon') {
      // Polygon: array of rings (first is outer, rest are holes)
      coordinates.forEach(ring => {
        const path = ring.map(coord => ({ lat: coord[1], lng: coord[0] }));
        paths.push(path);
      });
    } else if (geojson.geometry.type === 'MultiPolygon') {
      // MultiPolygon: array of polygons
      coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          const path = ring.map(coord => ({ lat: coord[1], lng: coord[0] }));
          paths.push(path);
        });
      });
    }

    return paths;
  };

  // Check if a point is inside the geofence
  const isPointInGeofence = (point) => {
    if (!geofence || !geofence.geojson || !window.google || !window.google.maps.geometry) return false;
    const paths = convertGeoJSONToPolygonPaths(geofence.geojson);
    
    for (let path of paths) {
      const polygon = new window.google.maps.Polygon({ paths: path });
      if (window.google.maps.geometry.poly.containsLocation(point, polygon)) {
        return true;
      }
    }
    
    return false;
  };

  // Create world boundary with hole (for grayed out effect outside geofence)
  const createWorldBoundaryWithHole = () => {
    if (!geofence || !geofence.geojson) return null;

    const paths = [];

    // World boundary (covering the entire world)
    const worldBounds = [
      { lat: 85, lng: -180 },
      { lat: 85, lng: 180 },
      { lat: -85, lng: 180 },
      { lat: -85, lng: -180 },
      { lat: 85, lng: -180 }
    ];

    // Add world boundary as first path
    paths.push(worldBounds);

    // Get the geofence paths and reverse them to create holes
    const geofencePaths = convertGeoJSONToPolygonPaths(geofence.geojson);
    
    // Add each geofence path in reverse order to create holes
    geofencePaths.forEach(path => {
      paths.push([...path].reverse());
    });

    return paths;
  };

  // Handle map click with boundary validation
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newPosition = { lat, lng };
    
    // Check if click is within geofence
    if (!isPointInGeofence(newPosition)) {
      alert('Please select a location within the community boundary (highlighted area).');
      return;
    }
    
    setMarkerPosition(newPosition);
    onLocationChange(lat.toString(), lng.toString());
  }, [geofence, onLocationChange]);

  // Handle marker drag with boundary validation
  const handleMarkerDrag = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newPosition = { lat, lng };
    
    // Allow dragging - just update position
    setMarkerPosition(newPosition);
  }, []);

  // Handle marker drag end with final validation
  const handleMarkerDragEnd = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newPosition = { lat, lng };
    
    // Final check when drag ends
    if (!isPointInGeofence(newPosition)) {
      alert('Please place the marker within the community boundary (inside the green border).');
      // Reset to center of boundary if invalid
      if (geofence && geofence.center_lat && geofence.center_lng) {
        const centerPos = {
          lat: parseFloat(geofence.center_lat),
          lng: parseFloat(geofence.center_lng)
        };
        setMarkerPosition(centerPos);
      } else {
        // Remove marker if no valid center
        setMarkerPosition(null);
      }
      return;
    }
    
    setMarkerPosition(newPosition);
    onLocationChange(lat.toString(), lng.toString());
  }, [geofence, onLocationChange]);

  // Handle autocomplete load
  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  // Handle place selection with boundary validation
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        const newPosition = { lat, lng };
        
        // Check if selected place is within geofence
        if (!isPointInGeofence(newPosition)) {
          alert('The selected location is outside the community boundary. Please search for a location within the highlighted area.');
          setSearchQuery('');
          return;
        }
        
        setMarkerPosition(newPosition);
        setMapCenter(newPosition);
        onLocationChange(lat.toString(), lng.toString());
        setSearchQuery(place.formatted_address || place.name || '');
        
        if (mapRef.current && mapRef.current.state && mapRef.current.state.map) {
          const map = mapRef.current.state.map;
          map.panTo(newPosition);
          map.setZoom(15);
        }
      } else {
        alert('No location data available for this place.');
      }
    }
  };

  // Manual search with boundary validation
  const handleManualSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;
    
    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error('Location not found'));
          }
        });
      });
      
      const location = result.geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      const newPosition = { lat, lng };
      
      // Check if found location is within geofence
      if (!isPointInGeofence(newPosition)) {
        alert('The searched location is outside the community boundary. Please search for a location within the highlighted area.');
        return;
      }
      
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      onLocationChange(lat.toString(), lng.toString());
      
      if (mapRef.current && mapRef.current.state && mapRef.current.state.map) {
        const map = mapRef.current.state.map;
        map.panTo(newPosition);
        map.setZoom(15);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Location not found. Please try a different search term or use the dropdown suggestions.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current location with boundary validation
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const newPosition = { lat, lng };
          
          // Check if current location is within geofence
          if (!isPointInGeofence(newPosition)) {
            alert('Your current location is outside the community boundary. Please select a location within the highlighted area manually.');
            
            // Still pan to show where user is, but don't set marker
            if (mapRef.current && mapRef.current.state && mapRef.current.state.map) {
              const map = mapRef.current.state.map;
              map.panTo(newPosition);
              map.setZoom(12);
            }
            return;
          }
          
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          onLocationChange(lat.toString(), lng.toString());
          
          if (mapRef.current && mapRef.current.state && mapRef.current.state.map) {
            const map = mapRef.current.state.map;
            map.panTo(newPosition);
            map.setZoom(15);
          }
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
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
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search within community boundary..."
              className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </Autocomplete>
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isSearching}
              className="text-gray-400 hover:text-red-600 disabled:opacity-50 p-1"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
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
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <GoogleMap
          ref={mapRef}
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={markerPosition ? 15 : 10}
          options={mapOptions}
          onClick={handleMapClick}
          onLoad={() => setIsMapLoaded(true)}
        >
          {/* Grayed out area outside boundary */}
          {geofence && (
            <Polygon
              paths={createWorldBoundaryWithHole()}
              options={outsidePolygonOptions}
            />
          )}
          
          {/* Community boundary */}
          {geofence && convertGeoJSONToPolygonPaths(geofence.geojson).map((path, index) => (
            <Polygon
              key={`boundary-${index}`}
              paths={path}
              options={polygonOptions}
            />
          ))}
          
          {/* Marker */}
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDrag={handleMarkerDrag}
              onDragEnd={handleMarkerDragEnd}
              animation={window.google?.maps?.Animation?.DROP}
            />
          )}
        </GoogleMap>
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