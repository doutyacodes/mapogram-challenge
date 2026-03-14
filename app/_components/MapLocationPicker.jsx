import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, Crosshair, X } from 'lucide-react';

const MapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  className = "" 
}) => {
    
   const googleMapsApiKey= process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [mapCenter, setMapCenter] = useState({
    lat: latitude ? parseFloat(latitude) : 28.6139, // Default to Delhi
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
  
  // Libraries needed for Google Maps
  const libraries = ['places'];
  
  // Map configuration
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
    gestureHandling: 'greedy', // Allows one-finger scrolling on mobile
    clickableIcons: true,
    // Custom cursor styles
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

  // Update marker position when props change
  useEffect(() => {
    if (latitude && longitude) {
      const newPos = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      setMarkerPosition(newPos);
      setMapCenter(newPos);
    }
  }, [latitude, longitude]);

  // Handle map click
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newPosition = { lat, lng };
    setMarkerPosition(newPosition);
    
    // Call the parent callback with the new coordinates
    onLocationChange(lat.toString(), lng.toString());
  }, [onLocationChange]);

  // Handle marker drag
  const handleMarkerDrag = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    const newPosition = { lat, lng };
    setMarkerPosition(newPosition);
    
    // Call the parent callback with the new coordinates
    onLocationChange(lat.toString(), lng.toString());
  }, [onLocationChange]);

  // Handle autocomplete load
  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  // Handle place selection from autocomplete
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        const newPosition = { lat, lng };
        setMarkerPosition(newPosition);
        setMapCenter(newPosition);
        onLocationChange(lat.toString(), lng.toString());
        
        // Update search query with selected place name
        setSearchQuery(place.formatted_address || place.name || '');
        
        // Center map on selected location with appropriate zoom
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

  // Manual search fallback (for when autocomplete doesn't work)
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
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      onLocationChange(lat.toString(), lng.toString());
      
      // Center map on found location
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

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const newPosition = { lat, lng };
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          onLocationChange(lat.toString(), lng.toString());
          
          // Fixed: Use the correct way to access the map instance
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

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location <MapPin className="h-4 w-4 inline text-red-800 ml-1" />
      </label>
      
      {/* Search and Current Location Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          {/* <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}> */}
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for a location... (try typing 'India' or 'New York')"
                className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </Autocomplete>
          {/* </LoadScript> */}
          
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
        {/* <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}> */}
          <GoogleMap
            ref={mapRef}
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={markerPosition ? 15 : 10}
            options={mapOptions}
            onClick={handleMapClick}
            onLoad={() => setIsMapLoaded(true)}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={handleMarkerDrag}
                animation={window.google?.maps?.Animation?.DROP}
              />
            )}
          </GoogleMap>
        {/* </LoadScript> */}
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