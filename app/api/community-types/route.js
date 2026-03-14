// app\api\community-types\route.js
import { db } from '@/utils';
import { USERS, ROLES } from '@/utils/schema/schema';
import { COMMUNITY_TYPES } from '@/utils/schema/community_schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    // Get user from JWT token to check their role
    const token = req.cookies.get('user_token')?.value;
    
    let userRole = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        if (userId) {
          // Fetch user with their role
          const [userWithRole] = await db
            .select({
              user_id: USERS.id,
              role_name: ROLES.name,
            })
            .from(USERS)
            .leftJoin(ROLES, eq(USERS.role_id, ROLES.id))
            .where(eq(USERS.id, userId))
            .limit(1);
          
          if (userWithRole) {
            userRole = userWithRole.role_name;
          }
        }
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        // Continue with default access (non-privileged)
      }
    }

    let communityTypes = [];

    // Check if user has privileged access
    const isPrivilegedUser = userRole === 'super_admin' || userRole === 'official_admin';

    if (isPrivilegedUser) {
      // Privileged users can see all community types
      communityTypes = await db
        .select()
        .from(COMMUNITY_TYPES)
        .orderBy(COMMUNITY_TYPES.id);
    } else {
      // Regular users can only see 'Private Group' type
      communityTypes = await db
        .select()
        .from(COMMUNITY_TYPES)
        .where(eq(COMMUNITY_TYPES.name, 'Private Group'));
    }

    return NextResponse.json({ 
      communityTypes,
      success: true,
      userRole: userRole || 'user', // For debugging purposes
    });

  } catch (error) {
    console.error("Community Types API Error:", error);
    return NextResponse.json(
      { message: "Error fetching community types" }, 
      { status: 500 }
    );
  }
}