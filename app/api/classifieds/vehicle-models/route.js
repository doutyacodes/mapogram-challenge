// /api/classifieds/vehicle-models/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { VEHICLE_MODELS } from '@/utils/schema/classifieds_schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ success: false, message: "Brand ID required" }, { status: 400 });
    }

    const models = await db
      .select({
        id: VEHICLE_MODELS.id,
        name: VEHICLE_MODELS.name,
        brand_id: VEHICLE_MODELS.brand_id
      })
      .from(VEHICLE_MODELS)
      .where(
        and(
          eq(VEHICLE_MODELS.brand_id, parseInt(brandId)),
          eq(VEHICLE_MODELS.is_active, true)
        )
      );

    return NextResponse.json({ success: true, models });
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch vehicle models" }, { status: 500 });
  }
}