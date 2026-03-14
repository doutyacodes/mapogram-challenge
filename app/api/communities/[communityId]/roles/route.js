// /api/communities/[communityId]/roles
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { COMMUNITIES, COMMUNITY_TYPES, COMMUNITY_TYPE_ROLES } from '@/utils/schema/community_schema';
import { eq } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { communityId } = params;

    // First get the community type
    const community = await db
      .select({
        community_type_id: COMMUNITIES.community_type_id,
      })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, communityId))
      .limit(1);

    if (!community.length) {
      return NextResponse.json(
        { message: 'Community not found' },
        { status: 404 }
      );
    }

    // Then get all roles for this community type
    const roles = await db
      .select({
        id: COMMUNITY_TYPE_ROLES.id,
        role_name: COMMUNITY_TYPE_ROLES.role_name,
      })
      .from(COMMUNITY_TYPE_ROLES)
      .where(eq(COMMUNITY_TYPE_ROLES.community_type_id, community[0].community_type_id));

    return NextResponse.json({
      roles
    });

  } catch (error) {
    console.error('Error fetching community roles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch community roles' },
      { status: 500 }
    );
  }
}