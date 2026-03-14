"use client"
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMediaQuery } from 'react-responsive';
import { GoogleMap, InfoWindowF, MarkerF } from "@react-google-maps/api";
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { 
    Loader2,
    MapPin,
    Search,
    ChevronLeft, 
    ChevronRight, 
    X,
    Briefcase,
    FileText,
    Calendar,
    AlertTriangle,
    Target,
    Utensils,
    Star,
    Clock
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyGoogleMapsControlStyle } from "@/utils/googleMapsStyles";
import PostRegistrationModal from "@/components/map/posts/PostRegistrationModal";
import StateCategoryContent from "./StateCategoryContent";
import { STATIC_DISTRICT_DATA } from "@/utils/mockCategoryData";
import { useUserRole } from "@/app/hooks/useUserRole";
import { createClusterRenderer } from "@/utils/map/createClusterRenderer";
import MapCard from "@/components/map/MapCard";
import InfrastructureMapCard from "@/components/map/InfrastructureMapCard"; // Renamed from CentersMapcard
import { handleClusterClick } from "@/utils/map/handleClusterClick";
import MapTypeControls from "@/components/map/controls/MapTypeControls";
import ZoomControls from "@/components/map/controls/ZoomControls";
import MobileFilterDropdown from "@/components/map/controls/MobileFilterDropdown";
import PostFilterPanel from "@/components/map/controls/PostFilterPanel";
import ResetMapButton from "@/components/map/controls/ResetMapButton";
import { BASE_IMG_URL, center, containerStyle, DEFAULT_ZOOM, USER_LOCATION_ZOOM } from "@/lib/map/constants";
import { createPostCategoryMarkerIcon, groupPostsByLocation, groupRegistrationsByLocation } from '@/utils/map/markerUtils';
import FilterButton from "@/components/map/filters/FilterButton";
import FilterModal from "@/components/map/filters/FilterModal";
import LayerQuickActions from "@/components/map/controls/LayerQuickActions";
import RequirementModal from "@/components/community/UserRequirements/RequirementModal";
import CommunityPostCreation from "@/components/community/CommunityPostCreation";
import CommunityQuickActions from "@/components/map/controls/CommunityQuickActions";
import CreateInfrastructurePostModal from "@/components/Navbar/CreateInfrastructurePostModal"; // Renamed from CreateCenterPostModal

// Approval Pending Overlay Component
const ApprovalPendingOverlay = ({ communityName, isMobile }) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 text-center ${
        isMobile ? 'mx-4 p-6 max-w-sm' : 'mx-4 p-8 max-w-md'
      }`}>
        <div className={isMobile ? 'mb-4' : 'mb-6'}>
          <div className={`mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center ${
            isMobile ? 'w-12 h-12' : 'w-16 h-16'
          }`}>
            <svg className={`text-yellow-600 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Waiting for Approval
          </h3>
          <p className={`text-gray-600 mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
            Your request to join <strong>{communityName}</strong> is pending admin approval.
          </p>
          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            You&apos;ll get access as soon as the admin approves your request.
          </p>
        </div>
        <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
          Switch to another community using the top bar
        </div>
      </div>
    </div>
  );
};

// Infrastructure Access Overlay Component
const InfrastructureAccessOverlay = ({ infrastructureName, accessStatus, isMobile, onJoinRequest }) => {
  const getOverlayContent = () => {
    switch (accessStatus) {
      case 'not_joined':
        return {
          title: 'Join This Infrastructure',
          description: `You need to join ${infrastructureName} to view and interact with its content.`,
          buttonText: 'Request to Join',
          icon: '👥',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600'
        };
      case 'pending':
        return {
          title: 'Waiting for Approval',
          description: `Your request to join ${infrastructureName} is pending admin approval.`,
          buttonText: 'Request Pending',
          icon: '⏳',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600'
        };
      case 'no_access':
      default:
        return {
          title: 'Access Restricted',
          description: `You don't have access to view ${infrastructureName}'s content.`,
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

const InfrastructureRolesBar = ({ 
  infrastructureRoles = [], 
  selectedRole, 
  onRoleChange, 
  isLoading 
}) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRoles, setFilteredRoles] = useState(infrastructureRoles);

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
  }, [infrastructureRoles]);

  // Filter roles based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRoles(infrastructureRoles);
    } else {
      setFilteredRoles(
        infrastructureRoles.filter(role =>
          role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
  }, [searchQuery, infrastructureRoles]);

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

export default function CommunityView({ infrastructureId, isOwner }) {
  // State management
  const [postsItems, setPostsItems] = useState([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [groupedPosts, setGroupedPosts] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const router = useRouter();

  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [showApprovalOverlay, setShowApprovalOverlay] = useState(false);

  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [requirementData, setRequirementData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [postCategories, setPostCategories] = useState([]);
  const [communityRole, setCommunityRole] = useState(null);

  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Static State Community functionality
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedStateCategory, setSelectedStateCategory] = useState(null); // 'Challenges', 'Places', 'Food'

  const [countryCenter, setCountryCenter] = useState(center);

  const [showUserProfile, setShowUserProfile] = useState(false);
  const [postLikes, setPostLikes] = useState({});
  const [postLikeCounts, setPostLikeCounts] = useState({});

  const [selectedCategories, setSelectedCategories] = useState([]);

  // Infrastructure specific state
  const [contextMenu, setContextMenu] = useState(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPostType, setSelectedPostType] = useState('');

  const [infrastructureRoles, setInfrastructureRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRoleName, setCurrentRoleName] = useState('');
  
  const [geofenceData, setGeofenceData] = useState(null);
  const [minZoomLevel, setMinZoomLevel] = useState(DEFAULT_ZOOM);

  const [showAccessOverlay, setShowAccessOverlay] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);

  // Refs
  const userLocationRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const userHasInteractedRef = useRef(false);
  const markersRef = useRef([]);
  const clusterRef = useRef(null);
  const existingMarkersRef = useRef(new Map());
  const prevSelectedLocationRef = useRef(null);
  const geofenceSetupCompleteRef = useRef(false);
  const viewTimerRef = useRef(null);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [groupedRegistrations, setGroupedRegistrations] = useState({});
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [currentRegistrationIndex, setCurrentRegistrationIndex] = useState(0);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const [layerType, setLayerType] = useState(null);

  const { user, canCreatePost } = useUserRole();

  const searchParams = useSearchParams();
  const communityIdFromUrl = searchParams.get('communityId') || searchParams.get('community');
  
  // Determine community type
  const isInfrastructureCommunity = selectedCommunity?.community_type_name === 'Infrastructure';
  const isDistrictCommunity = selectedCommunity?.community_type_name === 'District';
  const isRegularCommunity = !isInfrastructureCommunity && !isDistrictCommunity;

  const getCategoryByName = (categoryName) => {
    return postCategories.find(cat => cat.name === categoryName) || { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280', class_name: '' };
  };

  // Determine map center based on community type
  const mapCenter = countryCenter;
  const mapZoom = DEFAULT_ZOOM;

  const isMobile = useMediaQuery({ maxWidth: 640 });

  const buttonStyle = {
    minWidth: isMobile ? '60px' : '100px',
    height: isMobile ? '28px' : '38px',
    fontSize: isMobile ? '12px' : '14px'
  };

  const [readPostIds, setReadPostIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readPostIds');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // State for static category markers
  const [categoryMarkers, setCategoryMarkers] = useState([]);
  const [activeCategoryMarker, setActiveCategoryMarker] = useState(null);

  const getMarkerIcon = useCallback((category, isSelected) => {
    let color = '#f97316'; // orange for challenges
    let path = '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>';
    
    if (category === 'Places') {
      color = '#22c55e'; // green
      path = '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>';
    } else if (category === 'Food') {
      color = '#ef4444'; // red
      path = '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>';
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${isSelected ? 48 : 36}" height="${isSelected ? 48 : 36}">
      <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.2"/>
      <circle cx="20" cy="20" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <svg x="10" y="10" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${path}
      </svg>
    </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  // Generate markers based on state, district, and category filters
  useEffect(() => {
    setActiveCategoryMarker(null);
    if (selectedCommunity?.source === 'static' && geofenceData?.type === 'FeatureCollection') {
      let markers = [];
      const stateName = selectedCommunity.name;
      const stateData = STATIC_DISTRICT_DATA[stateName] || {};
      
      geofenceData.features.forEach(feature => {
        const distName = feature.properties.name || feature.properties.district;
        // If a district is selected, skip others
        if (selectedDistrict && distName !== selectedDistrict) return;
        
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        feature.geometry.coordinates[0].forEach(coord => {
          if (coord[1] < minLat) minLat = coord[1];
          if (coord[1] > maxLat) maxLat = coord[1];
          if (coord[0] < minLng) minLng = coord[0];
          if (coord[0] > maxLng) maxLng = coord[0];
        });
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        const distData = stateData[distName] || {};
        const categoriesToShow = selectedStateCategory ? [selectedStateCategory] : ['Challenges', 'Places', 'Food'];
        
        categoriesToShow.forEach((cat, catIdx) => {
          const items = distData[cat] || [];
          items.forEach((item, index) => {
            const angle = (index + catIdx * 2.5) * (Math.PI / 2.5);
            // Smaller radius to keep markers clustered per district
            const radius = 0.05 + ((index % 3) * 0.02); 
            
            markers.push({
              ...item,
              category: cat,
              lat: centerLat + radius * Math.cos(angle),
              lng: centerLng + radius * Math.sin(angle)
            });
          });
        });
      });
      setCategoryMarkers(markers);
    } else {
      setCategoryMarkers([]);
    }
  }, [selectedStateCategory, selectedDistrict, geofenceData, selectedCommunity]);

  // Helper function to check if user can access community posts
  const canAccessCommunityPosts = (community) => {
    if (!community) return false;
    if (community.is_open) return true;
    return community.status === 'approved';
  };

  const markPostAsRead = useCallback((newsId) => {
    setReadPostIds(prev => {
      const updated = [...prev, newsId];
      localStorage.setItem('readPostIds', JSON.stringify(updated));
      return updated;
    });
  }, []);

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

  // UNIFIED API CALL - Only using /api/communities/post
  const fetchPostsData = useCallback(async (bounds, communityId, isAutoRefresh = false, filters = {}, quickFilter = 'all', roleId = null) => {
    try {
      if (!communityId) {
        console.log("No community ID provided, skipping fetch");
        return;
      }

      if (!canAccessCommunityPosts(selectedCommunity)) {
        console.log("No access to community posts, skipping fetch");
        return;
      }      

      if (!isAutoRefresh) {
        setIsLoading(true);
        setPostsItems([]);
        setGroupedPosts({});
        setGroupedRegistrations({});
        setError(null);
      }
      
      // ONLY USING UNIFIED COMMUNITIES API
      let url = '/api/communities/post';
      const params = new URLSearchParams();

      if (communityId) {
        params.append('communityId', communityId);
      }

      // Add role parameter for Infrastructure communities
      if (isInfrastructureCommunity && (roleId || selectedRole)) {
        params.append('role', roleId || selectedRole);
      }

      // Add filter parameters for regular communities
      if (!isInfrastructureCommunity) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
              params.append(key, value.join(','));
            } else if (!Array.isArray(value)) {
              params.append(key, value);
            }
          }
        });

        if (quickFilter && quickFilter !== 'all') {
          params.append('quickFilter', quickFilter);
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log("Fetching from unified API:", url); // Debug log
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts data');
      }
      
      const data = await response.json();
      setPostsItems(Array.isArray(data.posts) ? [...data.posts] : []);
      setPostCategories(Array.isArray(data.categories) ? [...data.categories] : []);
      initializeLikeData(Array.isArray(data.posts) ? [...data.posts] : []);
      
      // Handle infrastructure specific data
      if (isInfrastructureCommunity) {
        setInfrastructureRoles(data.communityRoles || []);
        setCurrentRoleName(data.currentRole || '');
        setIsAdmin(data.user?.isAdmin || false);
        
        // Check access status for infrastructure
        // if (data.user && !data.user.isAdmin && (!data.currentRole || data.currentRole === 'member')) {
        //   setShowAccessOverlay(true);
        //   setAccessStatus('not_joined');
        // } else {
        //   setShowAccessOverlay(false);
        //   setAccessStatus('approved');
        // }
      } else {
        setCommunityRole(data?.user?.community_role || null);
      }

      const grouped = groupPostsByLocation(Array.isArray(data.posts) ? [...data.posts] : []);
      setGroupedPosts(grouped);

      const groupedRegs = groupRegistrationsByLocation(Array.isArray(data.registrations) ? [...data.registrations] : []);
      setGroupedRegistrations(groupedRegs);
      
      // Clear markers if no posts found for Infrastructure role
      if (isInfrastructureCommunity && data.posts.length === 0) {
        existingMarkersRef.current.forEach(marker => {
          marker.setMap(null);
        });
        existingMarkersRef.current.clear();
        
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
  }, [selectedCommunity, isInfrastructureCommunity, selectedRole]);

  // Unified geofence handling
  const fetchCommunityGeofence = useCallback(async (communityId, districtName = null) => {
    try {
      if (communityId === 999991 || communityId === 999992 || communityId === 999993) {
        let geojsonFile = '';
        if (communityId === 999991) geojsonFile = '/geojson/kerala.json';
        else if (communityId === 999992) geojsonFile = '/geojson/karnataka.json';
        else if (communityId === 999993) geojsonFile = '/geojson/tamil_nadu.json';

        const response = await fetch(geojsonFile);
        if (response.ok) {
          const data = await response.json();
          
          if (districtName) {
            // Filter by selected district
            const filteredFeatures = data.features.filter(
              f => f.properties.name.toLowerCase() === districtName.toLowerCase()
            );
            if (filteredFeatures.length > 0) {
              setGeofenceData({
                type: 'FeatureCollection',
                features: filteredFeatures
              });
              return;
            }
          }
          
          setGeofenceData(data);
          return;
        }
      }

      const response = await fetch(`/api/communities/${communityId}/geofence`);
      
      if (!response.ok) {
        setGeofenceData(null);
        return;
      }
      
      const data = await response.json();
      setGeofenceData(data.geofence?.geojson?.geometry || null);
    } catch (err) {
      console.error("Error fetching geofence:", err);
      setGeofenceData(null);
    }
  }, []);

  // Join infrastructure request - USING COMMUNITIES API
  const handleJoinInfrastructure = useCallback(async (communityId) => {
    try {
      // OLD API: /api/centers/join
      // NEW API: /api/communities/join-infrastructure
      const response = await fetch('/api/communities/join-infrastructure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ communityId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send join request');
      }

      const data = await response.json();
      
      if (data.status === 'pending') {
        setAccessStatus('pending');
      }
      
    } catch (err) {
      console.error("Error joining infrastructure:", err);
    }
  }, []);

  // Handle community change
  const handleCommunityChange = useCallback((community) => {
    setSelectedCommunity(community);
    setShowApprovalOverlay(false);
    setShowAccessOverlay(false);
    
    // Reset static state community filters
    setSelectedDistrict(null);
    setSelectedStateCategory(null);
    
    if (!canAccessCommunityPosts(community)) {
      if (community.community_type_name === 'Infrastructure') {
        setShowAccessOverlay(true);
        // Set access status based on infrastructure community status
        if (community.status === 'pending') {
          setAccessStatus('pending');
        } else {
          setAccessStatus('not_joined');
        }
      } else {
        setShowApprovalOverlay(true);
      }
      return;
    }

    if (community) {
      fetchCommunityGeofence(community.id);
      fetchPostsData(null, community.id);
    }
  }, [fetchPostsData, fetchCommunityGeofence]);

  // Handler for quick filter changes (regular communities)
  const handleQuickFilterChange = (filter) => {
    setActiveQuickFilter(filter);
    fetchPostsData(
      null,
      selectedCommunity.id,
      false,
      {},
      filter
    );
  };

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
    fetchPostsData(null, selectedCommunity?.id, false, filters);
  };

  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // Fetch user communities
  const fetchUserCommunities = useCallback(async () => {
    try {
      setCommunitiesLoading(true);
      const response = await fetch('/api/user/community/followed-communities');

      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }

      const data = await response.json();
      setCommunities(data.communities);

      const communityIdFromUrl = searchParams.get('communityId') || searchParams.get('community');
      let communityToSelect = null;

      if (communityIdFromUrl && data.communities.length > 0) {
        const matched = data.communities.find(c => c.id === parseInt(communityIdFromUrl));
        if (matched) {
          communityToSelect = matched;
        }
      }
      
      if (!communityToSelect && data.communities.length > 0) {
        communityToSelect = data.communities[0];
      }

      if (communityToSelect) {
        setSelectedCommunity(communityToSelect);
        const url = new URL(window.location.href);
        url.searchParams.set('communityId', communityToSelect.id);
        window.history.replaceState({}, '', url.toString());
        
        // Handle access overlays for all community types
        setShowApprovalOverlay(false);
        setShowAccessOverlay(false);
        
        if (!canAccessCommunityPosts(communityToSelect)) {
          if (communityToSelect.community_type_name === 'Infrastructure') {
            setShowAccessOverlay(true);
            // Set access status based on infrastructure community status
            if (communityToSelect.status === 'pending') {
              setAccessStatus('pending');
            } else {
              setAccessStatus('not_joined');
            }
          } else {
            setShowApprovalOverlay(true);
          }
        }
      }

    } catch (err) {
      console.error("Error fetching communities:", err);
      setError("Failed to load communities");
    } finally {
      setCommunitiesLoading(false);
    }
  }, [searchParams]);

  // Update URL when community changes
  useEffect(() => {
    if (selectedCommunity && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('communityId', selectedCommunity.id);
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedCommunity]);

  // ADD THIS useEffect TO TRIGGER API CALL WHEN COMMUNITY IS SELECTED
  useEffect(() => {
    if (selectedCommunity && canAccessCommunityPosts(selectedCommunity)) {
      fetchCommunityGeofence(selectedCommunity.id, selectedDistrict);
      if (selectedCommunity.source !== 'static') {
        fetchPostsData(null, selectedCommunity.id);
      } else {
        setIsLoading(false);
        setPostsItems([]);
      }
    }
  }, [selectedCommunity, selectedDistrict, fetchCommunityGeofence, fetchPostsData]);

  // Initialize communities
  useEffect(() => {
    fetchUserCommunities();
  }, [fetchUserCommunities]);

  // Auto-select first role for Infrastructure admin users
  useEffect(() => {
    if (isInfrastructureCommunity && isAdmin && infrastructureRoles.length > 0 && !selectedRole) {
      setSelectedRole(infrastructureRoles[0].id.toString());
    }
  }, [isInfrastructureCommunity, isAdmin, infrastructureRoles, selectedRole]);

  // Fetch data when selected role changes (Infrastructure)
  useEffect(() => {
    if (isInfrastructureCommunity && selectedCommunity && selectedRole) {
      fetchPostsData(null, selectedCommunity.id, false, {}, 'all', selectedRole);
    }
  }, [selectedRole, isInfrastructureCommunity]);

  // Update URL params when role changes
  useEffect(() => {
    if (isInfrastructureCommunity && selectedRole) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('role', selectedRole);
      router.push(`?${newParams.toString()}`, { scroll: false });
    }
  }, [selectedRole, isInfrastructureCommunity, router, searchParams]);

  // Unified marker management
  useEffect(() => {
    const updateMarkersAsync = async () => {
      if (!mapRef || (Object.keys(groupedPosts).length === 0 && Object.keys(groupedRegistrations).length === 0)) return;
      
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
      
      Object.keys(groupedPosts).forEach((locationKey) => {
        const [lat, lng] = locationKey.split(',').map(parseFloat);
        const postsAtLocation = groupedPosts[locationKey];
        const mainPost = postsAtLocation[0];
        
        if (mainPost.category && !selectedCategories.includes(mainPost.category)) {
          if (currentMarkers.has(locationKey)) {
            currentMarkers.get(locationKey).setMap(null);
          }
          return;
        }

        const allPostRead = areAllPostAtLocationRead(locationKey);
        const markerPromise = (async () => {
          let marker = currentMarkers.get(locationKey);
          
          const categoryData = postCategories.find(cat => cat.id === mainPost.category_id) || 
                              { name: 'Default', shape: 'pin', icon_name: 'MapPin', color: '#6b7280' };

          // Check if this post needs blinking effect (Infrastructure)
          const needsBlinking = isInfrastructureCommunity && 
            mainPost.issue_details && 
            mainPost.issue_details.assigned_to_user_id === user?.id &&
            mainPost.issue_details.status !== 'completed';
          
          const markerIcon = createPostCategoryMarkerIcon(
            categoryData, 
            postsAtLocation.length, 
            mainPost, 
            allPostRead,
            needsBlinking
          );
          
          if (marker) {
            marker.setMap(mapRef);
            marker.setIcon(markerIcon);
            marker.setZIndex(1);
          } else {
            marker = new google.maps.Marker({
              position: { lat, lng },
              map: mapRef,
              icon: markerIcon,
              zIndex: 1,
            });
            
            marker.addListener('click', () => {
              handleMarkerClick(locationKey);
            });
            
            currentMarkers.set(locationKey, marker);
          }
          
          return marker;
        })();
        
        markerPromises.push(markerPromise);
      });
      
      const resolvedMarkers = await Promise.all(markerPromises);
      allMarkers.push(...resolvedMarkers.filter(marker => marker));
      
      if (clusterRef.current) {
        clusterRef.current.clearMarkers();
        clusterRef.current.setMap(null);
      }
      
      if (allMarkers.length > 0) {
        const clusterType = isInfrastructureCommunity ? "page" : layerType;
        const cluster = new MarkerClusterer({
          map: mapRef,
          markers: allMarkers,
          renderer: createClusterRenderer(mapRef, readPostIds, groupedPosts, { type: clusterType }),
          algorithmOptions: {
            maxZoom: isInfrastructureCommunity ? 15 : 12,
            radius: isInfrastructureCommunity ? 130 : 80,
          },
        });
        
        cluster.addListener('click', (event, cluster, map) => {
          handleClusterClick(event, cluster, map);
        });
        
        clusterRef.current = cluster;
      }
      
      markersRef.current = allMarkers;
      
      return () => {
        if (clusterRef.current) {
          clusterRef.current.clearMarkers();
          clusterRef.current.setMap(null);
        }
      };
    };
    
    updateMarkersAsync();
  }, [mapRef, groupedPosts, selectedCategories, readPostIds, isInfrastructureCommunity, layerType, selectedDistrict]);

  // Geofence setup using Infrastructure approach
  useEffect(() => {
    if (!mapRef || !geofenceData) return;
    
    let allPaths = [];
    const bounds = new window.google.maps.LatLngBounds();

    if (geofenceData.type === 'FeatureCollection') {
      geofenceData.features.forEach(feature => {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
          const path = geometry.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }));
          allPaths.push(path);
          path.forEach(p => bounds.extend(p));
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            const path = polygon[0].map(coord => ({ lat: coord[1], lng: coord[0] }));
            allPaths.push(path);
            path.forEach(p => bounds.extend(p));
          });
        }
      });
    } else {
      // Handle the generic geometry object from original mapogram geofences
      if (geofenceData.type === 'Polygon') {
        const path = geofenceData.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }));
        allPaths.push(path);
        path.forEach(p => bounds.extend(p));
      } else if (geofenceData.type === 'MultiPolygon') {
        geofenceData.coordinates.forEach(polygon => {
          const path = polygon[0].map(coord => ({ lat: coord[1], lng: coord[0] }));
          allPaths.push(path);
          path.forEach(p => bounds.extend(p));
        });
      } else if (geofenceData.coordinates) {
        // Fallback for non-standard original code
        const path = geofenceData.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }));
        allPaths.push(path);
        path.forEach(p => bounds.extend(p));
      }
    }

    // Create the geofence polygons (blue outlines)
    const geofencePolygons = allPaths.map(path => new window.google.maps.Polygon({
      paths: path,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: 'transparent',
      fillOpacity: 0,
      clickable: false,
      map: mapRef
    }));
    
    // Create the world bounds
    const worldBounds = [
      { lat: 85, lng: -180 },
      { lat: 85, lng: 180 },
      { lat: -85, lng: 180 },
      { lat: -85, lng: -180 }
    ];
    
    // Create the geofence holes (counter-clockwise for outer ring)
    const holePaths = allPaths.map(path => [...path].reverse());
    
    // Create the inverse polygon (grey overlay outside geofence)
    const overlayPolygon = new window.google.maps.Polygon({
      paths: [worldBounds, ...holePaths],
      strokeColor: 'transparent',
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: '#6B7280',
      fillOpacity: 0.4,
      clickable: false,
      map: mapRef
    });
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const centerLat = (ne.lat() + sw.lat()) / 2;
    const centerLng = (ne.lng() + sw.lng()) / 2;

    if (mapRef) {
      mapRef.setCenter({ lat: centerLat, lng: centerLng });
      mapRef.setZoom(16.5);
      
      mapRef.setOptions({
        restriction: {
          latLngBounds: bounds,
          strictBounds: true,
        },
        minZoom: 16.5,
        maxZoom: 22
      });
      
      setMinZoomLevel(16.5);
    }
    
    return () => {
      geofencePolygons.forEach(p => p.setMap(null));
      overlayPolygon.setMap(null);
    };
  }, [mapRef, geofenceData]);

  // Helper function to check if a point is inside a polygon (for Infrastructure right-click)
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

  // Handle map load
  const handleMapLoad = (map) => {
    setMapRef(map);
    applyGoogleMapsControlStyle(); 
    
    const addInteractionListeners = () => {
      map.addListener('dragstart', () => {
        userHasInteractedRef.current = true;
      });
      
      map.addListener('zoom_changed', () => {
        if (!isInitialLoadRef.current && geofenceSetupCompleteRef.current) {
          userHasInteractedRef.current = true;
        }
      });

      map.addListener('click', () => {
        userHasInteractedRef.current = true;
      });
    };

    addInteractionListeners();
  };

  // Handle marker click
  const handleMarkerClick = useCallback((locationKey, index = 0) => {
    const [lat, lng] = locationKey.split(',').map(parseFloat);
    setSelectedLocation({ key: locationKey, lat, lng });
    setCurrentPostIndex(index);
  }, []);

  // Navigation functions
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
      const response = await fetch('/api/communities/post/like', {
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

  // Get current post item
  const getCurrentPostItem = () => {
    if (!selectedLocation || !groupedPosts[selectedLocation.key]) return null;
    return groupedPosts[selectedLocation.key][currentPostIndex];
  };

  const currentPost = getCurrentPostItem();
  const selectedPostGroup = selectedLocation ? groupedPosts[selectedLocation.key] : [];

  // Choose the appropriate MapCard based on community type
  const renderMapCard = () => {
    if (isInfrastructureCommunity) {
      return (
        <InfrastructureMapCard
          post={currentPost}
          user={user}
          onClose={() => {
            setSelectedLocation(null);
            setShowRegistrationDetails(false);
            setShowUserProfile(false);
            setCurrentRegistrationIndex(0);
          }}
          onPrev={handlePrevPost}
          onNext={handleNextPost}
          currentIndex={currentPostIndex}
          totalItems={selectedPostGroup.length}
          onLike={handleLikePost}
          isLiked={postLikes[currentPost?.id]}
          likeCount={postLikeCounts[currentPost?.id] || 0}
          onProfileClick={() => setShowUserProfile(true)}
          onApplyClick={() => setShowRegistrationModal(true)}
          showRegistrationDetails={showRegistrationDetails}
          onBackFromRegistration={() => setShowRegistrationDetails(false)}
          getCurrentRegistrationItem={getCurrentPostItem}
          currentRegistrationIndex={currentRegistrationIndex}
          showUserProfile={showUserProfile}
          onBackFromProfile={() => setShowUserProfile(false)}
        />
      );
    } else {
      return (
        <MapCard
          post={currentPost}
          user={user}
          onClose={() => {
            if (viewTimerRef.current) {
              clearTimeout(viewTimerRef.current);
              viewTimerRef.current = null;
            }
            
            if (currentPost) {
              markPostAsRead(currentPost.id);
            }
            setSelectedLocation(null);
            setShowRegistrationDetails(false);
            setShowUserProfile(false);
            setCurrentRegistrationIndex(0);
          }}
          onPrev={handlePrevPost}
          onNext={handleNextPost}
          readPostIds={readPostIds}
          currentIndex={currentPostIndex}
          totalItems={selectedPostGroup.length}
          onLike={handleLikePost}
          isLiked={postLikes[currentPost?.id]}
          likeCount={postLikeCounts[currentPost?.id] || 0}
          onProfileClick={() => setShowUserProfile(true)}
          onApplyClick={() => setShowRegistrationModal(true)}
          showRegistrationDetails={showRegistrationDetails}
          onBackFromRegistration={() => setShowRegistrationDetails(false)}
          getCurrentRegistrationItem={getCurrentPostItem}
          currentRegistrationIndex={currentRegistrationIndex}
          showUserProfile={showUserProfile}
          onBackFromProfile={() => setShowUserProfile(false)}
          isFromCommunity={true}
          communityRole={communityRole}
        />
      );
    }
  };

  return (
    <>
      <div className="relative">

        {/* Approval Pending Overlay for regular communities */}
        {showApprovalOverlay && selectedCommunity && !isInfrastructureCommunity && (
          <ApprovalPendingOverlay
            communityName={selectedCommunity.name}
            isMobile={isMobile}
          />
        )}

        {/* Infrastructure Access Overlay for Infrastructure communities */}
        {showAccessOverlay && isInfrastructureCommunity && (
          <InfrastructureAccessOverlay
            infrastructureName={selectedCommunity?.name || 'this infrastructure'}
            accessStatus={accessStatus}
            isMobile={isMobile}
            onJoinRequest={() => handleJoinInfrastructure(selectedCommunity?.id)}
          />
        )}

        {/* Infrastructure Roles Bar for Infrastructure Admin */}
        {isInfrastructureCommunity && isAdmin && infrastructureRoles.length > 0 && (
          <InfrastructureRolesBar
            infrastructureRoles={infrastructureRoles}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            isLoading={isLoading}
          />
        )}

        {/* Page Access Overlay for Infrastructure communities */}
        {/* {showAccessOverlay && pageAccessData && isInfrastructureCommunity && (
          <PageAccessOverlay
            pageName={pageAccessData.pageName || 'this page'}
            accessStatus={accessStatus}
            isMobile={isMobile}
            onJoinRequest={() => handleJoinPage(selectedCommunity?.id)}
          />
        )} */}

        {/* Page Roles Bar for Infrastructure Admin */}
        {/* {isInfrastructureCommunity && isAdmin && pageRoles.length > 0 && (
          <PageRolesBar
            pageRoles={pageRoles}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            isLoading={isLoading}
          />
        )} */}

        <CommunityPostCreation
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          communityId={selectedCommunity?.id}
        />

        {/* Filter Controls - Top Right */}
        <div className="absolute top-3 right-4 z-10 flex items-end gap-2">
          {selectedCommunity && (
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

                  {!isInfrastructureCommunity && (
                    <ResetMapButton
                      mapRef={mapRef}
                      fetchPostsData={fetchPostsData}
                      setSelectedLocation={setSelectedLocation}
                      id={selectedCommunity?.id}
                      isMobile={isMobile}
                      buttonStyle={buttonStyle}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Reset Button for regular communities */}
        {isMobile && !isInfrastructureCommunity && (
          <div className="absolute right-1 z-10" style={{ bottom: '238px' }}>
            <ResetMapButton
              mapRef={mapRef}
              fetchPostsData={fetchPostsData}
              setSelectedLocation={setSelectedLocation}
              id={selectedCommunity?.id}
              isMobile
              buttonStyle={buttonStyle}
            />
          </div>
        )}

        {/* Show message when no posts */}
        {!isLoading && selectedCommunity && selectedCommunity?.source !== 'static' && postsItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-5">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-gray-200">
              <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isInfrastructureCommunity && selectedRole 
                  ? `No ${currentRoleName} Posts Found`
                  : 'No Posts Found'
                }
              </h3>
              <p className="text-gray-600">
                {isInfrastructureCommunity && selectedRole
                  ? `No posts available for the ${currentRoleName} role`
                  : 'No posts available for your role'
                }
              </p>
            </div>
          </div>
        )}

        {/* Static State Community UI Elements */}
        {selectedCommunity?.source === 'static' && (
          <>
            {/* District Selector - Bottom Left */}
            <div className="absolute bottom-6 left-4 z-10 w-48 sm:w-64">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">Filter by District</span>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  <button
                    onClick={() => setSelectedDistrict(null)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      !selectedDistrict 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Districts
                  </button>
                  {/* We dynamically pull district names from the geofence data features */}
                  {geofenceData?.type === 'FeatureCollection' && 
                    // Get unique district names, sort alphabetically
                    Array.from(new Set(geofenceData.features.map(f => f.properties.name)))
                      .sort()
                      .map(districtName => (
                        <button
                          key={districtName}
                          onClick={() => setSelectedDistrict(districtName)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                            selectedDistrict === districtName 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {districtName}
                        </button>
                      ))
                  }
                </div>
              </div>
            </div>

          </>
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
            minZoom: isInfrastructureCommunity ? minZoomLevel : 2,
            maxZoom: isInfrastructureCommunity ? 22 : 18,
            restriction: isInfrastructureCommunity && geofenceData ? {
              latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180,
              },
              strictBounds: false,
            } : {
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
          onClick={() => {
            if (contextMenu) {
              setContextMenu(null);
            }
          }}
          onRightClick={(e) => {
            if (!isInfrastructureCommunity || !geofenceData) return;
            
            const clickedLat = e.latLng.lat();
            const clickedLng = e.latLng.lng();
            
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
          onLoad={handleMapLoad}
        >
          {/* Custom Map Type Controls */}
          <MapTypeControls mapRef={mapRef} buttonStyle={buttonStyle}/>

          {/* Community Quick Actions for District communities */}
          {user?.role_name === "official_user" && isDistrictCommunity &&(
            <div className="absolute right-1.5 z-10" style={{ bottom: isMobile ? '300px' : '200px' }}>
              <CommunityQuickActions
                activeFilter={activeQuickFilter}
                onFilterChange={handleQuickFilterChange}
                communityType={"city"}
                isMobile={isMobile}
              />
            </div>
          )}

          {/* Custom Zoom Controls */}
          <ZoomControls mapRef={mapRef} isMobile={isMobile}/>

          {currentPost && (
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
              {renderMapCard()}
            </InfoWindowF>
          )}

          {/* Context Menu for Right Click (Infrastructure only) */}
          {contextMenu && isInfrastructureCommunity && (
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
                <button
                  onClick={() => setContextMenu(null)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>

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
                    Create Event
                  </button>

                  <button
                    onClick={() => {
                      setIsIssueModalOpen(true);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-md transition-colors text-sm text-red-700"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </InfoWindowF>
          )}

          {/* Static Category Markers */}
          {selectedCommunity?.source === 'static' && categoryMarkers.map(marker => (
            <MarkerF
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setActiveCategoryMarker(marker.id)}
              icon={{
                url: getMarkerIcon(marker.category, activeCategoryMarker === marker.id)
              }}
            />
          ))}

          {/* Active Category InfoWindow */}
          {selectedCommunity?.source === 'static' && activeCategoryMarker && (() => {
            const markerData = categoryMarkers.find(m => m.id === activeCategoryMarker);
            if (!markerData) return null;
            return (
              <InfoWindowF
                position={{ lat: markerData.lat, lng: markerData.lng }}
                onCloseClick={() => setActiveCategoryMarker(null)}
                options={{
                  pixelOffset: new window.google.maps.Size(0, -30),
                  maxWidth: 280
                }}
              >
                <div className="bg-white rounded-lg overflow-hidden font-sans">
                  <div className="h-24 w-full relative">
                    <img src={markerData.image} alt={markerData.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 bg-white/90 text-yellow-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Star size={10} fill="currentColor" /> {markerData.points} pts
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{markerData.title}</h3>
                    {markerData.hours && (
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock size={10}/> {markerData.hours}
                      </p>
                    )}
                    {markerData.distance && (
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin size={10}/> {markerData.distance}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 line-clamp-3 mb-3">{markerData.description}</p>
                    <div className="flex gap-2">
                       <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-medium transition-colors" onClick={() => { alert('Accepted!'); setActiveCategoryMarker(null); }}>Accept</button>
                       <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium transition-colors" onClick={() => { alert('Denied!'); setActiveCategoryMarker(null); }}>Deny</button>
                       <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded text-xs font-medium transition-colors border border-red-100" onClick={() => {
                          setCategoryMarkers(prev => prev.filter(m => m.id !== markerData.id));
                          setActiveCategoryMarker(null);
                       }}>Hide</button>
                    </div>
                  </div>
                </div>
              </InfoWindowF>
            );
          })()}
        </GoogleMap>

        {selectedCommunity?.source === 'static' && (
          <>
            {/* Category Cards - Bottom Center Array */}
            {selectedDistrict && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex gap-2 sm:gap-4 overflow-x-auto max-w-[calc(100vw-300px)] px-4 custom-scrollbar">
                {[
                  { id: 'Challenges', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-400' },
                  { id: 'Places', icon: MapPin, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-400' },
                  { id: 'Food', icon: Utensils, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-400' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedStateCategory(cat.id === selectedStateCategory ? null : cat.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border bg-white whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      selectedStateCategory === cat.id 
                        ? `${cat.border} ring-2 ring-offset-1 ${cat.ring} scale-105` 
                        : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${cat.bg}`}>
                      <cat.icon className={`w-5 h-5 ${cat.color}`} />
                    </div>
                    <span className={`font-semibold ${selectedStateCategory === cat.id ? 'text-gray-900' : 'text-gray-600'}`}>
                      {cat.id}
                    </span>
                  </button>
                ))}
              </div>
            )}

          </>
        )}

        {/* Create Post Modal for Infrastructure */}
        {isInfrastructureCommunity && (
          <>
            <CreateInfrastructurePostModal
              isOpen={isCreatePostModalOpen}
              onClose={() => {
                setIsCreatePostModalOpen(false);
                setClickedLocation(null);
              }}
              onBack={() => {
                setIsCreatePostModalOpen(false);
                setClickedLocation(null);
              }}
              pageId={selectedCommunity?.id}
              preSelectedCategory={selectedCategory}
              preSelectedPostType={selectedPostType}
              initialLatitude={clickedLocation?.lat}
              initialLongitude={clickedLocation?.lng}
            />

            <CreateInfrastructurePostModal
              isOpen={isCreateEventModalOpen}
              onClose={() => {
                setIsCreateEventModalOpen(false);
                setClickedLocation(null);
              }}
              onBack={() => {
                setIsCreateEventModalOpen(false);
                setClickedLocation(null);
              }}
              pageId={selectedCommunity?.id}
              preSelectedCategory={selectedCategory}
              preSelectedPostType={selectedPostType}
              initialLatitude={clickedLocation?.lat}
              initialLongitude={clickedLocation?.lng}
            />

            <CreateInfrastructurePostModal
              isOpen={isIssueModalOpen}
              onClose={() => {
                setIsIssueModalOpen(false);
                setClickedLocation(null);
              }}
              onBack={() => {
                setIsIssueModalOpen(false);
                setClickedLocation(null);
              }}
              pageId={selectedCommunity?.id}
              preSelectedPostType="issue"
              initialLatitude={clickedLocation?.lat}
              initialLongitude={clickedLocation?.lng}
            />
          </>
        )}

        <RequirementModal
          isOpen={showRequirementModal}
          onClose={() => setShowRequirementModal(false)}
          requirementData={requirementData}
          communityId={selectedCommunity?.id}
          onComplete={() => {
            setShowRequirementModal(false);
          }}
        />

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
            onSubmit={(result) => console.log('Registration successful:', result)}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-10">
            <div className="flex items-center space-x-2"> 
              <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
              <span>
                {isInfrastructureCommunity && currentRoleName 
                  ? `Loading ${currentRoleName} Data...` 
                  : 'Loading Data...'
                }
              </span>
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
    </>
  );
}