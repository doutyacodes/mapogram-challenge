import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USER_COMMUNITY_FOLLOW, 
  COMMUNITIES, 
  COMMUNITY_MODERATORS 
} from '@/utils/schema/community_schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    // Get user's community memberships
    const memberships = await db
      .select({
        communityId: USER_COMMUNITY_FOLLOW.community_id,
        status: USER_COMMUNITY_FOLLOW.status,
        community: {
          id: COMMUNITIES.id,
          name: COMMUNITIES.name,
          image_url: COMMUNITIES.image_url,
          invite_code: COMMUNITIES.invite_code,
          created_by: COMMUNITIES.created_by
        }
      })
      .from(USER_COMMUNITY_FOLLOW)
      .leftJoin(COMMUNITIES, eq(USER_COMMUNITY_FOLLOW.community_id, COMMUNITIES.id))
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId));

    // Get user's moderator roles
    const moderatorRoles = await db
      .select({
        communityId: COMMUNITY_MODERATORS.community_id,
        role: COMMUNITY_MODERATORS.role
      })
      .from(COMMUNITY_MODERATORS)
      .where(eq(COMMUNITY_MODERATORS.user_id, userId));

    // Combine the data
    const communityStatus = memberships.map(membership => {
      const moderatorRole = moderatorRoles.find(role => role.communityId === membership.communityId);
      const isCreator = membership.community.created_by === userId;
      
      return {
        ...membership.community,
        membershipStatus: membership.status,
        isCreator,
        moderatorRole: moderatorRole?.role || null,
        isAdmin: isCreator || moderatorRole?.role === 'admin',
        canManageRequests: isCreator || ['admin', 'moderator'].includes(moderatorRole?.role)
      };
    });

    return NextResponse.json({ communities: communityStatus });

  } catch (error) {
    console.error("Error fetching user community status:", error);
    return NextResponse.json({ message: "Failed to fetch community status" }, { status: 500 });
  }
}