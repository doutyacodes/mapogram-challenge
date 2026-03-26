"use client"
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMediaQuery } from 'react-responsive';
import { GoogleMap, InfoWindowF, MarkerF } from "@react-google-maps/api";
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import toast from "react-hot-toast";
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
import GlobalApi from "@/app/api/GlobalApi";
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
  const [districtPages, setDistrictPages] = useState([]);
  const [geofenceData, setGeofenceData] = useState(null);
  const [categoryMarkers, setCategoryMarkers] = useState([]);
  const [activeCategoryMarker, setActiveCategoryMarker] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [activeDiscoveryCategory, setActiveDiscoveryCategory] = useState(null);
  const [activeCardTab, setActiveCardTab] = useState('Rules');

  const [isTourismPage, setIsTourismPage] = useState(false);

  useEffect(() => {
    // Dynamically check if current page is a Tourism parent or a District page
    const checkTourismStatus = async () => {
      if (!pageId) return;
      
      // Basic check for hardcoded Kerala/Karnataka IDs as fallback (including 10000)
      if (Number(pageId) === 999991 || Number(pageId) === 999992 || Number(pageId) === 10000) {
        setIsTourismPage(true);
      }

      try {
        const res = await GlobalApi.GetMapDistricts();
        const districtsList = res.data.data || [];
        console.log("[TOURISM] ALL Districts from API:", districtsList.length, districtsList.map(d => `${d.name} (${d.page_id})`));
        setDistrictPages(districtsList);
        
        // If this page acts as the structural parent for ALL districts (e.g. 10000), 
        // we don't automatically select a single district (they see the whole state).
        const districtsOnThisPage = districtsList.filter(d => Number(d.page_id) === Number(pageId));
        
        if (districtsOnThisPage.length > 0) {
          setIsTourismPage(true);
          // Only auto-select if there is EXACTLY one district mapped to this page
          // (Legacy behavior for when districts were independent pages)
          if (districtsOnThisPage.length === 1 && !selectedDistrict) {
             console.log("[TOURISM] Legacy Parent: Auto-selecting unique district:", districtsOnThisPage[0].name);
             setSelectedDistrict(districtsOnThisPage[0].name);
          }
        }
      } catch (e) {
        console.error("Tourism check failed", e);
      }
    };
    checkTourismStatus();
  }, [pageId, selectedDistrict, setSelectedDistrict]);

  
  const [isDistrictFilterOpen, setIsDistrictFilterOpen] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState("");
  
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [deniedItemIds, setDeniedItemIds] = useState(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [qrSuccess, setQRSuccess] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const triggeredPopupsRef = useRef(new Set());
  
  // Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Distance validation and Auto Popup/Complete Trigger
  useEffect(() => {
    if (!userLocation || !categoryMarkers || categoryMarkers.length === 0 || !window.google) return;
    
    categoryMarkers.forEach((marker) => {
      if (!marker || !marker.position) return;
      
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        new window.google.maps.LatLng(marker.position.lat, marker.position.lng)
      );

      // Dynamic Radius trigger (from DB, default 20m)
      const dynamicRadius = marker.radius_meters || 20;

      // Trigger logic
      if (distance < dynamicRadius) {
        const isAlreadyAccepted = acceptedItems.some(i => i.id === marker.id);
        
        if (!isAlreadyAccepted && !triggeredPopupsRef.current.has(marker.id)) {
            // New Discovery: Show Detail Modal
            triggeredPopupsRef.current.add(marker.id);
            setSelectedDetailItem(marker);
            setShowDetailModal(true);
            setActiveDetailTab('Rules');
            toast.success(`You are within range of ${marker.title}!`);
        }
      }
    });
  }, [userLocation, categoryMarkers, acceptedItems]);

  
  const isWithinRadius = useCallback((item) => {
    if (!userLocation || !item || !item.position || !window.google) return false;
    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
      new window.google.maps.LatLng(item.position.lat, item.position.lng)
    );
    const dynamicRadius = item.radius_meters || 20;
    return distance <= dynamicRadius;
  }, [userLocation]);

  // Detail Modal States
  const [activeDetailTab, setActiveDetailTab] = useState('Rules');

  const geofenceSetupCompleteRef = useRef(false);
  const tourismMarkersRef = useRef([]);

  const getCategoryByName = (categoryName) => {
    return postCategories.find(cat => cat.name === categoryName) || { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280', class_name: '' };
  };

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

  // Fetch Geofence and Districts
  const fetchTourismData = useCallback(async () => {
    try {
      const res = await GlobalApi.GetMapDistricts();
      const districts = res.data.data || [];
      setDistrictPages(districts);

      // Build a FeatureCollection from all district geofences
      const features = districts.map(d => {
        if (!d.geojson) return null;
        let geojsonObj = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
        return {
          type: "Feature",
          properties: { name: d.name, district: d.name, page_id: d.page_id },
          geometry: geojsonObj
        };
      }).filter(Boolean);

      setGeofenceData({
        type: "FeatureCollection",
        features
      });
    } catch (err) {
      console.error("Error fetching tourism data:", err);
      setGeofenceData(null);
      setError("Failed to load tourism data.");
    } finally {
      setIsLoading(false); // Ensure loading is stopped
      console.log("[TOURISM] fetchTourismData finished.");
    }
  }, []);

  useEffect(() => {
    if (pageId && isTourismPage) {
      console.log("[TOURISM] Triggering fetchTourismData due to pageId or isTourismPage change.");
      fetchTourismData();
    } else {
      console.log("[TOURISM] Not fetching tourism data. pageId:", pageId, "isTourismPage:", isTourismPage);
      // If conditions are not met, ensure loading state is reset
      setIsLoading(false);
    }
    // Safety timeout to ensure loading doesn't hang
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("[TOURISM] Loading timeout reached, forcing isLoading to false.");
        setIsLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [pageId, isTourismPage, fetchTourismData, isLoading]);

  // Calculate actual center of selected district for marker grouping
  const districtCenter = useMemo(() => {
    if (!geofenceData || !selectedDistrict) return null;
    const feature = geofenceData.features.find(f => (f.properties.name || f.properties.district) === selectedDistrict);
    if (!feature) return null;

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    
    if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.flat(1).forEach(polygon => {
        polygon[0].forEach(coord => {
          if (coord[1] < minLat) minLat = coord[1];
          if (coord[1] > maxLat) maxLat = coord[1];
          if (coord[0] < minLng) minLng = coord[0];
          if (coord[0] > maxLng) maxLng = coord[0];
        });
      });
    } else {
      feature.geometry.coordinates[0].forEach(coord => {
        if (coord[1] < minLat) minLat = coord[1];
        if (coord[1] > maxLat) maxLat = coord[1];
        if (coord[0] < minLng) minLng = coord[0];
        if (coord[0] > maxLng) maxLng = coord[0];
      });
    }

    if (minLat === 90) {
      console.warn("[TOURISM] Invalid centroid calculation for", selectedDistrict);
      return null;
    }

    const calculated = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    };
    console.log("[TOURISM] Centroid for", selectedDistrict, ":", calculated, "From feature", feature.properties.name);
    return calculated;
  }, [geofenceData, selectedDistrict]);

  const mapCenter = useMemo(() => {
    if (isTourismPage && districtCenter) {
      return { lat: districtCenter.lat, lng: districtCenter.lng };
    }
    return countryCenter;
  }, [isTourismPage, districtCenter]);

  const mapZoom = useMemo(() => {
    if (isTourismPage && selectedDistrict) return 9;
    return DEFAULT_ZOOM;
  }, [isTourismPage, selectedDistrict]);

  // Pan map when district center changes
  useEffect(() => {
    if (mapRef && districtCenter) {
      mapRef.panTo({ lat: districtCenter.lat, lng: districtCenter.lng });
      // Use a more appropriate zoom for districts
      if (mapRef.getZoom() < 8) {
        mapRef.setZoom(10);
      }
    }
  }, [mapRef, districtCenter]);

  // Unified tourism markers logic (Scattering)
  const visibleTourismMarkers = useMemo(() => {
    if (!isTourismPage || !selectedDistrict || !districtCenter) return [];

    const categories = ['Challenges', 'Places', 'Food', 'Activity', 'Events'];
    let finalMarkers = [];

    categories.forEach((cat) => {
      // If category is filtered out by FAB, skip
      if (activeDiscoveryCategory && activeDiscoveryCategory !== cat) return;

      const items = categoryMarkers.filter(m => m.category === cat && !deniedItemIds.has(m.id));
      if (items.length === 0) return;

      // SCATTERED: Show individual markers at their real positions
      finalMarkers.push(...items.map(item => ({
        ...item,
        isGroup: false
      })));
    });

    return finalMarkers;
  }, [isTourismPage, selectedDistrict, districtCenter, categoryMarkers, activeDiscoveryCategory, deniedItemIds]);

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
    if (!selectedDistrict || districtPages.length === 0) {
      setCategoryMarkers([]);
      return;
    }

    const currentDistrict = districtPages.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
    if (!currentDistrict) return;

    const fetchDistrictChallenges = async () => {
      try {
        const res = await GlobalApi.GetMapChallenges(null, currentDistrict.page_id);
        const challenges = res.data.data || [];
        
        const newMarkers = [];
        
        challenges.forEach(challenge => {
          // Determine Mapogram Category based on Wowfy frequency/exp_type
          let category = 'Challenges';
          if (challenge.frequency === 'food' || challenge.exp_type === 'breakfast' || challenge.exp_type === 'biriyani') category = 'Food';
          else if (challenge.frequency === 'contest' || challenge.frequency === 'quiz') category = 'Activity';
          else if (challenge.frequency === 'event') category = 'Events';
          else if (challenge.exp_type === 'arts' || challenge.frequency === 'experience') category = 'Places';

          if (activeDiscoveryCategory && category !== activeDiscoveryCategory) return;
          if (deniedItemIds.has(challenge.id)) return;

          // Deterministic scatter for empty coordinates so markers don't stack
          const latOffset = challenge.latitude ? 0 : ((challenge.id % 10) * 0.015 - 0.075);
          const lngOffset = challenge.longitude ? 0 : (((challenge.id * 7) % 10) * 0.015 - 0.075);

          // Push into markers
          newMarkers.push({
            id: challenge.id,
            ...challenge,
            category,
            position: { 
              lat: parseFloat(challenge.latitude) || ((districtCenter?.lat && !isNaN(districtCenter.lat)) ? districtCenter.lat + latOffset : 8.524), 
              lng: parseFloat(challenge.longitude) || ((districtCenter?.lng && !isNaN(districtCenter.lng)) ? districtCenter.lng + lngOffset : 76.936)
            }
          });
        });

        setCategoryMarkers(newMarkers);
        console.log(`[TOURISM] Generated ${newMarkers.length} markers for ${selectedDistrict} via API.`);
      } catch (error) {
        console.error("Failed to fetch district challenges:", error);
      }
    };

    fetchDistrictChallenges();
  }, [selectedDistrict, deniedItemIds, activeDiscoveryCategory, districtPages, districtCenter]);

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

        // Add proper click listener directly natively
        window.google.maps.event.addListener(polygon, 'click', () => {
          console.log('[TOURISM] Clicked on map district:', data.name);
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

  const filteredDistricts = districtPages
    .map(d => d.name)
    .filter(name => name.toLowerCase().includes(districtSearchQuery.toLowerCase()));

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
      
      {/* 1. Map District Interactions (Replaces Top Left Dropdown) */}
      <div className="absolute top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {selectedDistrict && (
          <div className="flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
              <span className="font-black text-gray-800 tracking-wider text-sm uppercase">
                {selectedDistrict}
              </span>
            </div>
            <button 
              onClick={() => setSelectedDistrict(null)}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors w-fit shadow-md animate-in fade-in slide-in-from-left-2"
            >
              <X size={12} /> Clear Filter
            </button>
          </div>
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
                <img src={item.media?.[0]?.media_url || '/placeholder.jpg'} className="w-full h-full object-cover rounded-xl" alt="" />
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

      {/* 4. State Category Content Removed - Directly going to Details */}

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

        {/* --- Tourism Static Markers (Grouped or Scattered) --- */}
        {isTourismPage && visibleTourismMarkers.map((marker, index) => (
          <MarkerF
            key={`tourism-marker-${marker.id}-${index}`}
            position={marker.position}
            zIndex={marker.isGroup ? 110 : 100}
            onClick={() => {
              if (marker.isGroup) {
                setExpandedCategory(marker.category);
              } else {
                setActiveCategoryMarker(marker.id);
                setActiveDiscoveryCategory(marker.category);
              }
            }}
            icon={{
              url: getMarkerIcon(marker.category, activeCategoryMarker === marker.id, marker.isGroup),
              scaledSize: marker.isGroup ? new window.google.maps.Size(46, 46) : new window.google.maps.Size(38, 38),
              anchor: marker.isGroup ? new window.google.maps.Point(23, 23) : new window.google.maps.Point(19, 19)
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
              <div className="bg-white rounded-[2rem] overflow-hidden font-sans relative w-[240px] sm:w-[280px] transition-all duration-300">
                <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-50">
                  <div className="flex items-center gap-2">
                     <div className={`p-1 rounded text-white ${
                       markerData.category === 'Challenges' ? 'bg-orange-500' :
                       markerData.category === 'Places' ? 'bg-green-500' :
                       markerData.category === 'Food' ? 'bg-red-500' :
                       markerData.category === 'Activity' ? 'bg-purple-500' :
                       markerData.category === 'Events' ? 'bg-indigo-500' : 'bg-blue-500'
                     }`}>
                       {markerData.category === 'Challenges' ? <Target size={12} /> :
                        markerData.category === 'Places' ? <MapPin size={12} /> :
                        markerData.category === 'Food' ? <Utensils size={12} /> :
                        markerData.category === 'Activity' ? <Activity size={12} /> :
                        markerData.category === 'Events' ? <Calendar size={12} /> : <Star size={12} />}
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{markerData.category}</span>
                  </div>
                  <button onClick={() => setActiveCategoryMarker(null)} className="text-gray-300 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 shadow-inner">
                    <img src={markerData.media?.[0]?.media_url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-1 leading-tight">{markerData.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black uppercase">
                      Entry: {markerData.entry_points ? `${markerData.entry_points} Pts` : 'Free'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDetailItem(markerData);
                      setShowDetailModal(true);
                      setActiveDetailTab('Rules');
                      setActiveCategoryMarker(null);
                    }}
                    className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </InfoWindowF>
          );
        })()}
      </GoogleMap>

      {/* --- Detailed Sliding Modal (Ported from legacy setup) --- */}
      {showDetailModal && selectedDetailItem && (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto" 
            onClick={() => setShowDetailModal(false)}
          />
          
          <div className={`
            ${isMobile ? 'w-[85%] h-[85%] my-auto mr-0 rounded-l-[2.5rem]' : 'w-[30%] h-[85%] my-auto mr-0 rounded-l-[3rem]'} 
            bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] pointer-events-auto animate-in slide-in-from-right duration-500 flex flex-col relative overflow-hidden border border-gray-100/50
          `}>
            {/* Header */}
            <div className="bg-white p-6 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white ${
                  selectedDetailItem.category === 'Challenges' ? 'bg-orange-500' :
                  selectedDetailItem.category === 'Places' ? 'bg-green-500' :
                  selectedDetailItem.category === 'Food' ? 'bg-red-500' :
                  selectedDetailItem.category === 'Activity' ? 'bg-purple-500' :
                  selectedDetailItem.category === 'Events' ? 'bg-indigo-500' : 'bg-blue-500'
                }`}>
                  {selectedDetailItem.category === 'Challenges' ? <Target size={16} /> :
                   selectedDetailItem.category === 'Places' ? <MapPin size={16} /> :
                   selectedDetailItem.category === 'Food' ? <Utensils size={16} /> :
                   selectedDetailItem.category === 'Activity' ? <Activity size={16} /> :
                   selectedDetailItem.category === 'Events' ? <Calendar size={16} /> : <Star size={16} />}
                </div>
                <span className="font-black text-blue-600 text-xs tracking-[0.2em] uppercase">
                  {selectedDetailItem.category}
                </span>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
              <div className="px-6 py-4 text-center">
                 <h2 className="text-gray-900 text-2xl font-black tracking-tight leading-tight uppercase mb-4">
                  {selectedDetailItem.title}
                </h2>
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-56 relative mb-6">
                  <img src={selectedDetailItem.media?.[0]?.media_url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                {['Rules', 'People', 'Leaderboard'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative transition-all ${
                      activeDetailTab === tab ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {tab}
                    {activeDetailTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full mx-4" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeDetailTab === 'Rules' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">{selectedDetailItem.description || "Historical and cultural landmark."}</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 text-center">
                          <span className="text-[8px] uppercase font-black text-blue-400 block mb-1">Price</span>
                          <span className="text-lg font-black text-blue-700">{selectedDetailItem.entry_points ? `${selectedDetailItem.entry_points} Pts` : 'Free'}</span>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-3xl border border-yellow-100 text-center">
                          <span className="text-[8px] uppercase font-black text-yellow-500 block mb-1">Prize</span>
                          <span className="text-lg font-black text-yellow-700">{selectedDetailItem.reward_points || 0} Pts</span>
                        </div>
                    </div>
                  </div>
                )}
                {/* Simplified People & Leaderboard for now */}
                {(activeDetailTab === 'People' || activeDetailTab === 'Leaderboard') && (
                  <div className="text-center py-10">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No data available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-50">
               {acceptedItems.find(i => i.id === selectedDetailItem.id) ? (
                 <div className="flex gap-3">
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedDetailItem.position.lat},${selectedDetailItem.position.lng}`, '_blank')}
                      className="flex-1 bg-blue-600 text-white font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Navigation2 size={16} /> ROUTE
                    </button>
                    <button 
                      onClick={() => setShowQRModal(true)}
                      className="flex-1 bg-orange-500 text-white font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2"
                    >
                      <QrCode size={16} /> SCAN
                    </button>
                 </div>
               ) : deniedItemIds.has(selectedDetailItem.id) ? (
                  <div className="text-center text-gray-400 font-black text-[10px] py-4 uppercase tracking-[0.2em]">Item Hidden</div>
               ) : (
                 <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const inRange = isWithinRadius(selectedDetailItem);
                        if (!inRange) {
                          toast.error("You must be closer to the location to complete this!");
                          return;
                        }
                        if (selectedDetailItem.category === 'Food' || selectedDetailItem.category === 'Events') {
                          setShowQRModal(true);
                        } else {
                          setShowUploadModal(true);
                        }
                      }}
                      className={`flex-1 font-black text-xs py-4 rounded-2xl flex justify-center items-center shadow-lg transition-all ${isWithinRadius(selectedDetailItem) ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'}`}
                    >
                      {!isWithinRadius(selectedDetailItem) ? 'TOO FAR AWAY' : (selectedDetailItem.category === 'Food' || selectedDetailItem.category === 'Events' ? 'SCAN QR' : 'UPLOAD MEDIA')}
                    </button>
                    <button 
                      onClick={() => {
                        setDeniedItemIds(prev => new Set([...prev, selectedDetailItem.id]));
                        setShowDetailModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white font-black text-xs py-4 rounded-2xl"
                    >
                      HIDE
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* --- QR Scan Simulation Modal --- */}
      {showQRModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-300">
             <button onClick={() => !qrScanning && setShowQRModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
               <X className="w-5 h-5 text-gray-500" />
             </button>
             <h2 className="text-3xl font-black mb-2">Scan QR Code</h2>
             <p className="text-gray-400 text-sm mb-8 font-bold">Verification processing...</p>
             
             <div className="aspect-square w-full max-w-[240px] mx-auto mb-8 rounded-[2.5rem] border-4 border-dashed border-blue-100 flex items-center justify-center relative overflow-hidden bg-gray-50">
                {qrSuccess ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-green-500 text-white animate-in zoom-in">
                    <CheckCircle size={80} className="mb-4" />
                    <p className="font-black text-2xl uppercase tracking-widest">SUCCESS</p>
                  </div>
                ) : (
                  <div className={`transition-opacity duration-300 ${qrScanning ? 'opacity-100' : 'opacity-20'}`}>
                    <QrCode size={120} className={qrScanning ? 'animate-pulse' : ''} />
                  </div>
                )}
                {qrScanning && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_blue] animate-bounce" style={{ top: '50%' }} />}
             </div>

             {!qrSuccess && (
               <button 
                 onClick={() => {
                   setQrScanning(true);
                   setTimeout(() => {
                     setQrScanning(false);
                     setQRSuccess(true);
                     setTimeout(() => {
                       setShowQRModal(false);
                       setShowUploadModal(true); // Ask for image upload after QR code for food
                       setQRSuccess(false);
                     }, 1500);
                   }, 2000);
                 }}
                 disabled={qrScanning}
                 className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl text-lg hover:bg-blue-700 transition-all disabled:bg-gray-100 disabled:text-gray-400"
               >
                 {qrScanning ? 'VERIFYING...' : 'SIMULATE SCAN'}
               </button>
             )}
          </div>
        </div>
      )}

      {/* --- Upload Media Simulation Modal --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-300">
             <button onClick={() => !uploading && setShowUploadModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
               <X className="w-5 h-5 text-gray-500" />
             </button>
             <h2 className="text-3xl font-black mb-2">Upload Evidence</h2>
             <p className="text-gray-400 text-sm mb-8 font-bold">Provide an image or video.</p>
             
             <div className="aspect-square w-full max-w-[240px] mx-auto mb-8 rounded-[2.5rem] border-4 border-dashed border-indigo-100 flex items-center justify-center relative overflow-hidden bg-gray-50">
                {uploadSuccess ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-[#00C853] text-white animate-in zoom-in">
                    <CheckCircle size={80} className="mb-4" />
                    <p className="font-black text-2xl uppercase tracking-widest">COMPLETED</p>
                  </div>
                ) : (
                  <div className={`transition-opacity duration-300 ${uploading ? 'opacity-100 animate-pulse text-indigo-500' : 'opacity-30 text-gray-400'} flex flex-col items-center justify-center`}>
                    <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <span className="font-black tracking-widest uppercase text-sm">{uploading ? 'UPLOADING...' : 'TAP TO BROWSE'}</span>
                  </div>
                )}
             </div>

             {!uploadSuccess && (
               <button 
                 onClick={() => {
                   setUploading(true);
                   setTimeout(() => {
                     setUploading(false);
                     setUploadSuccess(true);
                     setTimeout(() => {
                        setAcceptedItems(prev => [...prev.filter(i => i.id !== selectedDetailItem?.id), selectedDetailItem].slice(-5));
                       setUploadSuccess(false);
                       setShowUploadModal(false);
                       setShowDetailModal(false);
                     }, 2000);
                   }, 2000);
                 }}
                 disabled={uploading}
                 className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl text-lg hover:bg-indigo-700 transition-all disabled:bg-gray-100 disabled:text-gray-400"
               >
                 {uploading ? 'PROCESSING...' : 'SIMULATE UPLOAD'}
               </button>
             )}
          </div>
        </div>
      )}

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