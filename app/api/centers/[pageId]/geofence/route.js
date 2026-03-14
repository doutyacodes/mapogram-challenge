import { db } from "@/utils";
import { PAGE_GEOFENCES } from "@/utils/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(request, { params }) {
  try {
    const { pageId:id } = params;
    
    // Query your database for the geofence
    const geofence = await db
      .select()
      .from(PAGE_GEOFENCES)
      .where(eq(PAGE_GEOFENCES.page_id, parseInt(id)))
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