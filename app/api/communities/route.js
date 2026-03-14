import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { and, desc, eq} from 'drizzle-orm';
import { 
  COMMUNITIES, 
  COMMUNITY_MODERATORS, 
  COMMUNITY_TYPES, 
  COMMUNITY_TYPE_ROLES, 
  USER_COMMUNITY_FOLLOW,
  COMMUNITY_DEPARTMENTS,
  DEPARTMENTS,
  COMMUNITY_GEOFENCES,
} from '@/utils/schema/community_schema';
import { 
  USERS,
  ROLES
} from '@/utils/schema/schema';
import jwt from 'jsonwebtoken';
import { BASE_IMG_URL } from '@/lib/map/constants';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true";

  const query = db
    .select({
      id: COMMUNITIES.id,
      name: COMMUNITIES.name,
      description: COMMUNITIES.description,
      image_url: COMMUNITIES.image_url,
      created_at: COMMUNITIES.created_at,
      community_type: {
        id: COMMUNITY_TYPES.id,
        name: COMMUNITY_TYPES.name,
        description: COMMUNITY_TYPES.description,
      },
    })
    .from(COMMUNITIES)
    .leftJoin(
      COMMUNITY_TYPES,
      eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id)
    )
    .where(eq(COMMUNITIES.is_open, true))
    .orderBy(COMMUNITIES.created_at);

    if (!fetchAll) {
      query.limit(10);
    }

    const communities = await query.execute();

    return NextResponse.json(
      {
        success: true,
        communities,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Get Communities Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}

// Function to generate unique invite code
function generateInviteCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to check if invite code is unique
async function generateUniqueInviteCode() {
  let inviteCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    inviteCode = generateInviteCode();
    
    // Check if this code already exists
    const existingCommunity = await db
      .select()
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.invite_code, inviteCode))
      .limit(1);
    
    if (existingCommunity.length === 0) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    // Fallback to timestamp-based code if we can't generate unique one
    inviteCode = `COM${Date.now().toString().slice(-6)}`;
  }
  
  return inviteCode;
}

export async function POST(req) {
  try {
    const { 
      name, 
      description, 
      imageUrl, 
      communityTypeId, 
      selectedDepartments,
      geofenceData // New field
    } = await req.json();

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Community name is required' }, { status: 400 });
    }

    if (name.trim().length < 3) {
      return NextResponse.json({ message: 'Community name must be at least 3 characters' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ message: 'Community description is required' }, { status: 400 });
    }

    if (description.trim().length < 10) {
      return NextResponse.json({ message: 'Description must be at least 10 characters' }, { status: 400 });
    }

    if (!communityTypeId) {
      return NextResponse.json({ message: 'Community type is required' }, { status: 400 });
    }

    // Get user from JWT token
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user role to validate permissions
    const [userWithRole] = await db
      .select({
        user_id: USERS.id,
        role_name: ROLES.name,
      })
      .from(USERS)
      .leftJoin(ROLES, eq(USERS.role_id, ROLES.id))
      .where(eq(USERS.id, userId))
      .limit(1);

    if (!userWithRole) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userRole = userWithRole.role_name;

    // Verify community type exists and check permissions
    const [communityType] = await db
      .select()
      .from(COMMUNITY_TYPES)
      .where(eq(COMMUNITY_TYPES.id, communityTypeId))
      .limit(1);

    if (!communityType) {
      return NextResponse.json({ message: 'Invalid community type' }, { status: 400 });
    }

    // Check if user has permission to create this type of community
    const isPrivilegedUser = userRole === 'super_admin' || userRole === 'official_admin';
    const isDistrictType = communityType.name.toLowerCase() === 'district';

    if (isDistrictType && !isPrivilegedUser) {
      return NextResponse.json({ 
        message: 'You do not have permission to create district communities' 
      }, { status: 403 });
    }

    // If it's a district community, validate departments and geofence
    if (isDistrictType) {
      if (!selectedDepartments || selectedDepartments.length === 0) {
        return NextResponse.json({ 
          message: 'At least one department must be selected for district communities' 
        }, { status: 400 });
      }

      if (!geofenceData || !geofenceData.geojson) {
        return NextResponse.json({ 
          message: 'District boundary (geofence) is required for district communities' 
        }, { status: 400 });
      }

      // Validate geofence structure
      if (!geofenceData.center_lat || !geofenceData.center_lng) {
        return NextResponse.json({ 
          message: 'Invalid geofence data: center coordinates are required' 
        }, { status: 400 });
      }
    }

    // Validate selected departments exist if provided
    if (selectedDepartments && selectedDepartments.length > 0) {
      const departmentChecks = await Promise.all(
        selectedDepartments.map(deptId => 
          db.select({ id: DEPARTMENTS.id })
            .from(DEPARTMENTS)
            .where(eq(DEPARTMENTS.id, deptId))
            .limit(1)
        )
      );

      const invalidDepartments = departmentChecks.filter(result => result.length === 0);
      if (invalidDepartments.length > 0) {
        return NextResponse.json({ message: 'One or more selected departments are invalid' }, { status: 400 });
      }
    }

    // Generate unique invite code
    const inviteCode = await generateUniqueInviteCode();

    // Create the community
    const [insertResult] = await db
      .insert(COMMUNITIES)
      .values({
        name: name.trim(),
        description: description.trim(),
        image_url: imageUrl ? `${BASE_IMG_URL}/${imageUrl}` : null,
        community_type_id: communityTypeId,
        is_open: false,
        invite_code: inviteCode,
        created_by: userId,
      });

    const insertedId = insertResult.insertId;

    // Fetch the full inserted community row
    const [insertedCommunity] = await db
      .select()
      .from(COMMUNITIES)
      .where(eq(COMMUNITIES.id, insertedId));

    // Fetch default role for this community type
    const [defaultRole] = await db
      .select()
      .from(COMMUNITY_TYPE_ROLES)
      .where(eq(COMMUNITY_TYPE_ROLES.community_type_id, communityTypeId))
      .orderBy(COMMUNITY_TYPE_ROLES.id)
      .limit(1);

    // Add creator as approved member
    await db.insert(USER_COMMUNITY_FOLLOW).values({
      user_id: userId,
      community_id: insertedId,
      community_role_id: defaultRole?.id ?? null,
      status: 'approved',
      followed_at: new Date(),
    });

    // Add creator as admin in moderators
    await db.insert(COMMUNITY_MODERATORS).values({
      user_id: userId,
      community_id: insertedId,
      role: 'admin',
    });

    // If district community, link departments
    if (isDistrictType && selectedDepartments && selectedDepartments.length > 0) {
      const departmentLinks = selectedDepartments.map(departmentId => ({
        community_id: insertedId,
        department_id: departmentId,
      }));

      await db.insert(COMMUNITY_DEPARTMENTS).values(departmentLinks);
    }

    // If district community, save geofence data
    if (isDistrictType && geofenceData) {
      await db.insert(COMMUNITY_GEOFENCES).values({
        community_id: insertedId,
        name: geofenceData.name || `${name.trim()} Boundary`,
        source: 'osm', // OpenStreetMap
        geojson: geofenceData.geojson,
        center_lat: geofenceData.center_lat,
        center_lng: geofenceData.center_lng,
      });
    }

    // Build invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const inviteLink = `${baseUrl}/communities/invite/${inviteCode}`;

    // Build response
    const communityResponse = {
      ...insertedCommunity,
      community_type: communityType || null,
      invite_link: inviteLink,
      has_geofence: isDistrictType && geofenceData ? true : false,
    };

    return NextResponse.json({
      community: communityResponse,
      message: "Community created successfully",
      success: true,
    });

  } catch (error) {
    console.error("Create Community API Error:", error);
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    // Handle database constraint errors
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23000') {
      return NextResponse.json({ message: "Community name already exists" }, { status: 400 });
    }

    return NextResponse.json({ message: "Error creating community" }, { status: 500 });
  }
}