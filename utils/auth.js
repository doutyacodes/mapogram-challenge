/**
 * Authentication Utilities
 * 
 * This module provides utilities for handling JWT tokens stored in cookies.
 * Save this file as: src/utils/auth.js
 * 
 * Usage:
 * import { getUserFromToken, isAuthenticated, isFirstTimeUser } from '@/utils/auth';
 */
const getUserFromToken = () => {
  try {
    // Get the token from cookies
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_token='))
      ?.split('=')[1];
    
    if (!token) {
      console.log('No user token found in cookies');
      return null;
    }
    
    // Decode JWT token (client-side decoding - payload only)
    // Note: This only decodes the payload, doesn't verify signature
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid token format');
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const decoded = JSON.parse(jsonPayload);
    
    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }
    
    // Return user data from token
    return {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      profile_image_url: decoded.profile_image_url,
      isFirstTime: decoded.isFirstTime,
      iat: decoded.iat, // issued at
      exp: decoded.exp  // expiration
    };
    
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Alternative function if you want to get specific user properties
const getUserProperty = (property) => {
  const user = getUserFromToken();
  return user ? user[property] : null;
};

// Function to check if user is authenticated
const isAuthenticated = () => {
  const user = getUserFromToken();
  return user !== null;
};

// Function to check if token exists (without decoding)
const hasUserToken = () => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('user_token='));
  return !!token;
};

// Function to remove user token (logout)
const removeUserToken = () => {
  document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Function to check if user is first time user
const isFirstTimeUser = () => {
  const user = getUserFromToken();
  return user ? user.isFirstTime : false;
};

// Export functions for use in other modules
export { 
  getUserFromToken, 
  getUserProperty, 
  isAuthenticated, 
  hasUserToken, 
  removeUserToken, 
  isFirstTimeUser 
};

// Example usage:
/*
// Get full user object
const user = getUserFromToken();
console.log('Current user:', user);

// Get specific property
const userId = getUserProperty('id');
const userName = getUserProperty('name');

// Check authentication status
if (isAuthenticated()) {
  console.log('User is logged in');
} else {
  console.log('User is not logged in');
}

// Check if first time user
if (isFirstTimeUser()) {
  // Show onboarding flow
  console.log('Show onboarding for new user');
}
*/