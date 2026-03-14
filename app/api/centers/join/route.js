// /api/communities/join/route.js - Join a community
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { PAGE_MEMBERS, PAGE_ROLES } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req) {
  try {
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const userId = decoded.id;
    const body = await req.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json({ message: "Page ID is required" }, { status: 400 });
    }

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(PAGE_MEMBERS)
      .where(
        and(
          eq(PAGE_MEMBERS.page_id, pageId),
          eq(PAGE_MEMBERS.user_id, userId)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json(
        { message: "You are already a member or have a pending request" },
        { status: 400 }
      );
    }

    // Get the default "Member" role
    const memberRole = await db
      .select()
      .from(PAGE_ROLES)
      .where(eq(PAGE_ROLES.name, 'Member'))
      .limit(1);

    if (memberRole.length === 0) {
      return NextResponse.json(
        { message: "Member role not found" },
        { status: 500 }
      );
    }

    // Create membership with is_approved = false (pending)
    await db.insert(PAGE_MEMBERS).values({
      page_id: pageId,
      user_id: userId,
      role_id: memberRole[0].id,
      is_approved: false,
      added_by: null, // Self-join, not added by anyone
    });

    return NextResponse.json({
      message: "Join request sent successfully. Waiting for admin approval.",
      status: "pending"
    });
  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json({ message: "Failed to join community" }, { status: 500 });
  }
}