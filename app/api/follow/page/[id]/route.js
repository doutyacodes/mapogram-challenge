import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { PAGES, USER_FOLLOWED_PAGES, USERS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';
import { USER_NOTIFICATIONS } from '@/utils/schema/friendsLayer_schema';

// Follow a page
export async function POST(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const { id: pageId } = params;

    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(USER_FOLLOWED_PAGES)
      .where(and(
        eq(USER_FOLLOWED_PAGES.user_id, userId),
        eq(USER_FOLLOWED_PAGES.page_id, parseInt(pageId))
      ));

    if (existingFollow) {
      return NextResponse.json({ message: "Already following this page" }, { status: 400 });
    }

    // Follow the page
    await db.insert(USER_FOLLOWED_PAGES).values({
      user_id: userId,
      page_id: parseInt(pageId)
    });

    // ✅ Fetch page and user details for notification
    const [page] = await db.select().from(PAGES).where(eq(PAGES.id, parseInt(pageId)));
    const [follower] = await db.select().from(USERS).where(eq(USERS.id, userId));

    if (page && follower) {
      await db.insert(USER_NOTIFICATIONS).values({
        user_id: page.user_id, // Page owner's user id
        type: 'follow_page',
        message: `${follower.name || follower.username} followed your page "${page.name}"`,
        metadata: JSON.stringify({
          follower_id: userId,
          page_id: page.id
        }),
        created_at: new Date()
      });
    }

    return NextResponse.json({ message: "Successfully followed page" });

  } catch (error) {
    console.error("Error following page:", error);
    return NextResponse.json({ message: "Failed to follow page" }, { status: 500 });
  }
}
// Unfollow a page
export async function DELETE(req, { params }) {
  console.log("unfollowa page")
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const { id: pageId } = params;

    await db
      .delete(USER_FOLLOWED_PAGES)
      .where(and(
        eq(USER_FOLLOWED_PAGES.user_id, userId),
        eq(USER_FOLLOWED_PAGES.page_id, parseInt(pageId))
      ));

    return NextResponse.json({ message: "Successfully unfollowed page" });
  } catch (error) {
    console.error("Error unfollowing page:", error);
    return NextResponse.json({ message: "Failed to unfollow page" }, { status: 500 });
  }
}