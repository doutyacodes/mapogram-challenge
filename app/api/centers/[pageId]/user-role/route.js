import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGE_MEMBERS, PAGE_ROLES } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId'));
    const pageId = parseInt(params.pageId);

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    const userRole = await db
      .select({
        role: PAGE_ROLES
      })
      .from(PAGE_MEMBERS)
      .innerJoin(PAGE_ROLES, eq(PAGE_ROLES.id, PAGE_MEMBERS.role_id))
      .where(
        and(
          eq(PAGE_MEMBERS.page_id, pageId),
          eq(PAGE_MEMBERS.user_id, userId)
        )
      )
      .limit(1);

    if (userRole.length === 0) {
      return NextResponse.json({ role: null });
    }

    return NextResponse.json({ role: userRole[0].role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ message: "Failed to fetch user role" }, { status: 500 });
  }
}