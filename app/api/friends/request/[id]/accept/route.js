// /api/friends/request/[id]/accept/route.js - Accept friend request
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USERS } from '@/utils/schema/schema';
import { FRIEND_REQUESTS, FRIENDS, USER_NOTIFICATIONS } from '@/utils/schema/friendsLayer_schema';

import { eq, and } from 'drizzle-orm';

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

    const senderId = parseInt(params.id);
    const receiverId = decoded.id;

    // Get receiver's name for notification
    const receiver = await db
      .select({ name: USERS.name })
      .from(USERS)
      .where(eq(USERS.id, receiverId));

    // Update friend request status
    await db.update(FRIEND_REQUESTS)
      .set({ 
        status: 'accepted',
        responded_at: new Date()
      })
      .where(and(
        eq(FRIEND_REQUESTS.sender_id, senderId),
        eq(FRIEND_REQUESTS.receiver_id, receiverId)
      ));

    // Create friendship record (ensure consistent ordering)
    const user1_id = Math.min(senderId, receiverId);
    const user2_id = Math.max(senderId, receiverId);
    
    await db.insert(FRIENDS).values({
      user1_id,
      user2_id
    });

    // Create notification for sender
    await db.insert(USER_NOTIFICATIONS).values({
      user_id: senderId,
      type: 'friend_accept',
      message: `${receiver[0].name} accepted your friend request`,
      metadata: JSON.stringify({ accepter_id: receiverId })
    });

    return NextResponse.json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return NextResponse.json({ message: "Failed to accept friend request" }, { status: 500 });
  }
}