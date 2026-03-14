// app/api/friends/requests/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { FRIEND_REQUESTS, FRIENDS } from '@/utils/schema/friendsLayer_schema';
import { and, eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const requestId = parseInt(id);
    const { action } = await req.json(); // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Get token from cookies
    const token = req.cookies.get('user_token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;
    const userId = payload.id;

    // Get the friend request
    const [friendRequest] = await db
      .select()
      .from(FRIEND_REQUESTS)
      .where(
        and(
          eq(FRIEND_REQUESTS.id, requestId),
          eq(FRIEND_REQUESTS.receiver_id, userId),
          eq(FRIEND_REQUESTS.status, 'pending')
        )
      )
      .limit(1);

    if (!friendRequest) {
      return NextResponse.json({ message: 'Friend request not found' }, { status: 404 });
    }

    // Update the friend request status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await db
      .update(FRIEND_REQUESTS)
      .set({ 
        status: newStatus,
        responded_at: new Date()
      })
      .where(eq(FRIEND_REQUESTS.id, requestId));

    // If accepted, create friendship
    if (action === 'accept') {
      // Ensure user1_id is always the smaller ID for consistency
      const user1_id = Math.min(friendRequest.sender_id, friendRequest.receiver_id);
      const user2_id = Math.max(friendRequest.sender_id, friendRequest.receiver_id);

      await db.insert(FRIENDS).values({
        user1_id,
        user2_id,
      });
    }

    return NextResponse.json({ 
      message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected' 
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    return NextResponse.json({ message: "Failed to respond to friend request" }, { status: 500 });
  }
}