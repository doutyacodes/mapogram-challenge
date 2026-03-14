import jwt from 'jsonwebtoken';

/**
 * Generate user token with first-time status
 * @param {Object} user - User object
 * @param {boolean} isFirstTime - Whether user is first time
 * @returns {string} - JWT token
 */
export function generateUserToken(user, isFirstTime = false) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      profile_image_url: user.profile_image_url,
      isFirstTime,
    },
    process.env.JWT_SECRET
  );
}

/**
 * Verify and decode token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token or null if invalid
 */
export function verifyUserToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}