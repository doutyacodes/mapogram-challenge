// import { NextResponse } from 'next/server';
// import { db } from '@/utils';
// import {
//   USERS,
//   USER_PROFILES,
//   LAYERS,
//   PAGES,
//   PAGE_PROFILES,
//   PAGE_TYPES,
// } from '@/utils/schema/schema';
// import {
//   COMMUNITIES,
//   USER_COMMUNITY_FOLLOW,
// } from '@/utils/schema/community_schema';
// import { and, eq, like, or } from 'drizzle-orm';
// import { jwtVerify } from 'jose';

// export async function GET(req) {
//   try {
//     // Get token from cookies
//     const token = req.cookies.get('user_token')?.value;

//     if (!token) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     // Verify token
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     const decoded = await jwtVerify(token, secret);
//     const payload = decoded.payload;
//     const userId = payload.id;

//     const { searchParams } = new URL(req.url);
//     const query = searchParams.get('q');
//     const filter = searchParams.get('filter') || 'all';

//     if (!query || query.trim().length < 2) {
//       return NextResponse.json([]);
//     }

//     const searchTerm = `%${query.trim()}%`;
//     let results = [];

//     // Search USERS
//     if (filter === 'all' || filter === 'users') {
//       const users = await db
//         .select({
//           id: USERS.id,
//           name: USERS.name,
//           username: USERS.username,
//           profile_pic_url: USER_PROFILES.profile_pic_url,
//         })
//         .from(USERS)
//         .leftJoin(USER_PROFILES, eq(USERS.id, USER_PROFILES.user_id))
//         .where(
//           or(
//             like(USERS.name, searchTerm),
//             like(USERS.username, searchTerm)
//           )
//         )
//         .limit(10);

//       results = [
//         ...results,
//         ...users.map((user) => ({
//           ...user,
//           itemType: 'user',
//         })),
//       ];
//     }

//     // Search PAGES
//     if (filter === 'all' || filter === 'pages') {
//       const pages = await db
//         .select({
//           id: PAGES.id,
//           name: PAGES.name,
//           username: PAGES.username,
//           profile_pic_url: PAGE_PROFILES.profile_pic_url,
//           page_type_name: PAGE_TYPES.name,
//         })
//         .from(PAGES)
//         .leftJoin(PAGE_PROFILES, eq(PAGES.id, PAGE_PROFILES.page_id))
//         .leftJoin(PAGE_TYPES, eq(PAGES.page_type_id, PAGE_TYPES.id))
//         .where(
//           or(
//             like(PAGES.name, searchTerm),
//             like(PAGES.username, searchTerm)
//           )
//         )
//         .limit(10);

//       results = [
//         ...results,
//         ...pages.map((page) => ({
//           ...page,
//           itemType: 'page',
//         })),
//       ];
//     }

//     // Search LAYERS
//     if (filter === 'all' || filter === 'layers') {
//       const layers = await db
//         .select({
//           id: LAYERS.id,
//           name: LAYERS.name,
//         })
//         .from(LAYERS)
//         .where(like(LAYERS.name, searchTerm))
//         .limit(10);

//       results = [
//         ...results,
//         ...layers.map((layer) => ({
//           ...layer,
//           itemType: 'layer',
//         })),
//       ];
//     }

//     // Search COMMUNITIES followed by user
//     if (filter === 'all' || filter === 'communities') {
//       const communities = await db
//         .select({
//           id: COMMUNITIES.id,
//           name: COMMUNITIES.name,
//           image_url: COMMUNITIES.image_url,
//         })
//         .from(COMMUNITIES)
//         .innerJoin(
//           USER_COMMUNITY_FOLLOW,
//           eq(COMMUNITIES.id, USER_COMMUNITY_FOLLOW.community_id)
//         )
//         .where(
//           and(
//             eq(USER_COMMUNITY_FOLLOW.user_id, userId),
//             like(COMMUNITIES.name, searchTerm)
//           )
//         )
//         .limit(10);

//       results = [
//         ...results,
//         ...communities.map((community) => ({
//           ...community,
//           itemType: 'community',
//           profile_pic_url: community.image_url, // for consistent display
//         })),
//       ];
//     }

//     // Sort by relevance
//     results.sort((a, b) => {
//       const aExact = a.name.toLowerCase() === query.toLowerCase();
//       const bExact = b.name.toLowerCase() === query.toLowerCase();

//       if (aExact && !bExact) return -1;
//       if (!aExact && bExact) return 1;

//       const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
//       const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());

//       if (aStarts && !bStarts) return -1;
//       if (!aStarts && bStarts) return 1;

//       return a.name.localeCompare(b.name);
//     });

//     // Limit total results
//     results = results.slice(0, 15);

//     return NextResponse.json(results);
//   } catch (error) {
//     console.error('Error searching:', error);
//     return NextResponse.json({ message: 'Failed to search' }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { db } from '@/utils';
import {
  USERS,
  USER_PROFILES,
  LAYERS,
  PAGES,
  PAGE_PROFILES,
  PAGE_TYPES,
} from '@/utils/schema/schema';
import {
  COMMUNITIES,
  COMMUNITY_TYPES,
  USER_COMMUNITY_FOLLOW,
} from '@/utils/schema/community_schema';
import { and, eq, like, or } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export async function GET(req) {
  try {
    // Get token from cookies
    const token = req.cookies.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;
    const userId = payload.id;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const filter = searchParams.get('filter') || 'all';

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const searchTerm = `%${query.trim()}%`;
    let results = [];

    // Search USERS
    // if (filter === 'all' || filter === 'users') {
    //   const users = await db
    //     .select({
    //       id: USERS.id,
    //       name: USERS.name,
    //       username: USERS.username,
    //       profile_pic_url: USER_PROFILES.profile_pic_url,
    //     })
    //     .from(USERS)
    //     .leftJoin(USER_PROFILES, eq(USERS.id, USER_PROFILES.user_id))
    //     .where(
    //       or(
    //         like(USERS.name, searchTerm),
    //         like(USERS.username, searchTerm)
    //       )
    //     )
    //     .limit(10);

    //   results = [
    //     ...results,
    //     ...users.map((user) => ({
    //       ...user,
    //       itemType: 'user',
    //     })),
    //   ];
    // }

    // Search PAGES with type 'Center' as special communities
    if (filter === 'all' || filter === 'communities') {
      const centerPages = await db
        .select({
          id: PAGES.id,
          name: PAGES.name,
          username: PAGES.username,
          profile_pic_url: PAGE_PROFILES.profile_pic_url,
          page_type_name: PAGE_TYPES.name,
        })
        .from(PAGES)
        .leftJoin(PAGE_PROFILES, eq(PAGES.id, PAGE_PROFILES.page_id))
        .leftJoin(PAGE_TYPES, eq(PAGES.page_type_id, PAGE_TYPES.id))
        .where(
          and(
            eq(PAGE_TYPES.name, 'Center'), // Only pages with type 'Center'
            or(
              like(PAGES.name, searchTerm),
              like(PAGES.username, searchTerm)
            )
          )
        )
        .limit(10);

      results = [
        ...results,
        ...centerPages.map((page) => ({
          id: page.id,
          name: page.name,
          username: page.username,
          profile_pic_url: page.profile_pic_url,
          itemType: 'special-community',
          community_type: { id: 'center', name: 'Center' }, // Special type for centers
          is_center: true, // Flag to identify this is a center page
        })),
      ];
    }

    // Search LAYERS - DISABLED TEMPORARILY
    // if (filter === 'all' || filter === 'layers') {
    //   const layers = await db
    //     .select({
    //       id: LAYERS.id,
    //       name: LAYERS.name,
    //     })
    //     .from(LAYERS)
    //     .where(like(LAYERS.name, searchTerm))
    //     .limit(10);
    //
    //   results = [
    //     ...results,
    //     ...layers.map((layer) => ({
    //       ...layer,
    //       itemType: 'layer',
    //     })),
    //   ];
    // }

    // Search COMMUNITIES followed by user
    if (filter === 'all' || filter === 'communities') {
      const communities = await db
        .select({
          id: COMMUNITIES.id,
          name: COMMUNITIES.name,
          image_url: COMMUNITIES.image_url,
          community_type: COMMUNITY_TYPES.name,
          community_type_id: COMMUNITY_TYPES.id,
        })
        .from(COMMUNITIES)
        .leftJoin(
          COMMUNITY_TYPES,
          eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id)
        )
        .where(like(COMMUNITIES.name, searchTerm))
        .limit(10);

      results = [
        ...results,
        ...communities.map((community) => ({
          ...community,
          itemType: 'community',
          profile_pic_url: community.image_url,
          community_type: { id: community.community_type_id, name: community.community_type },
          is_center: false, // Regular community, not a center
        })),
      ];
    }

    // Sort by relevance
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.name.localeCompare(b.name);
    });

    // Limit total results
    results = results.slice(0, 15);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ message: 'Failed to search' }, { status: 500 });
  }
}