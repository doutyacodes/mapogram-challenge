// app/api/communities/[id]/type/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { eq } from 'drizzle-orm';
import { COMMUNITIES, COMMUNITY_TYPES } from '@/utils/schema/community_schema';

export async function GET(request, { params }) {
  try {
    const communityId = parseInt(params.communityId);
    
    const community = await db
      .select({
        type: COMMUNITY_TYPES.name
      })
      .from(COMMUNITIES)
      .innerJoin(
        COMMUNITY_TYPES,
        eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id)
      )
      .where(eq(COMMUNITIES.id, communityId))
      .then(res => res[0]);

    if (!community) {
      return NextResponse.json({ message: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({ community_type: community.type.toLowerCase() });

  } catch (error) {
    console.error('Error fetching community type:', error);
    return NextResponse.json({ error: 'Failed to fetch community type' }, { status: 500 });
  }
}