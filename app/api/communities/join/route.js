
// /api/communities/join/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_COMMUNITY_FOLLOW, COMMUNITIES, COMMUNITY_TYPES, COMMUNITY_TYPE_ROLES } from '@/utils/schema/community_schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req) {
  try {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { communityId, roleId } = await req.json();

    if (!communityId) {
      return NextResponse.json(
        { message: 'Community ID is required' },
        { status: 400 }
      );
    }

    // Check if user is already following this community
    const existingFollow = await db
      .select()
      .from(USER_COMMUNITY_FOLLOW)
      .where(
        and(
          eq(USER_COMMUNITY_FOLLOW.user_id, userId),
          eq(USER_COMMUNITY_FOLLOW.community_id, communityId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return NextResponse.json(
        { message: 'You are already following this community' },
        { status: 400 }
      );
    }

    // Get community details
    const community = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        is_open: COMMUNITIES.is_open,
        community_type_id: COMMUNITIES.community_type_id
      })
      .from(COMMUNITIES)
      .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITIES.id, communityId))
      .limit(1);

    if (!community.length) {
      return NextResponse.json(
        { message: 'Community not found' },
        { status: 404 }
      );
    }

    const communityData = community[0];

    // For Private Group type, use default role (first available role)
    let finalRoleId = roleId;
    if (!roleId) {
      const defaultRole = await db
        .select({ id: COMMUNITY_TYPE_ROLES.id })
        .from(COMMUNITY_TYPE_ROLES)
        .where(eq(COMMUNITY_TYPE_ROLES.community_type_id, communityData.community_type_id))
        .limit(1);

      if (defaultRole.length > 0) {
        finalRoleId = defaultRole[0].id;
      }
    }

    // Determine status based on community type
    const status = communityData.is_open ? 'approved' : 'pending';

    // Insert the follow record
    await db.insert(USER_COMMUNITY_FOLLOW).values({
      user_id: userId,
      community_id: communityId,
      community_role_id: finalRoleId,
      status: status,
      followed_at: new Date()
    });

    return NextResponse.json({
      message: communityData.is_open 
        ? 'Successfully joined the community!' 
        : 'Join request sent! Please wait for admin approval.',
      status: status
    });

  } catch (error) {
    console.error('Error joining community:', error);
    return NextResponse.json(
      { message: 'Failed to join community' },
      { status: 500 }
    );
  }
}
