import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/utils";
import { USER_DETAILS, USER_ROLES, USER_ENTITIES, USER_COMPANIES } from "@/utils/schema/schema";
import { eq, or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req) {
  try {
    const { name, username, password, mobile, profile_image_url, role, companyData } = await req.json();

    // Validate required fields
    if (!name || !username || !password || !mobile || !role) {
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

    // Validate role exists
    const roleExists = await db
      .select()
      .from(USER_ROLES)
      .where(eq(USER_ROLES.id, role))
      .limit(1)
      .execute();

    if (roleExists.length === 0) {
      return NextResponse.json(
        { message: "Invalid role selected." },
        { status: 400 }
      );
    }
    console.log("role got",role)
    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Prepare user data
    const userData = {
      name,
      username,
      password: hashedPassword,
      mobile,
      is_active: true,
      role_id: Number(role), // Store the role in user_details
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
          role: USER_ROLES.role_name,
          department: USER_ROLES.department,
        })
        .from(USER_DETAILS)
        .innerJoin(USER_ROLES, eq(USER_DETAILS.role_id, USER_ROLES.id)) // 👈 join on role_id
        .where(eq(USER_DETAILS.username, username))
        .limit(1)
        .execute();

      const userId = createdUser[0].id;

      // Insert into USER_ENTITIES (as type 'user')
      await tx.insert(USER_ENTITIES).values({
        user_id: userId,
        type: 'user',
        reference_id: userId, // self-reference
      });

        // Handle company data if exists
      if (companyData) {
        // Convert single company object to array if needed
        const companies = Array.isArray(companyData) ? companyData : [companyData];
        
        for (const company of companies) {
          // Validate company data
          if (!company.name || !company.description) {
            throw new Error("Company name and description are required");
          }

          // Create company
          const companyInsertData = {
            user_id: userId,
            name: company.name,
            description: company.description,
            website_url: company.website_url || null,
            logo_url: company.logo_url || null,
          };

          const [insertResult] = await tx
            .insert(USER_COMPANIES)
            .values(companyInsertData)
            .execute();

          // Get the inserted company
          const createdCompany = await tx
            .select()
            .from(USER_COMPANIES)
            .where(eq(USER_COMPANIES.id, insertResult.insertId))
            .limit(1)
            .execute();

          if (createdCompany.length > 0) {
            // Create user entity for the company
            await tx.insert(USER_ENTITIES).values({
              user_id: userId,
              type: 'company',
              reference_id: createdCompany[0].id,
            });
          }
        }
      }

      return {
        user: createdUser[0],
      };
    });

    // Generate JWT token with user info
    const token = jwt.sign(
      { 
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        profile_image_url: result.user.profile_image_url,
        role: result.user.role,
        isAdmin: true, // Flag for admin users
        isFirstTime: false, // Admins typically don't need first-time flow
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
          role: result.user.role,
        },
        message: `Admin account created successfully`,
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
    console.error("Admin signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}