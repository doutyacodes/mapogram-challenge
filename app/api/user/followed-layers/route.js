// /api/user/followed-layers/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USER_FOLLOWED_LAYERS,
  LAYERS,
  USERS
} from '@/utils/schema/schema';
import { eq, ilike, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const userId = decoded.id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Get user's followed layers
    let query = db
      .select({
        layer_id: LAYERS.id,
        layer_name: LAYERS.name,
        is_permanent: LAYERS.is_permanent,
        followed_at: USER_FOLLOWED_LAYERS.followed_at,
      })
      .from(USER_FOLLOWED_LAYERS)
      .innerJoin(LAYERS, eq(LAYERS.id, USER_FOLLOWED_LAYERS.layer_id))
      .where(eq(USER_FOLLOWED_LAYERS.user_id, userId));

    // Add search filter if provided
    if (search) {
      query = query.where(
        and(
          eq(USER_FOLLOWED_LAYERS.user_id, userId),
          ilike(LAYERS.name, `%${search}%`)
        )
      );
    }

    const followedLayers = await query.orderBy(USER_FOLLOWED_LAYERS.followed_at);

    return NextResponse.json({ 
      layers: followedLayers,
      count: followedLayers.length 
    });
  } catch (error) {
    console.error("Error fetching followed layers:", error);
    return NextResponse.json({ message: "Failed to fetch followed layers" }, { status: 500 });
  }
}