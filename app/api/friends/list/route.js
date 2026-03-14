// /api/friends/list/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USERS, USER_PROFILES } from '@/utils/schema/schema';
import { FRIENDS } from '@/utils/schema/friendsLayer_schema';

import { eq, or, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || decoded.id;

    // Verify the requesting user has permission to view this friends list
    // For now, only allow users to view their own friends list
    // You can modify this logic based on your privacy requirements
    if (parseInt(userId) !== decoded.id) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Fetch friends list
    // Since friendship is bidirectional, we need to check both user1_id and user2_id
    const friendsData = await db
      .select({
        friendId: or(
          eq(FRIENDS.user1_id, parseInt(userId)),
          eq(FRIENDS.user2_id, parseInt(userId))
        ),
        user1_id: FRIENDS.user1_id,
        user2_id: FRIENDS.user2_id,
        became_friends_at: FRIENDS.became_friends_at,
        // Friend's user data
        id: USERS.id,
        name: USERS.name,
        email: USERS.email,
        role: USERS.role,
        // Friend's profile data
        bio: USER_PROFILES.bio,
        profile_pic_url: USER_PROFILES.profile_pic_url,
      })
      .from(FRIENDS)
      .innerJoin(
        USERS,
        or(
          and(eq(FRIENDS.user1_id, parseInt(userId)), eq(USERS.id, FRIENDS.user2_id)),
          and(eq(FRIENDS.user2_id, parseInt(userId)), eq(USERS.id, FRIENDS.user1_id))
        )
      )
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .where(
        or(
          eq(FRIENDS.user1_id, parseInt(userId)),
          eq(FRIENDS.user2_id, parseInt(userId))
        )
      );

    // Format the response to only include friend data
    const friends = friendsData.map(friend => ({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      role: friend.role,
      bio: friend.bio,
      profile_pic_url: friend.profile_pic_url,
      became_friends_at: friend.became_friends_at,
    }));

    return NextResponse.json({ 
      friends,
      total: friends.length 
    });

  } catch (error) {
    console.error("Error fetching friends list:", error);
    return NextResponse.json({ message: "Failed to fetch friends list" }, { status: 500 });
  }
}