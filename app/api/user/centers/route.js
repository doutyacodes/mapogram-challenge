import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  PAGES,
  PAGE_MEMBERS,
  PAGE_TYPES,
  PAGE_ROLES,
  PAGE_PROFILES
} from '@/utils/schema/schema';
import { eq, and, ilike } from 'drizzle-orm';

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

    // Get user's centers (pages where user is a member and page type category is 'centers')
    let query = db
      .select({
        page_id: PAGES.id,
        page_name: PAGES.name,
        page_username: PAGES.username,
        page_description: PAGE_PROFILES.bio, // This will be null if no profile exists
        page_image_url: PAGE_PROFILES.profile_pic_url, // This will be null if no profile exists
        role_name: PAGE_ROLES.name,
        is_approved: PAGE_MEMBERS.is_approved,
        joined_at: PAGE_MEMBERS.created_at,
        page_type_name: PAGE_TYPES.name,
        page_type_category: PAGE_TYPES.category,
      })
      .from(PAGE_MEMBERS)
      .innerJoin(PAGES, eq(PAGES.id, PAGE_MEMBERS.page_id))
      .innerJoin(PAGE_TYPES, eq(PAGE_TYPES.id, PAGES.page_type_id))
      .innerJoin(PAGE_ROLES, eq(PAGE_ROLES.id, PAGE_MEMBERS.role_id))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id)) // Use leftJoin so pages without profiles still show up
      .where(
        and(
          eq(PAGE_MEMBERS.user_id, userId),
          eq(PAGE_TYPES.category, 'centers')
        )
      );

    // Add search filter if provided
    if (search) {
      query = query.where(
        and(
          eq(PAGE_MEMBERS.user_id, userId),
          eq(PAGE_TYPES.category, 'centers'),
          ilike(PAGES.name, `%${search}%`)
        )
      );
    }

    const userCenters = await query.orderBy(PAGE_MEMBERS.created_at);

    return NextResponse.json({ 
      centers: userCenters,
      count: userCenters.length 
    });
  } catch (error) {
    console.error("Error fetching user centers:", error);
    return NextResponse.json({ message: "Failed to fetch centers" }, { status: 500 });
  }
}