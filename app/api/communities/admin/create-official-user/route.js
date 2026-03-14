// /api/admin/create-official-user/route.js
import { db } from "@/utils";
import { ROLES, USERS, USER_PROFILES } from "@/utils/schema/schema";
import { USER_ENTITIES } from "@/utils/schema/community_schema";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { BASE_IMG_URL } from "@/lib/map/constants";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, username, password, bio } = body;

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

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(USERS)
      .where(eq(USERS.username, username.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "Username already taken" },
        { status: 409 }
      );
    }

    // Get the "official_user" role
    const [officialUserRole] = await db
      .select()
      .from(ROLES)
      .where(eq(ROLES.name, 'official_user'))
      .limit(1);

    if (!officialUserRole) {
      return NextResponse.json(
        { message: "Official user role not found" },
        { status: 500 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await hash(password, saltRounds);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert into USERS with official_user role
      await tx.insert(USERS).values({
        name: name.trim(),
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        role_id: officialUserRole.id, // Set official_user role
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

      // 3. Create USER_PROFILES (no profile picture for official users created by admin)
      await tx.insert(USER_PROFILES).values({
        user_id: newUser.id,
        bio: bio || null,
        profile_pic_url: null, // Can be added later by the user
      });

      // 4. Insert into USER_ENTITIES (as self-referenced 'user')
      await tx.insert(USER_ENTITIES).values({
        user_id: newUser.id,
        type: 'user',
        reference_id: newUser.id,
      });

      return newUser;
    });

    // Return success
    return NextResponse.json(
      {
        message: "Official user created successfully",
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
  } catch (error) {
    console.error("Error creating official user:", error);
    return NextResponse.json(
      { message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}