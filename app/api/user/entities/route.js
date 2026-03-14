// app/api/user/entities/route.js
import { db } from '@/utils';
import { jwtVerify } from 'jose';
import { 
  USER_ENTITIES, 
  USER_COMPANIES, 
  USER_RESTAURANTS,
  COMMUNITY_ROLE_REQUIREMENTS,
  COMMUNITY_TYPE_ROLES,
  COMMUNITY_TYPES
} from '@/utils/schema/community_schema';
import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get JWT token from cookies
    const token = request.cookies.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    const userId = payload.id;
    const userName = payload.name;

    // Get community_id from query parameters
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('community_id');

    let allowedEntityTypes = ['user']; // Always allow user entities

    // If community_id is provided, fetch the allowed entity types for that community
    if (communityId) {
      try {
        // Get community type for the given community
        const community = await db
          .select({ community_type_id: COMMUNITY_TYPES.id })
          .from(COMMUNITY_TYPES)
          .where(eq(COMMUNITY_TYPES.id, communityId))
          .then(res => res[0]);

        if (community) {
          // Get all roles for this community type
          const roles = await db
            .select({ id: COMMUNITY_TYPE_ROLES.id })
            .from(COMMUNITY_TYPE_ROLES)
            .where(eq(COMMUNITY_TYPE_ROLES.community_type_id, community.community_type_id));

          const roleIds = roles.map(role => role.id);

          if (roleIds.length > 0) {
            // Get all requirements for these roles
            const requirements = await db
              .select({ requirement_type: COMMUNITY_ROLE_REQUIREMENTS.requirement_type })
              .from(COMMUNITY_ROLE_REQUIREMENTS)
              .where(inArray(COMMUNITY_ROLE_REQUIREMENTS.role_id, roleIds));

            // Map requirement types to entity types
            const additionalEntityTypes = requirements.map(req => {
              switch (req.requirement_type) {
                case 'user_company':
                  return 'company';
                case 'user_restaurant':
                  return 'restaurant';
                default:
                  return null;
              }
            }).filter(Boolean);

            // Add additional entity types to allowed types
            allowedEntityTypes = [...new Set([...allowedEntityTypes, ...additionalEntityTypes])];
          }
        }
      } catch (error) {
        console.error('Error fetching community requirements:', error);
        // If there's an error fetching community requirements, fall back to user entities only
      }
    }

    // Fetch entities for the user, filtered by allowed types
    const entities = await db
      .select()
      .from(USER_ENTITIES)
      .where(eq(USER_ENTITIES.user_id, userId));

    // Filter entities based on allowed types
    const filteredEntities = entities.filter(entity => 
      allowedEntityTypes.includes(entity.type)
    );

    // Enrich with details from companies or restaurants
    const enrichedEntities = await Promise.all(
      filteredEntities.map(async (entity) => {
        if (entity.type === 'company') {
          const company = await db
            .select()
            .from(USER_COMPANIES)
            .where(eq(USER_COMPANIES.id, entity.reference_id))
            .then(res => res[0]);

          return { ...entity, name: company?.name || 'Company' };

        } else if (entity.type === 'restaurant') {
          const restaurant = await db
            .select()
            .from(USER_RESTAURANTS)
            .where(eq(USER_RESTAURANTS.id, entity.reference_id))
            .then(res => res[0]);

          return { ...entity, name: restaurant?.name || 'Restaurant' };

        } else {
          // Default case: personal profile
          return { ...entity, name: userName || 'My Profile' };
        }
      })
    );

    return NextResponse.json({ entities: enrichedEntities }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user entities:', error);
    return NextResponse.json({ error: 'Failed to fetch user entities' }, { status: 500 });
  }
}