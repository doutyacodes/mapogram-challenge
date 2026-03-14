// /api/classifieds/vehicle-brands/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { VEHICLE_BRANDS } from '@/utils/schema/classifieds_schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleType = searchParams.get('type');

    if (!vehicleType) {
      return NextResponse.json({ success: false, message: "Vehicle type required" }, { status: 400 });
    }

    const brands = await db
      .select({
        id: VEHICLE_BRANDS.id,
        name: VEHICLE_BRANDS.name,
        vehicle_type: VEHICLE_BRANDS.vehicle_type
      })
      .from(VEHICLE_BRANDS)
      .where(
        and(
          eq(VEHICLE_BRANDS.vehicle_type, vehicleType),
          eq(VEHICLE_BRANDS.is_active, true)
        )
      );

    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error("Error fetching vehicle brands:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch vehicle brands" }, { status: 500 });
  }
}

