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
    AlertTriangle,
    Target,
    Utensils,
    Activity,
    Calendar,
    Star,
    Clock,
    Fish,
    Trophy,
    Bike,
    Waves,
    Music,
    Palette,
    Cpu,
    ShoppingBag,
    ArrowLeft,
    UserPlus,
    Heart,
    MessageCircle,
    CheckCircle,
    Users,
    UsersRound
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
  const [isDistrictFilterOpen, setIsDistrictFilterOpen] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState("");
  const [isDiscoveryMenuOpen, setIsDiscoveryMenuOpen] = useState(false);
  const [activeCardTab, setActiveCardTab] = useState('Rules');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [activeDiscoveryCategory, setActiveDiscoveryCategory] = useState(null);

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

  // Advanced Map Interaction Redesign States
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [deniedItemIds, setDeniedItemIds] = useState(new Set());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [qrSuccess, setQrSuccess] = useState(false);

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
    } else if (category === 'Activity') {
      color = '#06b6d4'; // cyan
      path = '<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>';
    } else if (category === 'Events') {
      color = '#8b5cf6'; // violet
      path = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';
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
        
        // Define which categories to show based on district selection
        let categoriesToShow = [];
        if (selectedStateCategory) {
          categoriesToShow = [selectedStateCategory];
        } else if (selectedDistrict) {
          categoriesToShow = ['Challenges', 'Places', 'Food', 'Activity', 'Events'];
        } else {
          categoriesToShow = ['Challenges']; // default to challenges statewide
        }
        
        categoriesToShow.forEach((cat, catIdx) => {
          let items = distData[cat] || [];
          
          // Apply sub-category filter if selected
          if (selectedSubCategory) {
            items = items.filter(item => item.tags?.includes(selectedSubCategory));
          }
          
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
  }, [selectedStateCategory, selectedDistrict, geofenceData, selectedCommunity, selectedSubCategory]);

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

  // Unified geofence effect: Handles fitBounds, polygon rendering, and state-specific logic
  useEffect(() => {
    if (!mapRef || !geofenceData) return;
    
    // 1. Calculate and Fit Bounds
    const bounds = new google.maps.LatLngBounds();
    let hasCoords = false;
    let allPaths = [];

    if (geofenceData.type === 'FeatureCollection') {
      geofenceData.features.forEach(feature => {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach(ring => {
            const path = ring.map(coord => ({ lat: coord[1], lng: coord[0] }));
            allPaths.push(path);
            path.forEach(p => {
              bounds.extend(p);
              hasCoords = true;
            });
          });
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              const path = ring.map(coord => ({ lat: coord[1], lng: coord[0] }));
              allPaths.push(path);
              path.forEach(p => {
                bounds.extend(p);
                hasCoords = true;
              });
            });
          });
        }
      });
    } else if (geofenceData.type === 'Polygon') {
      geofenceData.coordinates.forEach(ring => {
        const path = ring.map(coord => ({ lat: coord[1], lng: coord[0] }));
        allPaths.push(path);
        path.forEach(p => {
          bounds.extend(p);
          hasCoords = true;
        });
      });
    } else if (geofenceData.type === 'MultiPolygon') {
      geofenceData.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          const path = ring.map(coord => ({ lat: coord[1], lng: coord[0] }));
          allPaths.push(path);
          path.forEach(p => {
            bounds.extend(p);
            hasCoords = true;
          });
        });
      });
    }

    if (hasCoords) {
      // Logic for Infrastructure communities (keep original restriction behavior)
      if (isInfrastructureCommunity) {
        const worldBounds = [
          { lat: -85, lng: -180 },
          { lat: 85, lng: -180 },
          { lat: 85, lng: 180 },
          { lat: -85, lng: 180 },
          { lat: -85, lng: -0.1 }
        ];
        const holePaths = allPaths.map(path => [...path].reverse());
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
        mapRef.setCenter({ lat: (ne.lat() + sw.lat()) / 2, lng: (ne.lng() + sw.lng()) / 2 });
        mapRef.setZoom(16.5);
        mapRef.setOptions({
          restriction: { latLngBounds: bounds, strictBounds: true },
          minZoom: 16.5,
          maxZoom: 22
        });
        setMinZoomLevel(16.5);

        return () => overlayPolygon.setMap(null);
      } else {
        // Restore geofence highlighting for static/state communities
        const geofencePolygons = allPaths.map(path => new window.google.maps.Polygon({
          paths: path,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          clickable: false,
          map: mapRef
        }));

        const worldBounds = [
          { lat: 85, lng: -180 },
          { lat: 85, lng: 180 },
          { lat: -85, lng: 180 },
          { lat: -85, lng: -180 }
        ];
        
        const holePaths = allPaths.map(path => [...path].reverse());
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

        mapRef.fitBounds(bounds);
        mapRef.setOptions({
          restriction: null,
          minZoom: 2,
          maxZoom: 18
        });
        setMinZoomLevel(2);
        
        const listener = google.maps.event.addListenerOnce(mapRef, "idle", () => {
          if (mapRef.getZoom() > 14) mapRef.setZoom(14);
        });

        return () => {
          geofencePolygons.forEach(p => p.setMap(null));
          overlayPolygon.setMap(null);
        };
      }
    }
  }, [mapRef, geofenceData, isInfrastructureCommunity]);

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
            {/* Modern District Selector - Bottom Left */}
            <div className="absolute bottom-10 left-4 z-[110] flex flex-col gap-2">
              <button
                onClick={() => setIsDistrictFilterOpen(!isDistrictFilterOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl border transition-all duration-300 backdrop-blur-md ${
                  isDistrictFilterOpen 
                    ? 'bg-blue-600 text-white border-blue-500 scale-105' 
                    : 'bg-white/90 text-gray-700 border-white/20 hover:bg-white hover:scale-105'
                }`}
              >
                <MapPin className={`w-4 h-4 ${isDistrictFilterOpen ? 'text-white' : 'text-blue-500'}`} />
                <span className="text-sm font-bold tracking-tight">
                  {selectedDistrict || 'Select District'}
                </span>
                {isDistrictFilterOpen ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
              </button>

              {isDistrictFilterOpen && (
                <div className="w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search district..."
                      className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 font-medium"
                      value={districtSearchQuery}
                      onChange={(e) => setDistrictSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1.5 custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedDistrict(null);
                        setIsDistrictFilterOpen(false);
                        setDistrictSearchQuery("");
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center justify-between group ${
                        !selectedDistrict 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <span className="font-semibold">All Districts</span>
                      {!selectedDistrict && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </button>
                    {geofenceData?.type === 'FeatureCollection' && 
                      Array.from(new Set(geofenceData.features.map(f => f.properties.name)))
                        .sort()
                        .filter(name => name.toLowerCase().includes(districtSearchQuery.toLowerCase()))
                        .map(districtName => (
                          <button
                            key={districtName}
                            onClick={() => {
                              setSelectedDistrict(districtName);
                              setIsDistrictFilterOpen(false);
                              setDistrictSearchQuery("");
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center justify-between mt-0.5 group ${
                              selectedDistrict === districtName 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <span className="font-semibold truncate pr-2">{districtName}</span>
                            {selectedDistrict === districtName && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                          </button>
                        ))
                    }
                  </div>
                </div>
              )}
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
            if (activeCategoryMarker) {
              setActiveCategoryMarker(null);
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
                onCloseClick={() => { setActiveCategoryMarker(null); setActiveCardTab('Rules'); }}
                options={{
                  pixelOffset: new window.google.maps.Size(0, -30),
                  maxWidth: 320
                }}
              >
                <div className={`bg-white rounded-xl overflow-hidden font-sans relative shadow-2xl border border-gray-100 min-w-[280px] ${deniedItemIds.has(markerData.id) ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  {/* Header Image */}
                  <div className="h-32 w-full relative">
                    <img src={markerData.image} alt={markerData.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-3 left-3 right-3">
                       <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">
                         {markerData.category} {markerData.tags?.[0] && `→ ${markerData.tags[0]}`}
                       </p>
                       <h3 className="font-bold text-white text-base leading-tight drop-shadow-md">{markerData.title}</h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Entry Fee</span>
                        <span className="text-sm font-black text-gray-800">{markerData.entryFee || 'Free'}</span>
                      </div>
                      
                      {markerData.id.startsWith('f_') && markerData.price && (
                        <div className="flex items-center justify-between bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                          <span className="text-[10px] uppercase font-bold text-green-600/70 tracking-wider">Price</span>
                          <span className="text-sm font-black text-green-700">{markerData.price}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        setDetailItem(markerData);
                        setIsDetailModalOpen(true);
                        setActiveCategoryMarker(null);
                        setActiveCardTab('Rules'); 
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </InfoWindowF>
            );
          })()}
        </GoogleMap>

        {selectedCommunity?.source === 'static' && (
          <>
            {/* Unified Discovery FAB - Bottom Right */}
            <div className={`fixed z-[120] flex flex-col items-end gap-3 transition-all duration-300 ${
              isMobile ? 'bottom-32 right-3' : 'bottom-6 right-6'
            }`}>
              {/* Expanded Menu Items */}
              {isDiscoveryMenuOpen && (
                <div className="flex flex-col items-end gap-3 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
                  {activeDiscoveryCategory ? (
                    // Sub-category Sub-menu
                    <>
                      <button 
                        onClick={() => setActiveDiscoveryCategory(null)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 hover:bg-gray-200/80 rounded-full text-[10px] font-bold text-gray-600 transition-colors backdrop-blur-sm self-end mb-1"
                      >
                        <ArrowLeft size={12} /> Back
                      </button>
                      {[
                        { id: 'Biryani', icon: Utensils, color: 'text-red-500', label: 'Biryani' },
                        { id: 'Mandi', icon: Utensils, color: 'text-orange-600', label: 'Mandi & Arabian' },
                        { id: 'Seafood', icon: Fish, color: 'text-blue-500', label: 'Seafood' },
                        { id: 'Appam', icon: Utensils, color: 'text-amber-600', label: 'Appam & Chicken' },
                        { id: 'Puttu', icon: Utensils, color: 'text-neutral-700', label: 'Puttum Beefum' },
                        { id: 'Football', icon: Trophy, color: 'text-green-500', label: 'Football Turfs' },
                        { id: 'Cricket', icon: Trophy, color: 'text-blue-500', label: 'Cricket Nets' },
                        { id: 'Yoga', icon: Activity, color: 'text-purple-500', label: 'Yoga & Health' },
                        { id: 'Cycling', icon: Bike, color: 'text-orange-500', label: 'Cycling Clubs' },
                        { id: 'Kayaking', icon: Waves, color: 'text-cyan-500', label: 'Kayaking Spots' },
                        { id: 'Music', icon: Music, color: 'text-pink-500', label: 'Live Music' },
                        { id: 'Art', icon: Palette, color: 'text-indigo-500', label: 'Art Galleries' },
                        { id: 'Tech', icon: Cpu, color: 'text-gray-600', label: 'Tech Meetups' },
                        { id: 'Market', icon: ShoppingBag, color: 'text-amber-500', label: 'Local Markets' }
                      ].filter(sub => {
                        if (activeDiscoveryCategory === 'Food') return ['Biryani', 'Mandi', 'Seafood', 'Appam', 'Puttu'].includes(sub.id);
                        if (activeDiscoveryCategory === 'Activity') return ['Football', 'Cricket', 'Yoga', 'Cycling', 'Kayaking'].includes(sub.id);
                        if (activeDiscoveryCategory === 'Events') return ['Music', 'Art', 'Tech', 'Market'].includes(sub.id);
                        return false;
                      }).map((sub) => (
                        <div key={sub.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                          <span className="bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-xl uppercase tracking-widest border border-gray-100">
                            {sub.label}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedStateCategory(activeDiscoveryCategory);
                              setSelectedSubCategory(sub.id === selectedSubCategory ? null : sub.id);
                              setIsDiscoveryMenuOpen(false);
                            }}
                            className={`w-11 h-11 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md ${
                              selectedSubCategory === sub.id 
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100 font-bold' 
                                : 'bg-white/95 text-gray-700 border border-white/20'
                            }`}
                          >
                            <sub.icon className={`w-4.5 h-4.5 ${selectedSubCategory === sub.id ? 'text-white' : sub.color}`} />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Main Category Menu
                    [
                      { id: 'Challenges', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-400', always: true, label: 'Challenges', hasSub: false },
                      { id: 'Places', icon: MapPin, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-400', always: false, label: 'Places', hasSub: false },
                      { id: 'Food', icon: Utensils, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-400', always: false, label: 'Food Specials', hasSub: true },
                      { id: 'Activity', icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', ring: 'ring-cyan-400', always: false, label: 'Activities', hasSub: true },
                      { id: 'Events', icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-400', always: false, label: 'Events', hasSub: true },
                    ].filter(cat => cat.always || selectedDistrict).reverse().map((cat) => (
                      <div key={cat.id} className="flex items-center gap-3">
                        <span className="bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-2xl uppercase tracking-widest border border-white/10">
                          {cat.label}
                        </span>
                        <button
                          onClick={() => {
                            if (cat.hasSub) {
                              setActiveDiscoveryCategory(cat.id);
                            } else {
                              setSelectedStateCategory(cat.id === selectedStateCategory ? null : cat.id);
                              setSelectedSubCategory(null);
                              setIsDiscoveryMenuOpen(false);
                            }
                          }}
                          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-md ${
                            selectedStateCategory === cat.id && !selectedSubCategory
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                              : 'bg-white/95 text-gray-700 border border-white/20'
                          }`}
                        >
                          <cat.icon className={`w-5 h-5 ${selectedStateCategory === cat.id && !selectedSubCategory ? 'text-white' : cat.color}`} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Main FAB Trigger */}
              <button
                onClick={() => {
                  if (isDiscoveryMenuOpen) {
                    setIsDiscoveryMenuOpen(false);
                    // Don't reset activeDiscoveryCategory here to allow re-opening the sub-menu if needed? 
                    // Actually, reset it to main on close for better UX
                    setTimeout(() => setActiveDiscoveryCategory(null), 300);
                  } else {
                    setIsDiscoveryMenuOpen(true);
                  }
                }}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:rotate-12 active:scale-90 z-[121] ${
                  isDiscoveryMenuOpen 
                    ? 'bg-red-500 text-white rotate-90 scale-110' 
                    : 'bg-white text-blue-600 border-2 border-blue-50/50 hover:bg-blue-50'
                }`}
              >
                {isDiscoveryMenuOpen ? (
                  <X className="w-8 h-8" />
                ) : (
                  <div className="relative">
                    <Target className={`w-8 h-8 ${selectedStateCategory ? '' : 'animate-pulse'}`} />
                    {(selectedStateCategory || selectedSubCategory) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>
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

        {/* --- Advanced Redesign UI Components --- */}

        {/* 1. Left-side Accepted Items Stack */}
        <div className="fixed left-4 top-24 z-50 flex flex-col gap-2 pointer-events-none">
          {acceptedItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setDetailItem(item);
                setIsDetailModalOpen(true);
                setActiveCardTab('Rules');
              }}
              className={`pointer-events-auto h-8 px-4 rounded-full shadow-lg border border-white flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 animate-in slide-in-from-left duration-300 max-w-[160px] group ${
                item.id.startsWith('c_') ? 'bg-orange-600/90' :
                item.id.startsWith('p_') ? 'bg-green-600/90' :
                item.id.startsWith('f_') ? 'bg-red-600/90' :
                item.id.startsWith('a_') ? 'bg-cyan-600/90' :
                item.id.startsWith('e_') ? 'bg-violet-600/90' : 'bg-blue-600/90'
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-widest truncate">
                {item.title.length > 10 ? `${item.title.substring(0, 10)}...` : item.title}
              </span>
            </button>
          ))}
        </div>

        {/* 2. Right-side Sliding Modal (60% width) */}
        {isDetailModalOpen && detailItem && (
          <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            {/* Backdrop click to close */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto" 
              onClick={() => setIsDetailModalOpen(false)}
            />
            
            <div className="w-[82%] md:w-[60%] h-[80%] my-auto mr-4 md:mr-8 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] pointer-events-auto animate-in slide-in-from-right duration-500 flex flex-col relative overflow-hidden rounded-[2.5rem] border border-gray-100/50">
              
              {/* 1. Top Header Refined */}
              <div className="bg-white p-4 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full text-white shadow-sm ${
                    detailItem.id.startsWith('c_') ? 'bg-orange-500' :
                    detailItem.id.startsWith('p_') ? 'bg-green-500' :
                    detailItem.id.startsWith('f_') ? 'bg-red-500' :
                    detailItem.id.startsWith('a_') ? 'bg-cyan-500' :
                    detailItem.id.startsWith('e_') ? 'bg-violet-500' : 'bg-blue-500'
                  }`}>
                    {detailItem.id.startsWith('c_') ? <Target size={16} /> :
                     detailItem.id.startsWith('p_') ? <MapPin size={16} /> :
                     detailItem.id.startsWith('f_') ? <Utensils size={16} /> :
                     detailItem.id.startsWith('a_') ? <Activity size={16} /> :
                     detailItem.id.startsWith('e_') ? <Calendar size={16} /> : <Star size={16} />}
                  </div>
                  <span className="font-black text-blue-600 text-[10px] md:text-xs tracking-[0.2em] uppercase">
                    {detailItem.category} {detailItem.tags?.[0] && `/ ${detailItem.tags[0]}`}
                  </span>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content Wrapper */}
              <div className="flex-1 overflow-y-auto scrollbar-none">
                {/* 2. Logo Section (Hotel Name as Logo Text) */}
                <div className="py-4 md:py-6 flex flex-col items-center justify-center bg-white border-b border-gray-50/50">
                  {detailItem.logo ? (
                    <img src={detailItem.logo} className="h-8 md:h-12 object-contain mb-1" alt="brand-logo" />
                  ) : null}
                  <div className="text-xs md:text-sm font-black text-blue-600 uppercase tracking-[0.2em] text-center px-4 leading-tight opacity-80">
                    {detailItem.title}
                  </div>
                </div>

                {/* 3. Main Image */}
                <div className="px-6">
                  <div className="rounded-[2rem] overflow-hidden shadow-lg h-48 md:h-64 relative">
                    <img src={detailItem.image} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>

                {/* 4. Title Section */}
                {/* 4. Title Section (Dish Name as Primary Title) */}
                <div className="px-6 py-4 md:py-6 text-center">
                  <h2 className="text-gray-900 text-xl md:text-3xl font-black tracking-tight leading-tight uppercase">
                    {detailItem.foodName || detailItem.title}
                  </h2>
                </div>

                {/* 5. Tabs Layout (Client Style) */}
                <div className="flex px-6 border-b border-gray-100 bg-gray-50/50">
                  {['Rules', 'People', 'Leaderboard'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveCardTab(tab)}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest relative transition-all ${
                        activeCardTab === tab ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {tab}
                      {activeCardTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full mx-4" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-6 py-6 mb-8 min-h-[100px]">
                  {activeCardTab === 'Rules' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">{detailItem.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-blue-50 p-4 rounded-[1.5rem] border border-blue-100 flex flex-col justify-center text-center">
                            <span className="text-[9px] uppercase font-black text-blue-400 tracking-widest block mb-1">Price</span>
                            <span className="text-lg md:text-xl font-black text-blue-700 leading-none">{detailItem.price || detailItem.entryFee}</span>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-[1.5rem] border border-yellow-100 flex flex-col justify-center text-center">
                            <span className="text-[9px] uppercase font-black text-yellow-500 tracking-widest block mb-1">Prize</span>
                            <span className="text-lg md:text-xl font-black text-yellow-700 leading-none">{detailItem.prize}</span>
                          </div>
                      </div>
                    </div>
                  )}
                  {activeCardTab === 'People' && (
                    <div className="space-y-6">
                      {(detailItem.people || []).map((person, idx) => (
                        <div key={idx} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <img src={person.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                                <div>
                                  <p className="font-bold text-gray-800">{person.name}</p>
                                  <p className="text-xs text-gray-400">{person.date}</p>
                                </div>
                              </div>
                              <button className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition-colors">Follow</button>
                           </div>
                           <p className="text-sm font-bold text-green-600 mb-4 flex items-center gap-2">
                             <CheckCircle size={16} /> {person.description}
                           </p>
                           <img src={person.certification} className="w-full h-40 object-cover rounded-xl mb-4" alt="" />
                           <div className="flex items-center gap-6 text-gray-400">
                              <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                <Heart size={16} /> <span className="text-xs font-black">{person.likes}</span>
                              </button>
                              <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                <MessageCircle size={16} /> <span className="text-xs font-black">{person.comments}</span>
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeCardTab === 'Leaderboard' && (
                    <div className="space-y-4">
                      {(detailItem.leaderboard || []).map((entry, idx) => (
                         <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                              <span className={`text-xl font-black ${idx === 0 ? 'text-yellow-600' : 'text-gray-300'}`}>#{entry.rank}</span>
                              <img src={entry.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                              <span className="font-black text-gray-800">{entry.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black text-blue-600">{entry.points}</p>
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Points</p>
                            </div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Info Blocks (Yellow boxes Refined) */}
                <div className="grid grid-cols-2 gap-3 px-6 mb-6 mt-auto flex-shrink-0">
                  <div className="bg-[#FFFCE4] border border-[#FFD700] p-3 rounded-[1.5rem] text-center shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-1">DISTANCE</p>
                    <p className="text-gray-900 text-base md:text-lg font-black">{detailItem.distance || '0.50 km'}</p>
                  </div>
                  <div className="bg-[#FFFCE4] border border-[#FFD700] p-3 rounded-[1.5rem] text-center shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase mb-1">PRICE</p>
                    <p className="text-gray-900 text-base md:text-lg font-black">
                      {detailItem.price || detailItem.prize || detailItem.entryFee}
                    </p>
                  </div>
                </div>
              </div>

              {/* 7. Full-width Sticky Footer */}
              {!acceptedItems.find(i => i.id === detailItem.id) && !deniedItemIds.has(detailItem.id) ? (
                <div className="flex h-14 md:h-20 flex-shrink-0">
                  <button 
                    onClick={() => {
                      setAcceptedItems(prev => [...prev.filter(i => i.id !== detailItem.id), detailItem].slice(-5));
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 bg-[#00C853] hover:bg-[#00B248] text-white font-black text-base md:text-xl tracking-[0.1em] transition-colors"
                  >
                    ACCEPT
                  </button>
                  <button 
                    onClick={() => {
                      setDeniedItemIds(prev => new Set([...prev, detailItem.id]));
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 bg-[#FF0000] hover:bg-[#E60000] text-white font-black text-base md:text-xl tracking-[0.1em] transition-colors"
                  >
                    HIDE
                  </button>
                </div>
              ) : deniedItemIds.has(detailItem.id) ? (
                <div className="p-8 bg-gray-50 text-center font-bold text-gray-400 border-t border-gray-100 flex-shrink-0">
                    This item has been declined.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* 3. Center QR Scanning Modal (90% width/height) */}
        {isQRModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !qrScanning && setIsQRModalOpen(false)} />
            
            <div className="relative w-[90%] max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <button 
                 onClick={() => setIsQRModalOpen(false)}
                 className="absolute top-6 right-6 z-50 bg-gray-100 p-2 rounded-full"
               >
                 <X size={24} />
               </button>

               <div className="p-10 text-center">
                  <h2 className="text-4xl font-black mb-2">Scan QR Code</h2>
                  <p className="text-gray-500 mb-10 font-medium">Position the QR code within the frame to verify</p>
                  
                  {/* QR Simulation Frame */}
                  <div className="relative aspect-square w-full max-w-sm mx-auto mb-10 overflow-hidden rounded-[2rem] border-4 border-dashed border-blue-500/30 p-4">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Cpu size={200} />
                    </div>
                    
                    {qrScanning && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse-scan" style={{
                        animation: 'scan 2.5s infinite linear'
                      }} />
                    )}

                    {qrSuccess ? (
                      <div className="h-full w-full flex flex-col items-center justify-center bg-green-500 text-white animate-in zoom-in duration-500">
                        <CheckCircle size={80} className="mb-4" />
                        <h3 className="text-2xl font-bold">Verification Complete!</h3>
                        <p className="font-bold opacity-80">Points credited successfully</p>
                      </div>
                    ) : (
                      <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <Star size={100} className={qrScanning ? 'animate-pulse' : ''} />
                      </div>
                    )}
                  </div>

                  {!qrSuccess && (
                    <button
                      onClick={() => {
                        setQrScanning(true);
                        setTimeout(() => {
                           setQrScanning(false);
                           setQrSuccess(true);
                           setTimeout(() => {
                              // Success - remove from accepted items
                              setAcceptedItems(prev => prev.filter(i => i.id !== detailItem.id));
                              setQrSuccess(false);
                              setIsQRModalOpen(false);
                              setIsDetailModalOpen(false);
                           }, 2000);
                        }, 2500);
                      }}
                      disabled={qrScanning}
                      className={`w-full py-5 rounded-3xl text-xl font-black transition-all ${
                        qrScanning ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-200'
                      }`}
                    >
                      {qrScanning ? 'Verifying...' : 'Simulate QR Scan'}
                    </button>
                  )}
               </div>
            </div>
            
            <style jsx>{`
               @keyframes scan {
                 0% { top: 0% }
                 50% { top: 100% }
                 100% { top: 0% }
               }
            `}</style>
          </div>
        )}

      </div>
    </>
  );
}