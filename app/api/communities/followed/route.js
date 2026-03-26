import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { COMMUNITIES, USER_COMMUNITY_FOLLOW } from '@/utils/schema/community_schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export async function GET(req) {
  try {
    // Get token from cookies
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({
        success: true,
        communities: []
      });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;
    const userId = payload.id;

    // Fetch user's followed communities
    const followedCommunities = await db
    .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        image_url: COMMUNITIES.image_url,
        community_type_id: COMMUNITIES.community_type_id, // Add this
        followed_at: USER_COMMUNITY_FOLLOW.followed_at,
    })
    .from(COMMUNITIES)
    .innerJoin(
        USER_COMMUNITY_FOLLOW,
        eq(COMMUNITIES.id, USER_COMMUNITY_FOLLOW.community_id)
    )
    .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId));

    return NextResponse.json({
        success: true,
        communities: followedCommunities.map(community => ({
            ...community,
            community_type: { id: community.community_type_id } // Add this structure
        }))
    });

  } catch (error) {
    console.error('Error fetching followed communities:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch followed communities' 
    }, { status: 500 });
  }
}