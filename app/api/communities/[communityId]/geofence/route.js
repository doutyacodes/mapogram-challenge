import { db } from "@/utils";
import { COMMUNITY_GEOFENCES } from "@/utils/schema/community_schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(request, { params }) {
  try {
    const { communityId:id } = params;
    
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