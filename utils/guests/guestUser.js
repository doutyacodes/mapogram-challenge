// utils/guestUser.js
import { SignJWT } from 'jose';

export async function createGuestSession() {
  const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload = {
    isGuest: true,
    sessionId,
    hasFollowedLayer: false,
    hasFollowedCommunities: false,
    createdAt: Date.now()
  };

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);

  return { token, sessionId };
}


export const createGuestIdentity = (sessionId) => {
  return {
    type: "guest",
    id: sessionId,
    name: "Guest User",
    username: "guest",
    profile_pic_url: "/user-placeholder.png", // Add a default guest avatar
    bio: "Browsing as guest"
  };
};

// Store guest follows in memory (you might want to use Redis in production)
// const guestFollows = new Map();

// utils/guests/guestUser.js
const GUEST_STORAGE_KEY = 'guest_follows_data';

export const getGuestFollows = (sessionId) => {
  // For server-side calls, return empty data since we can't access sessionStorage
  if (typeof window === 'undefined') {
    return { layers: [], bottomBar: [] };
  }

  try {
    const stored = sessionStorage.getItem(GUEST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { layers: [], bottomBar: [] };
  } catch (error) {
    console.error('Error reading guest follows from sessionStorage:', error);
    return { layers: [], bottomBar: [] };
  }
};

export const setGuestFollows = (sessionId, data) => {
  // For server-side calls, we can't set sessionStorage
  if (typeof window === 'undefined') {
    console.warn('Cannot set guest follows on server-side');
    return;
  }

  try {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving guest follows to sessionStorage:', error);
  }
};

export const clearGuestFollows = (sessionId) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(GUEST_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing guest follows from sessionStorage:', error);
  }
};

// Helper function to check if guest has any follows (client-side only)
export const hasGuestFollows = () => {
  if (typeof window === 'undefined') return false;
  
  const data = getGuestFollows();
  return data.layers && data.layers.length > 0;
};