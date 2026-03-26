// /api/page/[id]/route.js - Get page data
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { PAGES, PAGE_PROFILES, PAGE_TYPES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.id;
      } catch (e) {
        console.error("Token verification failed:", e);
      }
    }

    const { id } = await params;
    const pageId = parseInt(id);

    // Tourism Mock Bypass
    if (pageId === 999991 || pageId === 999992) {
      return NextResponse.json({
        id: pageId,
        name: pageId === 999991 ? "Kerala Tourism" : "Karnataka Tourism",
        username: pageId === 999991 ? "keralatourism" : "karnatakatourism",
        profilePic: "https://www.keralatourism.org/images/logo/logo.png",
        bio: "Official tourism page",
        pageType: "Tourism",
      });
    }

    const pageData = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        username: PAGES.username,
        profilePic: PAGE_PROFILES.profile_pic_url,
        bio: PAGE_PROFILES.bio,
        pageType: PAGE_TYPES.name,
      })
      .from(PAGES)
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .leftJoin(PAGE_TYPES, eq(PAGE_TYPES.id, PAGES.page_type_id))
      .where(eq(PAGES.id, pageId));

    if (pageData.length === 0) {
      return NextResponse.json({ message: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(pageData[0]);
  } catch (error) {
    console.error("Error fetching page data - [id] route:", error);
    return NextResponse.json({ message: "Failed to fetch page data", error: error.message }, { status: 500 });
  }
}