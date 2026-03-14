// ============================================
// /api/admin/add-user-to-community/route.js
// ============================================
import { db } from "@/utils";
import { USER_COMMUNITY_FOLLOW } from "@/utils/schema/community_schema";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import jwt from 'jsonwebtoken';


export async function POST(req) {
  try {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, communityId, roleId } = body;

    // Validation
    if (!userId || !communityId || !roleId) {
      return NextResponse.json(
        { message: "User ID, Community ID, and Role ID are required" },
        { status: 400 }
      );
    }

    // Check if user is already in the community
    const existingFollow = await db
      .select()
      .from(USER_COMMUNITY_FOLLOW)
      .where(
        and(
          eq(USER_COMMUNITY_FOLLOW.user_id, userId),
          eq(USER_COMMUNITY_FOLLOW.community_id, communityId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return NextResponse.json(
        { message: "User is already in this community" },
        { status: 409 }
      );
    }

    // Add user to community with the specified role
    await db.insert(USER_COMMUNITY_FOLLOW).values({
      user_id: userId,
      community_id: communityId,
      community_role_id: roleId,
      status: 'approved', // Official users are auto-approved
      invited_by: null, // Admin-assigned, not invited
    });

    return NextResponse.json(
      {
        message: "User successfully added to community",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding user to community:", error);
    return NextResponse.json(
      { message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}