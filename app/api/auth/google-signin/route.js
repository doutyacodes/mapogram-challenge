// app/api/auth/google-signin/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/utils";
import { AUTH_PROVIDERS, USERS, USER_FOLLOWED_LAYERS, LAYERS, ROLES } from "@/utils/schema/schema";
import { USER_COMMUNITY_FOLLOW } from "@/utils/schema/community_schema";
import { eq, sql, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import GoogleProvider from "next-auth/providers/google";

// Use the same authOptions as your [...nextauth]/route.js
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

export async function GET(req) {
  try {
    console.log("Google signin handler called");
    
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    
    if (!session?.user?.email) {
      console.log("No session found, redirecting to signup");
      return NextResponse.redirect(new URL('/auth/signup', req.url));
    }

    // Find user by Google account
    // We need to get the providerAccountId, but it's not directly available in session
    // So we'll find the user by email and name combination
    const authProviders = await db
      .select({
        'users.id': USERS.id,
        'users.name': USERS.name,
        'users.username': USERS.username,
        'users.role_id': USERS.role_id,
        'roles.name': ROLES.name,
        'roles.display_name': ROLES.display_name,
      })
      .from(AUTH_PROVIDERS)
      .innerJoin(USERS, eq(AUTH_PROVIDERS.user_id, USERS.id))
      .innerJoin(ROLES, eq(USERS.role_id, ROLES.id))
      .where(eq(AUTH_PROVIDERS.provider, 'google'));

    let user = null;
    for (const provider of authProviders) {
      // Match by name and email domain (since we generated username from email)
      const emailUsername = session.user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
      if (provider['users.username'].startsWith(emailUsername) && 
          provider['users.name'] === session.user.name) {
        user = {
          id: provider['users.id'],
          name: provider['users.name'],
          username: provider['users.username'],
          role_id: provider['users.role_id'],
          role_name: provider['roles.name'],
          role_display_name: provider['roles.display_name'],
        };
        break;
      }
    }

    if (!user) {
      console.log("User not found in database");
      return NextResponse.redirect(new URL('/auth/signup?error=user_not_found', req.url));
    }

    console.log("User found:", user.username);

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

    // Generate your custom JWT token
    const tokenPayload = {
      id: user.id,
      name: user.name,
      username: user.username,
      role_id: user.role_id,
      role_name: user.role_name,
      role_display_name: user.role_display_name,
      hasFollowedLayer,
      hasFollowedCommunities,
      isGuest: false, // Important: mark as NOT guest
      isAdmin: false, // Add if you have admin logic
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Token generated, redirecting to layers");

    // Determine redirect URL based on onboarding status
    // let redirectUrl = '/layers/6'; // Default redirect
    // if (!hasFollowedLayer) {
    //   redirectUrl = '/onboarding/follow';
    // } else if (!hasFollowedCommunities) {
    //   redirectUrl = '/communities/select';
    // }

    const response = NextResponse.redirect(new URL('/', req.url));

    // Set your custom cookie (overwriting any guest token)
    response.cookies.set("user_token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear NextAuth session cookie if you don't need it
    response.cookies.set("next-auth.session-token", "", {
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Google signin error:", error);
    return NextResponse.redirect(new URL('/auth/signup?error=signin_failed', req.url));
  }
}