// app\api\auth\google-callback\route.js
import { NextResponse } from "next/server";
import { db } from "@/utils";
import { AUTH_PROVIDERS, USERS, USER_COMMUNITY_FOLLOW, USER_FOLLOWED_LAYERS, LAYERS } from "@/utils/schema/schema";
import { eq, sql, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { providerAccountId } = await req.json();

    if (!providerAccountId) {
      return NextResponse.json({ message: "Provider account ID required" }, { status: 400 });
    }

    // Get user from auth provider
    const authProvider = await db
      .select()
      .from(AUTH_PROVIDERS)
      .innerJoin(USERS, eq(AUTH_PROVIDERS.user_id, USERS.id))
      .where(eq(AUTH_PROVIDERS.provider_user_id, providerAccountId))
      .limit(1);

    if (authProvider.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = authProvider[0].users;

    // Check follow status
    const [followedLayersCount] = await db
      .select({ count: sql`count(*)` })
      .from(USER_FOLLOWED_LAYERS)
      .innerJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
      .where(
        and(
          eq(USER_FOLLOWED_LAYERS.user_id, user.id),
          eq(LAYERS.is_permanent, false)
        )
      );

    const [followedCommunitiesCount] = await db
      .select({ count: sql`count(*)` })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, user.id));

    const hasFollowedLayer = followedLayersCount.count > 0;
    const hasFollowedCommunities = followedCommunitiesCount.count > 0;

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      name: user.name,
      username: user.username,
      hasFollowedLayer,
      hasFollowedCommunities,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create response
    const response = NextResponse.json({
      message: "Google signin successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
    });

    // Set cookie
    response.cookies.set("user_token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}