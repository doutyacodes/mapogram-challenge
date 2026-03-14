// stores\activeIdentityStore.js
import { createGuestIdentity } from '@/utils/guests/guestUser';
import { create } from 'zustand';

export const useIdentityStore = create((set, get) => ({
  loggedInUserId: null,
  currentIdentity: null,
  isIdentityLoading: true,
  isGuest: false,

  setIdentity: (identity) => {
    set({ currentIdentity: identity });
    // Only store in localStorage for registered users
    if (identity.type !== 'guest') {
      localStorage.setItem('currentIdentity', JSON.stringify(identity));
    }
  },

  clearIdentity: () => {
    set({ 
      loggedInUserId: null, 
      currentIdentity: null,
      isIdentityLoading: false,
      isGuest: false
    });
    localStorage.removeItem('currentIdentity');
  },

  setGuestMode: (sessionId) => {
    const guestIdentity = createGuestIdentity(sessionId);
    set({ 
      loggedInUserId: null,
      currentIdentity: guestIdentity,
      isIdentityLoading: false,
      isGuest: true
    });
    // Don't store guest identity in localStorage
    localStorage.removeItem('currentIdentity');
  },

  loadInitialIdentity: async () => {
    set({ isIdentityLoading: true });

    try {
      // Check if we have a stored identity preference (for registered users only)
      const storedIdentity = localStorage.getItem('currentIdentity');
      let apiUrl = '/api/user/profile';

      if (storedIdentity) {
        try {
          const parsed = JSON.parse(storedIdentity);
          if (parsed.type && parsed.id && parsed.type !== 'guest') {
            apiUrl = `/api/user/profile?type=${parsed.type}&id=${parsed.id}`;
          }
        } catch {
          localStorage.removeItem('currentIdentity');
        }
      }

      // Fetch the profile data
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');

      // Check if user is guest
      if (data.isGuest) {
        set({
          loggedInUserId: null,
          currentIdentity: createGuestIdentity(data.sessionId),
          isIdentityLoading: false,
          isGuest: true
        });
        return;
      }

      // Set both logged in user ID and current identity for registered users
      set({
        loggedInUserId: data.loggedInUserId,
        currentIdentity: data.identity,
        isIdentityLoading: false,
        isGuest: false
      });
      
      // Store the current identity for persistence
      localStorage.setItem('currentIdentity', JSON.stringify(data.identity));
    } catch (error) {
      console.error('Failed to load identity:', error);
      
      // Try to fallback to user profile without query params
      try {
        const fallbackResponse = await fetch('/api/user/profile');
        const fallbackData = await fallbackResponse.json();

        if (fallbackResponse.ok && fallbackData.identity) {
          if (fallbackData.isGuest) {
            set({ 
              loggedInUserId: null,
              currentIdentity: createGuestIdentity(fallbackData.sessionId),
              isIdentityLoading: false,
              isGuest: true
            });
          } else {
            set({ 
              loggedInUserId: fallbackData.loggedInUserId,
              currentIdentity: fallbackData.identity,
              isIdentityLoading: false,
              isGuest: false
            });
            localStorage.setItem('currentIdentity', JSON.stringify(fallbackData.identity));
          }
        } else {
          throw new Error('Fallback also failed');
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
        set({ 
          loggedInUserId: null,
          currentIdentity: null,
          isIdentityLoading: false,
          isGuest: false
        });
        localStorage.removeItem('currentIdentity');
      }
    }
  },

  // Helper function to switch to a different identity (user or page) - only for registered users
  switchIdentity: async (type, id) => {
    const current = get();
    
    // Guests cannot switch identity
    if (current.isGuest) {
      throw new Error('Guests cannot switch identity');
    }

    // Prevent re-setting the same identity
    if (current.currentIdentity && current.currentIdentity.type === type && current.currentIdentity.id === id) {
      console.log('Already using this identity, skipping switch');
      return current.currentIdentity;
    }

    try {
      const response = await fetch(`/api/user/profile?type=${type}&id=${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to switch identity');
      }

      set({ currentIdentity: data.identity });
      localStorage.setItem('currentIdentity', JSON.stringify(data.identity));

      return data.identity;
    } catch (error) {
      console.error('Failed to switch identity:', error);
      throw error;
    }
  },

  // Helper to get current logged in user ID
  getLoggedInUserId: () => {
    return get().loggedInUserId;
  },

  // Helper to check if user is guest
  isGuestUser: () => {
    return get().isGuest;
  }
}));