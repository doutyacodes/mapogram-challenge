"use client"
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMediaQuery } from 'react-responsive';
import { GoogleMap, InfoWindowF, MarkerF } from "@react-google-maps/api";
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { 
    Briefcase,
    Loader2,
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Target,
    Utensils,
    Activity,
    Calendar,
    Star,
    Clock,
    Heart,
    MessageCircle,
    Share2,
    Navigation2,
    QrCode,
    Award,
    CheckCircle
  } from "lucide-react";
import { useRouter } from "next/navigation";
import { applyGoogleMapsControlStyle } from "@/utils/googleMapsStyles";
import PostRegistrationModal from "@/components/map/posts/PostRegistrationModal";
import { useUserRole } from "@/app/hooks/useUserRole";
import PagePostCreation from "../../../../../components/map/posts/PagePostCreation";
import StateCategoryContent from "../../../communities/components/StateCategoryContent";
import { STATIC_DISTRICT_DATA } from "@/utils/mockCategoryData";
import { createClusterRenderer } from "@/utils/map/createClusterRenderer";
import MapCard from "@/components/map/MapCard";
import { handleClusterClick } from "@/utils/map/handleClusterClick";
import MapTypeControls from "@/components/map/controls/MapTypeControls";
import ZoomControls from "@/components/map/controls/ZoomControls";
import MobileFilterDropdown from "@/components/map/controls/MobileFilterDropdown";
import PostFilterPanel from "@/components/map/controls/PostFilterPanel";
import ResetMapButton from "@/components/map/controls/ResetMapButton";
import { center, containerStyle, DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "@/lib/map/constants";
import { createPostCategoryMarkerIcon, groupPostsByLocation, groupRegistrationsByLocation } from '@/utils/map/markerUtils';

export default function PageView({pageId, isOwner, selectedDistrict, setSelectedDistrict, onTourismUpdate}) {
  const [postsItems, setPostsItems] = useState([]);
  const [groupedPosts, setGroupedPosts] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [mapBounds, setMapBounds] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [locationPermissionState, setLocationPermissionState] = useState(null);

  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [postCategories, setPostCategories] = useState([]);
  const [communities, setCommunities] = useState([]);

  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const [countryCenter, setCountryCenter] = useState(center);

  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  const [showUserProfile, setShowUserProfile] = useState(false);
  const [postLikes, setPostLikes] = useState({}); // Track liked posts
  const [postLikeCounts, setPostLikeCounts] = useState({});

  const [selectedCategories, setSelectedCategories] = useState([]);

  // Add refs to store state for mobile restoration
  const userLocationRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const userHasInteractedRef = useRef(false); // Track if user has manually moved the map

  const markersRef = useRef([]);
  const clusterRef = useRef(null);
  const existingMarkersRef = useRef(new Map()); // Track markers by location key
  const prevSelectedLocationRef = useRef(null);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [groupedRegistrations, setGroupedRegistrations] = useState({});
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [currentRegistrationIndex, setCurrentRegistrationIndex] = useState(0);

  const { user, canCreatePost } = useUserRole();

  // --- Tourism Specific States ---
  const [geofenceData, setGeofenceData] = useState(null);
  const [categoryMarkers, setCategoryMarkers] = useState([]);
  const [activeCategoryMarker, setActiveCategoryMarker] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [activeDiscoveryCategory, setActiveDiscoveryCategory] = useState(null);
  const [activeCardTab, setActiveCardTab] = useState('Rules');

  const isTourismPage = Number(pageId) === 999991 || Number(pageId) === 999992;

  
  const [isDistrictFilterOpen, setIsDistrictFilterOpen] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState("");
  
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [deniedItemIds, setDeniedItemIds] = useState(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('rules');
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSuccess, setQRSuccess] = useState(false);

  const geofenceSetupCompleteRef = useRef(false);
  const tourismMarkersRef = useRef([]);

  const getCategoryByName = (categoryName) => {
    return postCategories.find(cat => cat.name === categoryName) || { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280', class_name: '' };
  };

  // Determine map center and zoom - always use default for full world view
  const mapCenter = countryCenter;
  const mapZoom = DEFAULT_ZOOM; // Always use default zoom

  const isMobile = useMediaQuery({ maxWidth: 640 });

  const buttonStyle = {
    minWidth: isMobile ? '60px' : '100px',  // Changed from 80px to 60px for mobile
    height: isMobile ? '28px' : '38px',     // Changed from 34px to 28px for mobile
    fontSize: isMobile ? '12px' : '14px'    // Added smaller font size for mobile
  };

  const [readPostIds, setReadPostIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readPostIds');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  // Add this function to mark news as read
  const markPostAsRead = useCallback((newsId) => {
    setReadPostIds(prev => {
      const updated = [...prev, newsId];
      localStorage.setItem('readPostIds', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // --- Tourism Data Sync ---
  useEffect(() => {
    if (onTourismUpdate) {
      onTourismUpdate({
        selectedDistrict,
        acceptedCount: acceptedItems.length
      });
    }
  }, [selectedDistrict, acceptedItems.length, onTourismUpdate]);

  // Fetch Geofence
  const fetchGeofence = useCallback(async (id) => {
    if (!id) return;
    try {
      // For now we use the same community geofence API
      // In a real Page app, this might be /api/pages/[id]/geofence
      const response = await fetch(`/api/communities/${id}/geofence`);
      if (!response.ok) {
        setGeofenceData(null);
        return;
      }
      const data = await response.json();
      setGeofenceData(data.geofence?.geojson || null);
    } catch (err) {
      console.error("Error fetching geofence:", err);
      setGeofenceData(null);
    }
  }, []);

  useEffect(() => {
    if (pageId && (pageId === "999991" || pageId === "999992")) {
      fetchGeofence(pageId);
    }
  }, [pageId, fetchGeofence]);

  // Marker Icon Generator for Tourism
  const getMarkerIcon = (category, isSelected, isGroup = false) => {
    let color = '#f97316'; // orange for challenges
    let path = '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>';
    
    if (category === 'Places') {
      color = '#22c55e'; // green
      path = '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>';
    } else if (category === 'Food') {
      color = '#ef4444'; // red
      path = '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>';
    } else if (category === 'Activity') {
      color = '#06b6d4'; // cyan
      path = '<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>';
    } else if (category === 'Events') {
      color = '#8b5cf6'; // violet
      path = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';
    }

    const size = isSelected ? 48 : (isGroup ? 44 : 36);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">
      <circle cx="20" cy="20" r="18" fill="${color}" opacity="${isGroup ? '0.4' : '0.2'}"/>
      <circle cx="20" cy="20" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(8, 8) scale(0.9)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${path}
        </svg>
      </g>
    </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  useEffect(() => {
    if (!selectedDistrict || !STATIC_DISTRICT_DATA["Kerala"]?.[selectedDistrict]) {
      setCategoryMarkers([]);
      return;
    }

    const districtData = STATIC_DISTRICT_DATA["Kerala"][selectedDistrict];
    const newMarkers = [];

    // Flatten data for markers, filtering by activeDiscoveryCategory if set
    Object.entries(districtData).forEach(([category, items]) => {
      // If a category is selected, only show markers for that category
      if (activeDiscoveryCategory && category !== activeDiscoveryCategory) return;

      items.forEach(item => {
        if (deniedItemIds.has(item.id)) return;
        
        // Use position object from generated data
        if (item.position && item.position.lat && item.position.lng) {
          newMarkers.push({
            ...item,
            category,
            position: { lat: parseFloat(item.position.lat), lng: parseFloat(item.position.lng) }
          });
        }
      });
    });

    setCategoryMarkers(newMarkers);
    console.log(`[TOURISM] Generated ${newMarkers.length} markers for ${selectedDistrict} (Category: ${activeDiscoveryCategory || 'All'})`);
  }, [selectedDistrict, deniedItemIds, activeDiscoveryCategory]);

  // --- Tourism Map Rendering ---
  
  // 1. Geofence Polygons & Overlay
  useEffect(() => {
    if (!mapRef || !geofenceData) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;
    let districtPolygonsData = [];

    if (geofenceData.type === 'FeatureCollection') {
      geofenceData.features.forEach(feature => {
        const distName = feature.properties.name || feature.properties.district;
        const geometry = feature.geometry;
        const featureBounds = new window.google.maps.LatLngBounds();
        
        if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach(ring => {
            const path = ring.map(coord => {
              const p = { lat: coord[1], lng: coord[0] };
              featureBounds.extend(p);
              bounds.extend(p);
              hasCoords = true;
              return p;
            });
            districtPolygonsData.push({ path, name: distName, bounds: featureBounds });
          });
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              const path = ring.map(coord => {
                const p = { lat: coord[1], lng: coord[0] };
                featureBounds.extend(p);
                bounds.extend(p);
                hasCoords = true;
                return p;
              });
              districtPolygonsData.push({ path, name: distName, bounds: featureBounds });
            });
          });
        }
      });
    }

    if (hasCoords) {
      // Interactive Polygons
      const geofencePolygons = districtPolygonsData.map(data => {
        const isSelected = selectedDistrict && data.name.toLowerCase() === selectedDistrict.toLowerCase();
        
        const polygon = new window.google.maps.Polygon({
          paths: data.path,
          strokeColor: isSelected ? '#2563EB' : '#3B82F6',
          strokeOpacity: isSelected ? 1 : 0.8,
          strokeWeight: isSelected ? 4 : 2,
          fillColor: isSelected ? '#3B82F6' : '#3B82F6',
          fillOpacity: isSelected ? 0.2 : 0.1,
          clickable: true,
          map: mapRef,
          zIndex: 1
        });

        polygon.addListener('click', () => {
          setSelectedDistrict(data.name);
        });

        return polygon;
      });

      // Overlay (Dimming other areas)
      const worldBounds = [
        { lat: 85, lng: -180 }, { lat: 85, lng: 180 }, 
        { lat: -85, lng: 180 }, { lat: -85, lng: -180 }
      ];
      
      let holesToDraw = selectedDistrict 
        ? districtPolygonsData.filter(d => d.name.toLowerCase() === selectedDistrict.toLowerCase())
        : districtPolygonsData;

      const holePaths = holesToDraw.map(d => [...d.path].reverse());
      const overlayPolygon = new window.google.maps.Polygon({
        paths: [worldBounds, ...holePaths],
        strokeColor: 'transparent',
        fillColor: '#6B7280',
        fillOpacity: 0.4,
        clickable: false,
        map: mapRef,
        zIndex: 0
      });

      // Adjust View
      if (selectedDistrict) {
        const selectedData = districtPolygonsData.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
        if (selectedData) {
          mapRef.fitBounds(selectedData.bounds, { top: 80, bottom: 80, left: 40, right: 40 });
        }
      } else {
        mapRef.fitBounds(bounds, { top: 80, bottom: 40, left: 40, right: 40 });
      }

      return () => {
        geofencePolygons.forEach(p => p.setMap(null));
        overlayPolygon.setMap(null);
      };
    }
  }, [mapRef, geofenceData, selectedDistrict, setSelectedDistrict]);

  // 2. Discovery Markers (Subtle circles)
  useEffect(() => {
    if (!mapRef || !geofenceData || selectedDistrict) return;

    const discoveryMarkers = [];
    if (geofenceData.type === 'FeatureCollection') {
      geofenceData.features.forEach(feature => {
        const distName = feature.properties.name || feature.properties.district;
        const geometry = feature.geometry;
        const districtBounds = new window.google.maps.LatLngBounds();
        
        if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach(ring => {
            ring.forEach(coord => districtBounds.extend({ lat: coord[1], lng: coord[0] }));
          });
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              ring.forEach(coord => districtBounds.extend({ lat: coord[1], lng: coord[0] }));
            });
          });
        }

        if (!districtBounds.isEmpty()) {
          const marker = new window.google.maps.Marker({
            position: districtBounds.getCenter(),
            map: mapRef,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#FFFFFF',
              fillOpacity: 0.9,
              strokeColor: '#2563EB',
              strokeWeight: 2
            },
            title: distName,
            zIndex: 2
          });

          marker.addListener('click', () => {
            setSelectedDistrict(distName);
          });
          discoveryMarkers.push(marker);
        }
      });
    }

    return () => discoveryMarkers.forEach(m => m.setMap(null));
  }, [mapRef, geofenceData, selectedDistrict, setSelectedDistrict]);

  // 3. Tourism Item Markers
  useEffect(() => {
    if (!mapRef || !selectedDistrict) {
      tourismMarkersRef.current.forEach(m => m.setMap(null));
      tourismMarkersRef.current = [];
      return;
    }
    // Cleanup handled by declarative MarkerF
  }, [mapRef, selectedDistrict]);

  // Unified geofence effect

  // HELPER FUNCTION TO CHECK IF ALL post AT A LOCATION ARE READ
  const areAllPostAtLocationRead = (locationKey) => {
    const postAtLocation = groupedPosts[locationKey];
    if (!postAtLocation || postAtLocation.length === 0) return false;
    
    return postAtLocation.every(post => readPostIds.includes(post.id));
  };

  const initializeLikeData = (newsData) => {
    const counts = {};
    const likes = {};
    newsData.forEach(news => {
      counts[news.id] = news.like_count || 0;
      likes[news.id] = news.is_liked_by_user || false;
    });
    setPostLikeCounts(counts);
    setPostLikes(likes);
  };

  const fetchPostsData = useCallback(async (bounds, pageId, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setIsLoading(true);
      }
      
      let url = '/api/page';
      const params = new URLSearchParams();

      // Comment out bounds filtering - fetch all data
      // if (bounds) {
      //   const { north, south, east, west } = bounds;
      //   params.append('north', north);
      //   params.append('south', south);
      //   params.append('east', east);
      //   params.append('west', west);
      // }
      
      if (pageId) {
        params.append('pageId', pageId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts data');
      }
      
      const data = await response.json();
      setPostsItems(data.posts || []);
      setPostCategories(data.categories || []);
      initializeLikeData(data.posts || []);

      const grouped = groupPostsByLocation(data.posts || []);
      setGroupedPosts(grouped);
      
      // ADD this line to group registrations
      const groupedRegs = groupRegistrationsByLocation(data.registrations || []);
      setGroupedRegistrations(groupedRegs);
      
    } catch (err) {
      console.error("Error fetching posts:", err);
      if (!isAutoRefresh) {
        setError("Failed to load posts data");
      }
    } finally {
      if (!isAutoRefresh) {
        setIsLoading(false);
      }
    }
  }, []);

  // Updated useEffect to fetch posts when community is selected
  useEffect(() => {
    if (pageId) {
      fetchPostsData(null, pageId);
    }
  }, [pageId, fetchPostsData]);

  // Handle page visibility change to restore map state on mobile ONLY
  useEffect(() => {
    // Only add visibility change handler for mobile devices
    if (!isMobile) return;

    const handleVisibilityChange = () => {
      // Only restore location if:
      // 1. Page is becoming visible
      // 2. Map ref exists
      // 3. User location exists
      // 4. User hasn't manually interacted with the map
      // 5. User gave permission (don't ask again)
      if (!document.hidden && 
          mapRef && 
          userLocationRef.current && 
          !userHasInteractedRef.current &&
          locationPermissionState === 'granted') {
        // Restore user location when page becomes visible again on mobile
        setTimeout(() => {
          mapRef.panTo(userLocationRef.current);
          mapRef.setZoom(USER_LOCATION_ZOOM);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mapRef, isMobile, locationPermissionState]);

  useEffect(() => {
    const updateMarkersAsync = async () => {
      if (!mapRef || (Object.keys(groupedPosts).length === 0 && Object.keys(groupedRegistrations).length === 0)) return;
      
      // Get current markers map
      const currentMarkers = existingMarkersRef.current;
      const newLocationKeys = new Set([...Object.keys(groupedPosts), ...Object.keys(groupedRegistrations)]);
      const existingLocationKeys = new Set(currentMarkers.keys());
      
      // Remove markers that no longer exist
      for (const locationKey of existingLocationKeys) {
        if (!newLocationKeys.has(locationKey)) {
          const marker = currentMarkers.get(locationKey);
          if (marker) {
            marker.setMap(null);
            currentMarkers.delete(locationKey);
          }
        }
      }
      
      // Update or create markers
      const allMarkers = [];
      const markerPromises = [];
      
      // HANDLE POST MARKERS
      Object.keys(groupedPosts).forEach((locationKey) => {
        const [lat, lng] = locationKey.split(',').map(parseFloat);
        const postsAtLocation = groupedPosts[locationKey];
        const mainPost = postsAtLocation[0];
        
        if (mainPost.category && !selectedCategories.includes(mainPost.category)) {
          // Hide marker if category not selected
          if (currentMarkers.has(locationKey)) {
            currentMarkers.get(locationKey).setMap(null);
          }
          return;
        }
        const allPostRead = areAllPostAtLocationRead(locationKey); // Check if all news are read
        const markerPromise = (async () => {
          let marker = currentMarkers.get(locationKey);
          
          // Instead of passing category name string, pass the category object
          const categoryData = postCategories.find(cat => cat.id === mainPost.category_id) || 
                              { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280' };

          const markerIcon = createPostCategoryMarkerIcon(categoryData, postsAtLocation.length, mainPost, allPostRead);
          
          if (marker) {
            // Update existing marker
            marker.setMap(mapRef);
            marker.setIcon(markerIcon);
            marker.setZIndex(1);
          } else {
            // Create new marker
            marker = new google.maps.Marker({
              position: { lat, lng },
              map: mapRef,
              icon: markerIcon,
              zIndex: 1,
            });
            
            // Add click listener to new marker
            marker.addListener('click', () => {
              handleMarkerClick(locationKey);
            });
            
            currentMarkers.set(locationKey, marker);
          }
          
          return marker;
        })();
        
        markerPromises.push(markerPromise);
      });
      
      // HANDLE REGISTRATION MARKERS
      Object.keys(groupedRegistrations).forEach((locationKey) => {
        const [lat, lng] = locationKey.split(',').map(parseFloat);
        const registrationsAtLocation = groupedRegistrations[locationKey];
        
        // Create a unique key for registration markers to avoid conflicts with post markers
        const registrationLocationKey = `reg_${locationKey}`;
        
        const markerPromise = (async () => {
          let marker = currentMarkers.get(registrationLocationKey);
          
          const registrationIcon = {
            url: "data:image/svg+xml," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <circle cx="12" cy="12" r="10" fill="#059669" stroke="#047857" stroke-width="2"/>
                <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <text x="12" y="20" text-anchor="middle" fill="#047857" font-size="8" font-weight="bold">${registrationsAtLocation.length}</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          };
          
          if (marker) {
            // Update existing registration marker
            marker.setMap(mapRef);
            marker.setIcon(registrationIcon);
            marker.setZIndex(2);
          } else {
            // Create new registration marker
            marker = new google.maps.Marker({
              position: { lat, lng },
              map: mapRef,
              icon: registrationIcon,
              zIndex: 2, // Higher than post markers
              title: `${registrationsAtLocation.length} Registration(s)`
            });
            
            marker.addListener('click', () => {
              handleRegistrationMarkerClick(locationKey); // Use original locationKey for the click handler
            });
            
            // Store in existingMarkersRef for proper tracking
            currentMarkers.set(registrationLocationKey, marker);
          }
          
          return marker;
        })();
        
        markerPromises.push(markerPromise);
      });
      
      // Wait for all markers to be created/updated
      const resolvedMarkers = await Promise.all(markerPromises);
      allMarkers.push(...resolvedMarkers.filter(marker => marker));
      
      // Update cluster with all visible markers
      if (clusterRef.current) {
        clusterRef.current.clearMarkers();
        clusterRef.current.setMap(null);
      }
      
      if (allMarkers.length > 0) {
        const cluster = new MarkerClusterer({
          map: mapRef,
          markers: allMarkers,
          renderer: createClusterRenderer(mapRef, readPostIds, groupedPosts, {type: "page"}),
          algorithmOptions: {
            maxZoom: 12,
            radius: 80,
          },
        });
        
        cluster.addListener('click', (event, cluster, map) => {
          handleClusterClick(event, cluster, map);
        });
        
        clusterRef.current = cluster;
      }
      
      // Update markersRef for compatibility
      markersRef.current = allMarkers;
      
      // Cleanup function
      return () => {
        if (clusterRef.current) {
          clusterRef.current.clearMarkers();
          clusterRef.current.setMap(null);
        }
        // Don't clear existingMarkersRef here - we want to keep markers for reuse
      };
    };
    
    updateMarkersAsync();
  }, [mapRef, groupedPosts, groupedRegistrations, selectedCategories, readPostIds]);

  // Handle zoom changes to update cluster marker sizes
  useEffect(() => {
    if (!mapRef || !clusterRef.current) return;
    
    const handleZoomChange = () => {
      // Small delay to ensure zoom has completed
      setTimeout(() => {
        // Get current markers
        const currentMarkers = markersRef.current;
        if (currentMarkers.length > 0) {
          // Clear the existing cluster
          clusterRef.current.clearMarkers();
          clusterRef.current.setMap(null);
          
          // Create new cluster with updated renderer
          const newCluster = new MarkerClusterer({
            map: mapRef,
            markers: currentMarkers,
            renderer: createClusterRenderer(mapRef, readPostIds, groupedPosts, {type: "page"}),
            algorithmOptions: {
              maxZoom: 12,
              radius: 80,
            },
          });

          newCluster.addListener('click', (event, cluster, map) => {
            handleClusterClick(event, cluster, map);
          });
          
          clusterRef.current = newCluster;
        }
      }, 100);
    };
    
    const zoomListener = mapRef.addListener('zoom_changed', handleZoomChange);
    
    return () => {
      if (zoomListener) {
        google.maps.event.removeListener(zoomListener);
      }
    };
  }, [mapRef]);

  // Auto-refresh posts data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (availableLanguages.length > 0) {
        fetchPostsData(null, pageId, true); // true = auto-refresh
        setLastFetchTime(Date.now());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchPostsData, pageId]);

    // Initialize selected categories when post categories are loaded
  useEffect(() => {
    if (postCategories.length > 0) {
      const categoryNames = postCategories
        .filter(cat => cat.name !== 'Default')
        .map(cat => cat.name);
      setSelectedCategories(categoryNames);
    }
  }, [postCategories]);

  // Cleanup all markers on component unmount
  useEffect(() => {
    return () => {
      // Clean up all markers when component unmounts
      existingMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      existingMarkersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    // Mark previous news as read when location changes
    if (prevSelectedLocationRef.current && prevSelectedLocationRef.current !== selectedLocation) {
      const prevLocationKey = prevSelectedLocationRef.current.key;
      const prevPostsGroup = groupedPosts[prevLocationKey];
      if (prevPostsGroup && prevPostsGroup.length > 0) {
        const prevPosts = prevPostsGroup[currentPostIndex] || prevPostsGroup[0];
        if (prevPosts) {
          markPostAsRead(prevPosts.id);
        }
      }
    }

    // Update ref to current location
    prevSelectedLocationRef.current = selectedLocation;

  }, [selectedLocation, groupedPosts, currentPostIndex, markPostAsRead,]);

  // Reset profile view when location changes
  useEffect(() => {
    setShowUserProfile(false);
  }, [selectedLocation]);

  // Handle marker click
  const handleMarkerClick = useCallback((locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentPostIndex(index);
  }, []);

  // Handle map load
  const handleMapLoad = (map) => {
    setMapRef(map);

    // Inject custom style to adjust controls after map is fully loaded
    applyGoogleMapsControlStyle(); 
    
    // Add map interaction listeners to track user interaction
    const addInteractionListeners = () => {
      map.addListener('dragstart', () => {
        userHasInteractedRef.current = true;
      });
      
      map.addListener('zoom_changed', () => {
        // Only mark as interaction if it's not the initial zoom
        if (!isInitialLoadRef.current) {
          userHasInteractedRef.current = true;
        }
      });

      // Also track clicks on the map
      map.addListener('click', () => {
        userHasInteractedRef.current = true;
      });
    };

    // Add listeners immediately but mark initial load as complete after delay
    addInteractionListeners();
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);
    
    // Add listeners after a short delay to avoid initial load events
    setTimeout(addInteractionListeners, 1000);
  };

  // Navigate through possts at the same location
  const handleNextPost = () => {
    if (selectedLocation && groupedPosts[selectedLocation.key]) {
      const maxIndex = groupedPosts[selectedLocation.key].length - 1;
      setCurrentPostIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
    }
  };

  const handlePrevPost = () => {
    setCurrentPostIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPostLikes(prev => ({
          ...prev,
          [postId]: data.liked
        }));
        
        // Update like count
        setPostLikeCounts(prev => ({
          ...prev,
          [postId]: data.liked 
            ? (prev[postId] || 0) + 1 
            : Math.max((prev[postId] || 0) - 1, 0)
        }));
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  // Function to handle registration modal submission
  const handleRegistrationSubmit = (result) => {
    console.log('Registration successful:', result);
    // You can add any additional logic here, like updating UI state
    // The modal will automatically redirect to the apply_link after submission
  };

  // Get current post item for the info window
  const getCurrentPostItem = () => {
    if (!selectedLocation || !groupedPosts[selectedLocation.key]) return null;
    return groupedPosts[selectedLocation.key][currentPostIndex];
  };

  const currentPost = getCurrentPostItem();

  const selectedPostGroup = selectedLocation ? groupedPosts[selectedLocation.key] : [];

  // 4. ADD this new function for handling registration marker clicks (place it with your other event handlers)
  const handleRegistrationMarkerClick = useCallback((locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentRegistrationIndex(index);
    setShowRegistrationDetails(true);
  }, []);

  // 5. ADD this helper function for registration navigation (place it with your other helper functions)
  const handleNextRegistration = () => {
    const selectedRegs = selectedLocation ? groupedRegistrations[selectedLocation.key] : [];
    if (currentRegistrationIndex < selectedRegs.length - 1) {
      setCurrentRegistrationIndex(currentRegistrationIndex + 1);
    }
  };

  const handlePrevRegistration = () => {
    if (currentRegistrationIndex > 0) {
      setCurrentRegistrationIndex(currentRegistrationIndex - 1);
    }
  };

  // 6. ADD this function to get current registration item (place it with your other helper functions)
  const getCurrentRegistrationItem = () => {
    if (!selectedLocation || !groupedRegistrations[selectedLocation.key]) return null;
    return groupedRegistrations[selectedLocation.key][currentRegistrationIndex];
  };

  const currentItem = showRegistrationDetails ? getCurrentRegistrationItem() : getCurrentPostItem();

  // --- Tourism Specific Handlers ---
  const handleAcceptItem = (item) => {
    if (!acceptedItems.find(i => i.id === item.id)) {
      setAcceptedItems(prev => [...prev, item]);
    }
    setShowDetailModal(false);
    setActiveCategoryMarker(null);
  };

  const handleDenyItem = (itemId) => {
    setDeniedItemIds(prev => new Set([...prev, itemId]));
    setShowDetailModal(false);
    setActiveCategoryMarker(null);
  };

  const handleQRScan = (item) => {
    setQRSuccess(true);
    setTimeout(() => {
      setQRSuccess(false);
      setShowQRModal(false);
      setAcceptedItems(prev => prev.filter(i => i.id !== item.id));
    }, 2000);
  };

  const handleShowRoute = (item) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
    window.open(url, '_blank');
  };

  const filteredDistricts = (STATIC_DISTRICT_DATA["Kerala"] ? Object.keys(STATIC_DISTRICT_DATA["Kerala"]) : [])
    .filter(d => d.toLowerCase().includes(districtSearchQuery.toLowerCase()));


  return (
    <div className="relative">
    
      {/* <PagePostCreation
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pageId={pageId}
      /> */}

      <>
        {/* Filter Controls - Top Right */}
        <div className="absolute top-3 right-4 z-10 flex items-end gap-2">
          {pageId && (
            <>
              {isMobile ? (
                <div className="flex gap-2 items-end">

                  {/* {isOwner && (
                  <button
                    onClick={() => setShowModal(true)}
                    // className='bg-blue-600 text-white font-medium rounded-lg p-2 text-xs shadow-sm hover:bg-blue-700 transition duration-200 ease-in-out min-w-[48px] h-[24px] '
                    className='bg-blue-600 text-white flex items-center justify-center rounded-lg p-2 shadow-sm hover:bg-blue-700 transition duration-200 ease-in-out'
                    style={buttonStyle}
                  >
                    Create Post
                  </button>
                  )} */}

                  <MobileFilterDropdown
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    showFiltersDropdown={showFiltersDropdown}
                    setShowFiltersDropdown={setShowFiltersDropdown}
                    buttonStyle={buttonStyle}
                    postCategories={postCategories}
                    fetchPostsData={fetchPostsData}
                    mapRef={mapRef}
                  />

                </div>
              ) : (
                <div className="flex gap-2">
                  {/* {isOwner && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
                      style={buttonStyle}
                    >
                      Create Post
                    </button>
                  )} */}
                  <PostFilterPanel
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    buttonStyle={buttonStyle}
                    postCategories={postCategories}
                    getCategoryByName={getCategoryByName}
                  />

                  <ResetMapButton
                    mapRef={mapRef}
                    fetchPostsData={fetchPostsData}
                    setSelectedLocation={setSelectedLocation}
                    id={pageId}
                    isMobile={isMobile}
                    buttonStyle={buttonStyle}
                  />

                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Reset Button - positioned where pan control used to be */}
        {isMobile && (
          <div className="absolute right-1 z-10" style={{ bottom: '238px' }}>
              <ResetMapButton
                mapRef={mapRef}
                fetchPostsData={fetchPostsData}
                setSelectedLocation={setSelectedLocation}
                id={pageId}
                isMobile /* true */
                buttonStyle={buttonStyle}
              />
          </div>
        )}
      </>

      {/* --- Tourism UI Components --- */}
      
      {/* 1. District Filter (Top Left) */}
      <div className="absolute top-4 left-4 z-[100] flex flex-col gap-2">
        <div className="relative group">
          <button 
            onClick={() => setIsDistrictFilterOpen(!isDistrictFilterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl hover:bg-white transition-all duration-300 group"
          >
            <div className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Search size={16} />
            </div>
            <span className="font-semibold text-gray-700 min-w-[120px] text-left">
              {selectedDistrict || "Select District"}
            </span>
          </button>

          {isDistrictFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-3 border-b border-gray-100">
                <input 
                  type="text"
                  placeholder="Search districts..."
                  className="w-full px-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={districtSearchQuery}
                  onChange={(e) => setDistrictSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                {filteredDistricts.map(dist => (
                  <button
                    key={dist}
                    onClick={() => {
                      setSelectedDistrict(dist);
                      setIsDistrictFilterOpen(false);
                      setDistrictSearchQuery("");
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedDistrict === dist 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {dist}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedDistrict && (
          <button 
            onClick={() => setSelectedDistrict(null)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors w-fit shadow-md animate-in fade-in slide-in-from-left-2"
          >
            <X size={12} /> Clear Filter
          </button>
        )}
      </div>

      {/* 2. Accepted Items Stack (Left Side) */}
      {acceptedItems.length > 0 && (
        <div className="absolute left-4 top-24 z-[90] flex flex-col gap-3 pointer-events-none">
          {acceptedItems.map((item, idx) => (
            <div 
              key={item.id}
              className="pointer-events-auto group relative animate-in slide-in-from-left-8 duration-500"
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <button
                onClick={() => {
                  setSelectedDetailItem(item);
                  setShowDetailModal(true);
                }}
                className={`w-14 h-14 rounded-2xl shadow-2xl border-2 p-1 overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 ${
                  selectedDetailItem?.id === item.id ? 'border-orange-500 scale-105' : 'border-white'
                }`}
              >
                <img src={item.image} className="w-full h-full object-cover rounded-xl" alt="" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                
                {/* Status dot */}
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
              </button>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-gray-800">
                {item.title}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Tourism Category Filter (Vertical Stack on Right) */}
      {selectedDistrict && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[50] pointer-events-none">
          {[
            { name: 'Challenges', icon: Target, color: 'text-orange-500' },
            { name: 'Places', icon: MapPin, color: 'text-green-500' },
            { name: 'Food', icon: Utensils, color: 'text-red-500' },
            { name: 'Activity', icon: Activity, color: 'text-purple-500' },
            { name: 'Events', icon: Calendar, color: 'text-indigo-500' }
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveDiscoveryCategory(activeDiscoveryCategory === cat.name ? null : cat.name)}
              title={cat.name}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 ${
                activeDiscoveryCategory === cat.name 
                  ? 'bg-gray-900 text-white border-gray-800 scale-110' 
                  : 'bg-white text-gray-500 border-white hover:border-gray-100'
              }`}
            >
              <cat.icon size={24} className={activeDiscoveryCategory === cat.name ? 'text-white' : cat.color} />
            </button>
          ))}
        </div>
      )}

      {/* 4. State Category Content (Floating window) */}
      {activeDiscoveryCategory && (
        <StateCategoryContent 
          category={activeDiscoveryCategory}
          district={selectedDistrict}
          itemsData={categoryMarkers.filter(m => m.category === activeDiscoveryCategory)}
          onClose={() => setActiveDiscoveryCategory(null)}
        />
      )}

      {/* Show message when community is selected but no posts */}
      {!isLoading && pageId && postsItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-5">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Posts Found</h3>
            <p className="text-gray-600">No posts available</p>
          </div>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: false,
          panControl: false,
          rotateControl: false,
          scaleControl: false,
          gestureHandling: "greedy",
          clickableIcons: false,
          minZoom: 2,
          maxZoom: 18,
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180,
            },
            strictBounds: true,
          },
          disableDefaultUI: true,
        }}
        onLoad={handleMapLoad}
      >
        {/* Custom Map Type Controls */}
        <MapTypeControls mapRef={mapRef} buttonStyle={buttonStyle}/>

        {/* Custom Zoom Controls */}
        <ZoomControls mapRef={mapRef} isMobile={isMobile}/>

        {/* Help Button below ZoomControls */}
        {/* <HelpButton isMobile={isMobile} /> */}

        {currentItem && (
          <InfoWindowF
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={() => {
              setSelectedLocation(null);
              setShowRegistrationDetails(false);
              setShowUserProfile(false);
              setCurrentRegistrationIndex(0);
            }}
            options={{
              pixelOffset: new window.google.maps.Size(0, -5),
              disableAutoPan: false,
              maxWidth: window.innerWidth < 640 ? 280 : 320
            }}
          >
            <MapCard
              post={currentItem} // ✅ Use the currentItem here
              user={user}
              onClose={() => {
                setSelectedLocation(null);
                setShowRegistrationDetails(false);
                setShowUserProfile(false);
                setCurrentRegistrationIndex(0);
              }}
              onPrev={showRegistrationDetails ? handlePrevRegistration : handlePrevPost}
              onNext={showRegistrationDetails ? handleNextRegistration : handleNextPost}
              // readPostIds={readPostIds}
              currentIndex={showRegistrationDetails ? currentRegistrationIndex : currentPostIndex}
              totalItems={
                showRegistrationDetails
                  ? (groupedRegistrations[selectedLocation?.key]?.length || 0)
                  : selectedPostGroup.length
              }
              onLike={handleLikePost}
              isLiked={postLikes[currentItem.id]}
              likeCount={postLikeCounts[currentItem.id] || 0}
              onProfileClick={() => setShowUserProfile(true)}
              onApplyClick={() => setShowRegistrationModal(true)}
              showRegistrationDetails={showRegistrationDetails}
              onBackFromRegistration={() => setShowRegistrationDetails(false)}
              getCurrentRegistrationItem={getCurrentRegistrationItem}
              currentRegistrationIndex={currentRegistrationIndex}
              showUserProfile={showUserProfile}
              onBackFromProfile={() => setShowUserProfile(false)}
            />
          </InfoWindowF>
        )}

        {/* --- Tourism Static Markers --- */}
        {isTourismPage && categoryMarkers.map((marker, index) => (
          <MarkerF
            key={`tourism-marker-${marker.id}-${index}`}
            position={marker.position}
            zIndex={100}
            onClick={() => {
              setActiveCategoryMarker(marker.id);
              setActiveDiscoveryCategory(marker.category);
            }}
            icon={{
              url: getMarkerIcon(marker.category, activeCategoryMarker === marker.id, false),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20)
            }}
          />
        ))}

        {/* --- Tourism InfoWindow --- */}
        {isTourismPage && activeCategoryMarker && (() => {
          const markerData = categoryMarkers.find(m => m.id === activeCategoryMarker);
          if (!markerData) return null;
          return (
            <InfoWindowF
              position={markerData.position}
              onCloseClick={() => { setActiveCategoryMarker(null); }}
              options={{
                pixelOffset: new window.google.maps.Size(0, -35),
                maxWidth: 320
              }}
            >
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className={`p-1 rounded text-white ${
                     markerData.category === 'Challenges' ? 'bg-orange-500' :
                     markerData.category === 'Places' ? 'bg-green-500' :
                     markerData.category === 'Food' ? 'bg-red-500' :
                     markerData.category === 'Activity' ? 'bg-purple-500' :
                     markerData.category === 'Events' ? 'bg-indigo-500' : 'bg-blue-500'
                   }`}>
                     {markerData.category === 'Challenges' ? <Target size={14} /> :
                      markerData.category === 'Places' ? <MapPin size={14} /> :
                      markerData.category === 'Food' ? <Utensils size={14} /> :
                      markerData.category === 'Activity' ? <Activity size={14} /> :
                      markerData.category === 'Events' ? <Calendar size={14} /> : <Star size={14} />}
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wider">{markerData.category}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{markerData.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{markerData.description || "Historical and cultural landmark in Kerala."}</p>
                <button 
                  onClick={() => {
                    // This will open the side panel
                    setActiveDiscoveryCategory(markerData.category);
                  }}
                  className="w-full py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </InfoWindowF>
          );
        })()}
      </GoogleMap>

      {/* Add the modal at the very end, after the InfoWindowF closing tag */}
      {showRegistrationModal && (
        <PostRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          post={currentPost}
          onSubmit={handleRegistrationSubmit}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-10">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
            <span>Loading Data...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 py-2 px-4 rounded-full shadow-md z-10">
          {error}
        </div>
      )}
    </div>
  );
}