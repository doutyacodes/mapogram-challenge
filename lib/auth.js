// lib\auth.js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/utils"
import { USERS, USER_PROFILES, AUTH_PROVIDERS, USER_ENTITIES, USER_FOLLOWED_LAYERS, LAYERS } from "@/utils/schema/schema"
import { eq, sql, and } from "drizzle-orm"
import { USER_COMMUNITY_FOLLOW } from "@/utils/schema/community_schema"
import { BASE_IMG_URL } from "@/lib/map/constants"
import jwt from "jsonwebtoken"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          // Check if user already exists with this Google account
          const existingAuthProvider = await db
            .select()
            .from(AUTH_PROVIDERS)
            .where(eq(AUTH_PROVIDERS.provider_user_id, account.providerAccountId))
            .limit(1);

          if (existingAuthProvider.length > 0) {
            console.log("user exists")
            // User exists, just sign them in
            return true;
          }

          // New Google user - create account
          await db.transaction(async (tx) => {
            // Generate unique username from email
            const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
            let username = baseUsername;
            let counter = 1;
            
            while (true) {
              const existingUser = await tx
                .select()
                .from(USERS)
                .where(eq(USERS.username, username))
                .limit(1);
              
              if (existingUser.length === 0) break;
              username = `${baseUsername}_${counter}`;
              counter++;
            }

            // Insert into USERS (without password for Google users)
            await tx.insert(USERS).values({
              name: user.name,
              username: username,
              password: null, // No password for Google users
            });

            // Get the inserted user
            const [newUser] = await tx
              .select()
              .from(USERS)
              .where(eq(USERS.username, username));

            // Create USER_PROFILES
            await tx.insert(USER_PROFILES).values({
              user_id: newUser.id,
              bio: null,
              profile_pic_url: user.image || null,
            });

            // Insert into AUTH_PROVIDERS
            await tx.insert(AUTH_PROVIDERS).values({
              user_id: newUser.id,
              provider: 'google',
              provider_user_id: account.providerAccountId,
            });

            // Insert into USER_ENTITIES
            await tx.insert(USER_ENTITIES).values({
              user_id: newUser.id,
              type: 'user',
              reference_id: newUser.id,
            });

            // Follow permanent layers
            const permanentLayers = await tx
              .select({ id: LAYERS.id })
              .from(LAYERS)
              .where(eq(LAYERS.is_permanent, true));

            if (permanentLayers.length > 0) {
              await tx.insert(USER_FOLLOWED_LAYERS).values(
                permanentLayers.map((layer) => ({
                  user_id: newUser.id,
                  layer_id: layer.id,
                }))
              );
            }
          });

          return true;
        } catch (error) {
          console.error("Error during Google sign up:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        // Get user data for JWT
        const authProvider = await db
          .select()
          .from(AUTH_PROVIDERS)
          .innerJoin(USERS, eq(AUTH_PROVIDERS.user_id, USERS.id))
          .where(eq(AUTH_PROVIDERS.provider_user_id, account.providerAccountId))
          .limit(1);

        if (authProvider.length > 0) {
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

          token.userId = user.id;
          token.username = user.username;
          token.name = user.name;
          token.hasFollowedLayer = followedLayersCount.count > 0;
          token.hasFollowedCommunities = followedCommunitiesCount.count > 0;
        }
      }
      return token;
    }
  }
}

export default NextAuth(authOptions)