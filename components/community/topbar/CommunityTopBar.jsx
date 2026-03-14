'use client';

import { useState, useEffect } from 'react';
import { Users, Crown, Shield, AlertTriangle, Plus, FileText } from 'lucide-react';
import CommunityManagementDropdown from '../CommunityManagementDropdown';
import CommunityPostCreation from '../CommunityPostCreation';
import CreateCenterPostModal from '@/components/Navbar/CreateInfrastructurePostModal';

export default function CommunityTopBar() {
  const [communityData, setCommunityData] = useState(null);
  const [membersCount, setMembersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [communityId, setCommunityId] = useState(null);

  // Get community ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('communityId');
    setCommunityId(id);
  }, []);

  // Color theme for community - using amber/orange theme
  const themeConfig = {
    bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    text: 'text-white',
    avatar: 'bg-gradient-to-br from-orange-500 to-amber-600',
    badge: 'bg-amber-500 text-white',
    button: 'bg-white/20 hover:bg-white/30 backdrop-blur-sm',
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchMembersCount();
      fetchUserRoleAndPermissions();
    }
  }, [communityId]);

  const fetchCommunityData = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/check-post-creation`);
      if (response.ok) {
        const result = await response.json();
        setCommunityData(result.community);
        
        // Check if current user is the community owner
        const currentUserId = await getCurrentUserId();
        if (result.community.created_by === currentUserId) {
          setIsOwner(true);
        }
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembersCount = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/members/count`);
      if (response.ok) {
        const result = await response.json();
        setMembersCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching members count:', error);
    }
  };

  const fetchUserRoleAndPermissions = async () => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) return;

      // Fetch user role based on community type
      const response = await fetch(`/api/communities/${communityId}/user-permissions?userId=${currentUserId}`);
      if (response.ok) {
        const result = await response.json();
        setUserRole(result.role);
        setIsOwner(result.isOwner);
        setIsModerator(result.isModerator);
      }
    } catch (error) {
      console.error('Error fetching user role and permissions:', error);
    }
  };

  // Helper function to get current user ID
  const getCurrentUserId = async () => {
    // Implement based on your auth system
    // This could be from cookies, localStorage, or auth context
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        return user.id;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
    return null;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getRoleBadge = () => {
    if (isOwner) {
      return (
        <span className="flex items-center text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full ml-2">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </span>
      );
    }
    
    if (isModerator) {
      return (
        <span className="flex items-center text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-2">
          <Shield className="w-3 h-3 mr-1" />
          Moderator
        </span>
      );
    }
    
    if (userRole) {
      return (
        <span className="flex items-center text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">
          {userRole.role_name || userRole.name}
        </span>
      );
    }
    
    return null;
  };

  const handleBack = () => {
    setIsIssueModalOpen(false);
    setShowPostModal(false);
  };

  const isInfrastructureCommunity = communityData?.community_type_name === 'Infrastructure';

  if (isLoading) {
    return (
      <div className={`${themeConfig.bg} px-4 py-3`}>
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
      <div className={`${themeConfig.bg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          {/* Left Section - Community Info */}
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
                {communityData?.image_url ? (
                  <img 
                    src={
                      communityData.image_url?.startsWith('http')
                        ? communityData.image_url
                        : `${process.env.NEXT_PUBLIC_BASE_IMG_URL}/${communityData.image_url}`
                    }
                    alt={communityData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={`text-lg md:text-xl font-bold ${themeConfig.text}`}>
                    {getInitials(communityData?.name)}
                  </span>
                )}
              </div>
            </div>

            {/* Name and Info */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <h1 className={`text-lg md:text-xl font-bold ${themeConfig.text}`}>
                  {communityData?.name || 'Community'}
                </h1>
                {getRoleBadge()}
              </div>
              <span className={`${themeConfig.text} opacity-80 text-xs md:text-sm`}>
                {communityData?.community_type_name || 'Community'}
                {isOwner && ' • You'}
              </span>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Community Management Dropdown - Show for owners/moderators */}
            {/* {(isOwner || isModerator) && ( */}
              <CommunityManagementDropdown
                selectedCommunity={communityData}
                onCreateCommunity={() => {}} // You can keep this or remove if not needed
                className="text-white"
              />
            {/* )} */}

            {/* Create Post / Report Issue Button */}
            {isInfrastructureCommunity ? (
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 border border-red-600 hover:border-red-700 shadow-lg hover:shadow-xl"
              >
                <AlertTriangle className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm hidden sm:inline">
                  Report Issue
                </span>
                <Plus className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                onClick={() => setShowPostModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 border border-white/30 hover:border-white/40 backdrop-blur-sm"
              >
                <FileText className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm hidden sm:inline">
                  Create Post
                </span>
                <Plus className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Members Count */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Users className="w-4 h-4 text-white" />
              <span className={`font-bold text-sm md:text-base ${themeConfig.text}`}>
                {membersCount}
              </span>
              <span className={`${themeConfig.text} opacity-80 text-xs md:text-sm hidden md:inline`}>
                Members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isInfrastructureCommunity ? (
        <CreateCenterPostModal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          onBack={handleBack}
          communityId={communityId}
          preSelectedPostType="issue"
        />
      ) : (
        <CommunityPostCreation
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          communityId={communityId}
        />
      )}
    </>
  );
}