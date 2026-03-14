  "use client"
  import React, { useState, useEffect, useCallback, useRef } from "react";
  import { useMediaQuery } from 'react-responsive';
  import { GoogleMap, InfoWindowF } from "@react-google-maps/api";
  import { MarkerClusterer } from '@googlemaps/markerclusterer';
  import { Search, UserPlus, Plus, Users, Flag, Layers, Crown, Bell, ChevronDown, Menu, X, Building, AlertTriangle, FileText, Calendar, Loader2, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
  import { useSearchParams, useRouter } from 'next/navigation';
  import { applyGoogleMapsControlStyle } from "@/utils/googleMapsStyles";
  import { useUserRole } from "@/app/hooks/useUserRole";
  import { createClusterRenderer } from "@/utils/map/createClusterRenderer";
  import CentersMapcard from "@/components/map/InfrastructureMapCard";
  import { handleClusterClick } from "@/utils/map/handleClusterClick";
  import MapTypeControls from "@/components/map/controls/MapTypeControls";
  import ZoomControls from "@/components/map/controls/ZoomControls";
  import MobileFilterDropdown from "@/components/map/controls/MobileFilterDropdown";
  import PostFilterPanel from "@/components/map/controls/PostFilterPanel";
  import { center, containerStyle, DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "@/lib/map/constants";
  import { createPostCategoryMarkerIcon, groupPostsByLocation } from '@/utils/map/markerUtils';
  import CreateCenterPostModal from "@/components/Navbar/CreateInfrastructurePostModal";

  // Page Access Overlay Component
  const PageAccessOverlay = ({ pageName, accessStatus, isMobile, onJoinRequest }) => {
    const getOverlayContent = () => {
      switch (accessStatus) {
        case 'not_joined':
          return {
            title: 'Join This Page',
            description: `You need to join ${pageName} to view and interact with its content.`,
            buttonText: 'Request to Join',
            icon: '👥',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600'
          };
        case 'pending':
          return {
            title: 'Waiting for Approval',
            description: `Your request to join ${pageName} is pending admin approval.`,
            buttonText: 'Request Pending',
            icon: '⏳',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600'
          };
        case 'no_access':
        default:
          return {
            title: 'Access Restricted',
            description: `You don't have access to view ${pageName}'s content.`,
            buttonText: 'Request Access',
            icon: '🔒',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-600'
          };
      }
    };

    const content = getOverlayContent();

    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 text-center ${
          isMobile ? 'mx-4 p-6 max-w-sm' : 'mx-4 p-8 max-w-md'
        }`}>
          <div className={isMobile ? 'mb-4' : 'mb-6'}>
            <div className={`mx-auto mb-3 ${content.bgColor} rounded-full flex items-center justify-center ${
              isMobile ? 'w-12 h-12' : 'w-16 h-16'
            }`}>
              <span className={`text-2xl ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                {content.icon}
              </span>
            </div>
            <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {content.title}
            </h3>
            <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {content.description}
            </p>
          </div>
          
          {accessStatus === 'not_joined' && (
            <button
              onClick={onJoinRequest}
              className={`w-full ${content.bgColor} ${content.textColor} font-medium rounded-lg py-3 px-4 hover:opacity-90 transition duration-200 ease-in-out ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
            >
              {content.buttonText}
            </button>
          )}
          
          {accessStatus === 'pending' && (
            <button
              disabled
              className={`w-full ${content.bgColor} ${content.textColor} font-medium rounded-lg py-3 px-4 opacity-70 cursor-not-allowed ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
            >
              {content.buttonText}
            </button>
          )}
        </div>
      </div>
    );
  };

  const PageRolesBar = ({ 
    pageRoles = [], 
    selectedRole, 
    onRoleChange, 
    isLoading 
  }) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRoles, setFilteredRoles] = useState(pageRoles);

    // Check scroll position
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, []);

    useEffect(() => {
      checkScroll();
    }, [pageRoles]);

    // Filter roles based on search
    useEffect(() => {
      if (searchQuery.trim() === '') {
        setFilteredRoles(pageRoles);
      } else {
        setFilteredRoles(
          pageRoles.filter(role =>
            role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        );
      }
    }, [searchQuery, pageRoles]);

    const scroll = (direction) => {
      if (scrollContainerRef.current) {
        const scrollAmount = 150;
        scrollContainerRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth',
        });
        setTimeout(checkScroll, 300);
      }
    };

    const handleRoleClick = (roleId) => {
      onRoleChange(roleId);
      setSearchOpen(false);
      setSearchQuery('');
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 md:pb-4 z-10">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl border border-gray-200 backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
            )}

            {/* Roles Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex-1 overflow-x-auto scrollbar-hide flex gap-2"
            >
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleClick(role.id)}
                    disabled={isLoading}
                    className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedRole === role.id
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {role.name}
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-500 py-2 px-4">
                  No roles found
                </div>
              )}
            </div>

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            )}

            {/* Search Button */}
            <div className="flex-shrink-0">
              {!searchOpen ? (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label="Search roles"
                >
                  <Search size={20} className="text-gray-700" />
                </button>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-36 sm:w-44 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom scrollbar hide CSS */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    );
  };

  export default function CentersView({pageId, isOwner}) {
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
    const searchParams = useSearchParams();
  console.log("grouped posts", groupedPosts)

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

    const [contextMenu, setContextMenu] = useState(null);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [clickedLocation, setClickedLocation] = useState(null);

    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedPostType, setSelectedPostType] = useState('');

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

    const [pageRoles, setPageRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(
      searchParams.get('role') || ''
    );

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentRole, setCurrentRole] = useState('');
    
    const [geofenceData, setGeofenceData] = useState(null);
    const [minZoomLevel, setMinZoomLevel] = useState(DEFAULT_ZOOM);

    const [showAccessOverlay, setShowAccessOverlay] = useState(false);
    const [accessStatus, setAccessStatus] = useState(null); // 'not_joined', 'pending', 'no_access'
    const [pageAccessData, setPageAccessData] = useState(null);

    const { user, canCreatePost } = useUserRole();

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

      // HELPER FUNCTION TO CHECK IF ALL post AT A LOCATION ARE READ
      const areAllPostAtLocationRead = (locationKey) => {
        const postAtLocation = groupedPosts[locationKey];
        if (!postAtLocation || postAtLocation.length === 0) return false;
        
        return postAtLocation.every(post => readPostIds.includes(post.id));
      };


    const fetchPostsData = useCallback(async (bounds, pageId, isAutoRefresh = false, roleId = null) => {
      try {

        if (!isAutoRefresh) {
          setIsLoading(true);
          setPostsItems([]);
          setGroupedPosts({});
          setGroupedRegistrations({});
          setError(null);
        }
        
        let url = '/api/centers';
        const params = new URLSearchParams();

        if (pageId) {
          params.append('pageId', pageId);
        }
        
        // ADD THIS - pass the selected role to API
        if (roleId || selectedRole) {
          params.append('role', roleId || selectedRole);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        console.log("Fetching posts from:", url); // Add for debugging
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts data');
        }
        
        const data = await response.json();
        setPostsItems(data.posts || []);
        setPostCategories(data.categories || []);
        setPageRoles(data.pageRoles || []);
        setCurrentRole(data.currentRole || '');
        setIsAdmin(data.user?.isAdmin || false);

        const grouped = groupPostsByLocation(data.posts || []);
        setGroupedPosts(grouped);
        
        // ADD THIS: Clear all existing markers when role changes and no posts found
        if (data.posts.length === 0) {
          // Clear all existing markers
          existingMarkersRef.current.forEach(marker => {
            marker.setMap(null);
          });
          existingMarkersRef.current.clear();
          
          // Clear cluster
          if (clusterRef.current) {
            clusterRef.current.clearMarkers();
            clusterRef.current.setMap(null);
          }
        }
        
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
    }, [selectedRole]);

    const fetchGeofence = useCallback(async (pageId) => {
      try {
        const response = await fetch(`/api/centers/${pageId}/geofence`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch geofence data');
        }
        
        const data = await response.json();
        
        if (data.geofence && data.geofence.geojson) {
          setGeofenceData(data.geofence.geojson.geometry);

        // Calculate bounds from geofence
          const bounds = new google.maps.LatLngBounds();
          data.geofence.geojson.geometry.coordinates[0].forEach(coord => {
            bounds.extend({ lat: coord[1], lng: coord[0] });
          });
          
      // Calculate center of geofence
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const centerLat = (ne.lat() + sw.lat()) / 2;
        const centerLng = (ne.lng() + sw.lng()) / 2;

        if (mapRef) {
          // First set the center
          mapRef.setCenter({ lat: centerLat, lng: centerLng });
          
          // Then set a fixed zoom level (higher number = more zoomed in)
          mapRef.setZoom(16.5); // Try 15, 16, or 17 for different zoom levels
          
          // Set restrictions
          mapRef.setOptions({
            restriction: {
              latLngBounds: bounds, // Use original bounds without padding
              strictBounds: true,
            },
            minZoom: 16.5, // Must match or be less than the setZoom value above
            maxZoom: 22
          });
          
          // Update state
          setMinZoomLevel(16.5); // Match the zoom level above
        }
          
          return bounds;
        }
      } catch (err) {
        console.error("Error fetching geofence:", err);
      }
    }, [mapRef]);

    // Check page access status
    const checkPageAccess = useCallback(async (pageId) => {
      try {
        const response = await fetch(`/api/centers/access-status?pageId=${pageId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check page access');
        }
        
        const data = await response.json();
        setPageAccessData(data);
        
        console.log("Page access data:", data); // Add this for debugging
        
        // Determine access status - FIXED THIS PART
        if (data.isMember) {
          if (data.isApproved) {
            setShowAccessOverlay(false);
            setAccessStatus('approved'); // CHANGED FROM null to 'approved'
            return { hasAccess: true, data }; // Return access info
          } else {
            setShowAccessOverlay(true);
            setAccessStatus('pending');
            return { hasAccess: false, data };
          }
        } else {
          setShowAccessOverlay(true);
          setAccessStatus('not_joined');
          return { hasAccess: false, data };
        }
        
      } catch (err) {
        console.error("Error checking page access:", err);
        // Default to no access on error
        setShowAccessOverlay(true);
        setAccessStatus('no_access');
        return { hasAccess: false, data: null };
      }
    }, []);

    // Join page request
    const handleJoinPage = useCallback(async (pageId) => {
      try {
        const response = await fetch('/api/centers/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageId }),
        });

        if (!response.ok) {
          throw new Error('Failed to send join request');
        }

        const data = await response.json();
        
        if (data.status === 'pending') {
          setAccessStatus('pending');
          // You can show a toast notification here if you want
          console.log('Join request sent successfully');
        }
        
      } catch (err) {
        console.error("Error joining page:", err);
        // Handle error (show toast, etc.)
      }
    }, []);

    useEffect(() => {
      if (pageId && mapRef) {
        // First check page access, then fetch geofence and posts if access is granted
        checkPageAccess(pageId).then((accessResult) => {
          console.log("Access result:", accessResult); // Add for debugging
          if (accessResult?.hasAccess) {
            // Only fetch data if user has access
            fetchGeofence(pageId).then(() => {
              fetchPostsData(null, pageId);
            });
          } else {
            // If no access, stop loading
            setIsLoading(false);
          }
        });
      }
    }, [pageId, mapRef, fetchGeofence, fetchPostsData, checkPageAccess]);

    useEffect(() => {
      if (!mapRef || !geofenceData) return;
      
      // Create the geofence polygon (blue outline) - INSIDE area
      const geofencePolygon = new google.maps.Polygon({
        paths: geofenceData.coordinates[0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        })),
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        clickable: false,
        map: mapRef
      });
      
      // Create the world bounds (large rectangle covering the world)
      const worldBounds = [
        { lat: 85, lng: -180 },
        { lat: 85, lng: 180 },
        { lat: -85, lng: 180 },
        { lat: -85, lng: -180 }
      ];
      
      // Create the geofence path (this will be the "hole" - must be counter-clockwise for outer ring)
      const geofencePath = [...geofenceData.coordinates[0].map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }))];
      
      // For proper hole rendering, ensure geofence path is in opposite winding order to worldBounds
      // Since worldBounds is clockwise, geofence path should be counter-clockwise
      geofencePath.reverse();
      
      // Create the inverse polygon (grey overlay outside geofence)
      const overlayPolygon = new google.maps.Polygon({
        paths: [worldBounds, geofencePath], // Outer ring (world), inner hole (geofence)
        strokeColor: 'transparent',
        strokeOpacity: 0,
        strokeWeight: 0,
        fillColor: '#6B7280', // Grey color
        fillOpacity: 0.4,     // Semi-transparent grey
        clickable: false,
        map: mapRef
      });
      
      // Cleanup function
      return () => {
        geofencePolygon.setMap(null);
        overlayPolygon.setMap(null);
      };
    }, [mapRef, geofenceData]);
        
    useEffect(() => {
      if (!mapRef || !geofenceData) return;
      
      const zoomChangedListener = mapRef.addListener('zoom_changed', () => {
        const currentZoom = mapRef.getZoom();
        if (currentZoom < minZoomLevel) {
          mapRef.setZoom(minZoomLevel);
        }
      });
      
      // Also prevent dragging outside bounds
      const dragListener = mapRef.addListener('drag', () => {
        const currentBounds = mapRef.getBounds();
        if (!currentBounds) return;
        
        // If map is dragged outside restricted area, recenter it
        const mapCenter = mapRef.getCenter();
        const restrictedBounds = new google.maps.LatLngBounds(
          { lat: -85, lng: -180 },
          { lat: 85, lng: 180 }
        );
        
        if (!restrictedBounds.contains(mapCenter)) {
          // Recenter to a safe position
          mapRef.panTo(center);
        }
      });
      
      return () => {
        if (zoomChangedListener) {
          google.maps.event.removeListener(zoomChangedListener);
        }
        if (dragListener) {
          google.maps.event.removeListener(dragListener);
        }
      };
    }, [mapRef, minZoomLevel, geofenceData]);

    useEffect(() => {
      const newParams = new URLSearchParams(searchParams);
      if (selectedRole) {
        newParams.set('role', selectedRole);
      } else {
        newParams.delete('role');
      }
      router.push(`?${newParams.toString()}`, { scroll: false });
    }, [selectedRole, router, searchParams]);

    // Add this effect to auto-select first role for admin users
    useEffect(() => {
      if (isAdmin && pageRoles.length > 0 && !selectedRole) {
        setSelectedRole(pageRoles[0].id.toString());
      }
    }, [isAdmin, pageRoles, selectedRole]);

    // ADD this effect to fetch data when selected role changes
    useEffect(() => {
      if (pageId && selectedRole) {
        fetchPostsData(null, pageId, false, selectedRole);
      }
    }, [selectedRole, pageId]);

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
          // Check if this post needs blinking effect

          
          const allPostRead = areAllPostAtLocationRead(locationKey); // Check if all news are read
          const markerPromise = (async () => {
            let marker = currentMarkers.get(locationKey);
            
            // Instead of passing category name string, pass the category object
            const categoryData = postCategories.find(cat => cat.id === mainPost.category_id) || 
                                { name: 'Default', shape: 'pin', icon_name: 'MapPn', color: '#6b7280' };

            // Check if this post needs blinking effect
            const needsBlinking = mainPost.issue_details && 
              mainPost.issue_details.assigned_to_user_id === user?.id &&
              mainPost.issue_details.status !== 'completed';
            
            const markerIcon = createPostCategoryMarkerIcon(
              categoryData, 
              postsAtLocation.length, 
              mainPost, 
              allPostRead,
              needsBlinking // Pass the blinking flag
            );
            
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
            renderer: createClusterRenderer(mapRef, readPostIds, groupedPosts, { type: "page" }),
            algorithmOptions: {
              maxZoom: 15,   // cluster still active up to closer zoom (previously 12)
              radius: 130,   // wider radius → merges nearby markers faster
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
    }, [mapRef, groupedPosts, selectedCategories, readPostIds]);

    // effect to clear markers when role changes to one with no posts
    useEffect(() => {
      if (selectedRole && postsItems.length === 0) {
        // Clear all markers when switching to a role with no posts
        existingMarkersRef.current.forEach(marker => {
          marker.setMap(null);
        });
        existingMarkersRef.current.clear();
        
        // Clear cluster
        if (clusterRef.current) {
          clusterRef.current.clearMarkers();
          clusterRef.current.setMap(null);
        }
      }
    }, [selectedRole, postsItems.length]);

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
              renderer: createClusterRenderer(mapRef, readPostIds, groupedPosts, { type: "page" }),
              algorithmOptions: {
                maxZoom: 15,   // allow clustering a bit deeper zoom
                radius: 130,   // make clusters merge quicker visually
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
        if (availableLanguages.length > 0 && accessStatus === 'approved') {
          fetchPostsData(null, pageId, true); // true = auto-refresh
          setLastFetchTime(Date.now());
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }, [fetchPostsData, pageId, accessStatus]); // Added accessStatus dependency

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
    console.log("Like triggered")
    };

    // Helper function to check if a point is inside a polygon
    const checkPointInPolygon = (point, polygon) => {
      const x = point.lat, y = point.lng;
      let inside = false;
      
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        
        const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      
      return inside;
    };

    // Get current post item for the info window
    const getCurrentPostItem = () => {
      if (!selectedLocation || !groupedPosts[selectedLocation.key]) return null;
      return groupedPosts[selectedLocation.key][currentPostIndex];
    };

    const selectedPostGroup = selectedLocation ? groupedPosts[selectedLocation.key] : [];

    // 6. ADD this function to get current registration item (place it with your other helper functions)
    const getCurrentRegistrationItem = () => {
      if (!selectedLocation || !groupedRegistrations[selectedLocation.key]) return null;
      return groupedRegistrations[selectedLocation.key][currentRegistrationIndex];
    };

    const currentItem = getCurrentPostItem();

    return (
      <div className="relative">

        {/* Page Access Overlay */}
        {showAccessOverlay && pageAccessData && (
          <PageAccessOverlay
            pageName={pageAccessData.pageName || 'this page'}
            accessStatus={accessStatus}
            isMobile={isMobile}
            onJoinRequest={() => handleJoinPage(pageId)}
          />
        )}
            
      <div> {/* Add padding-bottom to avoid content being hidden */}
        {/* Page Roles Bar - ONLY show for Admin users */}
        {isAdmin && pageRoles.length > 0 && (
          <PageRolesBar
            pageRoles={pageRoles}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            isLoading={isLoading}
          />
        )}
      </div>

        <>
          {/* Filter Controls - Top Right */}
          <div className="absolute top-3 right-4 z-10 flex items-end gap-2">
            {pageId && (
              <>
                {isMobile ? (
                  <div className="flex gap-2 items-end">

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
                    <PostFilterPanel
                      selectedCategories={selectedCategories}
                      setSelectedCategories={setSelectedCategories}
                      buttonStyle={buttonStyle}
                      postCategories={postCategories}
                      getCategoryByName={getCategoryByName}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>

        {/* Show message when community is selected but no posts */}
        {!isLoading && pageId && postsItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-5">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-gray-200">
              <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isAdmin && selectedRole 
                  ? `No ${currentRole} Posts Found`
                  : 'No Posts Found'
                }
              </h3>
              <p className="text-gray-600">
                {isAdmin && selectedRole
                  ? `No posts available for the ${currentRole} role`
                  : 'No posts available for your role'
                }
              </p>
            </div>
          </div>
        )}

      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-10">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
            <span>
              {isAdmin && currentRole 
                ? `Loading ${currentRole} Data...` 
                : 'Loading Data...'
              }
            </span>
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
              minZoom: minZoomLevel, // Use the dynamic minZoomLevel
              maxZoom: 22,
              restriction: geofenceData ? {
                latLngBounds: {
                  north: 85,
                  south: -85,
                  west: -180,
                  east: 180,
                },
                strictBounds: false, // Set to false to allow some movement at edges
              } : undefined,
              disableDefaultUI: true,
            }}
            onClick={() => {
              if (contextMenu) {
                setContextMenu(null);
              }
            }}  
            onLoad={handleMapLoad}
            onRightClick={(e) => {
              if (!geofenceData) return;
              
              const clickedLat = e.latLng.lat();
              const clickedLng = e.latLng.lng();
              
              // Check if the clicked point is inside the geofence
              const isInsideGeofence = checkPointInPolygon(
                { lat: clickedLat, lng: clickedLng },
                geofenceData.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }))
              );
              
              if (isInsideGeofence) {
                setContextMenu({
                  position: { lat: clickedLat, lng: clickedLng },
                  pixelPosition: { x: e.domEvent.clientX, y: e.domEvent.clientY }
                });
                setClickedLocation({ lat: clickedLat, lng: clickedLng });
              }
            }}
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
              <CentersMapcard
                post={currentItem} // ✅ Use the currentItem here
                user={user}
                onClose={() => {
                  setSelectedLocation(null);
                  setShowRegistrationDetails(false);
                  setShowUserProfile(false);
                  setCurrentRegistrationIndex(0);
                }}
                onPrev={handlePrevPost}
                onNext={handleNextPost}
                // readPostIds={readPostIds}
                currentIndex={currentPostIndex}
                totalItems={ selectedPostGroup.length}
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

          {/* Context Menu for Right Click */}
          {contextMenu && (
            <InfoWindowF
              position={contextMenu.position}
              onCloseClick={() => setContextMenu(null)}
              options={{
                disableAutoPan: true,
                maxWidth: 200,
                pixelOffset: new window.google.maps.Size(0, -10)
              }}
            >
            <div className="relative bg-white rounded-lg shadow-lg">
              {/* Close Button */}
              <button
                onClick={() => setContextMenu(null)}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>

              {/* Menu Items */}
              <div className="pt-6 pb-2 px-2 space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory({ id: 1, name: "Posts", post_type: "general" });
                    setSelectedPostType("general");
                    setIsCreatePostModalOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors text-sm text-blue-700"
                >
                  <FileText size={16} />
                  Create Post
                </button>

                <button
                  onClick={() => {
                    setSelectedCategory({ id: 53, name: "Event", post_type: "personal_event" });
                    setSelectedPostType("personal_event");
                    setIsCreateEventModalOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-md transition-colors text-sm text-green-700"
                >
                  <Calendar size={16} />
                  Create Event
                </button>

                <button
                  onClick={() => {
                    setIsIssueModalOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-md transition-colors text-sm text-red-700"
                >
                  <AlertTriangle size={16} />
                  Report Issue
                </button>
              </div>
            </div>
            </InfoWindowF>
          )}

        </GoogleMap>

        {/* Create Post Modal */}
        <CreateCenterPostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => {
            setIsCreatePostModalOpen(false);
            setClickedLocation(null);
          }}
          onBack={() => {
            setIsCreatePostModalOpen(false);
            setClickedLocation(null);
          }}
          pageId={pageId}
          preSelectedCategory={selectedCategory}
          preSelectedPostType={selectedPostType}
          initialLatitude={clickedLocation?.lat}
          initialLongitude={clickedLocation?.lng}
        />

        {/* Create Event Modal */}
        <CreateCenterPostModal
          isOpen={isCreateEventModalOpen}
          onClose={() => {
            setIsCreateEventModalOpen(false);
            setClickedLocation(null);
          }}
          onBack={() => {
            setIsCreateEventModalOpen(false);
            setClickedLocation(null);
          }}
          pageId={pageId}
          preSelectedCategory={selectedCategory}
          preSelectedPostType={selectedPostType}
          initialLatitude={clickedLocation?.lat}
          initialLongitude={clickedLocation?.lng}
        />

        {/* Issue Report Modal */}
        <CreateCenterPostModal
          isOpen={isIssueModalOpen}
          onClose={() => {
            setIsIssueModalOpen(false);
            setClickedLocation(null);
          }}
          onBack={() => {
            setIsIssueModalOpen(false);
            setClickedLocation(null);
          }}
          pageId={pageId}
          preSelectedPostType="issue"
          initialLatitude={clickedLocation?.lat}
          initialLongitude={clickedLocation?.lng}
        />
        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 py-2 px-4 rounded-full shadow-md z-10">
            {error}
          </div>
        )}
      </div>
    );
  }