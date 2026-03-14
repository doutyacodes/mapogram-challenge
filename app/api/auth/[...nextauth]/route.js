// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/utils"
import { USERS, USERNAMES , USER_PROFILES, AUTH_PROVIDERS, USER_FOLLOWED_LAYERS, LAYERS } from "@/utils/schema/schema"
import { eq, sql, and } from "drizzle-orm"
import { USER_COMMUNITY_FOLLOW, USER_ENTITIES } from "@/utils/schema/community_schema"

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          console.log("Google sign in attempt for:", user.email);
          
          // Check if user already exists with this Google account
          const existingAuthProvider = await db
            .select()
            .from(AUTH_PROVIDERS)
            .where(eq(AUTH_PROVIDERS.provider_user_id, account.providerAccountId))
            .limit(1);

          if (existingAuthProvider.length > 0) {
            console.log("Existing user found");
            return true; // User exists, allow sign in
          }

          console.log("Creating new user for:", user.email);
          
          // New Google user - create account
          await db.transaction(async (tx) => {
            // Generate unique username from email
            const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
            let username = baseUsername;
            let counter = 1;
            
            // Check username availability in USERNAMES table
            while (true) {
              const existingUsername = await tx
                .select()
                .from(USERNAMES)
                .where(eq(USERNAMES.username, username))
                .limit(1);
              
              if (existingUsername.length === 0) break;
                username = `${baseUsername}_${counter}`;
                counter++;
              }

              // Insert into USERS
              await tx.insert(USERS).values({
                name: user.name,
                username: username,
                password: null, // Make sure your schema allows null passwords
              });

              // Get the inserted user
              const [newUser] = await tx
                .select()
                .from(USERS)
                .where(eq(USERS.username, username));

              // Register username in USERNAMES table
              await tx.insert(USERNAMES).values({
                username: username,
                entity_type: 'user',
                entity_id: newUser.id,
              });

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
            
            console.log("New user created successfully:", username);
          });

          return true;
        } catch (error) {
          console.error("Error during Google sign up:", error);
          return false; // This will show "Access Denied"
        }
      }
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log("Redirect called with:", { url, baseUrl });
      // Redirect to your custom handler
      return `${baseUrl}/api/auth/google-signin`;
    },
    
    async session({ session, token }) {
      // Add custom data to session if needed
      if (token.userId) {
        session.user.id = token.userId;
        session.user.username = token.username;
      }
      return session;
    },
    
    async jwt({ token, account, user }) {
      // Store user data in JWT token
      if (account?.provider === "google") {
        const authProvider = await db
          .select()
          .from(AUTH_PROVIDERS)
          .innerJoin(USERS, eq(AUTH_PROVIDERS.user_id, USERS.id))
          .where(eq(AUTH_PROVIDERS.provider_user_id, account.providerAccountId))
          .limit(1);

        if (authProvider.length > 0) {
          const userData = authProvider[0].users;
          token.userId = userData.id;
          token.username = userData.username;
        }
      }
      return token;
    }
  },
  pages: {
    error: '/auth/error', // Create this page to handle errors better
  },
  debug: true, // Enable for development
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }