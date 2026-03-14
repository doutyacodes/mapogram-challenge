import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  UserPlus, 
  UserCheck, 
  Tag, 
  Users
} from 'lucide-react';
import { useIdentityStore } from '@/stores/activeIdentityStore';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentIdentity = useIdentityStore(state => state.currentIdentity);
  const loggedInUserId = useIdentityStore(state => state.loggedInUserId);

  // Use the custom notifications hook
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    acceptFriendRequest,
    rejectFriendRequest,
    acceptTag,
    rejectTag,
    isActionLoading
  } = useNotifications(currentIdentity, loggedInUserId);

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

  const getNotificationIcon = (type) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'friend_request':
        return <UserPlus className={`${iconClass} text-blue-500`} />;
      case 'friend_accept':
        return <UserCheck className={`${iconClass} text-green-500`} />;
      case 'follow_page':
        return <Users className={`${iconClass} text-purple-500`} />;
      case 'tagged_in_post':
        return <Tag className={`${iconClass} text-orange-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getProfileImage = (notification) => {
    switch (notification.type) {
      case 'friend_request':
        return notification.sender?.profile_pic_url;
      case 'friend_accept':
        return notification.accepter?.profile_pic_url;
      case 'follow_page':
        return notification.follower?.profile_pic_url;
      case 'tagged_in_post':
        return notification.tagger?.profile_pic_url;
      default:
        return null;
    }
  };

  const renderActionButtons = (notification) => {
    const needsAction = ['friend_request', 'tagged_in_post'].includes(notification.type);
    
    switch (notification.type) {
      case 'friend_request':
        return (
            <div className="flex gap-1 mt-2">
            <button
                onClick={(e) => {
                e.stopPropagation(); // Prevent marking as read
                const metadata = JSON.parse(notification.metadata || '{}');
                acceptFriendRequest(notification.id, notification.type, metadata.sender_id);
                }}
                disabled={isActionLoading(notification.id, 'accept_friend_request')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
                {isActionLoading(notification.id, 'accept_friend_request') ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                'Accept'
                )}
            </button>

            <button
                onClick={(e) => {
                e.stopPropagation(); // Prevent marking as read
                const metadata = JSON.parse(notification.metadata || '{}');
                rejectFriendRequest(notification.id, notification.type, metadata.sender_id);
                }}
                disabled={isActionLoading(notification.id, 'reject_friend_request')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
                {isActionLoading(notification.id, 'reject_friend_request') ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                'Decline'
                )}
            </button>
            </div>
        );

      case 'tagged_in_post':
        return (
          <div className="flex gap-1 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent marking as read
                acceptTag(notification.id, notification.type, currentIdentity.id);
              }}
              disabled={isActionLoading(notification.id, 'accept_tag')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isActionLoading(notification.id, 'accept_tag') ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Accept Tag'
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent marking as read
                rejectTag(notification.id, notification.type, currentIdentity.id);
              }}
              disabled={isActionLoading(notification.id, 'reject_tag')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isActionLoading(notification.id, 'reject_tag') ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Decline'
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className="relative p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-4.5 bg-red-500 text-white text-xs rounded-full border-2 border-slate-900 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold text-sm">
              Notifications
              {currentIdentity.type === 'page' && (
                <span className="text-xs text-slate-400 ml-1">
                  ({currentIdentity.name})
                </span>
              )}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => {
                  const profileImage = getProfileImage(notification);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 hover:bg-slate-750 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-slate-750/50' : ''
                      }`}
                      onClick={() => {
                        // Only mark as read if it's not an actionable notification
                        if (!notification.is_read && !['friend_request', 'tagged_in_post'].includes(notification.type)) {
                          markAsRead(notification.id, notification.type);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Profile Image or Icon */}
                        <div className="flex-shrink-0">
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notification.is_read ? 'text-slate-300' : 'text-white font-medium'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            {/* Notification type icon */}
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {!notification.is_read && renderActionButtons(notification)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
              <button
                onClick={markAllAsRead}
                className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-1"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;