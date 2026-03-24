import { db } from "@/utils";
import { COMMUNITY_GEOFENCES } from "@/utils/schema/community_schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


import path from 'path';
import fs from 'fs';

export async function GET(request, { params }) {
  try {
    const { communityId:id } = params;
    
    // Tourism Mock Bypass
    if (id === '999991' || id === '999992') {
      const fileName = id === '999991' ? 'kerala.json' : 'karnataka.json';
      const filePath = path.join(process.cwd(), 'public', 'geojson', fileName);
      
      try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const geojson = JSON.parse(fileData);
        
        // Return in the format expected by the frontend (array or object with geofence property)
        // CommunityView.jsx seems to expect geofence[0] from an array if fetched via /api/communities?communityId=
        // but this RESTful endpoint returns { geofence: ... }
        // Let's check PageView.jsx again.
        return NextResponse.json({ 
          geofence: {
            id: parseInt(id),
            community_id: parseInt(id),
            geojson: geojson
          } 
        });
      } catch (error) {
        console.error(`Error reading mock geofence ${fileName}:`, error);
        return NextResponse.json({ geofence: null }, { status: 500 });
      }
    }

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