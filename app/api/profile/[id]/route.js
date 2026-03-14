// /api/profile/[id]/route.js - Get user profile data
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USERS, USER_PROFILES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

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

    const userProfile = await db
      .select({
        id: USERS.id,
        name: USERS.name,
        username: USERS.username,
        profilePic: USER_PROFILES.profile_pic_url,
        bio: USER_PROFILES.bio,
      })
      .from(USERS)
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .where(eq(USERS.id, userId));

    if (userProfile.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userProfile[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ message: "Failed to fetch user profile" }, { status: 500 });
  }
}
