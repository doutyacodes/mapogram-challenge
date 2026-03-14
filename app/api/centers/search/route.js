// /api/centers/search/route.js - Search all communities of type 'centers'
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { PAGES, PAGE_PROFILES, PAGE_MEMBERS, PAGE_TYPES } from '@/utils/schema/schema';
import { like, or, eq, and } from 'drizzle-orm';

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
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ communities: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search only pages of type 'centers'
    const communities = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        username: PAGES.username,
        bio: PAGE_PROFILES.bio,
        profile_pic_url: PAGE_PROFILES.profile_pic_url,
        page_type: PAGE_TYPES.name,
      })
      .from(PAGES)
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .leftJoin(PAGE_TYPES, eq(PAGE_TYPES.id, PAGES.page_type_id))
      .where(
        and(
          eq(PAGE_TYPES.name, 'Center'),
          or(
            like(PAGES.name, searchTerm),
            like(PAGES.username, searchTerm)
          )
        )
      )
      .limit(10);

    // Check membership status for each community
    const communitiesWithStatus = await Promise.all(
      communities.map(async (community) => {
        const membership = await db
          .select({
            is_approved: PAGE_MEMBERS.is_approved,
          })
          .from(PAGE_MEMBERS)
          .where(
            and(
              eq(PAGE_MEMBERS.page_id, community.id),
              eq(PAGE_MEMBERS.user_id, userId)
            )
          )
          .limit(1);

        let membership_status = 'none';
        if (membership.length > 0) {
          membership_status = membership[0].is_approved ? 'member' : 'pending';
        }

        return {
          ...community,
          membership_status,
        };
      })
    );

    return NextResponse.json({ communities: communitiesWithStatus });
  } catch (error) {
    console.error("Error searching communities:", error);
    return NextResponse.json({ message: "Failed to search communities" }, { status: 500 });
  }
}
