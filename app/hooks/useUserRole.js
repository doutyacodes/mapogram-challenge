// hooks/useUserRole.js
import { useState, useEffect } from 'react';

export const useUserRole = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user); // This will include data.user.id
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        setError('Error fetching user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Helper functions to check roles
  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);

  const canCreatePost = () => {
    const allowedRoles = ['page']; // extendable in the future
    return hasAnyRole(allowedRoles);
  };

  // Helper function to check if user owns a post
  const isPostOwner = (postCreatedBy) => {
    return user?.id === postCreatedBy;
  };

  // Get current user ID
  const getCurrentUserId = () => user?.id;

  return {
    user,
    loading,
    error,
    hasRole,
    hasAnyRole,
    canCreatePost,
    canEditPost: () => hasAnyRole(['page']), // update based on your rules
    canDeletePost: () => hasAnyRole(['page']), // update based on your rules
    isPostOwner, // New helper function
    getCurrentUserId, // New helper function
  };
};