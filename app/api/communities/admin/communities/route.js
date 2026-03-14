// ============================================
// /api/admin/communities/route.js
// ============================================
import { db } from "@/utils";
import { COMMUNITIES, COMMUNITY_TYPES } from "@/utils/schema/community_schema";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { eq } from "drizzle-orm";

export async function GET(req) {
  try {

    const token = req.cookies.get('user_token')?.value;
    if (!token) {
        return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
        );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all communities created by this admin user
    const communities = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        description: COMMUNITIES.description,
        image_url: COMMUNITIES.image_url,
        community_type_id: COMMUNITIES.community_type_id,
        community_type: COMMUNITY_TYPES.name,
        is_open: COMMUNITIES.is_open,
        created_at: COMMUNITIES.created_at,
      })
      .from(COMMUNITIES)
      .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITIES.created_by, userId));

    return NextResponse.json(
      { communities },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin communities:", error);
    return NextResponse.json(
      { message: "Error fetching communities", details: error.message },
      { status: 500 }
    );
  }
}