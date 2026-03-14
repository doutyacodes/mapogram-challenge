import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGE_MEMBERS } from '@/utils/schema/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const pageId = parseInt(params.pageId);

    const membersCount = await db
      .select({ count: count() })
      .from(PAGE_MEMBERS)
      .where(eq(PAGE_MEMBERS.page_id, pageId));

    return NextResponse.json({ 
      count: membersCount[0]?.count || 0 
    });
  } catch (error) {
    console.error("Error fetching members count:", error);
    return NextResponse.json({ message: "Failed to fetch members count" }, { status: 500 });
  }
}