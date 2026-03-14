// components/InfrastructureMapCard.js
import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BASE_IMG_URL } from '@/lib/map/constants';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import AssignUserModal from '@/app/_components/AssignUserModal';

// Enhanced Image Modal with navigation
const ImageModal = ({ 
  isImageModalOpen, 
  closeImageModal, 
  images, 
  currentImageIndex, 
  setCurrentImageIndex, 
  post 
}) => {
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
                      e.target.src = "/user-placeholder.png";
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

const InfrastructureMapCard = ({
  post,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalItems,
  onRefresh,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const currentIdentity = useIdentityStore(state => state.currentIdentity);
  const loggedInUserId = useIdentityStore(state => state.loggedInUserId);

  // Check if current user is the post owner
  const isOwnPost = Number(loggedInUserId) === Number(post.user_id);
  
  // Check user role and permissions
  const userRole = post.user_page_role;
  const isAdmin = userRole === 'Admin';
  const isMember = userRole === 'Member';
  const canManagePosts = ['Admin', 'Maintenance', 'Security'].includes(userRole);
  const canSelfAssign = !isAdmin && !isMember && !post.issue_details?.assigned_to_user_id;

  // FIX: Memoize image modal functions to prevent flickering
  const openImageModal = useCallback((imageIndex = 0) => {
    setCurrentImageIndex(imageIndex);
    setIsImageModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  // Function to get navigation button text based on post type
  const getNavigationText = (postType) => {
    switch (postType) {
      case 'issue':
        return { prev: '← Prev Issue', next: 'Next Issue →' };
      default:
        return { prev: '← Prev Post', next: 'Next Post →' };
    }
  };

  // Status configuration for issues
  const statusConfig = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      label: 'Pending',
      icon: '⏳'
    },
    in_progress: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      label: 'In Progress',
      icon: '🔧'
    },
    completed: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      label: 'Completed',
      icon: '✓'
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/centers/issues/${post.id}/status`, {
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

  // Handle user confirmation
  const handleUserConfirmation = async (confirmed) => {
    try {
      const response = await fetch(`/api/centers/issues/${post.id}/confirm`, {
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

  // Handle self assignment
  const handleSelfAssign = async () => {
    try {
      const response = await fetch(`/api/centers/issues/${post.id}/assign-self`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error self-assigning issue:', error);
    }
  };

  // Common header component function
  const renderCardHeader = useCallback(() => {
    const truncateText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    };

    return (
      <div className="relative w-full mb-2 flex-shrink-0 flex items-center">
        {/* Left section - Profile */}
        <div className="flex items-center gap-1.5 rounded-lg p-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-gray-200">
              <Image
                src={post.creator_profile_image || "/user-placeholder.png"}
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/user-placeholder.png";
                }}
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
          </div>
          
          {/* User Info */}
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span 
              className="text-[10px] sm:text-[11px] font-medium text-gray-800 truncate w-full leading-tight text-left"
              title={post.user_name}
            >
              {truncateText(post.user_name, 12)}
            </span>
            {post.page?.name && (
              <span className="text-[8px] sm:text-[9px] text-gray-500 leading-[1.1] truncate w-full">
                {post.page.name}
              </span>
            )}
          </div>
        </div>

        {/* Center section - Category */}
        <div className="flex justify-center items-center px-2">
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] sm:text-xs font-medium rounded-full inline-flex items-center justify-center gap-0.5 shadow-sm">
            <span className="text-[10px] sm:text-xs">{post.category_name || post.post_type}</span>
          </span>
        </div>

        {/* Right section - Close button */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
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
      </div>
    );
  }, [post, onClose]);

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

  // Image With Modal component
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
          e.target.src = "/user-placeholder.png";
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
  ), [openImageModal]);

  // Render general card
  const renderGeneralCard = () => {
    const images = post.images || [];
    const primaryImage = images.find(img => img.is_primary) || images[0];

    return (
      <div className="w-full max-w-[280px] sm:max-w-[320px] relative select-none h-[400px] flex flex-col">
        {/* Header */}
        {renderCardHeader()}
        {/* Scrollable Content Area */}
    <div className="flex-1 overflow-y-auto 
                    [&::-webkit-scrollbar]:w-2 
                    [&::-webkit-scrollbar-track]:bg-gray-100 
                    [&::-webkit-scrollbar-thumb]:bg-gray-300 
                    [&::-webkit-scrollbar-thumb]:rounded-full 
                    [&::-webkit-scrollbar-thumb:hover]:bg-gray-400">
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

          {/* Description */}
          {post.description && (
            <div className="mb-3 flex-shrink-0">
              <p className="text-xs text-gray-700 line-clamp-3">
                {post.description}
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-grow"></div>

          {/* Date */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
            <p className="text-xs text-gray-500">
              Submitted {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>

        </div>

        {/* Navigation */}
        {renderNavigation()}
      </div>
    );
  };

  // Render issue card
  const renderIssueCard = () => {
    const { issue_details } = post;
    const images = post.images || [];
    const primaryImage = images.find(img => img.is_primary) || images[0];
    
    const currentStatus = statusConfig[issue_details?.status] || statusConfig.pending;
    
    // Check if user confirmation is needed (for post owner)
    const needsUserConfirmation = issue_details?.status === 'completed' && 
                                  issue_details?.user_confirmation_status === 'pending' &&
                                  isOwnPost;

    // Check if admin can assign users
    const canAssignUser = isAdmin && !issue_details?.assigned_to_user_id;

    return (
      <>
        <div className="w-full max-w-[280px] sm:max-w-[320px] relative select-none h-[450px] flex flex-col">
          {/* Header */}
          {renderCardHeader()}


          {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto 
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:bg-gray-100 
                [&::-webkit-scrollbar-thumb]:bg-gray-300 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb:hover]:bg-gray-400">

            {/* Status Banner */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${currentStatus.color.replace('bg-', 'bg-').replace(' text-', ' ')} flex items-center justify-center text-sm`}>
                  {currentStatus.icon}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
                
                {/* Assigned User Badge */}
                {issue_details?.assigned_to_user_id && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                    Assigned
                  </span>
                )}
              </div>

              {/* Status Update Dropdown */}
              {(isAdmin || issue_details?.assigned_to_user_id === loggedInUserId) && (
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
                            issue_details?.status === status ? 'bg-blue-50 text-blue-700' : ''
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


            {/* Assignment Actions Row - NEW SEPARATE ROW */}
            <div className="flex items-center mb-3 flex-shrink-0">
              {/* Left side - View Assignment button when already assigned */}
              {issue_details?.assigned_to_user_id && isAdmin &&(
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors shadow-sm w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  View Assignment
                </button>
              )}

              {/* Right side - Assignment action buttons */}
              {(canAssignUser || canSelfAssign) && (
                <div className={`flex items-center gap-2 ${canAssignUser && canSelfAssign ? '' : 'w-full'}`}>
                  {canAssignUser && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm ${canSelfAssign ? '' : 'w-full'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Assign to Someone
                    </button>
                  )}

                  {canSelfAssign && (
                    <button
                      onClick={handleSelfAssign}
                      className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm ${canAssignUser ? '' : 'w-full'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Assign to Myself
                    </button>
                  )}
                </div>
              )}
            </div>  
            
            {/* User Confirmation Badge */}
            {needsUserConfirmation && (
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

            {/* Issue Details Grid */}
            <div className="mb-3 flex-shrink-0">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  {/* Building Block */}
                  <div className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Block</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 block truncate">
                      {issue_details?.block_name || 'N/A'}
                    </span>
                  </div>

                  {/* Building */}
                  <div className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Building</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 block truncate">
                      {issue_details?.building_name || 'N/A'}
                    </span>
                  </div>

                  {/* Floor */}
                  <div className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Floor</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 block truncate">
                      {issue_details?.floor_number || 'N/A'}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="bg-white rounded-md p-2.5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Priority</span>
                    </div>
                    <span className={`text-xs font-bold block truncate ${
                      issue_details?.priority === 'high' 
                        ? 'text-red-600' 
                        : issue_details?.priority === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {issue_details?.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </div>
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
            {issue_details?.additional_info && (
              <div className="mb-3 flex-shrink-0">
                <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Additional Info</h4>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">{issue_details.additional_info}</p>
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-grow"></div>

            {/* Date */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
              <p className="text-xs text-gray-500">
                Submitted {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>

          </div>

          {/* Navigation */}
          {renderNavigation()}
        </div>

        {/* User Confirmation Modal */}
        {showConfirmationModal && needsUserConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">✓</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Issue Resolved</h3>
                    <p className="text-sm text-green-100">Please confirm the status</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      The issue has been marked as <span className="font-bold text-green-700">completed</span>. 
                      Please confirm if the issue has been resolved to your satisfaction.
                    </p>
                  </div>

                  {/* Issue Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="text-xs text-gray-600">Building:</span>
                      <span className="text-xs font-bold text-gray-900">{issue_details?.building_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-600">Floor:</span>
                      <span className="text-xs font-bold text-gray-900">{issue_details?.floor_number}</span>
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
                    Not Resolved
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
                  Selecting &ldquo;Not Resolved&ldquo; will reopen the issue for further work
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assign User Modal */}
        {showAssignModal && (
          <AssignUserModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            post={post}
            onRefresh={onRefresh}
          />
        )}
      </>
    );
  };

  // Get images for the current post
  const getPostImages = () => {
    if (post.images?.length > 0) {
      return post.images;
    }
    return [];
  };

  const postImages = getPostImages();

  if (!post) return null;

  // Render appropriate card based on post type
  const renderCard = () => {
    if (post.post_type === 'issue') {
      return renderIssueCard();
    }
    return renderGeneralCard();
  };

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
      />
    </>
  );  
};

export default InfrastructureMapCard;