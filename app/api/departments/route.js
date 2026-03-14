import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { DEPARTMENTS } from '@/utils/schema/community_schema';
import { asc } from 'drizzle-orm';

export async function GET(req) {
  try {
    // Fetch all departments for selection
    const departments = await db
      .select({
        id: DEPARTMENTS.id,
        name: DEPARTMENTS.name,
        description: DEPARTMENTS.description,
      })
      .from(DEPARTMENTS)
      .orderBy(asc(DEPARTMENTS.name));

    return NextResponse.json(
      {
        success: true,
        departments,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Get Departments Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}