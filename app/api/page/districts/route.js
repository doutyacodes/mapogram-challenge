import { db } from "@/utils";
import { 
  DISTRICTS,
  PAGES,
  PAGE_PROFILES
} from "@/utils/schema/schema";
import { eq, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let query = db
      .select({
        id: DISTRICTS.id,
        name: DISTRICTS.name,
        description: DISTRICTS.description,
        image_url: DISTRICTS.image_url,
        latitude: DISTRICTS.latitude,
        longitude: DISTRICTS.longitude,
        page_id: DISTRICTS.page_id,
        geojson: DISTRICTS.geojson, // Extracted directly from districts table now!
        // Page data (The parent, i.e., Kerala)
        page_name: PAGES.name,
        page_username: PAGES.username,
        // Profile data
        profile_pic_url: PAGE_PROFILES.profile_pic_url,
        bio: PAGE_PROFILES.bio
      })
      .from(DISTRICTS)
      .innerJoin(PAGES, eq(DISTRICTS.page_id, PAGES.id))
      .leftJoin(PAGE_PROFILES, eq(PAGES.id, PAGE_PROFILES.page_id));

    if (search) {
      query = query.where(
        or(
          like(DISTRICTS.name, `%${search}%`),
          like(DISTRICTS.description, `%${search}%`)
        )
      );
    }

    const results = await query;
    return NextResponse.json({ success: true, data: results });

  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
