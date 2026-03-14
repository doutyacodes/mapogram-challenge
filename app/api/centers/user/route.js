// /api/communities/user/route.js - Get all communities user is a member of
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import {
  PAGES,
  PAGE_PROFILES,
  PAGE_MEMBERS,
  PAGE_ROLES
} from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
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

    // Get all communities where user is a member
    const userCommunities = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        username: PAGES.username,
        bio: PAGE_PROFILES.bio,
        profile_pic_url: PAGE_PROFILES.profile_pic_url,
        role: PAGE_ROLES.name,
        is_approved: PAGE_MEMBERS.is_approved,
        created_at: PAGE_MEMBERS.created_at,
      })
      .from(PAGES)
      .innerJoin(PAGE_MEMBERS, eq(PAGE_MEMBERS.page_id, PAGES.id))
      .innerJoin(PAGE_ROLES, eq(PAGE_ROLES.id, PAGE_MEMBERS.role_id))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .where(eq(PAGE_MEMBERS.user_id, userId))
      .orderBy(PAGE_MEMBERS.created_at);

    // Separate approved and pending communities
    const approvedCommunities = userCommunities.filter(c => c.is_approved);
    const pendingCommunities = userCommunities.filter(c => !c.is_approved);

    // Return approved first, then pending
    const communities = [...approvedCommunities, ...pendingCommunities];

    return NextResponse.json({ communities });
  } catch (error) {
    console.error("Error fetching user communities:", error);
    return NextResponse.json({ message: "Failed to fetch communities" }, { status: 500 });
  }
}