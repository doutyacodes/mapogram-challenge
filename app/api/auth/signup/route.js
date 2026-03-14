import { db } from "@/utils";
import { LAYERS, USERS, USERNAMES, USER_FOLLOWED_LAYERS, USER_FOLLOWED_PAGES, USER_PROFILES, ROLES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, eq, sql } from "drizzle-orm";
import { USER_COMMUNITY_FOLLOW, USER_ENTITIES } from "@/utils/schema/community_schema";
import { BASE_IMG_URL } from "@/lib/map/constants";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, username, password, bio, profile_pic_url } = body;

    // Validation
    if (!name || !username || !password) {
      return NextResponse.json(
        { message: "Name, username, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
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

    if (username.length < 3) {
      return NextResponse.json(
        { message: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!profile_pic_url) {
      return NextResponse.json(
        { message: "Profile picture is required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await db
      .select()
      .from(USERNAMES)
      .where(eq(USERNAMES.username, username.trim().toLowerCase()))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { message: "Username already taken" },
        { status: 409 }
      );
    }

    // Get the default "user" role
    const [userRole] = await db
      .select()
      .from(ROLES)
      .where(eq(ROLES.name, 'user'))
      .limit(1);

    if (!userRole) {
      return NextResponse.json(
        { message: "Default user role not found" },
        { status: 500 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await hash(password, saltRounds);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert into USERS with role_id
      await tx.insert(USERS).values({
        name: name.trim(),
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        role_id: userRole.id,
      });

      // 2. Get inserted user with role information
      const [newUser] = await tx
        .select({
          id: USERS.id,
          name: USERS.name,
          username: USERS.username,
          role_id: USERS.role_id,
          role_name: ROLES.name,
          role_display_name: ROLES.display_name,
        })
        .from(USERS)
        .innerJoin(ROLES, eq(USERS.role_id, ROLES.id))
        .where(eq(USERS.username, username.toLowerCase().trim()));

      if (!newUser) {
        throw new Error("User creation failed");
      }

      // 3. Register username in USERNAMES table
      await tx.insert(USERNAMES).values({
        username: username.trim().toLowerCase(),
        entity_type: 'user',
        entity_id: newUser.id,
      });

      // 4. Create USER_PROFILES
      await tx.insert(USER_PROFILES).values({
        user_id: newUser.id,
        bio: bio || null,
        profile_pic_url: BASE_IMG_URL + profile_pic_url,
      });

      // 5. Insert into USER_ENTITIES (as self-referenced 'user')
      await tx.insert(USER_ENTITIES).values({
        user_id: newUser.id,
        type: 'user',
        reference_id: newUser.id,
      });

      return newUser;
    });

    // Outside transaction

    const permanentLayers = await db
      .select({ id: LAYERS.id })
      .from(LAYERS)
      .where(eq(LAYERS.is_permanent, true));

    await db.insert(USER_FOLLOWED_LAYERS).values(
      permanentLayers.map((layer) => ({
        user_id: result.id,
        layer_id: layer.id,
      }))
    );

    const [followedLayersCount] = await db
      .select({ count: sql`count(*)` })
      .from(USER_FOLLOWED_LAYERS)
      .innerJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
      .where(
        and(
          eq(USER_FOLLOWED_LAYERS.user_id, result.id),
          eq(LAYERS.is_permanent, false)
        )
      );

    const hasFollowedLayer = followedLayersCount.count > 0;

    // Check if user has followed any communities
    const [followedCommunitiesCount] = await db
      .select({ count: sql`count(*)` })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, result.id));

    const hasFollowedCommunities = followedCommunitiesCount.count > 0;

    // Generate JWT token with full follow status and role information
    const tokenPayload = {
      id: result.id,
      name: result.name,
      username: result.username,
      role_id: result.role_id,
      role_name: result.role_name,
      role_display_name: result.role_display_name,
      hasFollowedLayer,
      hasFollowedCommunities,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create response
    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: result.id,
          name: result.name,
          username: result.username,
          role: {
            id: result.role_id,
            name: result.role_name,
            display_name: result.role_display_name,
          },
        },
      },
      { status: 201 }
    );

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
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Check if username exists endpoint
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username || username.trim().length < 2) {
      return NextResponse.json(
        { message: "Username too short" },
        { status: 400 }
      );
    }

    // Check both USERS and USERNAMES tables for consistency
    const [existingUsername] = await db
      .select()
      .from(USERNAMES)
      .where(eq(USERNAMES.username, username.trim().toLowerCase()))
      .limit(1);

    return NextResponse.json(
      { exists: existingUsername !== undefined },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { message: "Error checking username", details: error.message },
      { status: 500 }
    );
  }
}