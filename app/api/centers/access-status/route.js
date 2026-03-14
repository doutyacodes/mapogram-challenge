import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { PAGES, PAGE_MEMBERS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request) {
  try {
    const token = request.cookies.get("user_token")?.value;
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ message: "Page ID is required" }, { status: 400 });
    }

    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.id;
      } catch (jwtError) {
        console.error("JWT verification failed:", jwtError);
      }
    }

    // Get page info
    const page = await db
      .select()
      .from(PAGES)
      .where(eq(PAGES.id, parseInt(pageId)))
      .limit(1);

    if (page.length === 0) {
      return NextResponse.json({ message: "Page not found" }, { status: 404 });
    }

    // If no user is logged in
    if (!userId) {
      return NextResponse.json({
        isMember: false,
        isApproved: false,
        pageName: page[0].name,
        accessStatus: 'not_joined'
      });
    }

    // Check if user is a member
    const membership = await db
      .select()
      .from(PAGE_MEMBERS)
      .where(
        and(
          eq(PAGE_MEMBERS.page_id, parseInt(pageId)),
          eq(PAGE_MEMBERS.user_id, userId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({
        isMember: false,
        isApproved: false,
        pageName: page[0].name,
        accessStatus: 'not_joined'
      });
    }

    return NextResponse.json({
      isMember: true,
      isApproved: membership[0].is_approved,
      pageName: page[0].name,
      accessStatus: membership[0].is_approved ? 'approved' : 'pending'
    });

  } catch (error) {
    console.error("Error checking page access:", error);
    return NextResponse.json({ message: "Failed to check page access" }, { status: 500 });
  }
}