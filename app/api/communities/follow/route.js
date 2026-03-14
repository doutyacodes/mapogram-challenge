import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { eq, and, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { USER_COMMUNITY_FOLLOW } from '@/utils/schema/community_schema';

export async function POST(req) {
  try {
    const { communities } = await req.json(); // Changed from communityIds to communities
    
    // if (!communities || !Array.isArray(communities) || communities.length < 2) {
    //   return NextResponse.json(
    //     { message: 'Please select at least 2 communities to follow' },
    //     { status: 400 }
    //   );
    // }

    // Validate that each community has both communityId and roleId
    const isValidData = communities.every(c => c.communityId && c.roleId);
    if (!isValidData) {
      return NextResponse.json(
        { message: 'Invalid community or role data' },
        { status: 400 }
      );
    }

    console.log("communities",communities)

    // Get token from cookies
    const token = req.cookies.get("user_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Check if user already follows these communities
    const communityIds = communities.map(c => c.communityId);
    const existingFollows = await db
      .select()
      .from(USER_COMMUNITY_FOLLOW)
      .where(
        and(
          eq(USER_COMMUNITY_FOLLOW.user_id, userId),
          inArray(USER_COMMUNITY_FOLLOW.community_id, communityIds)
        )
      )
      .execute();

    // Prepare follow data for communities not already followed
    const followData = communities
      .filter(community => 
        !existingFollows.some(follow => follow.community_id === community.communityId)
      )
      .map(community => ({
        user_id: userId,
        community_id: community.communityId,
        community_role_id: community.roleId
      }));

    if (followData.length > 0) {
      // Insert new follows
      await db
        .insert(USER_COMMUNITY_FOLLOW)
        .values(followData)
        .execute();
    }

    // ✅ After inserting, check again how many total communities the user now follows
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

    console.log("cleanPayload", cleanPayload)
    console.log("newTokenPayload", newTokenPayload)

    // Generate updated token
    const newToken = jwt.sign(
      newTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send new token in response
    const response = NextResponse.json({
      success: true,
      message: 'Successfully followed communities',
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
    console.error('Follow Communities Error:', error);
    return NextResponse.json(
      { message: 'Failed to follow communities' },
      { status: 500 }
    );
  }
}