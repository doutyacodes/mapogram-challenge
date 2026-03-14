// components/MapCard.js
import { getIconComponent } from '@/app/api/utils/iconMapping';
import { useUserRole } from '@/app/hooks/useUserRole';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BASE_IMG_URL } from '@/lib/map/constants';
import ClassifiedDetailsModal from './ClassifiedDetailsModal';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import GuestSignupModal from '../shared/GuestSignupModal';


const parseDescriptionWithTags = (description, tags, onTagClick) => {
  if (!tags || tags.length === 0) return <>{description}</>;

  // Create a more comprehensive regex to match @mentions
  const tagNames = tags.map(tag => tag.tagged_user_name);
  
  // Create regex pattern that matches any of the tagged usernames
  const tagPattern = tagNames.map(name => 
    `@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
  ).join('|');
  
  if (!tagPattern) return <>{description}</>;
  
  const regex = new RegExp(`(${tagPattern})`, 'gi');
  const parts = description.split(regex);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part matches any of our tags
        const matchedTag = tags.find(tag => 
          part.toLowerCase() === `@${tag.tagged_user_name.toLowerCase()}`
        );
        
        if (matchedTag) {
          return (
            <span 
              key={index}
              className="text-blue-600 font-medium cursor-pointer hover:underline hover:text-blue-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTagClick(matchedTag);
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

// Fixed tag click handler with proper navigation
const handleTagClick = (tag) => {
  const path = tag.tagged_type === 'user' 
    ? `/profile/${tag.tagged_id}` 
    : `/page/${tag.tagged_id}`;
  
  // Force navigation using window.location
  window.location.href = path;
};

// Redesigned compact tags dropdown
const TagsDropdown = ({ post }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!post.tags || post.tags.length === 0) return null;

  const handleUserClick = (tag, e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    handleTagClick(tag);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Small user icon button */}
      <button 
        className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors ml-1"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-label="View tagged users"
        title={`${post.tags.length} tagged user${post.tags.length > 1 ? 's' : ''}`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Absolute positioned dropdown */}
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
            {/* Dropdown content (drop-up now) */}
            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 max-w-64">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  Tagged ({post.tags.length})
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {post.tags.map((tag, index) => (
                    <button
                      key={index}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center space-x-2"
                      onClick={(e) => handleUserClick(tag, e)}
                    >
                    <div className="flex-shrink-0">
                      {tag.tagged_user_profile ? (
                        <img
                          src={tag.tagged_user_profile}
                          alt={tag.tagged_user_name}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                            e.target.style.objectFit = "cover"; 
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium"
                        style={{ display: tag.tagged_user_profile ? 'none' : 'flex' }}
                      >
                        {tag.tagged_user_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {tag.tagged_user_name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {tag.tagged_type}
                        {!tag.is_accepted && (
                          <span className="ml-1 text-yellow-600">• Pending</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Image Modal with navigation
const ImageModal = ({ isImageModalOpen, closeImageModal, images, currentImageIndex, setCurrentImageIndex, post, onLike, isLiked, likeCount, handleLike }) => {
  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isImageModalOpen) {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeImageModal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImageModalOpen]);

  if (!images.length) return null;

  return (
    <Transition appear show={isImageModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeImageModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Close button */}
                <button
                  onClick={closeImageModal}
                  className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image container */}
                <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] max-h-[600px]">
                  <Image
                    src={`${BASE_IMG_URL}${images[currentImageIndex]?.image_url || images[currentImageIndex]}`}
                    alt={`${post.title} - Image ${currentImageIndex + 1} of ${images.length}`}
                    layout="fill"
                    objectFit="contain"
                    className="rounded-t-2xl"
                    priority
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/user-placeoholder.png";
                      e.target.style.objectFit = "cover"; 
                    }}
                  />
                  
                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                
                {/* Bottom section */}
                <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {post.title && (
                        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                          {post.title}
                        </h3>
                      )}
                      
                      {/* Description - full version without truncation */}
                      {post.description && (
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {post.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{post.user_name || 'Anonymous'}</span>
                        {images.length > 1 && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {currentImageIndex + 1} / {images.length}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Like button remains the same */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 ${
                        isLiked 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 transition-transform duration-200 ${isLiked ? 'scale-110' : ''}`} 
                        fill={isLiked ? 'currentColor' : 'none'} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {likeCount || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const MapCard = ({
  post,
  user,
  onClose,
  onPrev,
  onNext,
  readPostIds = [],
  currentIndex,
  totalItems,
  onShare,
  onLike,
  isLiked,
  likeCount,
  onProfileClick,
  onApplyClick,
  showRegistrationDetails,
  onBackFromRegistration,
  getCurrentRegistrationItem,
  currentRegistrationIndex,
  onPrevRegistration,
  onNextRegistration,
  showUserProfile,
  onBackFromProfile,
  isFromCommunity = false,
  communityRole = null,
  onRefresh,
}) => {


  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isClassifiedDetailsOpen, setIsClassifiedDetailsOpen] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const loggedInUserId = useIdentityStore(state => state.loggedInUserId);
  
  // Logic to determine if current user is the post owner
  const isOwnPost = Number(loggedInUserId) === Number(post.creator_id);
   // Guest modal state
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalFeature, setGuestModalFeature] = useState('');

  // Chat-related state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const chatContainerRef = useRef(null);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Get current user identity to check if guest
  const currentIdentity = useIdentityStore(state => state.currentIdentity);
  console.log("currentIdentity", currentIdentity)
  const isGuest = currentIdentity?.type === 'guest';

  // Guest handler function
  const handleGuestAction = (featureName) => {
    if (isGuest) {
      setGuestModalFeature(featureName);
      setGuestModalOpen(true);
      return true;
    }
    return false;
  };

  // Wrapped functions that check for guest status
  const handleLike = (...args) => {
    if (handleGuestAction('liking posts')) return;
    onLike?.(...args);
  };

  const handleApply = (...args) => {
    if (handleGuestAction('applying to events')) return;
    onApplyClick?.(...args);
  };
  
 // FIX 1: Memoize image modal functions to prevent flickering
  const openImageModal = useCallback((imageIndex = 0) => {
    setCurrentImageIndex(imageIndex);
    setIsImageModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  // Move the timer state and logic to the top level - BEFORE any early returns
  const getTimeRemaining = useCallback((eventDate) => {
    if (!eventDate) return { expired: true };
    
    const now = new Date().getTime();
    const eventTime = new Date(eventDate).getTime();
    const difference = eventTime - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, expired: false };
    } else {
      return { expired: true };
    }
  }, []);

    // Function to get navigation button text based on post type
  const getNavigationText = (postType) => {
    switch (postType) {
      case 'job':
        return { prev: '← Prev Job', next: 'Next Job →' };
      case 'news':
        return { prev: '← Prev Article', next: 'Next Article →' };
      case 'event':
        return { prev: '← Prev Event', next: 'Next Event →' };
      case 'announcement':
        return { prev: '← Prev Announcement', next: 'Next Announcement →' };
      case 'collaboration':
        return { prev: '← Prev Collaboration', next: 'Next Collaboration →' };
      case 'classifieds':
        return { prev: '← Prev Listing', next: 'Next Listing →' };
      case 'offers':
        return { prev: '← Prev Offer', next: 'Next Offer →' };
      case 'complaints': // Add this case
        return { prev: '← Prev Complaint', next: 'Next Complaint →' };
      default:
        return { prev: '← Prev Post', next: 'Next Post →' };
    }
  };

  // State for countdown timer - MUST be before any early returns
  const [timeRemaining, setTimeRemaining] = useState(() => 
    post?.event_details?.event_date ? getTimeRemaining(post.event_details.event_date) : { expired: true }
  );

  const fetchChatMessages = useCallback(async () => {
    if (!post?.id) return;
        
    try {
      // Only show loading on initial fetch
      if (chatMessages.length === 0) {
        setIsLoadingMessages(true);
      }
      
      const response = await fetch(
        `/api/complaints/${post.id}/messages?userType=${currentIdentity?.type}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
        
        if (data.messages?.length > 0) {
          await fetch(
            `/api/complaints/${post.id}/messages/mark-read?userType=${currentIdentity?.type}`,
            {
              method: 'PATCH',
            }
          );
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [post?.id, chatMessages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage) return;
    if (handleGuestAction('sending messages')) return;
    
    try {
      setIsSendingMessage(true);
      const response = await fetch(`/api/complaints/${post.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: newMessage.trim(),
          post_type: 'complaints',
          userType: currentIdentity?.type
        }),
      });
      
      if (response.ok) {
        setNewMessage('');
        await fetchChatMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

 // Effect for countdown timer - MUST be before any early returns
  useEffect(() => {
    if (post?.post_type === 'event' && post?.status && post?.event_details?.event_date) {
      const timer = setInterval(() => {
        setTimeRemaining(getTimeRemaining(post.event_details.event_date));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [post?.event_details?.event_date, post?.post_type, post?.status, getTimeRemaining]);

  // Auto-fetch messages when chat is open
  useEffect(() => {
    if (isChatOpen) {
      fetchChatMessages();
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, fetchChatMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      // Smooth scroll to bottom
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: chatMessages.length === 1 ? 'auto' : 'smooth'
      });
    }
  }, [chatMessages]);

  // FIX 3: Memoize ImageWithModal to prevent flickering
  const ImageWithModal = useCallback(({ src, alt, className, width, height, images, imageIndex = 0 }) => (
    <div 
      className={`relative cursor-pointer group ${className}`}
      onClick={() => openImageModal(imageIndex)}
    >
      <Image
        src={src}
        alt={alt || "Post content image"}
        width={width}
        height={height}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/user-placeoholder.png";
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="bg-white bg-opacity-90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      {/* Image count indicator */}
      {images && images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
          1/{images.length}
        </div>
      )}
    </div>
  ), [openImageModal]);  // Add dependencies

    // Common header component function
  const renderCardHeader = useCallback(() => {
    const hideCenterSection =
      (post.post_type === 'event' && post.status) ||
      post.status === 'story' ||
      post.category_name === 'Posts';


    const handleProfileClick = () => {
      if (!isFromCommunity) {
        const path =
          post.creator_type === "user"
            ? `/profile/${post.created_by}`
            : `/page/${post.created_by}`;
        window.location.href = path;
      }
    };

    const truncateText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    };

    return (
      <div className="relative w-full mb-2 flex-shrink-0 flex items-center">
        {post.post_type === 'news' ? (
          // News layout - Only center and right sections
          <>
            {/* Center section - Category for news - Absolutely centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex justify-center items-center">
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] sm:text-xs font-medium rounded-full inline-flex items-center justify-center gap-0.5 shadow-sm">
                <span className="flex items-center justify-center">
                  {(() => {
                    const IconComponent = getIconComponent(post.category_icon);
                    return <IconComponent size={14} strokeWidth={2.5} color={post.category_color} />;
                  })()}
                </span>
                <span className="text-[10px] sm:text-xs">{post.category_name || "News"}</span>
              </span>
            </div>

            {/* Right section - Share and Close buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              {/* Share button */}
              <button
                onClick={() => onShare(post)}
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
                aria-label="Share"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              
              {/* Close button */}
              <button 
                onClick={onClose}
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          // Non-news layout - All three sections
          <>
            {/* Left section - Profile with clickable area */}
            {isFromCommunity ? (
              // Non-clickable version for community context
              <div className="flex items-center gap-1.5 rounded-lg p-1 min-w-0">
                {/* Profile image without hover effects */}
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-gray-200">
                  {/* Profile Image with blue indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors">
                      <Image
                        src={post.user_profile_image || "/user-placeholder.png"}
                        alt="Profile"
                        width={32}  // Set appropriate width
                        height={32} // Set appropriate height
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/user-placeoholder.png";
                          e.target.style.objectFit = "cover"; 
                        }}
                        
                      />
                    </div>
                    {/* Blue indicator circle */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                  {/* User Info - Aligned to left */}
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span 
                      className="text-[10px] sm:text-[11px] font-medium text-gray-800 truncate w-full leading-tight text-left"
                      title={post.user_name}
                    >
                      {truncateText(post.user_name, 12)}
                    </span>
                    {/* Page type - only show if not general post or status post */}
                    {post.page_type_name && !(post.post_type === 'general' || post.status) && (
                      <span className="text-[8px] sm:text-[9px] text-gray-500 leading-[1.1] truncate w-full">
                        {post.page_type_name}
                      </span>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            ) : (
              // Clickable version for non-community context (existing code)
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg p-1 transition-colors group min-w-0"
              >
              {/* Profile Image with blue indicator */}
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors">
                    <Image
                      src={post.user_profile_image || "/user-placeholder.png"}
                      alt="Profile"
                      width={32}  // Set appropriate width
                      height={32} // Set appropriate height
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/user-placeoholder.png";
                        e.target.style.objectFit = "cover"; 
                      }}
                    />
                  </div>
                  {/* Blue indicator circle */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                
                  {/* User Info - Aligned to left */}
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span 
                      className="text-[10px] sm:text-[11px] font-medium text-gray-800 truncate w-full leading-tight text-left"
                      title={post.user_name}
                    >
                      {truncateText(post.user_name, 12)}
                    </span>
                    {/* Page type - only show if not general post or status post */}
                    {post.page_type_name && !(post.post_type === 'general' || post.status) && (
                      <span className="text-[8px] sm:text-[9px] text-gray-500 leading-[1.1] truncate w-full">
                        {post.page_type_name}
                      </span>
                    )}
                  </div>
              </button>
            )}

            {/* Center section - Category for non-news post types */}
            {!hideCenterSection && (
              <div className="flex justify-center items-center px-2">
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] sm:text-xs font-medium rounded-full inline-flex items-center justify-center gap-0.5 shadow-sm">
                  <span className="flex items-center justify-center">
                    {(() => {
                      const IconComponent = getIconComponent(post.category_icon);
                      return <IconComponent size={14} strokeWidth={2.5} color={post.category_color} />;
                    })()}
                  </span>
                  <span className="text-[10px] sm:text-xs">{post.category_name || post.post_type}</span>
                </span>
              </div>
            )}

            {/* Right section - Share and Close buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              {/* Share button */}
              <button
                onClick={() => onShare(post)}
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
                aria-label="Share"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              
              {/* Close button */}
              <button 
                onClick={onClose}
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }, [
    post,
    isFromCommunity,
    onShare,
    onClose
  ]);

  // Navigation component
  const renderNavigation = useCallback(() => {
    if (totalItems <= 1) return null;
    
    const navText = getNavigationText(post.post_type);
    
    return (
      <div className="flex items-center justify-between mt-3 mb-1 flex-shrink-0">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium ${
            currentIndex === 0
              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
              : "text-blue-600 bg-blue-50 hover:bg-blue-100"
          }`}
        >
          {navText.prev}
        </button>
        <span className="text-xs text-gray-500 mx-2">
          {currentIndex + 1} of {totalItems}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === totalItems - 1}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium ${
            currentIndex === totalItems - 1
              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
              : "text-blue-600 bg-blue-50 hover:bg-blue-100"
          }`}
        >
          {navText.next}
        </button>
      </div>
    );
  }, [totalItems, currentIndex, post.post_type, onPrev, onNext]);

  const renderLikeSection = useCallback(() => {
    // Get unread message count
    const unreadCount = post?.unread_messages_count || 0;
    
    // Only show chat for complaint posts and if user is owner or service center
    const showChat = post?.post_type === 'complaints' && 
                    (isOwnPost || currentIdentity?.type === 'page');

    return (
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
              isLiked 
                ? 'bg-red-50 text-red-600' 
                : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} 
              fill={isLiked ? 'currentColor' : 'none'} 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs font-medium">
              {likeCount || 0}
            </span>
          </button>
          
          {showChat && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`relative flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                isChatOpen 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">Chat</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
          
        <p className="text-xs text-gray-600 flex-shrink-0">
          {new Date(post.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    );
  }, [post.id, isLiked, likeCount, handleLike, post.created_at, post?.post_type, post?.unread_messages_count, isOwnPost, currentIdentity, isChatOpen]);

   // Memoize renderSpecialEventCard to prevent unnecessary re-renders
  const renderSpecialEventCard = useCallback(() => {
    return (
      <div className={`w-full max-w-[320px] sm:max-w-[380px] relative select-none flex flex-col ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {renderCardHeader()}

        {/* Countdown Timer */}
        <div className="mb-3 flex-shrink-0">
          {timeRemaining.expired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <span className="text-red-600 font-semibold text-sm">🎉 Event Started!</span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
              <div className="text-center mb-2">
                <span className="text-blue-700 font-semibold text-xs">Event Starting In:</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-sm font-bold text-blue-600">{timeRemaining.days}</div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-sm font-bold text-blue-600">{timeRemaining.hours}</div>
                  <div className="text-xs text-gray-500">Hours</div>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-sm font-bold text-blue-600">{timeRemaining.minutes}</div>
                  <div className="text-xs text-gray-500">Min</div>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-sm font-bold text-blue-600">{timeRemaining.seconds}</div>
                  <div className="text-xs text-gray-500">Sec</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image section */}
        {post.image_url && (
          <ImageWithModal 
            src={`${BASE_IMG_URL}${post.image_url}`}
            alt={post.title}
            className="h-36 sm:h-44 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={380}
            height={200}
          />
        )}

        {/* Title section */}
        {post.title && (
          <h3 className="font-semibold text-sm sm:text-base mb-3 leading-tight flex-shrink-0">
            {post.title}
          </h3>
        )}

        {/* Event Details */}
        {post.event_details?.contact_info && (
          <div className="mb-3 flex-shrink-0">
            <div className="bg-green-50 px-3 py-2 rounded-lg">
              <span className="font-medium text-green-700 text-xs block mb-1">📞 Contact:</span>
              <span className="text-green-600 text-xs">{post.event_details.contact_info}</span>
            </div>
          </div>
        )}

        {/* Description Section */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="max-h-20 overflow-y-auto summary-scroll pr-1">
              {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
            {/* Tags button positioned absolutely in top-right */}
            <div className="absolute top-0 right-0">
              <TagsDropdown post={post} />
            </div>
          </div>
        )}

        {/* Bottom section */}
        <div className="mt-auto pt-3">
          {renderLikeSection()}
        </div>

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  }, [post, timeRemaining, readPostIds, user]);

  // Add new function to render classified card
  const renderClassifiedCard = useMemo(() => {
      const { classified_details } = post;
      const images = classified_details?.images || [];
      const primaryImage = images.find(img => img.is_primary) || images[0] || { image_url: post.image_url };

      // Get key details based on sub-category
      const getKeyDetails = () => {
        const subCategory = classified_details?.sub_category_name?.toLowerCase() || '';
        
        if (classified_details?.vehicle_details) {
          const vd = classified_details.vehicle_details;
          return [
            vd.brand_name && `${vd.brand_name} ${vd.model_name || ''}`.trim(),
            vd.year && `${vd.year}`,
            vd.fuel_type && `${vd.fuel_type}`,
            vd.mileage_km && `${vd.mileage_km.toLocaleString()} km`,
          ].filter(Boolean).slice(0, 3);
        }
        
        if (classified_details?.electronics_details) {
          const ed = classified_details.electronics_details;
          return [
            ed.brand_name && `${ed.brand_name}`,
            ed.storage_capacity && `${ed.storage_capacity}`,
            ed.ram && `${ed.ram} RAM`,
            ed.warranty_months_left > 0 && `${ed.warranty_months_left}m warranty`,
          ].filter(Boolean).slice(0, 3);
        }
        
        if (classified_details?.real_estate_details) {
          const rd = classified_details.real_estate_details;
          return [
            rd.property_type && `${rd.property_type}`,
            rd.bedrooms && `${rd.bedrooms} BHK`,
            rd.area_sqft && `${rd.area_sqft} sqft`,
            rd.furnished && `${rd.furnished}`,
          ].filter(Boolean).slice(0, 3);
        }
        
        if (classified_details?.furniture_details) {
          const fd = classified_details.furniture_details;
          return [
            fd.material && `${fd.material}`,
            fd.color && `${fd.color}`,
            fd.seating_capacity && `${fd.seating_capacity} seater`,
          ].filter(Boolean).slice(0, 3);
        }
        
        return [];
      };

      const keyDetails = getKeyDetails();

      return (
        <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[300px] sm:min-h-96 flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
          {/* Use the common header component */}
          {renderCardHeader()}

          {/* Image section with gallery support */}
          <ImageWithModal 
            src={`${BASE_IMG_URL}${primaryImage.image_url}`}
            alt={post.title}
            className="relative h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={320}
            height={160}
            images={images}
            imageIndex={0}
          />

          {/* Price and condition */}
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            {classified_details?.price && (
              <div className="text-lg sm:text-xl font-bold text-green-600">
                ₹{classified_details.price.toLocaleString()}
                {classified_details.price_type === 'negotiable' && (
                  <span className="text-xs text-gray-500 ml-1">(Negotiable)</span>
                )}
              </div>
            )}
            {classified_details?.condition && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {classified_details.condition}
              </span>
            )}
          </div>
          
          {/* Title section */}
          <h3 className="font-semibold text-sm sm:text-base mb-2 leading-tight flex-shrink-0 line-clamp-2">
            {post.title}
          </h3>

          {/* Sub-category and listing type */}
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {classified_details?.sub_category_name}
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {classified_details?.listing_type}
            </span>
          </div>
          
          {/* Key details section */}
          {keyDetails.length > 0 && (
            <div className="mb-3 flex-shrink-0">
              <div className="space-y-1">
                {keyDetails.map((detail, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Description preview */}
          {post.description && (
            <div className="mb-3 flex-shrink-0">
              <p className="text-xs text-gray-700 line-clamp-2">
                {post.description}
              </p>
            </div>
          )}

          {/* Spacer to push bottom content down */}
          <div className="flex-grow"></div>

          {/* Contact buttons */}
          <div className="mb-2 flex-shrink-0 space-y-2">
            {/* View Details Button */}
            <button
              onClick={() => setIsClassifiedDetailsOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>

            {/* Contact buttons */}
            {!isOwnPost && (classified_details?.contact_phone || classified_details?.contact_email) && (
              <div className="flex gap-2">
                {classified_details.contact_phone && (
                  <button
                    onClick={() => window.location.href = `tel:${classified_details.contact_phone}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </button>
                )}
                {classified_details.contact_email && (
                  <button
                    onClick={() => window.location.href = `mailto:${classified_details.contact_email}`}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom section with like button and date */}
          {renderLikeSection()}

          {/* Navigation */}
          {renderNavigation()}
        </div>
      );
  }, [post, readPostIds, onLike, isLiked, likeCount, onClose, onPrev, onNext, totalItems, currentIndex]);

  if (!post) return null;

 // function to get the button text based on category and application status
  const getActionButtonText = (categoryName, isApplied) => {
    const category = categoryName?.toLowerCase();
    
    if (isApplied) {
      if (['jobs', 'internship', 'gigs'].includes(category)) {
        return 'Applied';
      } else if (['others'].includes(category)) {
        return 'Registered';
      }
      return 'Joined';
    }
    
    // Default texts for not applied
    if (['jobs', 'internship', 'gigs'].includes(category)) {
      return 'Apply';
    } else if (['others'].includes(category)) {
      return 'Register';
    }
    return 'Join';
  };

  const renderChatSection = () => {
    const isUserSender = currentIdentity?.type === 'user';
    
    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg border border-blue-200">
          <button
            onClick={() => setIsChatOpen(false)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-medium">Back</span>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-700">Chat Support</span>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-3 space-y-2 px-1"
          style={{ maxHeight: '280px', minHeight: '200px' }}
        >
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-gray-500">No messages yet</p>
              <p className="text-[10px] text-gray-400 mt-1">Start the conversation</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isSentByMe = (isUserSender && msg.sender_type === 'user') || 
                                (!isUserSender && msg.sender_type === 'service_center');
              
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                      isSentByMe
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-xs leading-relaxed break-words">
                      {msg.message_text}
                    </p>
                    <p className={`text-[9px] mt-1 ${
                      isSentByMe ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSendingMessage}
            className={`px-3 py-2 rounded-full transition-all ${
              newMessage.trim() && !isSendingMessage
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSendingMessage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderPostComplaintCard = () => {
    const { complaint_details } = post;
    const images = post.images || [];
    const primaryImage = images.find(img => img.is_primary) || images[0];

    // Enhanced status configuration with border colors
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'Pending',
        borderColor: 'border-yellow-200',
        accentColor: 'bg-yellow-50',
        iconBg: 'bg-yellow-100',
        icon: '⏳'
      },
      in_progress: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'In Progress',
        borderColor: 'border-blue-200',
        accentColor: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        icon: '🔧'
      },
      completed: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Completed',
        borderColor: 'border-green-200',
        accentColor: 'bg-green-50',
        iconBg: 'bg-green-100',
        icon: '✓'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        label: 'Rejected',
        borderColor: 'border-red-200',
        accentColor: 'bg-red-50',
        iconBg: 'bg-red-100',
        icon: '✕'
      }
    };

    const currentStatus = statusConfig[complaint_details?.status] || statusConfig.pending;
    const isServiceCenter = currentIdentity?.type === 'page';
    const isPostOwner = currentIdentity?.type === 'user' && currentIdentity?.id === post.creator_id;
    
    // Check if user confirmation is needed
    const needsUserConfirmation = complaint_details?.status === 'completed' && 
                                  complaint_details?.user_confirmation_status === 'pending';
    
    // Check if awaiting user confirmation (for service center view)
    const awaitingConfirmation = isServiceCenter && needsUserConfirmation;

    const handleStatusUpdate = async (newStatus) => {
      if (handleGuestAction('updating complaint status')) return;
      
      try {
        setIsUpdatingStatus(true);
        const response = await fetch(`/api/complaints/${post.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        if (response.ok) {
          onRefresh?.();
          setShowStatusDropdown(false);
        }
      } catch (error) {
        console.error('Error updating status:', error);
      } finally {
        setIsUpdatingStatus(false);
      }
    };

    const handleUserConfirmation = async (confirmed) => {
      if (handleGuestAction('confirming complaint status')) return;
      
      try {
        const response = await fetch(`/api/complaints/${post.id}/confirm`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirmed }),
        });
        
        if (response.ok) {
          onRefresh?.();
          setShowConfirmationModal(false);
        }
      } catch (error) {
        console.error('Error confirming status:', error);
      }
    };

    // Show confirmation modal when user clicks on complaint needing confirmation
    // Note: The modal is triggered by clicking the "Action Required" button
    // or you can auto-show it by uncommenting the useEffect below
    
    // React.useEffect(() => {
    //   if (isPostOwner && needsUserConfirmation) {
    //     setShowConfirmationModal(true);
    //   }
    // }, [isPostOwner, needsUserConfirmation]);

    return (
      <>
        <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[350px] flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
          {/* Header */}
          {renderCardHeader()}

          {/* Status Banner with visual indicator */}
          <div className={`flex items-center justify-between mb-3 flex-shrink-0 ${currentStatus.accentColor} px-3 py-2 rounded-lg ${awaitingConfirmation ? 'ring-2 ring-orange-400 ring-opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full ${currentStatus.iconBg} flex items-center justify-center text-sm`}>
                {currentStatus.icon}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
              {awaitingConfirmation && (
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800 animate-pulse">
                  Awaiting User
                </span>
              )}
            </div>
            {isServiceCenter && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-50 rounded-full text-xs transition-colors shadow-sm"
                >
                  <span className="font-medium">Update</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                          complaint_details?.status === status ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Confirmation Badge (for post owner) */}
          {isPostOwner && needsUserConfirmation && (
            <div className="mb-3 flex-shrink-0">
              <button
                onClick={() => setShowConfirmationModal(true)}
                className="w-full bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-3 hover:from-orange-100 hover:to-amber-100 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-orange-900">Action Required</p>
                      <p className="text-[10px] text-orange-700">Confirm completion</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* Conditional Render: Chat or Post Details */}
          {isChatOpen ? (
            <div className="flex-1 mb-3 flex flex-col min-h-0">
              {renderChatSection()}
            </div>
          ) : (
            <>
              {/* Image section */}
              {primaryImage && (
                <ImageWithModal 
                  src={`${BASE_IMG_URL}${primaryImage.image_url}`}
                  alt={post.title}
                  className="relative h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3"
                  width={320}
                  height={160}
                  images={images}
                  imageIndex={0}
                />
              )}

              {/* Title */}
              <div className="mb-3 flex-shrink-0">
                <h3 className="font-bold text-sm sm:text-base leading-tight text-gray-900">
                  {post.title}
                </h3>
              </div>

              {/* Enhanced Complaint Details Grid */}
              <div className="mb-3 flex-shrink-0">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Brand */}
                    <div className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Brand</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 block truncate">{complaint_details?.brand_name}</span>
                    </div>

                    {/* Product */}
                    <div className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Product</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 block truncate">{complaint_details?.product_name}</span>
                    </div>

                    {/* Model (if exists) */}
                    {complaint_details?.specific_product_name && (
                      <div className="col-span-2 bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Model</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 block truncate">{complaint_details.specific_product_name}</span>
                      </div>
                    )}

                    {/* Service Type */}
                    {/* <div className="col-span-2 bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Service Type</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 block capitalize">
                        {complaint_details?.service_type?.replace('_', ' ') || 'At Center'}
                      </span>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Description */}
              {post.description && (
                <div className="mb-3 flex-shrink-0">
                  <p className="text-xs text-gray-700 line-clamp-3">
                    {post.description}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              {complaint_details?.additional_info && (
                <div className="mb-3 flex-shrink-0">
                  <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h4 className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Additional Info</h4>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">{complaint_details.additional_info}</p>
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-grow"></div>
            </>
          )}

          {/* Like section and date */}
          {renderLikeSection()}

          {/* Navigation */}
          {renderNavigation()}
        </div>

        {/* User Confirmation Modal - Rendered at root level */}
        {showConfirmationModal && isPostOwner && needsUserConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">✓</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Service Completed</h3>
                    <p className="text-sm text-green-100">Please confirm the status</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      The service center has marked your complaint as <span className="font-bold text-green-700">completed</span>. 
                      Please review the work and confirm if the issue has been resolved to your satisfaction.
                    </p>
                  </div>

                  {/* Complaint Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-600">Brand:</span>
                      <span className="text-xs font-bold text-gray-900">{complaint_details?.brand_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-600">Product:</span>
                      <span className="text-xs font-bold text-gray-900">{complaint_details?.product_name}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUserConfirmation(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Not Yet
                  </button>
                  <button
                    onClick={() => handleUserConfirmation(true)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Selecting &ldquo;Not Yet&ldquo; will reopen the complaint for further work
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCard = () => {
    // Check for story posts
    if (post.status === "story") {
      return renderStoryCard();
    }

    // Check for special event card condition
    if (post.post_type === 'event' && post.status) {
      return renderSpecialEventCard();
    }

    // Check for complaint card (city category)
    if (post.post_type === 'city') {
      return renderComplaintCard();
    }

    // Check for complaint card
    if (post.post_type === 'complaints') {
      return renderPostComplaintCard();
    }

    switch (post.post_type) {
      case 'job':
        return renderJobCard();
      case 'news':
        return renderNewsCard();
      case 'event':
        return renderEventCard();
      case 'classifieds':
        return renderClassifiedCard;
      case 'offers':
        return renderOfferCard();
      case 'announcement':
        if (post.category_name?.toLowerCase() === 'collaboration') {
          return renderCollaborationCard();
        }
        return renderAnnouncementCard();
      case 'general':
        if (post.product_launch_details) {
          return renderProductLaunchCard();
        }
        return renderGeneralCard();
      default:
        return renderGeneralCard();
    }
  };

  const renderCollaborationCard = () => {
    return (
      <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[280px] sm:min-h-[360px] flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {renderCardHeader()}

        {/* Image section */}
        {post.image_url && (
          <ImageWithModal 
            src={`${BASE_IMG_URL}${post.image_url}`}
            alt={post.title}
            className="h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={320}
            height={160}
          />
        )}
        
        <h3 className="font-semibold text-sm sm:text-base mb-2 leading-tight flex-shrink-0">
          {post.title}
        </h3>
        
        {/* Collaboration-specific details would go here */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="h-20 md:h-16 overflow-y-auto summary-scroll pr-1">
                {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>

            {/* Tags button positioned absolutely in top-right */}
            <div className="absolute top-0 right-0">
              <TagsDropdown post={post} />
            </div>
          </div>
        )}

        <div className="flex-grow"></div>
        
        {/* Action button for collaborations */}
        <div className="mb-2 flex-shrink-0">
          {!isOwnPost && (
            <button
              onClick={handleApply}
              className="w-full py-2 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              Express Interest
            </button>
          )}
        </div>

        {renderLikeSection()}
        {renderNavigation()}
      </div>
    );
  };

  const renderProductLaunchCard = () => {
    const formatLaunchDate = (dateString) => {
      if (!dateString) return 'Coming soon';
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return (
      <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[300px] sm:min-h-96 flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {renderCardHeader()}

        {/* Image section */}
        {post.image_url && (
          <ImageWithModal 
            src={`${BASE_IMG_URL}${post.image_url}`}
            alt={post.title}
            className="h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={320}
            height={160}
          />
        )}
        
        {/* Title section */}
        <h3 className="font-semibold text-sm sm:text-base mb-2 leading-tight flex-shrink-0">
          {post.product_launch_details?.product_name || post.title}
        </h3>
        
        {/* Launch Details Section */}
        {post.product_launch_details && (
          <div className="mb-3 flex-shrink-0 space-y-2">
            {/* Launch Date */}
            {post.product_launch_details.launch_date && (
              <div className="bg-blue-50 px-2 py-1.5 rounded">
                <span className="font-medium text-blue-700 text-xs block mb-1">🚀 Launch Date:</span>
                <span className="text-blue-600 text-xs">
                  {formatLaunchDate(post.product_launch_details.launch_date)}
                </span>
              </div>
            )}

            {/* Product Link */}
            {post.product_launch_details.link && (
              <div className="bg-green-50 px-2 py-1.5 rounded">
                <span className="font-medium text-green-700 text-xs block mb-1">🔗 Product Link:</span>
                <a 
                  href={post.product_launch_details.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 text-xs hover:underline break-all"
                >
                  View Product
                </a>
              </div>
            )}

            {/* Additional Info */}
            {post.product_launch_details.additional_info && (
              <div className="bg-yellow-50 px-2 py-1.5 rounded">
                <span className="font-medium text-yellow-700 text-xs block mb-1">ℹ️ About the Product:</span>
                <p className="text-yellow-600 text-xs">{post.product_launch_details.additional_info}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Description Section */}
        {post.description && (
          <div className="relative mb-2 flex-shrink-0">
            <div className="h-20 md:h-16 overflow-y-auto summary-scroll pr-1">
                  {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
          {/* Tags button positioned absolutely in top-right */}
          <div className="absolute top-0 right-0">
            <TagsDropdown post={post} />
          </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            new Date(post.product_launch_details?.launch_date) > new Date()
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {new Date(post.product_launch_details?.launch_date) > new Date()
              ? 'Coming Soon'
              : 'Launched'}
          </span>
        </div>
        
        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>
        
        {/* Bottom section with like button and date */}
        {renderLikeSection()}

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  const renderJobCard = () => {
    return (
      <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[300px] sm:min-h-96 flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {/* Use the common header component */}
        {renderCardHeader()}

        {/* Title section */}
        <h3 className="font-semibold text-sm sm:text-base mb-3 leading-tight flex-shrink-0">
          {post.title}
        </h3>
        
        {/* Job Details Section - Enhanced without image space */}
        {post.job_details && (
          <div className="mb-3 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              {post.job_details.salary_or_stipend && (
                <div className="bg-green-50 px-2 py-1.5 rounded">
                  <span className="font-medium text-green-700 block">Salary:</span>
                  <span className="text-green-600">{post.job_details.salary_or_stipend}</span>
                </div>
              )}
              <div className="bg-blue-50 px-2 py-1.5 rounded">
                <span className="font-medium text-blue-700 block">Location:</span>
                <span className="text-blue-600 capitalize">{post.job_details.location_type}</span>
              </div>
              {post.job_details.experience && (post.job_details.experience.min_years !== undefined || post.job_details.experience.max_years !== undefined) && (
                <div className="bg-purple-50 px-2 py-1.5 rounded">
                  <span className="font-medium text-purple-700 block">Experience:</span>
                  <span className="text-purple-600">
                    {post.job_details.experience.min_years}-{post.job_details.experience.max_years} years
                  </span>
                </div>
              )}
              {post.job_details.job_type && (
                <div className="bg-indigo-50 px-2 py-1.5 rounded">
                  <span className="font-medium text-indigo-700 block">Type:</span>
                  <span className="text-indigo-600 capitalize">{post.job_details.job_type}</span>
                </div>
              )}
            </div>

            {/* Education Section - Full width */}
            {post.job_details.education_qualifications && post.job_details.education_qualifications.length > 0 && (
              <div className="bg-orange-50 px-2 py-1.5 rounded mb-2">
                <span className="font-medium text-orange-700 text-xs block mb-1">Education:</span>
                <div className="flex flex-wrap gap-1">
                  {post.job_details.education_qualifications.map((edu, index) => (
                    <span key={index} className="bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded text-xs">
                      {edu.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section - Enhanced */}
            {post.job_details.skills && post.job_details.skills.length > 0 && (
              <div className="bg-gray-50 px-2 py-1.5 rounded">
                <span className="font-medium text-gray-700 text-xs block mb-1">Skills Required:</span>
                <div className="flex flex-wrap gap-1">
                  {post.job_details.skills.map((skill, index) => (
                    <span key={index} className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Description Section - More space */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="h-16 md:h-14 overflow-y-auto summary-scroll pr-1">
                {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
                      {/* Tags button positioned absolutely in top-right */}
          <div className="absolute top-0 right-0">
            <TagsDropdown post={post} />
          </div>
          </div>
        )}
        
        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>
        
        {/* Action Button */}
        <div className="mb-2 flex-shrink-0">
          {!isOwnPost && (
            <button
              onClick={handleApply}
              disabled={post.job_details?.is_applied_by_user}
              className={`w-full py-2 px-4 rounded-lg transition-colors font-medium text-sm ${
                post.job_details?.is_applied_by_user
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {getActionButtonText(post.category_name, post.job_details?.is_applied_by_user)}
            </button>
          )}
        </div>
      
        {/* Bottom section with like button and date */}
        {renderLikeSection()}

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  const renderNewsCard = () => {
    // News card rendering logic
    return (
      <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[300px] sm:min-h-96 flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {/* Use the common header component */}
        {renderCardHeader()}

        {/* Image section */}
        <ImageWithModal 
          src={`${BASE_IMG_URL}${post.image_url}`}
          alt={post.title}
          className="relative h-24 sm:h-32 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
          width={320}
          height={160}
        />
        
        {/* Title section */}
        <h3 className="font-semibold text-sm sm:text-base mb-3 leading-tight flex-shrink-0">
          {post.title}
        </h3>
        
        {/* Summary Section */}
        {post.news_details?.summary && (
          <div className="mb-3 flex-shrink-0">
            <div className="h-26 md:h-20 overflow-y-auto summary-scroll pr-1">
              <p className="text-xs sm:text-sm text-gray-700 leading-tight sm:leading-normal text-justify">
                {post.news_details.summary}
              </p>
            </div>
          </div>
        )}

        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>
        
        {/* Source and date section */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <button
            onClick={() => window.location.href = `/page/${post.created_by}`}
            className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 hover:bg-gray-50 rounded p-1 transition-colors group"
          >
            {/* Source Logo */}
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-gray-200 group-hover:border-blue-300 transition-colors flex-shrink-0">
              <Image
                src={post.user_profile_image || "/user-placeholder.png"}
                alt={`Logo of ${post.news_details?.source_name || 'news source'}`}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/user-placeoholder.png";
                  e.target.style.objectFit = "cover"; 
                }}
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-800 truncate font-medium sm:font-normal group-hover:text-blue-600 transition-colors">
              Source: {post.news_details?.source_name}
            </p>
          </button>
          <p className="text-xs text-gray-600 flex-shrink-0 ml-2">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
        
        {/* Read article button */}
        <button
          onClick={() => window.open(post.news_details?.article_url, '_blank')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded text-xs sm:text-sm font-medium transition-colors shadow-sm flex-shrink-0 mb-2"
        >
          Read Article
        </button>   

        {/* Bottom section with like button and date */}
        {renderLikeSection()}

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  const renderEventCard = () => {
    const formatEventDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[300px] sm:min-h-96 flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {/* Use the common header component */}
        {renderCardHeader()}

        {/* Event Type Badge */}
        {post.event_details.event_type && (
          <div className="mb-2 flex-shrink-0">
            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {post.event_details.event_type}
            </span>
          </div>
        )}

        {/* Event Name */}
        <h3 className="font-semibold text-sm sm:text-base mb-3 leading-tight flex-shrink-0">
          {post.event_details.event_name || post.title}
        </h3>
        
        {/* Event Details Section */}
        <div className="mb-3 flex-shrink-0 space-y-2">
          {/* Event Date */}
          {post.event_details.event_date && (
            <div className="bg-blue-50 px-2 py-1.5 rounded">
              <span className="font-medium text-blue-700 text-xs block mb-1">📅 Event Date:</span>
              <span className="text-blue-600 text-xs">{formatEventDate(post.event_details.event_date)}</span>
            </div>
          )}

          {/* Event Link */}
          {post.event_details.link && (
            <div className="bg-green-50 px-2 py-1.5 rounded">
              <span className="font-medium text-green-700 text-xs block mb-1">🔗 Registration Link:</span>
              <a 
                href={post.event_details.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 text-xs hover:underline break-all"
              >
                Register Here
              </a>
            </div>
          )}

          {/* Additional Info if available */}
          {post.event_details.additional_info && (
            <div className="bg-yellow-50 px-2 py-1.5 rounded">
              <span className="font-medium text-yellow-700 text-xs block mb-1">ℹ️ Additional Info:</span>
              <p className="text-yellow-600 text-xs">{post.event_details.additional_info}</p>
            </div>
          )}
        </div>
        
        {/* Description Section */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="h-20 md:h-16 overflow-y-auto summary-scroll pr-1">
                {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
          {/* Tags button positioned absolutely in top-right */}
          <div className="absolute top-0 right-0">
            <TagsDropdown post={post} />
          </div>
          </div>
        )}
        
        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>
        
        {/* Action Button */}
        <div className="mb-2 flex-shrink-0">
          {!isOwnPost && (
            <button
              onClick={handleApply}
              disabled={post.event_details?.is_applied_by_user}
              className={`w-full py-2 px-4 rounded-lg transition-colors font-medium text-sm ${
                post.event_details?.is_applied_by_user
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {getActionButtonText(post.category_name, post.event_details?.is_applied_by_user)}
            </button>
          )}
        </div>
      
        {/* Bottom section with like button and date */}
        {renderLikeSection()}

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  const renderGeneralCard = () => {
    // General card rendering logic
    return (
      <div className={`w-full aq relative select-none flex flex-col ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {/* Use the common header component */}
        {renderCardHeader()}

        {/* Image section */}
        {post.image_url && (
          <ImageWithModal 
            src={`${BASE_IMG_URL}${post.image_url}`}
            alt={post.title}
            className="relative h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={380}
            height={200}
          />
        )}

        {/* Title section */}
        {post.title && (
          <h3 className="font-semibold text-sm sm:text-base mb-3 leading-tight flex-shrink-0">
            {post.title}
          </h3>
        )}
        
        {/* Description Section */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="max-h-20 overflow-y-auto summary-scroll pr-1">
              {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
            {/* Tags button positioned absolutely in top-right */}
            <div className="absolute top-0 right-0">
              <TagsDropdown post={post} />
            </div>
          </div>
        )}

        {/* Bottom section with like button and date */}
        <div className="mt-auto pt-3">
          {renderLikeSection()}
        </div>
      
        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  const renderStoryCard = () => {
    return (
      <div className={`w-full max-w-[320px] sm:max-w-[380px] relative select-none border-2 border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-lg ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {/* Content with white background */}
        <div className="bg-white rounded-[6px] h-full p-3 flex flex-col m-[2px]">
          
          {/* Story badge at the top */}
          <div className="flex justify-start mb-3">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
              📱 Story
            </span>
          </div>

          {/* Use the common header component */}
          {renderCardHeader()}

          {/* Image section */}
          {post.image_url && (
            <ImageWithModal 
              src={`${BASE_IMG_URL}${post.image_url}`}
              alt={post.title}
              className="relative h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
              width={380}
              height={200}
            />
          )}
                  
          {/* Title section */}
          {post.title && (
            <h3 className="font-semibold text-sm sm:text-base mb-3 leading-tight flex-shrink-0">
              {post.title}
            </h3>
          )}
          
          {/* Description Section */}
          {post.description && (
            <div className="relative mb-3 flex-shrink-0">
              <div className="max-h-20 overflow-y-auto summary-scroll pr-1">
                {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
              </div>
              {/* Tags button positioned absolutely in top-right */}
              <div className="absolute top-0 right-0">
                <TagsDropdown post={post} />
              </div>
            </div>
          )}

          {/* Bottom section with like button and date */}
          <div className="mt-auto pt-3">
            {renderLikeSection()}
          </div>
        
          {/* Navigation */}
          {renderNavigation()}
        </div>
      </div>
    );
  };

  const renderOfferCard = () => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const copyCouponCode = () => {
      if (post.offer_details?.coupon_code) {
        navigator.clipboard.writeText(post.offer_details.coupon_code);
        // You might want to add a toast notification here
      }
    };

    return (
      <div className={`w-full max-w-[280px] sm:max-w-[320px] relative select-none min-h-[300px] sm:min-h-96 flex flex-col justify-between ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {/* Use the common header component */}
        {renderCardHeader()}

        {/* Image section - Show image if available */}
        {post.image_url && (
          <ImageWithModal 
            src={`${BASE_IMG_URL}${post.image_url}`}
            alt={post.title}
            className="h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={320}
            height={160}
          />
        )}

        {/* Title section - No truncation for offers */}
        <h3 className="font-semibold text-base sm:text-lg mb-3 leading-tight flex-shrink-0">
          {post.title}
        </h3>

        {/* Offer Details Section */}
        <div className="mb-3 flex-shrink-0 space-y-2">
          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-2">
            {post.offer_details?.valid_from && (
              <div className="bg-blue-50 px-2 py-1.5 rounded">
                <span className="font-medium text-blue-700 text-xs block mb-1">Starts:</span>
                <span className="text-blue-600 text-xs">{formatDate(post.offer_details.valid_from)}</span>
              </div>
            )}
            {post.offer_details?.valid_until && (
              <div className="bg-red-50 px-2 py-1.5 rounded">
                <span className="font-medium text-red-700 text-xs block mb-1">Ends:</span>
                <span className="text-red-600 text-xs">{formatDate(post.offer_details.valid_until)}</span>
              </div>
            )}
          </div>

          {/* Coupon Code - Copyable */}
          {post.offer_details?.coupon_code && (
            <div className="bg-green-50 px-2 py-1.5 rounded">
              <span className="font-medium text-green-700 text-xs block mb-1">🎟️ Coupon Code:</span>
              <div className="flex items-center justify-between">
                <span className="text-green-600 text-xs font-mono bg-green-100 px-2 py-1 rounded">
                  {post.offer_details.coupon_code}
                </span>
                <button
                  onClick={copyCouponCode}
                  className="text-green-600 hover:text-green-800 text-xs font-medium ml-2"
                  title="Copy coupon code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Website URL Button */}
          {post.offer_details?.website_url && (
            <div className="bg-purple-50 px-2 py-1.5 rounded">
              <span className="font-medium text-purple-700 text-xs block mb-1">🌐 Website:</span>
              <a
                href={post.offer_details.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-1 px-3 rounded transition-colors"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>
        
        {/* Description Section - Clear and visible */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="h-20 md:h-16 overflow-y-auto summary-scroll pr-1">
              {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
            {/* Tags button positioned absolutely in top-right */}
            <div className="absolute top-0 right-0">
              <TagsDropdown post={post} />
            </div>
          </div>
        )}
        
        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>
        
        {/* Special Offer Badge */}
        <div className="mb-2 flex-shrink-0">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold py-1 px-3 rounded-full inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 5.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 10l1.293-1.293zm4 0a1 1 0 010 1.414L11.586 10l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Special Offer
          </div>
        </div>
        
        {/* Bottom section with like button and date */}
        {renderLikeSection()}

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  const renderComplaintCard = () => {
    const getStatusColor = (status) => {
      const colors = {
        'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
        'acknowledged': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'in_progress': 'bg-orange-100 text-orange-800 border-orange-200',
        'resolved': 'bg-green-100 text-green-800 border-green-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200'
      };
      return colors[status] || colors['submitted'];
    };

    const getSeverityColor = (severity) => {
      const colors = {
        'low': 'bg-emerald-100 text-emerald-800',
        'medium': 'bg-amber-100 text-amber-800',
        'high': 'bg-rose-100 text-rose-800'
      };
      return colors[severity] || colors['low'];
    };

    const getStatusIcon = (status) => {
      const icons = {
        'submitted': '📋',
        'acknowledged': '👁️',
        'in_progress': '🔧',
        'resolved': '✅',
        'rejected': '❌'
      };
      return icons[status] || '📋';
    };

    const handleStatusUpdate = async (newStatus, remarks = '') => {
      setIsUpdatingStatus(true);
      try {
        const response = await fetch('/api/complaints/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            complaint_id: post.complaint_details.id,
            post_id: post.id,
            new_status: newStatus,
            remarks: remarks
          })
        });

        if (response.ok) {
          // Trigger a refetch of the post data
          if (onRefresh) {
            onRefresh();
          }
          setShowStatusDropdown(false);
        } else {
          console.error('Failed to update status');
        }
      } catch (error) {
        console.error('Error updating status:', error);
      } finally {
        setIsUpdatingStatus(false);
      }
    };

    const canUpdateStatus = communityRole && 
                          !communityRole.is_official === false && 
                          post.complaint_details?.can_update_status;

    const isCitizen = communityRole?.name?.toLowerCase() === 'citizen';

    return (
      <div className={`w-full max-w-[320px] sm:max-w-[380px] relative select-none flex flex-col ${readPostIds.includes(post.id) ? 'grayscale' : ''}`}>
        {renderCardHeader()}

        {/* Image section */}
        {post.image_url && (
          <ImageWithModal 
            src={`${BASE_IMG_URL}${post.image_url}`}
            alt={post.title}
            className="relative h-32 sm:h-40 w-full overflow-hidden rounded-md sm:rounded-lg mb-3 flex-shrink-0"
            width={380}
            height={200}
          />
        )}

        {/* Issue Title/Subject */}
        <div className="mb-3 flex-shrink-0">
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
            <h3 className="font-semibold text-sm sm:text-base text-red-900 leading-tight">
              🚨 {post.title}
            </h3>
          </div>
        </div>

        {/* Complaint Details Section */}
        <div className="mb-3 flex-shrink-0 space-y-2">
          {/* Status Display */}
          <div className="relative">
            <div className={`px-3 py-2 rounded-lg border ${getStatusColor(post.complaint_details?.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-xs block mb-1">
                    {getStatusIcon(post.complaint_details?.status)} Status
                  </span>
                  <span className="text-sm font-semibold capitalize">
                    {post.complaint_details?.status?.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Status Update Button for Officials */}
                {canUpdateStatus && (
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      disabled={isUpdatingStatus}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                    >
                      {isUpdatingStatus ? '⏳' : '✏️'} Update
                    </button>
                    
                    {showStatusDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        {['acknowledged', 'in_progress', 'resolved', 'rejected'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(status)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 capitalize first:rounded-t-lg last:rounded-b-lg"
                          >
                            {getStatusIcon(status)} {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Severity */}
          <div className={`px-3 py-2 rounded-lg ${getSeverityColor(post.complaint_details?.severity)}`}>
            <span className="font-medium text-xs block mb-1">⚠️ Severity Level</span>
            <span className="text-sm font-semibold capitalize">
              {post.complaint_details?.severity}
            </span>
          </div>

          {/* Location Description */}
          {post.complaint_details?.location_description && (
            <div className="bg-gray-50 px-3 py-2 rounded-lg">
              <span className="font-medium text-gray-700 text-xs block mb-1">📍 Location Details</span>
              <span className="text-gray-600 text-sm">{post.complaint_details.location_description}</span>
            </div>
          )}

          {/* Last Updated */}
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-blue-700 text-xs block mb-1">🕒 Last Updated</span>
            <span className="text-blue-600 text-xs">
              {new Date(post.complaint_details?.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Description Section */}
        {post.description && (
          <div className="relative mb-3 flex-shrink-0">
            <div className="max-h-20 overflow-y-auto summary-scroll pr-1 bg-gray-50 p-3 rounded-lg">
              <span className="font-medium text-gray-700 text-xs block mb-2">📝 Issue Description</span>
              {parseDescriptionWithTags(post.description, post.tags, handleTagClick)}
            </div>
            {/* Tags button positioned absolutely in top-right */}
            <div className="absolute top-2 right-2">
              <TagsDropdown post={post} />
            </div>
          </div>
        )}

        {/* Bottom section */}
        <div className="mt-auto pt-3">
          {renderLikeSection()}
        </div>

        {/* Navigation */}
        {renderNavigation()}
        
        {/* Click outside to close dropdown */}
        {showStatusDropdown && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowStatusDropdown(false)}
          />
        )}
      </div>
    );
  };

  // Get images for the current post
  const getPostImages = () => {
    if (post.post_type === 'classifieds' && post.classified_details?.images?.length > 0) {
      return post.classified_details.images;
    }

    if (post.post_type === 'complaints' && post.images?.length > 0) {
      return post.images;
    }
    
    if (post.post_type === 'offers' && post.image_url) {
      return [{ image_url: post.image_url }];
    }
    if (post.image_url) {
      return [{ image_url: post.image_url }];
    }
    return [];
  };

const postImages = getPostImages();

  // Render registration details if needed
  if (showRegistrationDetails) {
    const currentRegistration = getCurrentRegistrationItem();
    if (!currentRegistration) return null;
    
    return (
      <div className="w-[200px] md:w-[280px] h-full flex flex-col">
        {/* Registration Header */}
        <div className="relative w-full mb-3 flex-shrink-0 flex items-center justify-between">
          <button
            onClick={onBackFromRegistration}
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
            aria-label="Back to post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-700">Registrations</span>
          
          <button 
            onClick={onClose}
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Registration Content */}
        <>
          {/* User Profile Section */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 border-2 border-green-200">
              <Image
                src={currentRegistration.user_profile_image || "/user-placeohlder.png"}
                alt={`Profile picture of ${currentRegistration.user_name}`}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/user-placeoholder.png";
                  e.target.style.objectFit = "cover"; 
                }}
              />
            </div>
            
            <h3 className="font-semibold text-base sm:text-lg mb-1">
              {currentRegistration.user_name}
            </h3>
            
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mb-2">
              Applied
            </div>
          </div>

          {/* Post Applied For */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Applied for:</p>
            <p className="font-medium text-sm">{currentRegistration.post_title}</p>
            <p className="text-xs text-gray-500">{currentRegistration.post_category_name}</p>
          </div>

          {/* Contact Information */}
          <div className="mb-4 space-y-2">
            {currentRegistration.user_email && (
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{currentRegistration.user_email}</span>
              </div>
            )}
            
            {currentRegistration.user_phone && (
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{currentRegistration.user_phone}</span>
              </div>
            )}
          </div>

          {/* Application Note */}
          {currentRegistration.note && (
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-1">Note:</p>
              <div className="h-16 overflow-y-auto p-2 bg-gray-50 rounded text-sm">
                {currentRegistration.note}
              </div>
            </div>
          )}

          {/* Resume Link */}
          {currentRegistration.resume_url && (
            <div className="mb-4">
              <a 
                href={`${BASE_IMG_URL}${currentRegistration.resume_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">View Resume</span>
              </a>
            </div>
          )}

          {/* Application Date */}
          <div className="mb-4 text-center">
            <p className="text-xs text-gray-500">
              Applied on {new Date(currentRegistration.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Navigation for multiple registrations */}
          {totalItems > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={onPrevRegistration}
                disabled={currentRegistrationIndex === 0}
                className={`p-1 rounded text-xs sm:text-sm ${
                  currentRegistrationIndex === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-green-600 hover:bg-green-50"
                }`}
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">
                {currentRegistrationIndex + 1} of {totalItems}
              </span>
              <button
                onClick={onNextRegistration}
                disabled={currentRegistrationIndex === totalItems - 1}
                className={`p-1 rounded text-xs sm:text-sm ${
                  currentRegistrationIndex === totalItems - 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-green-600 hover:bg-green-50"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </>
      </div>
    );
  }

  // Render user profile if needed
  if (showUserProfile) {
    return (
      <div className="w-[200px] md:w-[280px] h-full flex flex-col">
        {/* Profile Header */}
        <div className="relative w-full mb-3 flex-shrink-0 flex items-center justify-between">
          <button
            onClick={onBackFromProfile}
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
            aria-label="Back to post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-700">Profile</span>
          
          <button 
            onClick={onClose}
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors border border-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col items-center text-center flex-grow">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 border-2 border-gray-200">
              <Image
                src={post.user_profile_image || "/user-placeholder.png"} 
                alt="Profile"
                width={32}  // Set appropriate width
                height={32} // Set appropriate height
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/user-placeoholder.png";
                  e.target.style.objectFit = "cover"; 
                }}
              />
          </div>
          
          <h3 className="font-semibold text-base sm:text-lg mb-2">
            {post.user_name}
          </h3>
          
          <div className="text-sm text-gray-600 mb-4">
            {/* <p>Member of {post.community_name}</p> */}
            <p className="text-xs mt-1">
              Joined {new Date(post.joined_at).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderCard()}
      {/* Enhanced Image Modal */}
      <ImageModal 
        isImageModalOpen={isImageModalOpen} 
        closeImageModal={closeImageModal} 
        images={postImages}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        post={post} 
        onLike={onLike} 
        isLiked={isLiked} 
        likeCount={likeCount}
        handleLike={handleLike}
      />
      {/* Classified Details Modal */}
      {post.post_type === 'classifieds' && (
        <ClassifiedDetailsModal
          isOpen={isClassifiedDetailsOpen}
          onClose={() => setIsClassifiedDetailsOpen(false)}
          post={post}
          onLike={onLike}
          isLiked={isLiked}
          likeCount={likeCount}
        />
      )}
      {/* Guest Signup Modal */}
      <GuestSignupModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        feature={guestModalFeature}
      />
    </>
  );  
};

export default MapCard;