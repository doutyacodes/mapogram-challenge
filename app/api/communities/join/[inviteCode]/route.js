import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  COMMUNITIES, 
  USER_COMMUNITY_FOLLOW,
  COMMUNITY_TYPE_ROLES 
} from '@/utils/schema/community_schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const inviteCode = params.inviteCode;

    if (!inviteCode) {
      return NextResponse.json({ message: "Invalid invite code" }, { status: 400 });
    }

    // Find community by invite code
    const [community] = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        is_open: COMMUNITIES.is_open,
        community_type_id: COMMUNITIES.community_type_id
      })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.invite_code, inviteCode));

    if (!community) {
      return NextResponse.json({ message: "Invalid invite link" }, { status: 404 });
    }

    // Check if user is already a member or has pending request
    const [existingFollow] = await db
      .select({ status: USER_COMMUNITY_FOLLOW.status })
      .from(USER_COMMUNITY_FOLLOW)
      .where(
        and(
          eq(USER_COMMUNITY_FOLLOW.user_id, userId),
          eq(USER_COMMUNITY_FOLLOW.community_id, community.id)
        )
      );

    if (existingFollow) {
      if (existingFollow.status === 'approved') {
        return NextResponse.json({ message: "You are already a member of this community" }, { status: 409 });
      } else if (existingFollow.status === 'pending') {
        return NextResponse.json({ message: "Your join request is pending approval" }, { status: 409 });
      }
    }

    // Get default member role
    const [memberRole] = await db
      .select({ id: COMMUNITY_TYPE_ROLES.id })
      .from(COMMUNITY_TYPE_ROLES)
      .where(
        and(
          eq(COMMUNITY_TYPE_ROLES.community_type_id, community.community_type_id),
          eq(COMMUNITY_TYPE_ROLES.role_name, 'member')
        )
      );

    const defaultRoleId = memberRole?.id || 1;

    if (community.is_open) {
      // Open community - auto approve
      await db.insert(USER_COMMUNITY_FOLLOW).values({
        user_id: userId,
        community_id: community.id,
        community_role_id: defaultRoleId,
        status: 'approved'
      });

      return NextResponse.json({ 
        message: `Welcome to ${community.name}!`,
        status: 'approved',
        communityId: community.id
      });
    } else {
      // Closed community - create pending request
      await db.insert(USER_COMMUNITY_FOLLOW).values({
        user_id: userId,
        community_id: community.id,
        community_role_id: defaultRoleId,
        status: 'pending'
      });

      return NextResponse.json({ 
        message: `Join request sent to ${community.name} admins`,
        status: 'pending',
        communityId: community.id
      });
    }

  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json({ message: "Failed to join community" }, { status: 500 });
  }
}
