import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { eq, and } from 'drizzle-orm';
import { COMMUNITY_TYPE_ROLES } from '@/utils/schema/community_schema';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'Community Type ID is required' },
        { status: 400 }
      );
    }

    console.log("iddd", id);

    const roles = await db
      .select({
        id: COMMUNITY_TYPE_ROLES.id,
        role_name: COMMUNITY_TYPE_ROLES.role_name,
      })
      .from(COMMUNITY_TYPE_ROLES)
      .where(
        and(
          eq(COMMUNITY_TYPE_ROLES.community_type_id, parseInt(id)),
          eq(COMMUNITY_TYPE_ROLES.is_official, false) // ✅ exclude official roles
        )
      )
      .execute();

    return NextResponse.json(
      {
        success: true,
        roles: roles,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get Community Roles Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch community roles' },
      { status: 500 }
    );
  }
}
