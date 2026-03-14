// /api/follow/[type]/[id]/count/route.js - Get followers count
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_FOLLOWED_PAGES, USER_FOLLOWED_LAYERS } from '@/utils/schema/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    // const token = req.cookies.get("user_token")?.value;
    // if (!token) {
    //   return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    // }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // if (!decoded?.id) {
    //   return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    // }

    const { type, id } = params;
    const entityId = parseInt(id);

    let followersCount;

    if (type === 'page') {
      const result = await db
        .select({ count: count() })
        .from(USER_FOLLOWED_PAGES)
        .where(eq(USER_FOLLOWED_PAGES.page_id, entityId));
      followersCount = result[0].count;
    } else if (type === 'layer') {
      const result = await db
        .select({ count: count() })
        .from(USER_FOLLOWED_LAYERS)
        .where(eq(USER_FOLLOWED_LAYERS.layer_id, entityId));
      followersCount = result[0].count;
    }

    return NextResponse.json({ count: followersCount || 0 });
  } catch (error) {
    console.error("Error fetching followers count:", error);
    return NextResponse.json({ message: "Failed to fetch followers count" }, { status: 500 });
  }
}