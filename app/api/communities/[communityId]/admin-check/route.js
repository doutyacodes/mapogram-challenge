import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
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

    // Check if user is the community creator
    const [community] = await db
      .select({ 
        created_by: COMMUNITIES.created_by,
        invite_code: COMMUNITIES.invite_code,
        name: COMMUNITIES.name 
      })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, communityId));

    if (!community) {
      return NextResponse.json({ message: "Community not found" }, { status: 404 });
    }

    const isCreator = community.created_by === userId;

    // Check if user is a moderator
    const [moderator] = await db
      .select({ role: COMMUNITY_MODERATORS.role })
      .from(COMMUNITY_MODERATORS)
      .where(
        and(
          eq(COMMUNITY_MODERATORS.community_id, communityId),
          eq(COMMUNITY_MODERATORS.user_id, userId)
        )
      );

    const isAdmin = isCreator || (moderator && moderator.role === 'admin');
    const isModerator = moderator && ['admin', 'moderator'].includes(moderator.role);

    return NextResponse.json({ 
      isAdmin,
      isModerator,
      isCreator,
      canManageRequests: isAdmin || isModerator,
      inviteCode: community.invite_code,
      communityName: community.name
    });

  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ message: "Failed to check admin status" }, { status: 500 });
  }
}
