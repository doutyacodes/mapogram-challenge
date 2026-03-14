'use client';

import { useEffect, useState } from 'react';
import { Users, Crown, Shield, Layers, AlertTriangle, Plus } from 'lucide-react';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import CreateCenterPostModal from '../Navbar/CreateInfrastructurePostModal';

export default function CentersTopBar({ type, id, currentUserId }) {
  const [data, setData] = useState(null);
  const [membersCount, setMembersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false); // Add this state

  // Determine entity type checks
  const isPage = type === 'page';
  const isProfile = type === 'profile';
  const isLayer = type === 'layer';
  const isCurrentUserOwner = (isProfile && currentUserId == id);

  // Get current user identity
  const currentIdentity = useIdentityStore(state => state.currentIdentity);

  // Color themes for different entity types
  const themes = {
    page: {
      bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
      text: 'text-white',
    },
    profile: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      text: 'text-white',
    },
    layer: {
      bg: 'bg-gradient-to-r from-red-500 to-pink-600',
      text: 'text-white',
    }
  };

  const currentTheme = themes[type];

  useEffect(() => {
    fetchData();
    if (isPage) {
      fetchMembersCount();
      if (currentUserId) {
        fetchUserRole();
      }
    }
  }, [id, type, currentUserId]);

  const fetchData = async () => {
    try {
      let endpoint;
      if (isProfile) {
        endpoint = `/api/profile/${id}`;
      } else if (isPage) {
        endpoint = `/api/page/${id}`;
      } else if (isLayer) {
        endpoint = `/api/layer/${id}`;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        
        // Check if current user is the page owner
        if (isPage && result.user_id === currentUserId) {
          setIsOwner(true);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembersCount = async () => {
    try {
      const response = await fetch(`/api/centers/${id}/members/count`);
      if (response.ok) {
        const result = await response.json();
        setMembersCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching members count:', error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const response = await fetch(`/api/centers/${id}/user-role?userId=${currentUserId}`);
      if (response.ok) {
        const result = await response.json();
        setUserRole(result.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getRoleDisplayText = () => {
    if (isProfile) return 'User';
    if (isLayer) return 'Layer';
    if (isPage) {
      if (isOwner) return 'Owner';
      if (userRole) return userRole.name;
      return 'Page';
    }
    return 'Page';
  };

  const getRoleBadge = () => {
    if (!isPage) return null;
    
    if (isOwner) {
      return (
        <span className="flex items-center text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full ml-2">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </span>
      );
    }
    
    if (userRole?.can_manage_roles || userRole?.can_manage_posts) {
      return (
        <span className="flex items-center text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-2">
          <Shield className="w-3 h-3 mr-1" />
          {userRole.name}
        </span>
      );
    }
    
    return null;
  };

  // Handle back button for modal
  const handleBack = () => {
    setIsIssueModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`${currentTheme.bg} px-4 py-3`}>
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/20 rounded w-24"></div>
            <div className="h-3 bg-white/20 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${currentTheme.bg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          {/* Left Section - Profile Info */}
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
                {isLayer ? (
                  <Layers className="w-6 h-6 md:w-7 md:h-7 text-white" />
                ) : data?.profilePic ? (
                  <img 
                    src={data.profilePic} 
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={`text-lg md:text-xl font-bold ${currentTheme.text}`}>
                    {getInitials(data?.name)}
                  </span>
                )}
              </div>
            </div>

            {/* Name and Info */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <h1 className={`text-lg md:text-xl font-bold ${currentTheme.text}`}>
                  {data?.name || 'Loading...'}
                </h1>
                {getRoleBadge()}
              </div>
              <span className={`${currentTheme.text} opacity-80 text-xs md:text-sm`}>
                {getRoleDisplayText()}
                {isCurrentUserOwner && ' • You'}
              </span>
            </div>
          </div>

          {/* Right Section - Members Count and Report Issue Button */}
          <div className="flex items-center gap-3">
            {/* Report Issue Button - Show for pages only */}
            {isPage && (
              <button
                onClick={() => setIsIssueModalOpen(true)}
className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 border border-red-600 hover:border-red-700 shadow-lg hover:shadow-xl"              >
                <AlertTriangle className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm hidden sm:inline">
                  Report Issue
                </span>
                <Plus className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Members Count (for pages) */}
            {isPage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Users className="w-4 h-4 text-white" />
                <span className={`font-bold text-sm md:text-base ${currentTheme.text}`}>
                  {membersCount}
                </span>
                <span className={`${currentTheme.text} opacity-80 text-xs md:text-sm hidden md:inline`}>
                  Members
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Issue Report Modal */}
      <CreateCenterPostModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onBack={handleBack}
        pageId={id}
        preSelectedPostType="issue"
      />
    </>
  );
}