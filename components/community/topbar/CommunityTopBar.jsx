'use client';

import { useState, useEffect } from 'react';
import { Users, Crown, Shield, AlertTriangle, Plus, FileText, Award } from 'lucide-react';
import CommunityManagementDropdown from '../CommunityManagementDropdown';
import CommunityPostCreation from '../CommunityPostCreation';
import CreateCenterPostModal from '@/components/Navbar/CreateInfrastructurePostModal';

export default function CommunityTopBar({ selectedDistrict, tourismData }) {
  const { isStatic, stateName, totalPoints } = tourismData || {};
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
            {isStatic ? (
              <>
                {/* Tourism Logo */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-inner">
                    <img 
                      src="https://www.keralatourism.org/images/logo/logo.png" 
                      alt="Tourism Logo" 
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                </div>

                {/* State/District Info */}
                <div className="flex flex-col min-w-0">
                   <span className="text-[10px] md:text-xs font-black text-white/90 uppercase tracking-[0.2em] leading-tight">
                     {stateName} Tourism
                   </span>
                   <h1 className="text-lg md:text-2xl font-black text-white truncate leading-tight mt-0.5">
                     {selectedDistrict || stateName}
                   </h1>
                </div>
              </>
            ) : (
              <>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
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
                      <span className={`text-base md:text-xl font-bold ${themeConfig.text}`}>
                        {getInitials(communityData?.name)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name and Info */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center">
                    <h1 className={`text-base md:text-xl font-bold ${themeConfig.text} truncate`}>
                      {communityData?.name || 'Community'}
                    </h1>
                    <div className="hidden sm:flex">{getRoleBadge()}</div>
                  </div>
                  <span className={`${themeConfig.text} opacity-80 text-[10px] md:text-sm hidden sm:inline`}>
                    {communityData?.community_type_name || 'Community'}
                    {isOwner && ' • You'}
                  </span>
                  {/* Show role badge on mobile instead of full info */}
                  <div className="sm:hidden -mt-0.5">{getRoleBadge()}</div>
                </div>
              </>
            )}
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-1.5 md:gap-3">
            {!isStatic && (
              <>
                {/* Community Management Dropdown - Show for owners/moderators */}
                <CommunityManagementDropdown
                  selectedCommunity={communityData}
                  onCreateCommunity={() => {}}
                  className="text-white"
                />

                {/* Create Post / Report Issue Button */}
                {isInfrastructureCommunity ? (
                  <button
                    onClick={() => setIsIssueModalOpen(true)}
                    className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 border border-red-600 hover:border-red-700 shadow-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <span className="text-white font-medium text-sm hidden sm:inline ml-2">
                      Report Issue
                    </span>
                    <Plus className="w-3.5 h-3.5 text-white sm:ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 border border-white/30 backdrop-blur-sm"
                  >
                    <FileText className="w-4 h-4 text-white" />
                    <span className="text-white font-medium text-sm hidden sm:inline ml-2">
                      Create Post
                    </span>
                    <Plus className="w-3.5 h-3.5 text-white sm:ml-1" />
                  </button>
                )}
              </>
            )}

            {/* Members Count / Tourism Points */}
            {isStatic ? (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl border border-white/30 shadow-lg animate-in zoom-in-95 duration-300">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] text-white/80 font-black uppercase tracking-widest leading-none">Your Points</span>
                  <span className="font-black text-white text-sm sm:text-xl leading-none mt-1">{totalPoints}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Users className="w-3.5 h-3.5 text-white" />
                <span className={`font-bold text-xs sm:text-base ${themeConfig.text}`}>
                  {membersCount}
                </span>
                <span className={`${themeConfig.text} opacity-80 text-xs hidden md:inline`}>
                  Members
                </span>
              </div>
            )}
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