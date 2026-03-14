// app/api/communities/departments/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { eq } from 'drizzle-orm';
import { DEPARTMENTS, COMMUNITY_DEPARTMENTS } from '@/utils/schema/community_schema';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = parseInt(searchParams.get("communityId"));

    if (!communityId) {
      return NextResponse.json({ message: "Missing communityId" }, { status: 400 });
    }

    const departments = await db
      .select({
        id: DEPARTMENTS.id,
        name: DEPARTMENTS.name,
        description: DEPARTMENTS.description,
      })
      .from(DEPARTMENTS)
      .innerJoin(
        COMMUNITY_DEPARTMENTS,
        eq(DEPARTMENTS.id, COMMUNITY_DEPARTMENTS.department_id)
      )
      .where(eq(COMMUNITY_DEPARTMENTS.community_id, communityId));

    return NextResponse.json({ departments });

  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ message: "Failed to fetch departments" }, { status: 500 });
  }
}