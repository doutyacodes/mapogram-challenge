// /api/page/[id]/admin-status/route.js - Check if user is admin/owner of page
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { PAGE_ADMINS, PAGES } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

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

    const pageId = parseInt(params.id);
    const currentUserId = decoded.id;

    // Check if user is page creator/owner
    const pageOwner = await db
      .select()
      .from(PAGES)
      .where(and(
        eq(PAGES.id, pageId),
        eq(PAGES.user_id, currentUserId)
      ));

    if (pageOwner.length > 0) {
      return NextResponse.json({ isAdmin: true, isOwner: true });
    }

    // Check if user is admin
    const adminRecord = await db
      .select()
      .from(PAGE_ADMINS)
      .where(and(
        eq(PAGE_ADMINS.page_id, pageId),
        eq(PAGE_ADMINS.user_id, currentUserId)
      ));

    if (adminRecord.length > 0) {
      return NextResponse.json({ 
        isAdmin: true, 
        isOwner: adminRecord[0].is_owner 
      });
    }

    return NextResponse.json({ isAdmin: false, isOwner: false });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ message: "Failed to check admin status" }, { status: 500 });
  }
}