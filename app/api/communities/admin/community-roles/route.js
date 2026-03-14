// ============================================
// /api/admin/community-roles/route.js
// ============================================
import { db } from "@/utils";
import { 
  COMMUNITIES, 
  COMMUNITY_TYPE_ROLES, 
  COMMUNITY_TYPES 
} from "@/utils/schema/community_schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { message: "Community ID is required" },
        { status: 400 }
      );
    }

    // Get the community's type
    const [community] = await db
      .select({
        community_type_id: COMMUNITIES.community_type_id,
      })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, communityId))
      .limit(1);

    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    // Get all official roles for this community type
    const roles = await db
      .select({
        id: COMMUNITY_TYPE_ROLES.id,
        role_name: COMMUNITY_TYPE_ROLES.role_name,
        is_official: COMMUNITY_TYPE_ROLES.is_official,
      })
      .from(COMMUNITY_TYPE_ROLES)
      .where(eq(COMMUNITY_TYPE_ROLES.community_type_id, community.community_type_id));

    // Filter to only return official roles (is_official = true)
    const officialRoles = roles.filter(role => role.is_official);

    return NextResponse.json(
      { roles: officialRoles },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching community roles:", error);
    return NextResponse.json(
      { message: "Error fetching roles", details: error.message },
      { status: 500 }
    );
  }
}