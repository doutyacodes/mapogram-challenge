import { NextResponse } from "next/server";
import { db } from "@/utils";
import { eq, and } from "drizzle-orm";
import {
  COMMUNITIES,
  COMMUNITY_POST_CATEGORIES,
} from "@/utils/schema/community_schema";
import { POST_CATEGORY_TEMPLATES, USERS, ROLES } from "@/utils/schema/schema";
import { jwtVerify } from "jose";

export async function GET(req) {
  try {
    // 🔐 Auth: get token from cookies
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const userId = decoded.payload.id;

    const { searchParams } = new URL(req.url);
    const communityId = parseInt(searchParams.get("communityId"));

    if (!communityId || !userId) {
      return NextResponse.json(
        { message: "Missing or invalid communityId or userId" },
        { status: 400 }
      );
    }

    // 1. Get the community type ID
    const community = await db
      .select({ community_type_id: COMMUNITIES.community_type_id })
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, communityId))
      .then((res) => res[0]);

    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    // 2. Get the user's role
    const user = await db
      .select({
        role_name: ROLES.name,
      })
      .from(USERS)
      .leftJoin(ROLES, eq(USERS.role_id, ROLES.id))
      .where(eq(USERS.id, userId))
      .then((res) => res[0]);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isOfficialUser =
      user.role_name === "official_user" || user.role_name === "super_admin";

    // 3. Build dynamic WHERE condition
    const baseCondition = eq(
      COMMUNITY_POST_CATEGORIES.community_type_id,
      community.community_type_id
    );

    const finalCondition = isOfficialUser
      ? baseCondition
      : and(baseCondition, eq(POST_CATEGORY_TEMPLATES.is_official, false));

    // 4. Fetch categories with correct condition
    const categories = await db
      .select({
        id: COMMUNITY_POST_CATEGORIES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name,
        post_type: POST_CATEGORY_TEMPLATES.post_type,
        is_official: POST_CATEGORY_TEMPLATES.is_official,
      })
      .from(COMMUNITY_POST_CATEGORIES)
      .innerJoin(
        POST_CATEGORY_TEMPLATES,
        eq(
          COMMUNITY_POST_CATEGORIES.post_category_template_id,
          POST_CATEGORY_TEMPLATES.id
        )
      )
      .where(finalCondition);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch post categories" },
      { status: 500 }
    );
  }
}
