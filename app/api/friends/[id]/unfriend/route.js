// /api/friends/[id]/unfriend/route.js - Unfriend user
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { FRIENDS } from '@/utils/schema/friendsLayer_schema';
import { eq, and, or } from 'drizzle-orm';

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

    const otherUserId = parseInt(params.id);
    const currentUserId = decoded.id;

    // Delete friendship record
    await db.delete(FRIENDS)
      .where(or(
        and(eq(FRIENDS.user1_id, currentUserId), eq(FRIENDS.user2_id, otherUserId)),
        and(eq(FRIENDS.user1_id, otherUserId), eq(FRIENDS.user2_id, currentUserId))
      ));

    return NextResponse.json({ message: "Unfriended successfully" });
  } catch (error) {
    console.error("Error unfriending user:", error);
    return NextResponse.json({ message: "Failed to unfriend user" }, { status: 500 });
  }
}