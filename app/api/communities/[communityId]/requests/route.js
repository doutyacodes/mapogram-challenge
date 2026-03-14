import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
    USER_PROFILES,
  USERS, 
} from '@/utils/schema/schema';
import { 
  USER_COMMUNITY_FOLLOW, 
  COMMUNITIES, 
  COMMUNITY_MODERATORS 
} from '@/utils/schema/community_schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const communityId = parseInt(params.communityId);

    if (!communityId) {
      return NextResponse.json({ message: "Community ID required" }, { status: 400 });
    }

    // Check if user is admin/moderator of this community
    const [moderator] = await db
      .select()
      .from(COMMUNITY_MODERATORS)
      .where(
        and(
          eq(COMMUNITY_MODERATORS.community_id, communityId),
          eq(COMMUNITY_MODERATORS.user_id, userId)
        )
      );

    // Also check if user is the community creator
    const [community] = await db
      .select({ created_by: COMMUNITIES.created_by })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, communityId));

    const isAuthorized = moderator || (community && community.created_by === userId);

    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Fetch pending requests with user details
    const requests = await db
    .select({
        id: USER_COMMUNITY_FOLLOW.id,
        user_id: USER_COMMUNITY_FOLLOW.user_id,
        followed_at: USER_COMMUNITY_FOLLOW.followed_at,
        user: {
        id: USERS.id,
        name: USERS.name,
        profile_pic_url: USER_PROFILES.profile_pic_url, // ✅ from USER_PROFILES
        }
    })
    .from(USER_COMMUNITY_FOLLOW)
    .leftJoin(USERS, eq(USER_COMMUNITY_FOLLOW.user_id, USERS.id))
    .leftJoin(USER_PROFILES, eq(USERS.id, USER_PROFILES.user_id)) // ✅ join profile table
    .where(
        and(
        eq(USER_COMMUNITY_FOLLOW.community_id, communityId),
        eq(USER_COMMUNITY_FOLLOW.status, 'pending')
        )
    )
    .orderBy(USER_COMMUNITY_FOLLOW.followed_at);


    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching community requests:", error);
    return NextResponse.json({ message: "Failed to fetch requests" }, { status: 500 });
  }
}