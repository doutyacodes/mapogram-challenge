"use client"
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMediaQuery } from 'react-responsive';
import { 
    Briefcase,
    Loader2,
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
import UserPostCreation from "@/components/user/Posts/UserPostCreation";

export default function UserView({userId, isOwner}) {
  const [postsItems, setPostsItems] = useState([]);
  const [groupedPosts, setGroupedPosts] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [mapBounds, setMapBounds] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const prevSelectedLocationRef = useRef(null);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [groupedRegistrations, setGroupedRegistrations] = useState({});
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [currentRegistrationIndex, setCurrentRegistrationIndex] = useState(0);

  // Leaflet map (replaces <GoogleMap>); `mapRef` is the L.Map instance
  const {
    containerRef: mapContainerRef,
    map: mapRef,
    clusterGroup,
    userHasInteractedRef, // true once the user has manually moved the map
  } = useLeafletMap({ center, zoom: DEFAULT_ZOOM, cluster: true, clusterType: "user" });

  const { user, canCreatePost } = useUserRole();

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

  const fetchPostsData = useCallback(async (bounds, userId, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setIsLoading(true);
      }
      
      let url = '/api/profile/posts';
      const params = new URLSearchParams();

      // Comment out bounds filtering - fetch all data
      // if (bounds) {
      //   const { north, south, east, west } = bounds;
      //   params.append('north', north);
      //   params.append('south', south);
      //   params.append('east', east);
      //   params.append('west', west);
      // }
      
      if (userId) {
        params.append('userId', userId);
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
    if (userId) {
      fetchPostsData(null, userId);
    }
  }, [userId, fetchPostsData]);

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
      if (availableLanguages.length > 0) {
        fetchPostsData(null, userId, true); // true = auto-refresh
        setLastFetchTime(Date.now());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchPostsData, userId]);

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
    
      <UserPostCreation
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
      />

      <>
        {/* Filter Controls - Top Right */}
        <div className="absolute top-3 right-4 z-10 flex items-end gap-2">
          {userId && (
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
                    id={userId}
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
                id={userId}
                isMobile /* true */
                buttonStyle={buttonStyle}
              />
          </div>
        )}
      </>

      {/* Show message when community is selected but no posts */}
      {!isLoading && userId && postsItems.length === 0 && (
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
          </LeafletPopup>
        )}

      </div>

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