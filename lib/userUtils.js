// /lib/userUtils.js - Utility functions for user status
import { db } from '@/lib/db';
import { USER_COMMUNITY_FOLLOW } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Check if a user has followed any communities
 * @param {number} userId - The user ID to check
 * @returns {Promise<boolean>} - True if user has followed communities
 */
export async function hasUserFollowedCommunities(userId) {
  try {
    const followedCommunitiesCount = await db
      .select({ count: sql`count(*)` })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId))
      .execute();

    return followedCommunitiesCount[0].count > 0;
  } catch (error) {
    console.error('Error checking user community follows:', error);
    return false;
  }
}

/**
 * Get user's followed communities count
 * @param {number} userId - The user ID
 * @returns {Promise<number>} - Number of communities followed
 */
export async function getUserFollowedCommunitiesCount(userId) {
  try {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId))
      .execute();

    return result[0].count;
  } catch (error) {
    console.error('Error getting user followed communities count:', error);
    return 0;
  }
}
