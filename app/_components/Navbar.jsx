"use client"; 
import React, { useRef, useState, useEffect } from 'react';
import { Search, UserPlus, Plus, Users, Flag, Layers, Crown, Bell, ChevronDown, Menu, X, Building } from 'lucide-react';
import Image from 'next/image';
import CreatePageModal from '@/components/Navbar/CreatePageModal';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import AccountManagerModal from '@/components/Navbar/AccountManagerModal';
import CreateTypeSelectorModal from '@/components/Navbar/CreateTypeSelectorModal';
// import NotificationDropdown from '@/components/Navbar/NotificationDropdown';
import UserFollowedModal from '@/components/Navbar/UserFollowedModal';
import GuestSignupModal from '@/components/shared/GuestSignupModal';
import RoleSelectionModal from '@/components/community/RoleSelectionModal';
import FollowPromptModal from '@/components/community/FollowPromptModal';
import { BASE_IMG_URL } from '@/lib/map/constants';
import CreateCommunityModal from '@/components/community/CreateCommunityModal';
import SearchAddCommunityButton from '@/components/community/SearchAddCommunityButton';
import CreateOfficialUserModal from '@/components/community/offficial/CreateOfficialUserModal';
import CommunityPostSelector from '@/components/Navbar/CommunityPostSelector';

const Navbar = () => {
  // const params = useParams();
  // const pageId = params.id;
  
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  
  const [searchFocus, setSearchFocus] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createPageModalOpen, setCreatePageModalOpen] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [layersModalOpen, setLayersModalOpen] = useState(false);
  const [communitiesModalOpen, setCommunitiesModalOpen] = useState(false);

  const [accountManagerModalOpen, setAccountManagerModalOpen] = useState(false);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalFeature, setGuestModalFeature] = useState('');

  // Community follow states
  const [showFollowPrompt, setShowFollowPrompt] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [userFollowedCommunities, setUserFollowedCommunities] = useState(new Set());

  const [createOfficialsModalOpen, setCreateOfficialsModalOpen] = useState(false);
  const [createCommunityModalOpen, setCreateCommunityModalOpen] = useState(false);
  const [searchCommunityModalOpen, setSearchCommunityModalOpen] = useState(false);

  const [allowsCommunityPostCreation, setAllowsCommunityPostCreation] = useState(false);
  const [currentCommunityId, setCurrentCommunityId] = useState(null);
  const [isCheckingCommunity, setIsCheckingCommunity] = useState(false);

  const [centersModalOpen, setCentersModalOpen] = useState(false);
  const [createCommunityPostModalOpen, setCreateCommunityPostModalOpen] = useState(false);

  const currentIdentity = useIdentityStore(state => state.currentIdentity);
  const loggedInUserId = useIdentityStore(state => state.loggedInUserId);
  const switchIdentity = useIdentityStore(state => state.switchIdentity);

  const isGuest = currentIdentity?.type === 'guest';
  const isAdmin = currentIdentity?.role === 'official_admin' || currentIdentity?.role === 'super_admin';
  const isCommunityPage = pathname?.includes('/communities');

  // console.log("currentIdentity", "loggedInUserId", currentIdentity, loggedInUserId)

  // Fetch user's followed communities on mount
  useEffect(() => {
    const fetchFollowedCommunities = async () => {
      try {
        const response = await fetch('/api/communities/followed');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const followedIds = new Set(data.communities.map(c => c.id));
            setUserFollowedCommunities(followedIds);
          }
        }
      } catch (error) {
        console.error('Error fetching followed communities:', error);
      }
    };

    if (!isGuest) {
      fetchFollowedCommunities();
    }
  }, [isGuest]);

  // Add this effect to check community permissions when on community page
  useEffect(() => {
    const checkCommunityPostCreation = async () => {
      if (!isCommunityPage) {
        setAllowsCommunityPostCreation(false);
        setCurrentCommunityId(null);
        return;
      }

      // Extract communityId from URL
      const urlParams = new URLSearchParams(window.location.search);
      const communityId = urlParams.get('communityId');
      
      if (!communityId) {
        setAllowsCommunityPostCreation(false);
        setCurrentCommunityId(null);
        return;
      }

      setCurrentCommunityId(communityId);
      setIsCheckingCommunity(true);

      try {
        const response = await fetch(`/api/communities/${communityId}/check-post-creation`);
        if (response.ok) {
          const data = await response.json();
          setAllowsCommunityPostCreation(data.allowsPostCreation);
        } else {
          setAllowsCommunityPostCreation(false);
        }
      } catch (error) {
        console.error('Error checking community post creation:', error);
        setAllowsCommunityPostCreation(false);
      } finally {
        setIsCheckingCommunity(false);
      }
    };

    checkCommunityPostCreation();
  }, [isCommunityPage, pathname]); // Re-run when pathname changes

  const handleGuestAction = (featureName) => {
    if (isGuest) {
      setGuestModalFeature(featureName);
      setGuestModalOpen(true);
      return true;
    }
    return false;
  };

  // Real search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=all`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setIsSearchOpen(true);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    if (result.itemType === 'community' || result.itemType === 'special-community') {
      handleCommunityClick(result);
      return;
    }

    // Handle other result types
    let path;
    if (result.itemType === 'page') {
      path = `/page/${result.id}`;
    } else if (result.itemType === 'user') {
      path = `/profile/${result.id}`;
    } else {
      path = `/layers/${result.id}`;
    }
    
    router.push(path);
    setSearchQuery('');
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
  };

  const handleCommunityCreated = (community) => {
    console.log('Community created:', community);
    // Handle success (e.g., redirect, refresh list, show notification)
  };


  const handleCommunityClick = (community) => {
    // For special communities (centers), navigate directly without follow check
    if (community.itemType === 'special-community') {
      router.push(`/centers/${community.id}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
      return;
    }
    
    // Regular communities follow the existing logic
    const isFollowed = userFollowedCommunities.has(community.id);
    
    if (isFollowed) {
      // Navigate directly to community
      router.push(`/communities?communityId=${community.id}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
    } else {
      // Show follow prompt
      setSelectedCommunity(community);
      setShowFollowPrompt(true);
    }
  };

  const handleFollowClick = (community, e) => {
    e.stopPropagation(); // Prevent triggering handleResultClick
    setSelectedCommunity(community);
    setShowFollowPrompt(true);
  };

  const handleFollowCommunity = () => {
    setShowFollowPrompt(false);
    setShowRoleModal(true);
  };

  const handleRoleSelect = async (communityId, roleId) => {
    try {
      const response = await fetch('/api/communities/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communities: [{ communityId, roleId }] // This matches your existing API structure
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage token if it exists (matching your existing pattern)
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('user_token', data.token);
        }
        
        // Update followed communities set
        setUserFollowedCommunities(prev => new Set([...prev, communityId]));
        
        // Navigate to community
        router.push(`/communities?communityId=${communityId}`);
        
        // Close modals and clear search
        setShowRoleModal(false);
        setSelectedCommunity(null);
        setSearchQuery('');
        setIsSearchOpen(false);
        setMobileSearchOpen(false);
      } else {
        console.error('Failed to follow community:', data.message);
      }
    } catch (error) {
      console.error('Error following community:', error);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const capitalizeWords = (str) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Navigation handlers
  const handleFriendsClick = () => {
    router.push('/layers/4'); // Uncomment when you add useRouter
    // console.log('Navigate to /layer/4');
  };

  const handlePagesClick = () => {
    router.push('/layers/5'); // Uncomment when you add useRouter
    // console.log('Navigate to /layer/5');
  };

  const handlePageCreated = (newPage) => {
    console.log('New page created:', newPage);
    // You can add additional logic here, such as:
    // - Redirecting to the new page
    // - Updating global state
    // - Showing a success message
    // - Refreshing page list
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        // Clear all localStorage data
        localStorage.clear();

        // Redirect to login page
        window.location.href = "/auth/login";
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Handle outside click detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setMobileSearchOpen(false);
      }
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Auto search on typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-700/50 px-3 lg:px-6 py-3">
        <div className="flex items-center justify-between w-full min-w-0">
          {/* Left Side - Logo */}
            <div className="flex items-center space-x-2">
              {/* Desktop Logo */}
              <div className="hidden md:block relative h-[7vh] w-[20vw] lg:h-[8vh] lg:w-[15vw]">
                <Image
                  src="/images/mapogram.png"
                  alt="Mapogram Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Mobile Logo */}
              <div className="md:hidden relative w-8 h-8">
                <Image
                  src="/images/mapogram-icon.png"
                  alt="Mapogram Icon"
                  fill
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>

          {/* Center - Desktop Search */}
          <div className="hidden lg:flex flex-1 justify-center max-w-2xl mx-8">
            <div className="relative w-full max-w-md" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Search Mapogram..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-full py-3 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all duration-200 shadow-lg"
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
              />
              
              {/* Desktop Search Results */}
              {isSearchOpen && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-96 overflow-y-auto w-full">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                  ) : (
                    searchResults.map((result, index) => {
                      const isFollowed = result.itemType === 'community' ? userFollowedCommunities.has(result.id) : true;
                      
                      return (
                        <div
                          key={`${result.itemType}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              result.itemType === 'page' 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                : result.itemType === 'community' || 'special-community'
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                : 'bg-gradient-to-br from-orange-500 to-amber-600'
                            }`}>
                              {result.profile_pic_url ? (
                                <img src={result.profile_pic_url} alt={result.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                getInitials(result.name)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate text-sm">{result.name}</p>
                              <p className={`text-xs capitalize ${
                                result.itemType === 'page' 
                                  ? 'text-blue-600' 
                                  : result.itemType === 'community' || 'special-community'
                                  ? 'text-green-600'
                                  : 'text-orange-600'
                              }`}>
                                {result.itemType === 'special-community' ? 'Community' : result.itemType}
                              </p>
                            </div>
                          </div>
                          
                          {/* Follow button for communities - only show for regular communities, not special ones */}
                            {result.itemType === 'community' && !isFollowed && (
                              <button
                                onClick={(e) => handleFollowClick(result, e)}
                                className="ml-2 px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                              >
                                Follow
                              </button>
                            )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-end flex-1 space-x-6">
            { isCommunityPage ? (
              /* Community Page Navigation */
              <>
                {/* Navigation Items for Communities */}
                <div className="flex items-center justify-between bg-slate-800/50 backdrop-blur-sm rounded-xl p-1.5 flex-shrink-0 min-w-max">
                  <NavItem 
                    icon={Plus} 
                    label="NEW POST" 
                    bgColor={allowsCommunityPostCreation ? "bg-emerald-500" : "bg-gray-500"} 
                    hoverColor={allowsCommunityPostCreation ? "hover:bg-emerald-600" : "hover:bg-gray-600"}
                    onClick={() => {
                      if (!allowsCommunityPostCreation) return;
                      if (handleGuestAction('center post creation')) return;
                      setCreateCommunityPostModalOpen(true);
                    }}
                    disabled={!allowsCommunityPostCreation}
                  />
                  <NavItem 
                    icon={Crown} 
                    label="COMMUNITIES" 
                    bgColor="bg-purple-500" 
                    hoverColor="hover:bg-purple-600"
                    onClick={() => setCommunitiesModalOpen(true)}
                  />
                </div>
              </>
            ) : (
              /* Regular Page Navigation */
              <>
                {/* Create Button */}
                {/* <button 
                  onClick={() => {
                    if (handleGuestAction('content creation')) return;
                      if (isCommunityPage) {
                        setCreateCommunityPostModalOpen(true);
                      } else {
                        setCreateModalOpen(true);
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                </button> */}

                {/* Create Button */}
                <button 
                  onClick={() => {
                    if (handleGuestAction('content creation')) return;
                    if (isCommunityPage) {
                      // Only allow if community permits post creation
                      if (allowsCommunityPostCreation) {
                        setCreateCommunityPostModalOpen(true);
                      }
                    } else {
                      setCreateModalOpen(true);
                    }
                  }}
                  disabled={isCommunityPage && !allowsCommunityPostCreation}
                  className={`${
                    isCommunityPage && !allowsCommunityPostCreation
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-500/25'
                  } text-white p-3 rounded-full transition-all duration-200 shadow-lg flex items-center space-x-2`}
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Navigation Items */}
                <div className="flex items-center justify-between bg-slate-800/50 backdrop-blur-sm rounded-xl p-1.5 flex-shrink-0 min-w-80">
                  <NavItem 
                    icon={Users} 
                    label="FRIENDS" 
                    bgColor="bg-cyan-500" 
                    hoverColor="hover:bg-cyan-600"
                    onClick={() => {
                      if (handleGuestAction('friends and social features')) return;
                      handleFriendsClick();
                    }}
                  />
                  <NavItem 
                    icon={Flag} 
                    label="PAGES" 
                    bgColor="bg-orange-500" 
                    hoverColor="hover:bg-orange-600"
                    onClick={() => {
                      if (handleGuestAction('page creation and management')) return;
                      handlePagesClick();
                    }}
                  />
                  <NavItem 
                    icon={Layers} 
                    label="LAYERS" 
                    bgColor="bg-red-500" 
                    hoverColor="hover:bg-red-600"
                    onClick={() => setLayersModalOpen(true)}
                  />
                  <NavItem 
                    icon={Crown} 
                    label="COMMUNITIES" 
                    bgColor="bg-purple-500" 
                    hoverColor="hover:bg-purple-600"
                    onClick={() => setCommunitiesModalOpen(true)}
                  />
                </div>
              </>
            )}
          
            {/* Notification Bell
            <button className="relative p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </button> */}

            {/* <NotificationDropdown /> */}

            {/* User Profile */}
            <div className="relative flex items-center space-x-3 pl-3 border-l border-slate-700 user-dropdown">
              <span className="text-white font-medium text-sm min-w-0 truncate max-w-32">
                {capitalizeWords(currentIdentity?.name || 'Loading...')}
              </span>

              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-slate-800 rounded-full p-2 transition-colors duration-200"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >

            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {currentIdentity?.profile_pic_url && currentIdentity.profile_pic_url !== '/user-placeholder.png' ? (
                <img 
                  src={currentIdentity.profile_pic_url} 
                  alt={currentIdentity.name || 'User'} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.onerror = null; // prevent infinite loop
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.closest('div').innerHTML += `<span class="text-white text-sm font-semibold flex">${getInitials(currentIdentity?.name || "?")}</span>`;
                  }}
                />
              ) : (
                <span className="text-white text-sm font-semibold flex">
                  {currentIdentity?.name ? getInitials(currentIdentity.name) : "?"}
                </span>
              )}
            </div>

               <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* User Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]">
                  <div className="py-1">
                    {/* <button 
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (handleGuestAction('page creation')) return;
                        setCreatePageModalOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Page</span>
                    </button>
                    
                    <button 
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (handleGuestAction('account management')) return;
                        setAccountManagerModalOpen(true);
                      }}
                    >
                      <Users className="w-4 h-4" />
                      <span>Manage Accounts</span>
                    </button> */}
                    
                    {/* <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Profile Settings
                    </button> */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Mobile Right Side */}
        <div className="lg:hidden flex items-center space-x-1 min-w-0 flex-shrink-0">
          {/* Mobile Search Icon */}
          <button 
            onClick={() => setMobileSearchOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-200"
          >
            <Search className="w-4 h-4" />
          </button>

          { isCommunityPage ? (
            /* Mobile Community Navigation */
            <>

              <button 
                onClick={() => {
                  if (!allowsCommunityPostCreation) return;
                  if (handleGuestAction('center post creation')) return;
                  setCreateCommunityPostModalOpen(true);
                }}
                disabled={!allowsCommunityPostCreation}
                className={`${
                  allowsCommunityPostCreation 
                    ? "bg-emerald-500 hover:bg-emerald-600" 
                    : "bg-gray-500 cursor-not-allowed"
                } text-white p-1.5 rounded-md transition-all duration-200`}
              >
                <Plus className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setCommunitiesModalOpen(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white p-1.5 rounded-md transition-all duration-200"
              >
                <Crown className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Mobile Regular Navigation */
            <>
              {/* Mobile Create Button */}
              <button 
                onClick={() => {
                if (handleGuestAction('content creation')) return;
                  if (isCommunityPage) {
                    setCreateCommunityPostModalOpen(true);
                  } else {
                    setCreateModalOpen(true);
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-md transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Mobile Nav Buttons */}
              <button 
                onClick={() => {
                  if (handleGuestAction('friends and social features')) return;
                  handleFriendsClick();
                }}              
                className="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded-md transition-all duration-200"
              >
                <Users className="w-4 h-4" />
              </button>

              <button 
                onClick={() => {
                  if (handleGuestAction('page creation and management')) return;
                  handlePagesClick();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-md transition-all duration-200"
              >
                <Flag className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setLayersModalOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md transition-all duration-200"
              >
                <Layers className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setCommunitiesModalOpen(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white p-1.5 rounded-md transition-all duration-200"
              >
                <Crown className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Mobile Notification */}
          {/* <NotificationDropdown /> */}

          {/* Mobile User Profile */}
          <div className="relative flex items-center space-x-0.5 user-dropdown min-w-0 flex-shrink-0">
            <span className="text-white font-medium text-xs hidden xs:block sm:block truncate max-w-12">
              {capitalizeWords(currentIdentity?.name?.split(' ')[0] || 'User')}
            </span>
            <div 
              className="flex items-center space-x-1 cursor-pointer hover:bg-slate-800 rounded-full p-1 transition-colors duration-200"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                {currentIdentity?.profile_pic_url && currentIdentity.profile_pic_url !== '/user-placeholder.png' ? (
                  <img 
                    src={currentIdentity.profile_pic_url} 
                    alt={currentIdentity.name || 'User'} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span 
                  className="text-white text-xs font-semibold"
                  style={{ display: currentIdentity?.profile_pic_url && currentIdentity.profile_pic_url !== '/user-placeholder.png' ? 'none' : 'flex' }}
                >
                  {currentIdentity?.name ? getInitials(currentIdentity.name) : '?'}
                </span>
              </div>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>

            {/* Mobile User Dropdown */}
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]">
                <div className="py-1">
                  {/* <button 
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (handleGuestAction('page creation')) return;
                      setCreatePageModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Page</span>
                  </button>
                  
                  <button 
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (handleGuestAction('account management')) return;
                      setAccountManagerModalOpen(true);
                    }}
                  >
                    <Users className="w-4 h-4" />
                    <span>Manage Accounts</span>
                  </button>
                    */}
                    
                  {/* <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">
                    Profile Settings
                  </button> */}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </nav>

      {/* Mobile Floating Search */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9998] lg:hidden">
          <div className="bg-white m-4 mt-20 rounded-lg shadow-xl" ref={mobileSearchRef}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Search</h3>
                <button 
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search Mapogram..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              {/* Mobile Search Results */}
              {isSearching && (
                <div className="mt-4 p-4 text-center text-gray-500 text-sm">Searching...</div>
              )}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.itemType}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        result.itemType === 'page' 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-orange-500 to-amber-600'
                      }`}>
                        {result.profile_pic_url ? (
                          <img src={result.profile_pic_url} alt={result.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(result.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{result.name}</p>
                        <p className={`text-xs capitalize ${
                          result.itemType === 'page' ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {result.itemType === 'special-community' ? 'Community' : result.itemType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Center Post Modal*/}
      <CommunityPostSelector
        isOpen={createCommunityPostModalOpen}
        onClose={() => setCreateCommunityPostModalOpen(false)}
        onBack={() => setCreateCommunityPostModalOpen(false)}
      />

      {/* Modal */}
      <CreateOfficialUserModal
        isOpen={createOfficialsModalOpen}
        onClose={() => setCreateOfficialsModalOpen(false)}
      />

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={createCommunityModalOpen} 
        onClose={() => setCreateCommunityModalOpen(false)} 
        onSuccess={handleCommunityCreated} 
      />

      {/* Search COmmunity Modal */}
      <SearchAddCommunityButton
        isModalOpen={searchCommunityModalOpen} 
        setIsModalOpen={setSearchCommunityModalOpen}
      />

      {/* Create Modal */}
      {createModalOpen && (
        <CreateTypeSelectorModal
          setCreateModalOpen={setCreateModalOpen}
          loggedInUserId={loggedInUserId}
          currentIdentity={currentIdentity}
        />
      )}

      {/* Layers Modal */}
      <UserFollowedModal
        type="layers"
        isOpen={layersModalOpen}
        onClose={() => setLayersModalOpen(false)}
      />

      {/* Communities Modal */}
      <UserFollowedModal
        type="communities"
        isOpen={communitiesModalOpen}
        onClose={() => setCommunitiesModalOpen(false)}
      />

      {/* Create Page Modal */}
      <CreatePageModal
        isOpen={createPageModalOpen}
        onClose={() => setCreatePageModalOpen(false)}
        onPageCreated={handlePageCreated}
      />

      <AccountManagerModal 
        isOpen={accountManagerModalOpen}
        onClose={() => setAccountManagerModalOpen(false)}
        currentIdentity={currentIdentity}
        loggedInUserId={loggedInUserId}
        switchIdentity={switchIdentity}
      />

      {/* Guest Signup Modal */}
      <GuestSignupModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        feature={guestModalFeature}
      />

      {/* Follow Prompt Modal */}
      {showFollowPrompt && selectedCommunity && (
        <FollowPromptModal
          isOpen={showFollowPrompt}
          onClose={() => {
            setShowFollowPrompt(false);
            setSelectedCommunity(null);
          }}
          community={selectedCommunity}
          onFollow={handleFollowCommunity}
        />
      )}

      {/* Role Selection Modal */}
      {showRoleModal && selectedCommunity && (
        <RoleSelectionModal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedCommunity(null);
          }}
          community={selectedCommunity}
          onRoleSelect={handleRoleSelect}
          baseUrl={BASE_IMG_URL}// Add this if your RoleSelectionModal uses baseUrl
        />
      )}
    </>
  );
};

const NavItem = ({ icon: Icon, label, bgColor, hoverColor, onClick, disabled = false }) => {
  return (
    <button 
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex flex-col items-center px-4 py-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50'
      } rounded-lg transition-all duration-200 group relative flex-1`}
    >
      <div className={`w-9 h-9 ${bgColor} ${
        disabled ? '' : hoverColor
      } rounded-xl flex items-center justify-center mb-1.5 shadow-lg transition-all duration-200 ${
        disabled ? '' : 'group-hover:scale-105'
      }`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className={`${
        disabled ? 'text-slate-400' : 'text-slate-300 group-hover:text-white'
      } text-xs font-medium transition-colors duration-200 whitespace-nowrap w-20 text-center`}>
        {label}
      </span>
    </button>
  );
};



export default Navbar;