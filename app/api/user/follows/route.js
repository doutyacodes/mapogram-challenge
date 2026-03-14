// app/api/user/follows/route.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/utils';
import { USERS, LAYERS, USER_FOLLOWED_PAGES, USER_FOLLOWED_LAYERS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

// GET - Fetch available pages and layers
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

    // Get top 3 most followed pages (excluding current user)
    const topPages = await db
      .select({
        id: USERS.id,
        name: USERS.name,
        website_url: USERS.website_url,
        page_type_id: USERS.page_type_id,
        follower_count: sql`COUNT(${USER_FOLLOWED_PAGES.user_id})`.as('follower_count')
      })
      .from(USERS)
      .leftJoin(USER_FOLLOWED_PAGES, eq(USERS.id, USER_FOLLOWED_PAGES.page_id))
      .where(and(eq(USERS.role, 'page'), ne(USERS.id, payload.id)))
      .groupBy(USERS.id)
      .orderBy(sql`follower_count DESC`)
      .limit(3);

    // Get top 3 most followed layers
    const topLayers = await db
      .select({
        id: LAYERS.id,
        name: LAYERS.name,
        follower_count: sql`COUNT(${USER_FOLLOWED_LAYERS.user_id})`.as('follower_count')
      })
      .from(LAYERS)
      .leftJoin(USER_FOLLOWED_LAYERS, eq(LAYERS.id, USER_FOLLOWED_LAYERS.layer_id))
      .groupBy(LAYERS.id)
      .orderBy(sql`follower_count DESC`)
      .limit(3);

    // Get user's current follows
    const userFollowedPages = await db
      .select({ page_id: USER_FOLLOWED_PAGES.page_id })
      .from(USER_FOLLOWED_PAGES)
      .where(eq(USER_FOLLOWED_PAGES.user_id, payload.id));

    const userFollowedLayers = await db
      .select({ layer_id: USER_FOLLOWED_LAYERS.layer_id })
      .from(USER_FOLLOWED_LAYERS)
      .where(eq(USER_FOLLOWED_LAYERS.user_id, payload.id));

    const followedPageIds = userFollowedPages.map(fp => fp.page_id);
    const followedLayerIds = userFollowedLayers.map(fl => fl.layer_id);

    return NextResponse.json({
      pages: topPages.map(page => ({
        ...page,
        isFollowed: followedPageIds.includes(page.id)
      })),
      layers: topLayers.map(layer => ({
        ...layer,
        isFollowed: followedLayerIds.includes(layer.id)
      })),
      hasFollowedLayer: followedLayerIds.length > 0
    });

  } catch (error) {
    console.error('Error fetching follow data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}