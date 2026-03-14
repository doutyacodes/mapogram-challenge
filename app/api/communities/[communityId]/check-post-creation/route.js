import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { COMMUNITIES, COMMUNITY_TYPES } from '@/utils/schema/community_schema';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { communityId: id } = params;

    // Fetch community with type information
    const community = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        description: COMMUNITIES.description,
        image_url: COMMUNITIES.image_url,
        community_type_id: COMMUNITIES.community_type_id,
        community_type_name: COMMUNITY_TYPES.name,
        is_open: COMMUNITIES.is_open,
        invite_code: COMMUNITIES.invite_code,
        created_by: COMMUNITIES.created_by,
        created_at: COMMUNITIES.created_at,
        is_user_accessible: COMMUNITY_TYPES.is_user_accessible,
        is_official_only: COMMUNITY_TYPES.is_official_only,
      })
      .from(COMMUNITIES)
      .leftJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITIES.id, parseInt(id)))
      .limit(1);

    if (community.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Community not found' 
      }, { status: 404 });
    }

    const communityData = community[0];

    // Check if user can create posts
    const allowsPostCreation = communityData.community_type_name?.toLowerCase() === "infrastructure";

    return NextResponse.json({
      success: true,
      allowsPostCreation,
      community: communityData
    });

  } catch (error) {
    console.error('Error fetching community data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch community data' 
    }, { status: 500 });
  }
}