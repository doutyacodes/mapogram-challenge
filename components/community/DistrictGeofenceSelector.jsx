import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, AlertCircle, Check, Info } from 'lucide-react';

const DistrictGeofenceSelector = ({ onGeofenceSelect, selectedGeofence }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [geofenceData, setGeofenceData] = useState(null);
  const [isLoadingGeofence, setIsLoadingGeofence] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const polygonRef = useRef(null);

  useEffect(() => {
    // Load Google Maps
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const initMap = () => {
    if (mapRef.current && window.google) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 }, // Center of India
        zoom: 5,
        mapTypeControl: true,
        streetViewControl: false,
      });
    }
  };

  const searchDistricts = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Use our custom API that handles variations and filtering
      const response = await fetch(
        `/api/search-districts?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      
      setSearchResults(data.districts || []);
      
      if (data.districts.length === 0) {
        setError('No districts found. Try different spelling (e.g., "Kanyakumari" or "Kanniyakumari")');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search districts. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDistricts(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchDistrictBoundary = async (district) => {
    setIsLoadingGeofence(true);
    setError('');

    try {
      const osmId = district.osm_id;
      const osmType = district.osm_type;

      // Method 1: Try direct search with polygon_geojson
      const searchResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(district.name || district.display_name.split(',')[0])}&` +
        `format=geojson&` +
        `polygon_geojson=1&` +
        `addressdetails=1&` +
        `countrycodes=in&` +
        `limit=1`
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to fetch boundary from Nominatim');
      }

      const geojsonData = await searchResponse.json();
      
      if (!geojsonData.features || geojsonData.features.length === 0) {
        throw new Error('No boundary data returned');
      }

      // Find the matching feature
      let feature = geojsonData.features.find(f => 
        f.properties.osm_id === osmId && f.properties.osm_type === osmType
      );

      // If not found, try the first one
      if (!feature) {
        feature = geojsonData.features[0];
      }
      
      if (!feature.geometry || !feature.geometry.coordinates) {
        throw new Error('Invalid geometry in response');
      }


      // The geometry is already in proper GeoJSON format
      const geometry = feature.geometry;
      
      // Validate geometry type
      if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) {
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
      }

      // Extract all coordinates for bounds calculation
      let allCoordinates = [];
      
      if (geometry.type === 'Polygon') {
        // Polygon: coordinates[0] is the outer ring
        allCoordinates = geometry.coordinates[0];
      } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon: coordinates[i][0] is each polygon's outer ring
        geometry.coordinates.forEach((polygon, idx) => {
          allCoordinates.push(...polygon[0]);
        });
      }

      if (allCoordinates.length < 3) {
        throw new Error('Insufficient coordinates for a valid polygon');
      }


      // Calculate bounds and center
      const bounds = allCoordinates.reduce(
        (acc, coord) => ({
          minLat: Math.min(acc.minLat, coord[1]),
          maxLat: Math.max(acc.maxLat, coord[1]),
          minLng: Math.min(acc.minLng, coord[0]),
          maxLng: Math.max(acc.maxLng, coord[0]),
        }),
        { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
      );

      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;

      // Create the final GeoJSON feature
      const geojson = {
        type: 'Feature',
        properties: {
          name: feature.properties.name || district.name || district.display_name.split(',')[0],
          osm_id: feature.properties.osm_id || osmId,
          osm_type: feature.properties.osm_type || osmType,
          admin_level: 5,
        },
        geometry: geometry,
      };

      setGeofenceData({
        geojson,
        center_lat: centerLat,
        center_lng: centerLng,
        name: feature.properties.name || district.name || district.display_name.split(',')[0],
      });

      // Draw on map
      drawPolygonOnMap(geometry, centerLat, centerLng);

    } catch (err) {
      console.error('Geofence fetch error:', err);
      setError(`Failed to load district boundary: ${err.message}. This district may not have detailed boundary data available.`);
      setGeofenceData(null);
    } finally {
      setIsLoadingGeofence(false);
    }
  };

  const drawPolygonOnMap = (geometry, centerLat, centerLng) => {
    if (!googleMapRef.current || !window.google) return;

    // Remove existing polygons
    if (polygonRef.current) {
      if (Array.isArray(polygonRef.current)) {
        polygonRef.current.forEach(p => p.setMap(null));
      } else {
        polygonRef.current.setMap(null);
      }
    }

    const bounds = new window.google.maps.LatLngBounds();

    if (geometry.type === 'Polygon') {
      // Single polygon - coordinates[0] is outer ring, rest are holes      
      // Convert all rings (outer + holes)
      const paths = geometry.coordinates.map((ring, idx) => {
        return ring.map(coord => {
          const point = { lat: coord[1], lng: coord[0] };
          if (idx === 0) bounds.extend(point); // Only extend bounds for outer ring
          return point;
        });
      });

      const polygon = new window.google.maps.Polygon({
        paths: paths, // First path is outer, rest are holes
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 2.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        clickable: false,
      });

      polygon.setMap(googleMapRef.current);
      polygonRef.current = polygon;

    } else if (geometry.type === 'MultiPolygon') {
      // Multiple polygons
      const polygons = [];

      geometry.coordinates.forEach((polygonCoords, polyIdx) => {
        
        // Each polygon can have multiple rings (outer + holes)
        const paths = polygonCoords.map((ring, ringIdx) => {
          return ring.map(coord => {
            const point = { lat: coord[1], lng: coord[0] };
            if (ringIdx === 0) bounds.extend(point); // Only extend for outer rings
            return point;
          });
        });

        const polygon = new window.google.maps.Polygon({
          paths: paths,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 2.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          clickable: false,
        });

        polygon.setMap(googleMapRef.current);
        polygons.push(polygon);
      });

      polygonRef.current = polygons;
    }

    // Fit map to show entire boundary
    googleMapRef.current.fitBounds(bounds);

    // Add padding by zooming out slightly
    setTimeout(() => {
      const currentZoom = googleMapRef.current.getZoom();
      if (currentZoom && currentZoom > 1) {
        googleMapRef.current.setZoom(Math.max(currentZoom - 0.5, 1));
      }
    }, 200);
  };

  const handleDistrictSelect = async (district) => {
    setSelectedDistrict(district);
    setSearchResults([]);
    
    // Extract just the district name (before the first comma)
    const districtName = district.display_name.split(',')[0].trim();
    setSearchQuery(districtName);
    
    await fetchDistrictBoundary(district);
  };

  const handleConfirmGeofence = () => {
    if (geofenceData) {
      onGeofenceSelect(geofenceData);
    }
  };

  const handleClear = () => {
    setSelectedDistrict(null);
    setGeofenceData(null);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: 20.5937, lng: 78.9629 });
      googleMapRef.current.setZoom(5);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4" />
          Select District Boundary
        </label>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a district (e.g., Kanyakumari, Thiruvananthapuram)"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoadingGeofence}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
          )}
        </div>

        {/* Info tip */}
        {!selectedDistrict && searchQuery.length === 0 && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Type a district name to search. Only administrative districts will be shown.
            </p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((result, idx) => {
              // Extract district name - prefer name over display_name
              const districtName = result.name || result.display_name.split(',')[0];
              // Get state from address
              const state = result.address?.state || '';
              
              return (
                <button
                  key={`${result.osm_id}-${idx}`}
                  onClick={() => handleDistrictSelect(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b last:border-b-0 border-gray-100"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {districtName} District
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{state}, India</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          District
                        </span>
                        <span className="text-xs text-gray-400">
                          {result.osm_type}/{result.osm_id}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingGeofence && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-600 font-medium">Loading district boundary...</p>
          <p className="text-xs text-blue-500">This may take a few seconds for large districts</p>
        </div>
      )}

      {/* Map Container */}
      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-80" />
        {!geofenceData && !isLoadingGeofence && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Search and select a district to view its boundary</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation */}
      {geofenceData && !selectedGeofence && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">District Boundary Loaded</p>
              <p className="text-xs text-green-700 mt-0.5">{geofenceData.name}</p>
              <p className="text-xs text-green-600 mt-1">
                Type: {geofenceData.geojson.geometry.type}
                {geofenceData.geojson.geometry.type === 'Polygon' && 
                  ` • ${geofenceData.geojson.geometry.coordinates[0].length} points`}
                {geofenceData.geojson.geometry.type === 'MultiPolygon' && 
                  ` • ${geofenceData.geojson.geometry.coordinates.length} parts`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleConfirmGeofence}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              Confirm Boundary
            </button>
          </div>
        </div>
      )}

      {/* Selected Confirmation */}
      {selectedGeofence && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">✓ Boundary Confirmed</p>
              <p className="text-xs text-blue-700 mt-0.5">{selectedGeofence.name}</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded transition-colors"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
};

export default DistrictGeofenceSelector;