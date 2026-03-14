import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USER_COMMUNITY_FOLLOW, 
  COMMUNITIES, 
  COMMUNITY_MODERATORS,
  COMMUNITY_TYPE_ROLES 
} from '@/utils/schema/community_schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const requestId = parseInt(params.requestId);
    const { action } = await req.json(); // 'approve' or 'reject'

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    // Get the request details
    const [request] = await db
      .select({
        id: USER_COMMUNITY_FOLLOW.id,
        community_id: USER_COMMUNITY_FOLLOW.community_id,
        user_id: USER_COMMUNITY_FOLLOW.user_id,
        status: USER_COMMUNITY_FOLLOW.status
      })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.id, requestId));

    if (!request || request.status !== 'pending') {
      return NextResponse.json({ message: "Request not found or already processed" }, { status: 404 });
    }

    // Check if current user is authorized to approve/reject
    const [moderator] = await db
      .select()
      .from(COMMUNITY_MODERATORS)
      .where(
        and(
          eq(COMMUNITY_MODERATORS.community_id, request.community_id),
          eq(COMMUNITY_MODERATORS.user_id, userId)
        )
      );

    const [community] = await db
      .select({ created_by: COMMUNITIES.created_by })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, request.community_id));

    const isAuthorized = moderator || (community && community.created_by === userId);

    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized to manage this request" }, { status: 403 });
    }

    if (action === 'approve') {
      // Get default member role for this community type
      const [communityData] = await db
        .select({ community_type_id: COMMUNITIES.community_type_id })
        .from(COMMUNITIES)
        .where(eq(COMMUNITIES.id, request.community_id));

      // Get default member role (assuming role with name 'member')
      const [memberRole] = await db
        .select({ id: COMMUNITY_TYPE_ROLES.id })
        .from(COMMUNITY_TYPE_ROLES)
        .where(
          and(
            eq(COMMUNITY_TYPE_ROLES.community_type_id, communityData.community_type_id),
            eq(COMMUNITY_TYPE_ROLES.role_name, 'member') // Adjust based on your role naming
          )
        );

      // Update status to approved
      await db
        .update(USER_COMMUNITY_FOLLOW)
        .set({ 
          status: 'approved',
          community_role_id: memberRole?.id || 1 // Fallback to default role ID
        })
        .where(eq(USER_COMMUNITY_FOLLOW.id, requestId));

    } else {
      // Delete the request (reject)
      await db
        .delete(USER_COMMUNITY_FOLLOW)
        .where(eq(USER_COMMUNITY_FOLLOW.id, requestId));
    }

    return NextResponse.json({ 
      message: action === 'approve' ? 'Request approved' : 'Request rejected',
      action 
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
  }
}