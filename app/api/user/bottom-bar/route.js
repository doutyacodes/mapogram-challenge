// app/api/user/bottom-bar/route.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/utils';
import { USERS, LAYERS, USER_FOLLOWED_PAGES, USER_FOLLOWED_LAYERS, USER_BOTTOM_BAR, USER_PROFILES, PAGE_TYPES } from '@/utils/schema/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { COMMUNITIES } from '@/utils/schema/community_schema';

// GET - Get user's bottom bar configuration
export async function GET(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('user_token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    const userId = payload.id;

    // Check if user has custom bottom bar configuration
    const customBottomBar = await db
      .select()
      .from(USER_BOTTOM_BAR)
      .where(eq(USER_BOTTOM_BAR.user_id, userId))
      .orderBy(USER_BOTTOM_BAR.position);

    if (customBottomBar.length === 0) {
      // No bottom bar items configured yet
      return NextResponse.json({ items: [] });
    }

    // Separate pages and layers
    const pageIds = customBottomBar.filter(item => item.item_type === 'page').map(item => item.item_id);
    const layerIds = customBottomBar.filter(item => item.item_type === 'layer').map(item => item.item_id);
    const communityIds = customBottomBar.filter(item => item.item_type === 'community').map(item => item.item_id);

    // Fetch data
    const [pages, layers, communities] = await Promise.all([
      pageIds.length > 0
        ? db
            .select({
              id: USERS.id,
              name: USERS.name,
              profile_pic_url: USER_PROFILES.profile_pic_url,
              page_type_name: PAGE_TYPES.name,
            })
            .from(USERS)
            .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
            .leftJoin(PAGE_TYPES, eq(USERS.page_type_id, PAGE_TYPES.id))
            .where(and(inArray(USERS.id, pageIds), eq(USERS.role, 'page')))
        : [],
      layerIds.length > 0
        ? db
            .select({
              id: LAYERS.id,
              name: LAYERS.name,
            })
            .from(LAYERS)
            .where(inArray(LAYERS.id, layerIds))
        : [],
          communityIds.length > 0
          ? db
              .select({
                id: COMMUNITIES.id,
                name: COMMUNITIES.name,
                image_url: COMMUNITIES.image_url,
              })
              .from(COMMUNITIES)
              .where(inArray(COMMUNITIES.id, communityIds))
          : []
      ]);

  // Map back to order
  const items = customBottomBar
    .map(config => {
      if (config.item_type === 'page') {
        const page = pages.find(p => p.id === config.item_id);
        return page
          ? {
              id: page.id,
              name: page.name,
              type: 'page',
              path: `/page/${page.id}`,
              profile_pic_url: page.profile_pic_url,
              page_type_name: page.page_type_name,
            }
          : null;
      } else if (config.item_type === 'layer') {
        const layer = layers.find(l => l.id === config.item_id);
        return layer
          ? {
              id: layer.id,
              name: layer.name,
              type: 'layer',
              path: `/layers/${layer.id}`,
              profile_pic_url: null
            }
          : null;
      } else if (config.item_type === 'community') {
      const community = communities.find(c => c.id === config.item_id);
      return community
        ? {
            id: community.id,
            name: community.name,
            type: 'community',
            path: `/communities?communityId=${community.id}`,
            profile_pic_url: community.image_url
          }
        : null;
    }
    return null;
  })
  .filter(Boolean);// remove any nulls

    return NextResponse.json({ items });

  } catch (error) {
    console.error('Error fetching bottom bar items:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user's bottom bar configuration
export async function PUT(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('user_token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    const userId = payload.id;
    const { items } = await request.json();

    // Validate items
    if (!Array.isArray(items) || items.length > 5) {
      return NextResponse.json({ message: 'Invalid items array or too many items (max 5)' }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || !item.type || !['page', 'layer', 'community'].includes(item.type)) {
        return NextResponse.json({ message: 'Invalid item format' }, { status: 400 });
      }
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Delete existing bottom bar configuration
      await tx
        .delete(USER_BOTTOM_BAR)
        .where(eq(USER_BOTTOM_BAR.user_id, userId));

      // Insert new configuration
      if (items.length > 0) {
        const bottomBarEntries = items.map((item, index) => ({
          user_id: userId,
          item_id: item.id,
          item_type: item.type,
          position: index
        }));

        await tx
          .insert(USER_BOTTOM_BAR)
          .values(bottomBarEntries);
      }
    });

    return NextResponse.json({ message: 'Bottom bar updated successfully' });

  } catch (error) {
    console.error('Error updating bottom bar:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}