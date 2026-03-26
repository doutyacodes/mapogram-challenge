// /api/follow/[type]/[id]/status/route.js - Check follow status
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_FOLLOWED_PAGES, USER_FOLLOWED_LAYERS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    const { type, id } = await params;
    
    if (!token) {
      return NextResponse.json({ isFollowing: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const entityId = parseInt(id);
    const currentUserId = decoded.id;

    let followRecord;
    
    if (type === 'page') {
      followRecord = await db
        .select()
        .from(USER_FOLLOWED_PAGES)
        .where(and(
          eq(USER_FOLLOWED_PAGES.user_id, currentUserId),
          eq(USER_FOLLOWED_PAGES.page_id, entityId)
        ));
    } else if (type === 'layer') {
      followRecord = await db
        .select()
        .from(USER_FOLLOWED_LAYERS)
        .where(and(
          eq(USER_FOLLOWED_LAYERS.user_id, currentUserId),
          eq(USER_FOLLOWED_LAYERS.layer_id, entityId)
        ));
    }

    return NextResponse.json({ isFollowing: followRecord.length > 0 });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ message: "Failed to check follow status" }, { status: 500 });
  }
}