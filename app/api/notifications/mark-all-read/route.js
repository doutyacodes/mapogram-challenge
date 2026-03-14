// /api/notifications/mark-all-read/route.js - Mark all notifications as read
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_NOTIFICATIONS } from '@/utils/schema/friendsLayer_schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function PATCH(req) {
  try {
    const token = req.cookies.get("user_token")?.value;
    const { searchParams } = new URL(req.url);
    const currentIdentityType = searchParams.get('identity_type'); // 'user' or 'page'

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const loggedInUserId = decoded.id;

    let updateCondition;

    if (currentIdentityType === 'user') {
      // Mark all notifications for user as read
      updateCondition = and(
        eq(USER_NOTIFICATIONS.user_id, loggedInUserId),
        eq(USER_NOTIFICATIONS.is_read, false)
      );
    } else if (currentIdentityType === 'page') {
      // Mark only page-related notifications as read
      const allowedTypes = ['follow_page', 'tagged_in_post'];
      updateCondition = and(
        eq(USER_NOTIFICATIONS.user_id, loggedInUserId),
        eq(USER_NOTIFICATIONS.is_read, false),
        inArray(USER_NOTIFICATIONS.type, allowedTypes)
      );
    } else {
      return NextResponse.json({ message: "Invalid identity type" }, { status: 400 });
    }

    // Update all matching notifications
    await db
      .update(USER_NOTIFICATIONS)
      .set({ is_read: true })
      .where(updateCondition);

    return NextResponse.json({ message: "All notifications marked as read" });

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ message: "Failed to mark notifications as read" }, { status: 500 });
  }
}