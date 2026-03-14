// /api/follow/[type]/[id]/route.js - Follow/Unfollow entity
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_FOLLOWED_PAGES, USER_FOLLOWED_LAYERS, PAGES } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';
import { USER_NOTIFICATIONS } from '@/utils/schema/friendsLayer_schema';

export async function POST(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const { type, id } = params;
    const entityId = parseInt(id);
    const currentUserId = decoded.id;

    if (type === 'page') {
      await db.insert(USER_FOLLOWED_PAGES).values({
        user_id: currentUserId,
        page_id: entityId,
      });

      // Get page owner for notification
      const pageOwner = await db
        .select({ user_id: PAGES.user_id, name: PAGES.name })
        .from(PAGES)
        .where(eq(PAGES.id, entityId));

      if (pageOwner.length > 0) {
        await db.insert(USER_NOTIFICATIONS).values({
          user_id: pageOwner[0].user_id,
          type: 'follow_page',
          message: `Someone followed your page "${pageOwner[0].name}"`,
          metadata: JSON.stringify({ follower_id: currentUserId, page_id: entityId })
        });
      }
    } else if (type === 'layer') {
      await db.insert(USER_FOLLOWED_LAYERS).values({
        user_id: currentUserId,
        layer_id: entityId,
      });
    }

    return NextResponse.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Error following entity:", error);
    return NextResponse.json({ message: "Failed to follow" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const { type, id } = params;
    const entityId = parseInt(id);
    const currentUserId = decoded.id;

    if (type === 'page') {
      await db.delete(USER_FOLLOWED_PAGES)
        .where(and(
          eq(USER_FOLLOWED_PAGES.user_id, currentUserId),
          eq(USER_FOLLOWED_PAGES.page_id, entityId)
        ));
    } else if (type === 'layer') {
      await db.delete(USER_FOLLOWED_LAYERS)
        .where(and(
          eq(USER_FOLLOWED_LAYERS.user_id, currentUserId),
          eq(USER_FOLLOWED_LAYERS.layer_id, entityId)
        ));
    }

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing entity:", error);
    return NextResponse.json({ message: "Failed to unfollow" }, { status: 500 });
  }
}