// hooks/useNotifications.js - Custom hook for managing notifications
import { useState, useEffect, useCallback } from 'react';

export const useNotifications = (currentIdentity, loggedInUserId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!currentIdentity?.type || !currentIdentity?.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/notifications?identity_type=${currentIdentity.type}&identity_id=${currentIdentity.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentIdentity?.type, currentIdentity?.id]);

  // Handle notification actions
  const handleAction = useCallback(async (action, notificationId, notificationType, metadata = {}) => {
    const loadingKey = `${notificationId}_${action}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const response = await fetch('/api/notifications/actions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notification_id: notificationId,
          notification_type: notificationType,
          metadata
        }),
      });

      if (response.ok) {
        // Refresh notifications after successful action
        await fetchNotifications();
        return true;
      } else {
        console.error('Failed to perform action');
        return false;
      }
    } catch (error) {
      console.error('Error performing action:', error);
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback((notificationId, notificationType) => {
    return handleAction('mark_read', notificationId, notificationType);
  }, [handleAction]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentIdentity?.type) return;

    try {
      const response = await fetch(
        `/api/notifications/mark-all-read?identity_type=${currentIdentity.type}`, 
        { method: 'PATCH' }
      );
      
      if (response.ok) {
        await fetchNotifications();
        return true;
      } else {
        console.error('Failed to mark all as read');
        return false;
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }, [currentIdentity?.type, fetchNotifications]);

  // Accept friend request
  const acceptFriendRequest = useCallback((notificationId, notificationType, senderId) => {
    return handleAction('accept_friend_request', notificationId, notificationType, { sender_id: senderId });
  }, [handleAction]);

  // Reject friend request
  const rejectFriendRequest = useCallback((notificationId, notificationType, senderId) => {
    return handleAction('reject_friend_request', notificationId, notificationType, { sender_id: senderId });
  }, [handleAction]);

  // Accept tag
  const acceptTag = useCallback((notificationId, notificationType, taggedId) => {
    return handleAction('accept_tag', notificationId, notificationType, { tagged_id: taggedId });
  }, [handleAction]);

  // Reject tag
  const rejectTag = useCallback((notificationId, notificationType, taggedId) => {
    return handleAction('reject_tag', notificationId, notificationType, { tagged_id: taggedId });
  }, [handleAction]);

  // Filter notifications based on current identity type
  const filteredNotifications = currentIdentity?.type === 'page' 
    ? notifications.filter(n => ['follow_page', 'tagged_in_post'].includes(n.type))
    : notifications;

  // Auto-fetch notifications when identity changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling for new notifications (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications: filteredNotifications,
    unreadCount,
    loading,
    actionLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    acceptFriendRequest,
    rejectFriendRequest,
    acceptTag,
    rejectTag,
    // Helper function to check if action is loading
    isActionLoading: (notificationId, action) => actionLoading[`${notificationId}_${action}`] || false
  };
};