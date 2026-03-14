// api/communities/follow-community
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USER_COMMUNITY_FOLLOW, 
  COMMUNITIES, 
  COMMUNITY_TYPES,
  COMMUNITY_MEMBERS,
  COMMUNITY_ROLES
} from '@/utils/schema/community_schema';
import { and, eq } from 'drizzle-orm';

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

    const { community_id, community_role_id } = await req.json();

    // Check if community exists and get its type
    const community = await db
      .select({
        is_open: COMMUNITIES.is_open,
        community_type_id: COMMUNITIES.community_type_id,
        community_type_name: COMMUNITY_TYPES.name,
      })
      .from(COMMUNITIES)
      .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITIES.id, community_id))
      .limit(1);

    if (!community.length) {
      return NextResponse.json(
        { message: 'Community not found' },
        { status: 404 }
      );
    }

    const communityData = community[0];

    // Check if already following or member
    const existingFollow = await db
      .select()
      .from(USER_COMMUNITY_FOLLOW)
      .where(
        and(
          eq(USER_COMMUNITY_FOLLOW.user_id, userId),
          eq(USER_COMMUNITY_FOLLOW.community_id, community_id)
        )
      )
      .limit(1);

    if (existingFollow.length) {
      return NextResponse.json(
        { message: 'You are already following this community' },
        { status: 400 }
      );
    }

    // Handle different community types
    if (communityData.community_type_name === 'Infrastructure') {
      // For Infrastructure, add to COMMUNITY_MEMBERS table
      
      // Get the default 'Member' role for this community
      const memberRole = await db
        .select()
        .from(COMMUNITY_ROLES)
        .where(
          and(
            eq(COMMUNITY_ROLES.community_id, community_id),
            eq(COMMUNITY_ROLES.name, 'Member')
          )
        )
        .limit(1);

      if (!memberRole.length) {
        return NextResponse.json(
          { message: 'Default member role not found for this community' },
          { status: 400 }
        );
      }

      await db.insert(COMMUNITY_MEMBERS).values({
        community_id,
        user_id: userId,
        role_id: memberRole[0].id,
        is_approved: communityData.is_open, // Auto-approve if open
        added_by: userId,
      });

    } else if (communityData.community_type_name === 'Private Group') {
      // For Private Group, add to USER_COMMUNITY_FOLLOW without role
      await db.insert(USER_COMMUNITY_FOLLOW).values({
        user_id: userId,
        community_id,
        status: communityData.is_open ? 'approved' : 'pending',
        // No community_role_id for Private Group
      });
    } else {
      // For other community types, require a role and add to USER_COMMUNITY_FOLLOW
      if (!community_role_id) {
        return NextResponse.json(
          { message: 'Role selection is required for this community' },
          { status: 400 }
        );
      }

      await db.insert(USER_COMMUNITY_FOLLOW).values({
        user_id: userId,
        community_id,
        community_role_id,
        status: communityData.is_open ? 'approved' : 'pending',
      });
    }

    return NextResponse.json({
      message: communityData.is_open 
        ? 'Successfully joined the community' 
        : 'Join request sent to community admins'
    });

  } catch (error) {
    console.error('Error joining community:', error);
    return NextResponse.json(
      { message: 'Failed to join community' },
      { status: 500 }
    );
  }
}