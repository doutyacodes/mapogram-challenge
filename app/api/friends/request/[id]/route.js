// /api/friends/request/[id]/route.js - Send friend request
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USERS } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';
import { FRIEND_REQUESTS, USER_NOTIFICATIONS } from '@/utils/schema/friendsLayer_schema';

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

    const receiverId = parseInt(params.id);
    const senderId = decoded.id;

    // Get sender's name for notification
    const sender = await db
      .select({ name: USERS.name })
      .from(USERS)
      .where(eq(USERS.id, senderId));

    // Insert friend request
    await db.insert(FRIEND_REQUESTS).values({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending'
    });

    // Create notification
    await db.insert(USER_NOTIFICATIONS).values({
      user_id: receiverId,
      type: 'friend_request',
      message: `${sender[0].name} sent you a friend request`,
      metadata: JSON.stringify({ sender_id: senderId })
    });

    return NextResponse.json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ message: "Failed to send friend request" }, { status: 500 });
  }
}