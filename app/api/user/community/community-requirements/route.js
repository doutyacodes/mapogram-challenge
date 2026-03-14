import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  COMMUNITY_ROLE_REQUIREMENTS, 
  COMMUNITY_TYPE_ROLES, 
  USER_COMPANIES, // Assuming you have this table
  USER_COMMUNITY_FOLLOW
} from '@/utils/schema/community_schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json(
        { message: 'Community ID is required' },
        { status: 400 }
      );
    }

    // Get token from cookies
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get user's role in this community
    const userRole = await db
      .select({
        roleId: COMMUNITY_TYPE_ROLES.id,
        roleName: COMMUNITY_TYPE_ROLES.role_name
      })
      .from(USER_COMMUNITY_FOLLOW)
      .leftJoin(COMMUNITY_TYPE_ROLES, eq(USER_COMMUNITY_FOLLOW.community_role_id, COMMUNITY_TYPE_ROLES.id))
      .where(and(
        eq(USER_COMMUNITY_FOLLOW.user_id, userId),
        eq(USER_COMMUNITY_FOLLOW.community_id, parseInt(communityId))
      ))
      .limit(1);

    if (userRole.length === 0) {
      return NextResponse.json(
        { message: 'User not found in this community' },
        { status: 404 }
      );
    }

    // Get requirements for user's role
    const requirements = await db
      .select({
        requirementType: COMMUNITY_ROLE_REQUIREMENTS.requirement_type
      })
      .from(COMMUNITY_ROLE_REQUIREMENTS)
      .where(eq(COMMUNITY_ROLE_REQUIREMENTS.role_id, userRole[0].roleId));

      console.log("requirements", requirements)

    if (requirements.length === 0) {
      return NextResponse.json({
        hasRequirements: false,
        message: 'No requirements for this role'
      });
    }

    // Check each requirement to see if user has completed it
    for (const req of requirements) {
      const isCompleted = await checkRequirementCompleted(userId, req.requirementType);
      console.log("isCompleted", isCompleted)
      if (!isCompleted) {
        return NextResponse.json({
          hasRequirements: true,
          requirement: {
            requirement_type: req.requirementType,
            role_name: userRole[0].roleName
          }
        });
      }
    }

    // All requirements completed
    return NextResponse.json({
      hasRequirements: false,
      message: 'All requirements completed'
    });

  } catch (error) {
    console.error('Error checking requirements:', error);
    return NextResponse.json(
      { message: 'Failed to check requirements' },
      { status: 500 }
    );
  }
}

async function checkRequirementCompleted(userId, requirementType) {
  try {
    switch (requirementType) {
      case 'user_company':
        // Check if user has company information
        const userCompany = await db
          .select({ id: USER_COMPANIES.id })
          .from(USER_COMPANIES)
          .where(eq(USER_COMPANIES.user_id, userId))
          .limit(1);

        console.log("userCompany", userCompany)
        
        return userCompany.length > 0;

      
      // Add more requirement checks here
      // case 'user_restaurant':
      //   const userRestaurant = await db
      //     .select({ id: USER_RESTAURANTS.id })
      //     .from(USER_RESTAURANTS)
      //     .where(eq(USER_RESTAURANTS.user_id, userId))
      //     .limit(1);
      //   return userRestaurant.length > 0;
      
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking requirement ${requirementType}:`, error);
    return false;
  }
}