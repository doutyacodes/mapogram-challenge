// app/api/friends/requests/count/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { FRIEND_REQUESTS } from '@/utils/schema/friendsLayer_schema';
import { and, eq, sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';

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

    // Count pending friend requests for the current user
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(FRIEND_REQUESTS)
      .where(
        and(
          eq(FRIEND_REQUESTS.receiver_id, userId),
          eq(FRIEND_REQUESTS.status, 'pending')
        )
      );

    return NextResponse.json({ count: parseInt(result.count) || 0 });
  } catch (error) {
    console.error("Error fetching friend requests count:", error);
    return NextResponse.json({ message: "Failed to fetch friend requests count" }, { status: 500 });
  }
}