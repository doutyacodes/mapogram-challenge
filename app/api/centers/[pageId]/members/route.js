// /api/pages/[id]/users/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGE_MEMBERS, PAGE_ROLES, USER_PROFILES, USERS } from '@/utils/schema/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { pageId:id } = params;

   const users = await db
      .select({
        user_id: USERS.id,
        user_name: USERS.name,
        profile_image: USER_PROFILES.profile_pic_url, // ✅ from USER_PROFILES
        role_name: PAGE_ROLES.name,
        is_approved: PAGE_MEMBERS.is_approved,
      })
      .from(PAGE_MEMBERS)
      .innerJoin(USERS, eq(PAGE_MEMBERS.user_id, USERS.id))
      .innerJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id)) // ✅ join added
      .innerJoin(PAGE_ROLES, eq(PAGE_MEMBERS.role_id, PAGE_ROLES.id))
      .where(
        and(
          eq(PAGE_MEMBERS.page_id, parseInt(id)),
          eq(PAGE_MEMBERS.is_approved, true)
        )
      );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching page users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}