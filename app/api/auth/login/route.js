import { db } from "@/utils";
import { LAYERS, USER_FOLLOWED_LAYERS, USER_FOLLOWED_PAGES, USERS, ROLES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq, sql } from "drizzle-orm";
import { USER_COMMUNITY_FOLLOW } from "@/utils/schema/community_schema";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, rememberMe = false } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: "Username can only contain letters, numbers and underscores" },
        { status: 400 }
      );
    }

    // Find user by username with role information
    const user = await db
      .select({
        id: USERS.id,
        name: USERS.name,
        username: USERS.username,
        password: USERS.password,
        role_id: USERS.role_id,
        role_name: ROLES.name,
        role_display_name: ROLES.display_name,
      })
      .from(USERS)
      .innerJoin(ROLES, eq(USERS.role_id, ROLES.id))
      .where(eq(USERS.username, username.toLowerCase()))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const foundUser = user[0];

    // Verify password
    const isPasswordValid = await compare(password, foundUser.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if user has followed at least one layer
    const [followedLayersCount] = await db
      .select({ count: sql`count(*)` })
      .from(USER_FOLLOWED_LAYERS)
      .innerJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
      .where(
        and(
          eq(USER_FOLLOWED_LAYERS.user_id, foundUser.id),
          eq(LAYERS.is_permanent, false)
        )
      );

    // Check if user has followed at least one community
    const [followedCommunitiesCount] = await db
      .select({ count: sql`count(*)` })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, foundUser.id));

    const hasFollowedLayer = followedLayersCount.count > 0;
    const hasFollowedCommunities = followedCommunitiesCount.count > 0;

    // Generate JWT token with role information
    const tokenPayload = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role_id: foundUser.role_id,
      role_name: foundUser.role_name,
      role_display_name: foundUser.role_display_name,
      hasFollowedLayer,
      hasFollowedCommunities,
    };

    // Set token expiration based on remember me
    const expiresIn = rememberMe ? "30d" : "7d";
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Create response
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: foundUser.id,
          name: foundUser.name,
          username: foundUser.username,
          role: {
            id: foundUser.role_id,
            name: foundUser.role_name,
            display_name: foundUser.role_display_name,
          },
        },
      },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set("user_token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}