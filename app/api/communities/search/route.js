// api/communities/search
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { COMMUNITIES, COMMUNITY_MEMBERS, COMMUNITY_TYPES } from '@/utils/schema/community_schema';
import { like, eq, count } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { message: 'Search query is required' },
        { status: 400 }
      );
    }

  const communities = await db
    .select({
      id: COMMUNITIES.id,
      name: COMMUNITIES.name,
      description: COMMUNITIES.description,
      image_url: COMMUNITIES.image_url,
      is_open: COMMUNITIES.is_open,
      community_type_name: COMMUNITY_TYPES.name,
      member_count: count(COMMUNITY_MEMBERS.id).as('member_count'),
    })
    .from(COMMUNITIES)
    .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
    .leftJoin(COMMUNITY_MEMBERS, eq(COMMUNITIES.id, COMMUNITY_MEMBERS.community_id))
    .where(like(COMMUNITIES.name, `%${query}%`))
    .groupBy(
      COMMUNITIES.id,
      COMMUNITIES.name,
      COMMUNITIES.description,
      COMMUNITIES.image_url,
      COMMUNITIES.is_open,
      COMMUNITY_TYPES.name
    )
    .limit(20);


    return NextResponse.json({
      communities
    });

  } catch (error) {
    console.error('Error searching communities:', error);
    return NextResponse.json(
      { message: 'Failed to search communities' },
      { status: 500 }
    );
  }
}