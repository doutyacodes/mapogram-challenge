import { db } from "@/utils";
import { COMMUNITY_GEOFENCES } from "@/utils/schema/community_schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Challenge pages (state tourism etc.) are not communities: their outlines come from
// /api/challenge-pages/:id.
export async function GET(request, props) {
  const params = await props.params;
  try {
    const resolvedParams = await params;
    const { communityId:id } = resolvedParams;

    // Query your database for the geofence
    const geofence = await db
      .select()
      .from(COMMUNITY_GEOFENCES)
      .where(eq(COMMUNITY_GEOFENCES.community_id, parseInt(id)))
      .limit(1);
    
    if (!geofence || geofence.length === 0) {
      return NextResponse.json({ geofence: null }, { status: 404 });
    }
    
    return NextResponse.json({ geofence: geofence[0] });
  } catch (error) {
    console.error('Error fetching geofence:', error);
    return NextResponse.json({ error: 'Failed to fetch geofence' }, { status: 500 });
  }
}