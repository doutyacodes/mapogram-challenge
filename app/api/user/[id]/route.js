// /api/users/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USERS, PAGE_MEMBERS, PAGE_ROLES, USER_PROFILES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const user = await db
      .select({
        user_id: USERS.id,
        user_name: USERS.name,
        profile_image: USER_PROFILES.profile_pic_url, // ✅ from USER_PROFILES
        role_name: PAGE_ROLES.name,
      })
      .from(USERS)
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id)) // ✅ join added
      .leftJoin(PAGE_MEMBERS, eq(USERS.id, PAGE_MEMBERS.user_id))
      .leftJoin(PAGE_ROLES, eq(PAGE_MEMBERS.role_id, PAGE_ROLES.id))
      .where(eq(USERS.id, parseInt(id)))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}