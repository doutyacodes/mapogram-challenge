import { hash } from "bcryptjs";
import { COMMUNITY_MODERATORS, USER_COMMUNITY_FOLLOW, USER_DETAILS, USER_ENTITIES, USER_ROLES } from "@/utils/schema/schema";
import { db } from "@/utils";
import { NextResponse } from "next/server";
import { eq, or, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { name, username, password, mobile, profile_image_url } = await req.json();

    // Validate required fields
    if (!name || !username || !password || !mobile) {
      return NextResponse.json(
        { message: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(USER_DETAILS)
      .where(
        or(
          eq(USER_DETAILS.username, username),
          eq(USER_DETAILS.mobile, mobile)
        )
      )
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      const user = existingUser[0];

      if (user.username === username && user.mobile === mobile) {
        return NextResponse.json(
          { message: "Both username and mobile number are already in use." },
          { status: 400 }
        );
      } else if (user.username === username) {
        return NextResponse.json(
          { message: "Username is already in use." },
          { status: 400 }
        );
      } else if (user.mobile === mobile) {
        return NextResponse.json(
          { message: "Mobile number is already in use." },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Prepare user data
    const userData = {
      name,
      username,
      password: hashedPassword,
      mobile,
      is_active: true,
    };

    // Add profile image URL if provided
    if (profile_image_url) {
      userData.profile_image_url = profile_image_url;
    }

    // Start transaction to create user and corresponding user_entity
    const result = await db.transaction(async (tx) => {
      // Create new user
      const newUser = await tx
        .insert(USER_DETAILS)
        .values(userData)
        .execute();

      // Fetch the newly created user
      const createdUser = await tx
        .select({
          id: USER_DETAILS.id,
          username: USER_DETAILS.username,
          name: USER_DETAILS.name,
          profile_image_url: USER_DETAILS.profile_image_url,
          department: USER_ROLES.department, // ✅ FROM user_roles table
        })
        .from(USER_DETAILS)
        .leftJoin(USER_ROLES, eq(USER_DETAILS.role_id, USER_ROLES.id))
        .where(eq(USER_DETAILS.username, username))
        .limit(1)
        .execute();


      const userId = createdUser[0].id;

      // 🔥 Insert into USER_ENTITIES (as type 'user')
      await tx.insert(USER_ENTITIES).values({
        user_id: userId,
        type: 'user',
        reference_id: userId, // self-reference
      });

      return {
        user: createdUser[0],
      };
    });

    // Check if user has followed any communities (for new users, this will be 0)
    const followedCommunitiesCount = await db
      .select({ count: sql`count(*)` })
      .from(USER_COMMUNITY_FOLLOW)
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, result.user.id))
      .execute();

    const hasFollowedCommunities = followedCommunitiesCount[0].count > 0;

    const moderatorCommunityIds = await db
      .select({ communityId: COMMUNITY_MODERATORS.community_id })
      .from(COMMUNITY_MODERATORS)
      .where(eq(COMMUNITY_MODERATORS.user_id, result.user.id))
      .execute();

    const role = moderatorCommunityIds.length > 0 ? "moderator" : "user";

    // Generate JWT token with additional user info including first-time flag
    const token = jwt.sign(
      { 
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        profile_image_url: result.user.profile_image_url,
        isFirstTime: !hasFollowedCommunities,
        role, //  "user" or "moderator", etc..
        isAdmin: false,
        department: result.user.department,

      },
      JWT_SECRET
    );
    
    const response = NextResponse.json(
      {
        token,
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          profile_image_url: result.user.profile_image_url,
          isFirstTime: !hasFollowedCommunities,
          isAdmin: false,
          department: result.user.department,
        },
        message: `Account created successfully`,
      },
      { status: 201 }
    );

    response.cookies.set("user_token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error("Signup Error:", error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: "Username or mobile number already exists." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}