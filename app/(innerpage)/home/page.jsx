"use client"
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMediaQuery } from 'react-responsive';
import { 
    Loader2,
    MapPin,
  } from "lucide-react";
import { useRouter } from "next/navigation";
import PostRegistrationModal from "@/components/map/posts/PostRegistrationModal";
import { useUserRole } from "@/app/hooks/useUserRole";
import MapCard from "@/components/map/MapCard";
import MapTypeControls from "@/components/map/controls/MapTypeControls";
import ZoomControls from "@/components/map/controls/ZoomControls";
import MobileFilterDropdown from "@/components/map/controls/MobileFilterDropdown";
import PostFilterPanel from "@/components/map/controls/PostFilterPanel";
import ResetMapButton from "@/components/map/controls/ResetMapButton";
import { center, containerStyle, DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "@/lib/map/constants";
import { groupPostsByLocation, groupRegistrationsByLocation } from '@/utils/map/markerUtils';
import { useLeafletMap } from "@/components/map/leaflet/useLeafletMap";
import { usePostMarkers } from "@/components/map/leaflet/usePostMarkers";
import LeafletPopup from "@/components/map/leaflet/LeafletPopup";
import { getLeaflet } from "@/utils/map/leaflet";
import FilterButton from "@/components/map/filters/FilterButton";
import FilterModal from "@/components/map/filters/FilterModal";
import LayerQuickActions from "@/components/map/controls/LayerQuickActions";
import LocationModal from "@/components/map/controls/LocationModal";

export default function PageView() {
    const layerId = 1
  const [postsItems, setPostsItems] = useState([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [groupedPosts, setGroupedPosts] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [mapBounds, setMapBounds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [locationPermissionState, setLocationPermissionState] = useState(null);

  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [postCategories, setPostCategories] = useState([]);

  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const [countryCenter, setCountryCenter] = useState(center);

  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  const [showUserProfile, setShowUserProfile] = useState(false);
  const [postLikes, setPostLikes] = useState({}); // Track liked posts
  const [postLikeCounts, setPostLikeCounts] = useState({});

  const [selectedCategories, setSelectedCategories] = useState([]);

  // Add refs to store state for mobile restoration
  const userLocationRef = useRef(null);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [groupedRegistrations, setGroupedRegistrations] = useState({});
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [currentRegistrationIndex, setCurrentRegistrationIndex] = useState(0);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

const [userLocation, setUserLocation] = useState(null);
const [showLocationModal, setShowLocationModal] = useState(true);
const [isGettingLocation, setIsGettingLocation] = useState(false);
const RADIUS_KM = 5; // 5km radius

  const prevSelectedLocationRef = useRef(null);
  const viewTimerRef = useRef(null);

  const [layerType, setLayerType] = useState(null);

  // Leaflet map (replaces <GoogleMap>); `mapRef` is the L.Map instance
  const {
    containerRef: mapContainerRef,
    map: mapRef,
    clusterGroup,
    userHasInteractedRef, // true once the user has manually moved the map
  } = useLeafletMap({ center, zoom: DEFAULT_ZOOM, cluster: true, clusterType: layerType || "page" });

  const { user } = useUserRole();
  
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

  // HELPER FUNCTION TO CHECK IF ALL post AT A LOCATION ARE READ
  const areAllPostAtLocationRead = (locationKey) => {
    const postAtLocation = groupedPosts[locationKey];
    if (!postAtLocation || postAtLocation.length === 0) return false;
    
    return postAtLocation.every(post => readPostIds.includes(post.id));
  };

  const initializeLikeData = (postData) => {
    const counts = {};
    const likes = {};
    postData.forEach(post => {
      counts[post.id] = post.like_count || 0;
      likes[post.id] = post.is_liked_by_user || false;
    });
    setPostLikeCounts(counts);
    setPostLikes(likes);
  };

  const trackPostView = useCallback(async (postId) => {
    try {
      // Check if already viewed recently (within 1 hour)
      const viewedPosts = JSON.parse(localStorage.getItem('viewedPostIds') || '[]');
      const existingView = viewedPosts.find(view => view.postId === postId);
      
      if (existingView) {
        const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in milliseconds
        if (existingView.timestamp > oneHourAgo) {
          console.log('Post already viewed recently, skipping');
          return;
        }
      }

      // Call API to track the view
      const response = await fetch('/api/posts/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        // Update localStorage to remember this view
        const updatedViews = viewedPosts.filter(view => view.postId !== postId);
        updatedViews.push({
          postId,
          timestamp: Date.now()
        });
        localStorage.setItem('viewedPostIds', JSON.stringify(updatedViews));
        console.log('View tracked successfully');
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, []);

    const fetchPostsData = useCallback(async (userLat, userLng, isAutoRefresh = false, filters = {}, quickFilter = 'all') => {
    try {
        if (!isAutoRefresh) {
        setIsLoading(true);
        }
        
        let url = '/api/home';
        const params = new URLSearchParams();

        // Add user location and radius
        if (userLat && userLng) {
        params.append('userLat', userLat);
        params.append('userLng', userLng);
        params.append('radiusKm', RADIUS_KM);
        }

        // Add filter parameters
        Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
            params.append(key, value.join(','));
            } else if (!Array.isArray(value)) {
            params.append(key, value);
            }
        }
        });

        // Add quick filter parameter
        if (quickFilter && quickFilter !== 'all') {
        params.append('quickFilter', quickFilter);
        }
        
        if (params.toString()) {
        url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
        throw new Error('Failed to fetch posts data');
        }
        
        const data = await response.json();
        setPostsItems(Array.isArray(data.posts) ? [...data.posts] : []);
        setPostCategories(Array.isArray(data.categories) ? [...data.categories] : []);
        initializeLikeData(Array.isArray(data.posts) ? [...data.posts] : []);

        const grouped = groupPostsByLocation(Array.isArray(data.posts) ? [...data.posts] : []);
        setGroupedPosts(grouped);

        const groupedRegs = groupRegistrationsByLocation(Array.isArray(data.registrations) ? [...data.registrations] : []);
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


    // Helper function to calculate distance between two points
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
    };

    // Handle location permission granted
    const handleLocationGranted = (lat, lng) => {
    setUserLocation({ lat, lng });
    setShowLocationModal(false);
    setIsGettingLocation(false);
    
    // Set map center to user location
    setCountryCenter({ lat, lng });
    
    // Fetch data with user location
    fetchPostsData(lat, lng);
    };


  // Handler for quick filter changes
  const handleQuickFilterChange = (filter) => {
    setActiveQuickFilter(filter);
    // Trigger data fetch with new quick filter
    fetchPostsData(
      null, // bounds - adjust based on your needs
      layerId, // current layer ID
      false, // not auto-refresh
      {}, // your existing filters object
      filter // new quick filter
    );
  };

  // Add these helper functions
  const countActiveFilters = (filters) => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          count++;
        } else if (!Array.isArray(value)) {
          count++;
        }
      }
    });
    return count;
  };

    const handleApplyFilters = (filters) => {
        setCurrentFilters(filters);
        setActiveFiltersCount(countActiveFilters(filters));
        // Re-fetch data with new filters and user location
        if (userLocation) {
            fetchPostsData(userLocation.lat, userLocation.lng, false, filters);
        }
    };

  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const getCurrentLayerType = async () => {
    try {
      const res = await fetch(`/api/layer/type?layerId=${layerId}`);
      const data = await res.json();
      console.log("data.type", data.type)
      return data.type; // 'job', 'news', or 'event'
    } catch (err) {
      console.error("Failed to get layer type", err);
      return null;
    }
  };

    // Updated useEffect to fetch posts when user location is available
    useEffect(() => {
    if (userLocation) {
        fetchPostsData(userLocation.lat, userLocation.lng);
    }
    }, [userLocation, fetchPostsData]);

  useEffect(() => {
    const fetchType = async () => {
      const type = await getCurrentLayerType();
      setLayerType(type);
    };

    fetchType();
  }, [layerId]);


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
          const { lat, lng } = userLocationRef.current;
          mapRef.setView([lat, lng], USER_LOCATION_ZOOM);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mapRef, isMobile, locationPermissionState, userHasInteractedRef]);



// Auto-refresh posts data every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (userLocation && availableLanguages.length > 0) {
      fetchPostsData(userLocation.lat, userLocation.lng, true); // true = auto-refresh
      setLastFetchTime(Date.now());
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [fetchPostsData, userLocation]);

  // Initialize selected categories when post categories are loaded
  useEffect(() => {
    if (postCategories.length > 0) {
      const categoryNames = postCategories
        .filter(cat => cat.name !== 'Default')
        .map(cat => cat.name);
      setSelectedCategories(categoryNames);
    }
  }, [postCategories]);

  useEffect(() => {

    // Clear any existing timer
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }

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

     // Start new timer for current news
    if (selectedLocation && groupedPosts[selectedLocation.key]) {
      const postGroup = groupedPosts[selectedLocation.key];
      if (postGroup && postGroup[currentPostIndex]) {
        const timer = setTimeout(() => {
          const postId = postGroup[currentPostIndex].id;
          trackPostView(postId);
        }, 5000);

        viewTimerRef.current = timer;
      }
    }

    // Update ref to current location
    prevSelectedLocationRef.current = selectedLocation;

  }, [selectedLocation, groupedPosts, currentPostIndex, markPostAsRead, trackPostView]);

  // Reset profile view when location changes
  useEffect(() => {
    setShowUserProfile(false);
  }, [selectedLocation]);

    // Radius circle around the user + keep the view near it
    useEffect(() => {
    const L = getLeaflet();
    if (!mapRef || !L || !userLocation) return;
    const { lat, lng } = userLocation;

    const circle = L.circle([lat, lng], {
        radius: RADIUS_KM * 1000, // metres
        color: '#3b82f6',
        opacity: 0.6,
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        interactive: false,
    }).addTo(mapRef);

    mapRef.setView([lat, lng], 14);

    // Restrict panning to the radius plus a 20% buffer for edge visibility
    const earthRadius = 6371; // km
    const buffer = RADIUS_KM * 1.2;
    const latOffset = (buffer / earthRadius) * (180 / Math.PI);
    const lngOffset = latOffset / Math.cos(lat * Math.PI / 180);
    mapRef.setMaxBounds([[lat - latOffset, lng - lngOffset], [lat + latOffset, lng + lngOffset]]);

    return () => {
        circle.remove();
        mapRef.setMaxBounds([[-85, -180], [85, 180]]);
    };
    }, [mapRef, userLocation]);

  // Handle marker click
  const handleMarkerClick = useCallback((locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentPostIndex(index);
  }, []);


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

  // Clustered post + registration markers (replaces google.maps.Marker + MarkerClusterer)
  usePostMarkers({
    map: mapRef,
    clusterGroup,
    groupedPosts,
    groupedRegistrations,
    selectedCategories,
    readPostIds,
    postCategories,
    onPostClick: handleMarkerClick,
    onRegistrationClick: handleRegistrationMarkerClick,
  });

  const closePopup = () => {
    setSelectedLocation(null);
    setShowRegistrationDetails(false);
    setShowUserProfile(false);
    setCurrentRegistrationIndex(0);
  };

  return (
    <div className="relative">

    {/* Location Modal */}
    <LocationModal
      isOpen={showLocationModal}
      onLocationGranted={handleLocationGranted}
      isLoading={isGettingLocation}
    />

      <>
        {/* Filter Controls - Top Right */}
        <div className="absolute top-3 right-4 z-10 flex items-end gap-2">
          {layerId && (
            <>
              {isMobile ? (
                <div className="flex gap-2 items-end">
                {/* Add the Filter Button */}
                <FilterButton
                  onClick={handleOpenFilterModal}
                  activeFiltersCount={activeFiltersCount}
                  isLoading={isLoading}
                  buttonStyle={buttonStyle}
                />
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
                  {/* Add the Filter Button */}
                  <FilterButton
                    onClick={handleOpenFilterModal}
                    activeFiltersCount={activeFiltersCount}
                    isLoading={isLoading}
                    buttonStyle={buttonStyle}
                  />
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
                    id={layerId}
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
                id={layerId}
                isMobile /* true */
                buttonStyle={buttonStyle}
              />
          </div>
        )}
      </>

      {/* Show message when community is selected but no posts */}
      {!isLoading && layerId && postsItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-5">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Posts Found</h3>
            <p className="text-gray-600">No posts available</p>
          </div>
        </div>
      )}

      <div style={containerStyle} className="relative">
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Custom Map Type Controls */}
        <MapTypeControls mapRef={mapRef} buttonStyle={buttonStyle}/>

        <div className="absolute right-1.5 z-10" style={{ bottom: isMobile ? '300px' : '200px' }}>
          <LayerQuickActions
            activeFilter={activeQuickFilter}
            onFilterChange={handleQuickFilterChange}
            layerType={layerType} // e.g., 'news', 'job', 'event'
            isMobile={false} // Set based on your mobile detection logic
          />
        </div>

        {/* Custom Zoom Controls */}
        <ZoomControls mapRef={mapRef} isMobile={isMobile}/>

        {/* Help Button below ZoomControls */}
        {/* <HelpButton isMobile={isMobile} /> */}

        {currentItem && selectedLocation && (
          <LeafletPopup
            map={mapRef}
            position={selectedLocation}
            onClose={closePopup}
            offset={[0, -5]}
            minWidth={isMobile ? 280 : 320}
            maxWidth={isMobile ? 280 : 320}
          >
            <MapCard
              post={currentItem} // ✅ Use the currentItem here
              user={user}
              onClose={() => {
                // Clear the view timer when closing
                if (viewTimerRef.current) {
                  clearTimeout(viewTimerRef.current);
                  viewTimerRef.current = null;
                }
                
                if (currentItem) {
                  markPostAsRead(currentItem.id);
                }
                setSelectedLocation(null);
                setShowRegistrationDetails(false);
                setShowUserProfile(false);
                setCurrentRegistrationIndex(0);
              }}
              onPrev={showRegistrationDetails ? handlePrevRegistration : handlePrevPost}
              onNext={showRegistrationDetails ? handleNextRegistration : handleNextPost}
              readPostIds={readPostIds}
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
          </LeafletPopup>
        )}

      </div>

      {layerType && (
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          layerType={layerType}
          currentFilters={currentFilters}
          onApplyFilters={handleApplyFilters}
        />
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