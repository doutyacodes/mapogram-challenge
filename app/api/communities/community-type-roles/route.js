// app/api/community-type-roles/route.js
import { db } from '@/utils';
import { COMMUNITY_TYPE_ROLES, COMMUNITY_TYPES } from '@/utils/schema/community_schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const communityTypeId = searchParams.get('communityTypeId');

    if (!communityTypeId) {
      return NextResponse.json({ message: 'Community type ID is required' }, { status: 400 });
    }

    // Get roles for specific community type
    const roles = await db
      .select({
        id: COMMUNITY_TYPE_ROLES.id,
        role_name: COMMUNITY_TYPE_ROLES.role_name,
        community_type_id: COMMUNITY_TYPE_ROLES.community_type_id,
        community_type: {
          id: COMMUNITY_TYPES.id,
          name: COMMUNITY_TYPES.name,
        }
      })
      .from(COMMUNITY_TYPE_ROLES)
      .leftJoin(COMMUNITY_TYPES, eq(COMMUNITY_TYPE_ROLES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITY_TYPE_ROLES.community_type_id, parseInt(communityTypeId)));

    return NextResponse.json({
      roles,
      success: true 
    });

  } catch (error) {
    console.error("Community Type Roles API Error:", error);
    return NextResponse.json(
      { message: "Error fetching community type roles" }, 
      { status: 500 }
    );
  }
}