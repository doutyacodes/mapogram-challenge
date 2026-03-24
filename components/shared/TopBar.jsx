'use client';

import { useEffect, useState } from 'react';
import { Heart, HeartOff, UserPlus, Users, Check, Clock, Layers, UserX, Award } from 'lucide-react';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import GuestSignupModal from './GuestSignupModal';

export default function ModernTopBar({ type, id, currentUserId, selectedDistrict, tourismData }) {
  const { isStatic, stateName, totalPoints } = tourismData || {};
  const [data, setData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // none, pending, friends, sent
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalFeature, setGuestModalFeature] = useState('');

  // Determine entity type checks
  const isPage = type === 'page';
  const isProfile = type === 'profile';
  const isLayer = type === 'layer';
  const isCurrentUserOwner = (isProfile && currentUserId == id);

  // Get current user identity to check if guest
  const currentIdentity = useIdentityStore(state => state.currentIdentity);
  const isGuest = currentIdentity?.type === 'guest';

  // Color themes for different entity types
  const themes = {
    page: {
      bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
      text: 'text-white',
      followBtn: 'bg-white text-amber-600 hover:bg-amber-50',
    },
    profile: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      text: 'text-white',
      followBtn: 'bg-white text-blue-600 hover:bg-blue-50',
    },
    layer: {
      bg: 'bg-gradient-to-r from-red-500 to-pink-600',
      text: 'text-white',
      followBtn: 'bg-white text-red-600 hover:bg-red-50',
    }
  };

  const currentTheme = themes[type];

  useEffect(() => {
    fetchData();
    if (!isCurrentUserOwner) {
      if (isProfile) {
        checkFriendStatus();
      } else if (isPage || isLayer) {
        checkFollowStatus();
      }
    }
    fetchFollowersCount();
    if (isPage) {
      checkAdminStatus();
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
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/follow/${type}/${id}/status`);
      if (response.ok) {
        const result = await response.json();
        setIsFollowing(result.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const checkFriendStatus = async () => {
    try {
      const response = await fetch(`/api/friends/${id}/status`);
      if (response.ok) {
        const result = await response.json();
        setFriendStatus(result.status);
      }
    } catch (error) {
      console.error('Error checking friend status:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`/api/page/${id}/admin-status`);
      if (response.ok) {
        const result = await response.json();
        setIsAdmin(result.isAdmin);
        setIsOwner(result.isOwner);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      let endpoint;
      if (isProfile) {
        endpoint = `/api/friends/${id}/count`;
      } else {
        endpoint = `/api/follow/${type}/${id}/count`;
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        setFollowersCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching followers count:', error);
    }
  };

  const handleFollow = async () => {
    // Check if guest user
    if (handleGuestAction('following')) return;
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/follow/${type}/${id}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleFriendAction = async () => {
    // Check if guest user
    if (handleGuestAction('friend management')) return;
    
    try {
      let response;
      
      if (friendStatus === 'friends') {
        // Unfriend
        response = await fetch(`/api/friends/${id}/unfriend`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          setFriendStatus('none');
          setFollowersCount(prev => prev - 1);
        }
      } else if (friendStatus === 'pending') {
        // Accept friend request
        response = await fetch(`/api/friends/request/${id}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          setFriendStatus('friends');
          setFollowersCount(prev => prev + 1);
        }
      } else if (friendStatus === 'none') {
        // Send friend request
        response = await fetch(`/api/friends/request/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          setFriendStatus('sent');
        }
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
    }
  };

  const handleGuestAction = (featureName) => {
    if (isGuest) {
      setGuestModalFeature(featureName);
      setGuestModalOpen(true);
      return true;
    }
    return false;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getFriendButtonText = () => {
    switch (friendStatus) {
      case 'friends': return 'Friends';
      case 'sent': return 'Request Sent';
      case 'pending': return 'Accept Request';
      default: return 'Add Friend';
    }
  };

  const getFriendButtonIcon = () => {
    switch (friendStatus) {
      case 'friends': return <UserX className="w-3 h-3" />;
      case 'sent': return <Clock className="w-3 h-3" />;
      case 'pending': return <Check className="w-3 h-3" />;
      default: return <UserPlus className="w-3 h-3" />;
    }
  };

  const getEntityTypeText = () => {
    if (isProfile) return 'User';
    if (isLayer) return 'Layer';
    if (isPage && data?.pageType) return `${data.pageType} • Page`;
    return 'Page';
  };

  const getAdminBadge = () => {
    if (!isPage || (!isAdmin && !isOwner)) return null;
    return (
      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full ml-2">
        {isOwner ? 'Owner' : 'Admin'}
      </span>
    );
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
    <div className={`${currentTheme.bg} px-4 py-3`}>
      <div className="flex items-center justify-between">
        {/* Left Section - Profile Info */}
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
                   {stateName || 'State'} Tourism
                 </span>
                 <h1 className="text-lg md:text-2xl font-black text-white truncate leading-tight mt-0.5">
                   {selectedDistrict || stateName || 'Explore'}
                 </h1>
              </div>
            </>
          ) : (
            <>
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
                  {getAdminBadge()}
                </div>
                <span className={`${currentTheme.text} opacity-80 text-xs md:text-sm`}>
                  {getEntityTypeText()}
                  {isCurrentUserOwner && ' • You'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Section - Stats and Actions */}
        {isStatic ? (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl border border-white/30 shadow-lg animate-in zoom-in-95 duration-300">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[10px] text-white/80 font-black uppercase tracking-widest leading-none">Your Points</span>
              <span className="font-black text-white text-sm sm:text-xl leading-none mt-1">{totalPoints}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
            {/* Action Buttons */}
            {!isCurrentUserOwner && (
            <>
              <div className="flex items-center gap-1 text-sm md:text-base font-medium">
              {/* Followers/Friends Count */}
                <span className={`font-bold text-lg md:text-xl ${currentTheme.text}`}>
                  {followersCount}
                </span>
                <span className={`${currentTheme.text} opacity-80 text-xs md:text-sm`}>
                  {isProfile ? 'Friends' : 'Followers'}
                </span>
              </div>

              <div>
                {isProfile ? (
                  <button
                    onClick={handleFriendAction}
                    disabled={friendStatus === 'sent'}
                    className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                      friendStatus === 'sent'
                        ? 'bg-white/20 text-white/70 cursor-not-allowed'
                        : friendStatus === 'pending'  
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : friendStatus === 'friends'
                        ? 'bg-white/20 text-white border border-white/30 hover:bg-red-500 hover:border-red-500'
                        : currentTheme.followBtn
                    }`}
                  >
                    {getFriendButtonIcon()}
                    <span className="hidden md:inline">{getFriendButtonText()}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                      isFollowing 
                        ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                        : currentTheme.followBtn
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Owner viewing own page - could show edit or manage options */}
          {/* {(isPage && (isAdmin || isOwner)) && (
            <button className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${currentTheme.followBtn}`}>
              Manage
            </button>
          )} */}
        </div>
      )}
    </div>

      {/* Guest Signup Modal */}
      <GuestSignupModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        feature={guestModalFeature}
      />

    </div>
  );
}