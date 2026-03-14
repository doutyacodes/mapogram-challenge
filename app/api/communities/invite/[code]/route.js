// app/api/communities/invite/[code]/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { COMMUNITIES, COMMUNITY_TYPES, COMMUNITY_TYPE_ROLES, USER_COMMUNITY_FOLLOW } from '@/utils/schema/community_schema';
import { USER_PROFILES, USERS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

// GET - Verify invite code and get community info
export async function GET(req, { params }) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ message: 'Invite code is required' }, { status: 400 });
    }

    // Find community by invite code
    const community = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        description: COMMUNITIES.description,
        image_url: COMMUNITIES.image_url,
        is_open: COMMUNITIES.is_open,
        created_by: COMMUNITIES.created_by,
        community_type_id: COMMUNITIES.community_type_id,
        community_type_name: COMMUNITY_TYPES.name,
        community_type_description: COMMUNITY_TYPES.description,
      })
      .from(COMMUNITIES)
      .leftJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITIES.invite_code, code))
      .limit(1);

    if (community.length === 0) {
      return NextResponse.json({ message: 'Invalid invite code' }, { status: 404 });
    }

    // Get creator info
    const creator = await db
      .select({
        id: USERS.id,
        username: USERS.name,
        profile_pic_url: USER_PROFILES.profile_pic_url,
      })
      .from(USERS)
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .where(eq(USERS.id, community[0].created_by))
      .limit(1);

    // Check if user is already a member (if authenticated)
    let membershipStatus = null;
    const token = req.cookies.get('user_token')?.value;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        if (userId) {
          const existingMembership = await db
            .select()
            .from(USER_COMMUNITY_FOLLOW)
            .where(and(
              eq(USER_COMMUNITY_FOLLOW.user_id, userId),
              eq(USER_COMMUNITY_FOLLOW.community_id, community[0].id)
            ))
            .limit(1);

          if (existingMembership.length > 0) {
            membershipStatus = existingMembership[0].status;
          }
        }
      } catch (error) {
        // Token invalid or expired, continue without membership check
        console.log('Token verification failed in GET:', error.message);
      }
    }

    const communityInfo = {
      ...community[0],
      creator: creator[0] || null,
    };

    return NextResponse.json({ 
      community: communityInfo,
      membershipStatus: membershipStatus,
      success: true 
    });

  } catch (error) {
    console.error("Invite verification error:", error);
    return NextResponse.json({ message: "Error verifying invite" }, { status: 500 });
  }
}

// POST - Join community via invite link
export async function POST(req, { params }) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ message: 'Invite code is required' }, { status: 400 });
    }

    // Get user from JWT token
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find community by invite code
    const community = await db
      .select()
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.invite_code, code))
      .limit(1);

    if (community.length === 0) {
      return NextResponse.json({ message: 'Invalid invite code' }, { status: 404 });
    }

    const communityData = community[0];

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(USER_COMMUNITY_FOLLOW)
      .where(and(
        eq(USER_COMMUNITY_FOLLOW.user_id, userId),
        eq(USER_COMMUNITY_FOLLOW.community_id, communityData.id)
      ))
      .limit(1);

    if (existingMembership.length > 0) {
      // User is already a member
      const status = existingMembership[0].status;
      if (status === 'approved') {
        return NextResponse.json({ 
          message: "You're already a member of this community!",
          alreadyMember: true,
          status: 'approved'
        }, { status: 200 });
      } else if (status === 'pending') {
        return NextResponse.json({ 
          message: 'Your join request is pending approval', 
          alreadyMember: true,
          status: 'pending'
        }, { status: 200 });
      } else if (status === 'invited') {
        return NextResponse.json({ 
          message: "You've been invited! Waiting for admin approval.", 
          alreadyMember: true,
          status: 'invited'
        }, { status: 200 });
      }
    }

    // Determine status based on community privacy
    // For open communities: approve immediately
    // For private communities via invite link: still needs admin approval
    const status = communityData.is_open ? 'approved' : 'pending';

    // Add user to community
    if (existingMembership.length > 0) {
      // Update existing record
      await db
        .update(USER_COMMUNITY_FOLLOW)
        .set({
          status: status,
          followed_at: new Date(),
        })
        .where(and(
          eq(USER_COMMUNITY_FOLLOW.user_id, userId),
          eq(USER_COMMUNITY_FOLLOW.community_id, communityData.id)
        ));
    } else {
      // Create new membership
      await db
        .insert(USER_COMMUNITY_FOLLOW)
        .values({
          user_id: userId,
          community_id: communityData.id,
          status: status,
          followed_at: new Date(),
        });
    }

    // ✅ Check total communities the user now follows
    const totalFollows = await db
      .select()
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId))
      .execute();

    // ✅ Clean up the old payload to avoid duplicated claims
    const { exp, iat, ...cleanPayload } = decoded;

    // ✅ Add updated community follow status
    const newTokenPayload = {
      ...cleanPayload,
      hasFollowedCommunities: totalFollows.length > 0,
    };

    console.log("cleanPayload", cleanPayload);
    console.log("newTokenPayload", newTokenPayload);

    // Generate updated token
    const newToken = jwt.sign(
      newTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create response with updated token
    const response = NextResponse.json({ 
      message: communityData.is_open 
        ? 'Successfully joined the community!' 
        : 'Join request submitted! Waiting for admin approval.',
      success: true,
      status: status,
      community_id: communityData.id,
      redirect_url: `/communities?community=${communityData.id}`,
      token: newToken
    });

    // Set cookie with new token
    response.cookies.set("user_token", newToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error("Join community error:", error);
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({ message: "Error joining community" }, { status: 500 });
  }
}