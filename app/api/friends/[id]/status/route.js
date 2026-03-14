// /api/friends/[id]/status/route.js - Check friend status
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { FRIENDS, FRIEND_REQUESTS } from '@/utils/schema/friendsLayer_schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const targetUserId = parseInt(params.id);
    const currentUserId = decoded.id;

    // Check if already friends
    const friendship = await db
      .select()
      .from(FRIENDS)
      .where(or(
        and(eq(FRIENDS.user1_id, currentUserId), eq(FRIENDS.user2_id, targetUserId)),
        and(eq(FRIENDS.user1_id, targetUserId), eq(FRIENDS.user2_id, currentUserId))
      ));

    if (friendship.length > 0) {
      return NextResponse.json({ status: 'friends' });
    }

    // Check for pending requests
    const sentRequest = await db
      .select()
      .from(FRIEND_REQUESTS)
      .where(and(
        eq(FRIEND_REQUESTS.sender_id, currentUserId),
        eq(FRIEND_REQUESTS.receiver_id, targetUserId),
        eq(FRIEND_REQUESTS.status, 'pending')
      ));

    if (sentRequest.length > 0) {
      return NextResponse.json({ status: 'sent' });
    }

    const receivedRequest = await db
      .select()
      .from(FRIEND_REQUESTS)
      .where(and(
        eq(FRIEND_REQUESTS.sender_id, targetUserId),
        eq(FRIEND_REQUESTS.receiver_id, currentUserId),
        eq(FRIEND_REQUESTS.status, 'pending')
      ));

    if (receivedRequest.length > 0) {
      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json({ status: 'none' });
  } catch (error) {
    console.error("Error checking friend status:", error);
    return NextResponse.json({ message: "Failed to check friend status" }, { status: 500 });
  }
}