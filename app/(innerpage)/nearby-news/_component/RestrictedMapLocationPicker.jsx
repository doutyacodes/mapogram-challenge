import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScriptNext, Marker, Circle, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, Crosshair, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

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
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false); // Add this state
  const googleMapsApiKey= process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const [mapCenter, setMapCenter] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(
    latitude && longitude 
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      : null
  );

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isWithinRadius, setIsWithinRadius] = useState(true);
  
  const mapRef = useRef(null);
  const radiusInMeters = radiusKm * 1000;
  
  // Libraries needed for Google Maps
  const libraries = ['places', 'geometry'];
  
  // Map configuration
  const mapContainerStyle = {
    width: '100%',
    height: '450px',
    borderRadius: '8px'
  };
  
  const mapOptions = {
    disableDefaultUI: isReadOnly,
    gestureHandling: isReadOnly ? 'none' : 'greedy',
    clickableIcons: !isReadOnly,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
    gestureHandling: '',
    draggableCursor: 'default',
    draggingCursor: 'default',
    disableDoubleClickZoom: isReadOnly,
    restriction: null, // Will be set dynamically
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      }
    ]
  };

  // Circle options for the radius
  const circleOptions = {
    strokeColor: '#3B82F6',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#3B82F6',
    fillOpacity: 0.15,
    clickable: false
  };

  // Calculate distance between two points in meters
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      // Fallback Haversine formula
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lng2-lng1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
    } else {
      // Use Google Maps geometry library
      const point1 = new window.google.maps.LatLng(lat1, lng1);
      const point2 = new window.google.maps.LatLng(lat2, lng2);
      return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
    }
  };

  // Validate if position is within radius
  const validatePosition = (lat, lng) => {
    if (!userCurrentLocation) return false;
    
    const distance = calculateDistance(
      userCurrentLocation.lat, 
      userCurrentLocation.lng, 
      lat, 
      lng
    );
    
    return distance <= radiusInMeters;
  };

  // Get user's current location on component mount
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            setUserCurrentLocation(userLocation);
            setMapCenter(userLocation);
            setIsGettingLocation(false);
            setLocationError(null);
            
            // If there's already a marker position, validate it
            if (markerPosition && userCurrentLocation) {
              const isValid = validatePosition(markerPosition.lat, markerPosition.lng);
              setIsWithinRadius(isValid);
              if (!isValid) {
                setValidationError(`Selected location is outside the ${radiusKm}km allowed radius`);
              }
            }
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
            maximumAge: 60000
          }
        );
      } else {
        setIsGettingLocation(false);
        setLocationError('Geolocation is not supported by this browser.');
      }
    };

    getCurrentLocation();
  }, [markerPosition]);

  // Update map restrictions when user location is available
  useEffect(() => {
    if (userCurrentLocation && mapRef.current && mapRef.current.state && mapRef.current.state.map) {
      const map = mapRef.current.state.map;
      
      // Calculate bounds with some padding beyond the radius for better UX
      const paddingFactor = 1.5; // 50% extra space beyond radius
      const paddedRadiusInMeters = radiusInMeters * paddingFactor;
      
      // Calculate approximate bounds (rough calculation)
      const latOffset = (paddedRadiusInMeters / 111320); // 1 degree lat ≈ 111.32 km
      const lngOffset = (paddedRadiusInMeters / (111320 * Math.cos(userCurrentLocation.lat * Math.PI / 180)));
      
      const bounds = {
        north: userCurrentLocation.lat + latOffset,
        south: userCurrentLocation.lat - latOffset,
        east: userCurrentLocation.lng + lngOffset,
        west: userCurrentLocation.lng - lngOffset
      };
      
      // Set map restriction
      map.setOptions({
        restriction: {
          latLngBounds: bounds,
          strictBounds: false
        },
        minZoom: 12, // Prevent too much zoom out
        maxZoom: 20
      });
    }
  }, [userCurrentLocation, radiusInMeters]);

  // Handle map click with validation
  const handleMapClick = useCallback((event) => {
    if (!userCurrentLocation) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const isValid = validatePosition(lat, lng);
    
    if (isValid) {
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition);
      setValidationError('');
      setIsWithinRadius(true);
      onLocationChange(lat.toString(), lng.toString());
    } else {
      setValidationError(`Please select a location within ${radiusKm}km of your current position`);
      setIsWithinRadius(false);
      
      // Show temporary error marker
      setTimeout(() => {
        setValidationError('');
      }, 3000);
    }
  }, [userCurrentLocation, radiusKm, onLocationChange]);

  // Handle marker drag with validation
  const handleMarkerDrag = useCallback((event) => {
    if (!userCurrentLocation) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const isValid = validatePosition(lat, lng);
    
    if (isValid) {
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition);
      setValidationError('');
      setIsWithinRadius(true);
      onLocationChange(lat.toString(), lng.toString());
    } else {
      // Snap back to previous valid position or remove marker
      setValidationError(`Marker must be within ${radiusKm}km of your current location`);
      setIsWithinRadius(false);
      
      // Reset marker to last valid position or remove it
      if (isWithinRadius) {
        // Keep current position
      } else {
        setMarkerPosition(null);
        onLocationChange('', '');
      }
      
      setTimeout(() => {
        setValidationError('');
      }, 3000);
    }
  }, [userCurrentLocation, radiusKm, onLocationChange, isWithinRadius]);

  // Handle autocomplete load
  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  // Handle place selection from autocomplete
  const onPlaceChanged = () => {
    if (autocomplete !== null && userCurrentLocation) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const isValid = validatePosition(lat, lng);
        
        if (isValid) {
          const newPosition = { lat, lng };
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          setValidationError('');
          setIsWithinRadius(true);
          onLocationChange(lat.toString(), lng.toString());
          setSearchQuery(place.formatted_address || place.name || '');
          
          if (mapRef.current && mapRef.current.state && mapRef.current.state.map) {
            const map = mapRef.current.state.map;
            map.panTo(newPosition);
            map.setZoom(16);
          }
        } else {
          setValidationError(`Selected location is outside the ${radiusKm}km allowed radius`);
          setIsWithinRadius(false);
          setTimeout(() => {
            setValidationError('');
          }, 3000);
        }
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Retry getting location
  const retryLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);
    setLocationPermissionDenied(false);
    
    // Re-trigger location detection
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserCurrentLocation(userLocation);
          setMapCenter(userLocation);
          setIsGettingLocation(false);
        },
        (error) => {
          setIsGettingLocation(false);
          setLocationError('Failed to get location. Please ensure location permissions are enabled.');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0 // Force fresh location
        }
      );
    }
  };

  // Handle Google Maps script load
  const handleGoogleMapsLoad = () => {
    setIsGoogleMapsLoaded(true);
  };

  // Create custom marker icon (safe method)
  const createMarkerIcon = (color = '#3B82F6', size = 20) => {
    if (!isGoogleMapsLoaded || !window.google || !window.google.maps) {
      return undefined; // Return undefined if Google Maps isn't loaded yet
    }

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
        <circle cx="12" cy="12" r="8"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;base64,' + btoa(svgIcon),
      scaledSize: new window.google.maps.Size(size, size)
    };
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
            {isGoogleMapsLoaded ? (
            <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                bounds: userCurrentLocation ? {
                    north: userCurrentLocation.lat + 0.1,
                    south: userCurrentLocation.lat - 0.1,
                    east: userCurrentLocation.lng + 0.1,
                    west: userCurrentLocation.lng - 0.1
                } : undefined,
                strictBounds: false
                }}
            >
                <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isReadOnly ? "Location editing disabled" : `Search within ${radiusKm}km of your location...`}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                disabled={!isGoogleMapsLoaded || isReadOnly} // Add isReadOnly condition
                />
            </Autocomplete>
            ) : (
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Loading map services..."
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                disabled
            />
            )}
            
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
            </div>
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
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <LoadScriptNext
        googleMapsApiKey={googleMapsApiKey} 
        libraries={libraries}
        onLoad={() => setIsGoogleMapsLoaded(true)}
        preventGoogleFontsLoading={true}
        >
          <GoogleMap
            ref={mapRef}
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={11}
            options={mapOptions}
            onClick={isReadOnly ? undefined : handleMapClick}
            onLoad={() => setIsMapLoaded(true)}
          >
            {/* User's current location marker */}
            {userCurrentLocation && isGoogleMapsLoaded && (
              <Marker
                position={userCurrentLocation}
                icon={createMarkerIcon('#3B82F6', 20)}
                title="Your current location"
              />
            )}
            
            {/* Radius circle */}
            {userCurrentLocation && (
              <Circle
                center={userCurrentLocation}
                radius={radiusInMeters}
                options={circleOptions}
              />
            )}
            
            {/* Selected location marker */}
            {markerPosition && isWithinRadius && isGoogleMapsLoaded && (
              <Marker
                position={markerPosition}
                draggable={window.google?.maps?.Animation ? true : false}
                onDragEnd={handleMarkerDrag}
                animation={window.google?.maps?.Animation?.DROP}
                title="Selected location"
              />
            )}
          </GoogleMap>
        </LoadScriptNext>
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