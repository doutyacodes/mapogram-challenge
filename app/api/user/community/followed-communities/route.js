// import { NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';
// import { db } from '@/utils';
// import { USER_COMMUNITY_FOLLOW, COMMUNITIES, COMMUNITY_TYPES } from '@/utils/schema/community_schema';
// import { eq } from 'drizzle-orm';

// export async function GET(req) {
//   try {
//     const token = req.cookies.get('user_token')?.value;
//     if (!token) {
//       return NextResponse.json(
//         { message: 'Authentication required' },
//         { status: 401 }
//       );
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const userId = decoded.id;

//     // Fetch followed communities and roles
//   const followedCommunities = await db
//     .select({
//       id: COMMUNITIES.id,
//       name: COMMUNITIES.name,
//       description: COMMUNITIES.description,
//       image_url: COMMUNITIES.image_url,
//       created_at: COMMUNITIES.created_at,
//       invite_code: COMMUNITIES.invite_code,
//       is_open: COMMUNITIES.is_open,
//       followed_at: USER_COMMUNITY_FOLLOW.followed_at,
//       status: USER_COMMUNITY_FOLLOW.status,
//       role_name: COMMUNITY_TYPES.name, // ✅ Now using community type name
//     })
//     .from(USER_COMMUNITY_FOLLOW)
//     .innerJoin(COMMUNITIES, eq(USER_COMMUNITY_FOLLOW.community_id, COMMUNITIES.id))
//     .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id)) // ✅ Join added
//     .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId))
//     .orderBy(USER_COMMUNITY_FOLLOW.followed_at);

//     return NextResponse.json({
//       communities: followedCommunities
//     });

//   } catch (error) {
//     console.error('Error fetching followed communities:', error);
//     return NextResponse.json(
//       { message: 'Failed to fetch communities' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USER_COMMUNITY_FOLLOW, 
  COMMUNITIES, 
  COMMUNITY_TYPES,
  COMMUNITY_MEMBERS,
  COMMUNITY_ROLES
} from '@/utils/schema/community_schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );  
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // null | followed | member

    let followedCommunities = [];
    let memberCommunities = [];

    // FOLLOWED COMMUNITIES
    if (!type || type === "followed") {
     followedCommunities = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        description: COMMUNITIES.description,
        image_url: COMMUNITIES.image_url,
        created_at: COMMUNITIES.created_at,
        invite_code: COMMUNITIES.invite_code,
        is_open: COMMUNITIES.is_open,
        followed_at: USER_COMMUNITY_FOLLOW.followed_at,
        status: USER_COMMUNITY_FOLLOW.status,
        community_type_name: COMMUNITY_TYPES.name,   // ✅ Correct name
        role_name: sql`NULL`.as('role_name'),        // ✅ Followed = no role
        source: sql`'followed'`.as('source')
      })
      .from(USER_COMMUNITY_FOLLOW)
      .innerJoin(COMMUNITIES, eq(USER_COMMUNITY_FOLLOW.community_id, COMMUNITIES.id))
      .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(USER_COMMUNITY_FOLLOW.user_id, userId));
    }

    // MEMBER COMMUNITIES
    if (!type || type === "member") {
    memberCommunities = await db
      .select({
        id: COMMUNITIES.id,
        name: COMMUNITIES.name,
        description: COMMUNITIES.description,
        image_url: COMMUNITIES.image_url,
        created_at: COMMUNITIES.created_at,
        invite_code: COMMUNITIES.invite_code,
        is_open: COMMUNITIES.is_open,
        followed_at: COMMUNITY_MEMBERS.created_at,
        status: sql`
          CASE 
            WHEN ${COMMUNITY_MEMBERS.is_approved} = 1 THEN 'approved'
            ELSE 'pending'
          END
        `.as('status'),
        community_type_name: COMMUNITY_TYPES.name,  // ✅ Added
        role_name: COMMUNITY_ROLES.name,            // ✅ Correct
        source: sql`'member'`.as('source')
      })
      .from(COMMUNITY_MEMBERS)
      .innerJoin(COMMUNITIES, eq(COMMUNITY_MEMBERS.community_id, COMMUNITIES.id))
      .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id)) // <-- also required!
      .leftJoin(COMMUNITY_ROLES, eq(COMMUNITY_MEMBERS.role_id, COMMUNITY_ROLES.id))
      .where(eq(COMMUNITY_MEMBERS.user_id, userId));
    }

    // MERGE + DEDUP
    const all = [...followedCommunities, ...memberCommunities];
    const map = new Map();

    for (const c of all) {
      const ex = map.get(c.id);
      if (!ex) {
        map.set(c.id, c);
      } else {
        if (ex.source === "followed" && c.source === "member") {
          map.set(c.id, c);
        }
      }
    }

    const staticCommunities = [
      {
        id: 999991, // Kerala
        name: 'Kerala',
        description: 'State of Kerala',
        image_url: null,
        created_at: new Date().toISOString(),
        invite_code: null,
        is_open: true,
        followed_at: new Date().toISOString(),
        status: 'approved',
        community_type_name: 'State',
        role_name: 'Member',
        source: 'static'
      },
      {
        id: 999992, // Karnataka
        name: 'Karnataka',
        description: 'State of Karnataka',
        image_url: null,
        created_at: new Date().toISOString(),
        invite_code: null,
        is_open: true,
        followed_at: new Date().toISOString(),
        status: 'approved',
        community_type_name: 'State',
        role_name: 'Member',
        source: 'static'
      },
      {
        id: 999993, // Tamil Nadu
        name: 'Tamil Nadu',
        description: 'State of Tamil Nadu',
        image_url: null,
        created_at: new Date().toISOString(),
        invite_code: null,
        is_open: true,
        followed_at: new Date().toISOString(),
        status: 'approved',
        community_type_name: 'State',
        role_name: 'Member',
        source: 'static'
      }
    ];

    const sortedUserCommunities = Array.from(map.values())
      .sort((a, b) => new Date(b.followed_at) - new Date(a.followed_at));

    const result = [...staticCommunities, ...sortedUserCommunities];

    return NextResponse.json({ communities: result });

  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { message: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}
