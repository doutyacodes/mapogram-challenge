// app/api/friends/requests/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USERS, USER_PROFILES } from '@/utils/schema/schema';
import { and, eq, sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { FRIEND_REQUESTS } from '@/utils/schema/friendsLayer_schema';

export async function GET(req) {
  try {
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

    // Get all pending friend requests for the current user
    const requests = await db
      .select({
        id: FRIEND_REQUESTS.id,
        sender_id: FRIEND_REQUESTS.sender_id,
        name: USERS.name,
        profile_pic_url: USER_PROFILES.profile_pic_url,
        requested_at: FRIEND_REQUESTS.requested_at,
      })
      .from(FRIEND_REQUESTS)
      .innerJoin(USERS, eq(FRIEND_REQUESTS.sender_id, USERS.id))
      .leftJoin(USER_PROFILES, eq(USERS.id, USER_PROFILES.user_id))
      .where(
        and(
          eq(FRIEND_REQUESTS.receiver_id, userId),
          eq(FRIEND_REQUESTS.status, 'pending')
        )
      )
      .orderBy(sql`${FRIEND_REQUESTS.requested_at} DESC`);

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json({ message: "Failed to fetch friend requests" }, { status: 500 });
  }
}