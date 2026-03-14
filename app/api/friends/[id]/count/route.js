// /api/friends/[id]/count/route.js - Get friends count
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { FRIENDS } from '@/utils/schema/friendsLayer_schema';
import { eq, or, count } from 'drizzle-orm';

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

    const userId = parseInt(params.id);

    const result = await db
      .select({ count: count() })
      .from(FRIENDS)
      .where(or(
        eq(FRIENDS.user1_id, userId),
        eq(FRIENDS.user2_id, userId)
      ));

    return NextResponse.json({ count: result[0].count || 0 });
  } catch (error) {
    console.error("Error fetching friends count:", error);
    return NextResponse.json({ message: "Failed to fetch friends count" }, { status: 500 });
  }
}
