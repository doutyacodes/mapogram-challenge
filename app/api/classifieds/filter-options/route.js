import { db } from "@/utils";
import { NextResponse } from "next/server";
import { POST_CATEGORY_TEMPLATES} from "@/utils/schema/schema";
import { 
  CLASSIFIED_SUB_CATEGORIES,
  VEHICLE_BRANDS,
  ELECTRONICS_BRANDS
} from "@/utils/schema/classifieds_schema";
import { eq } from "drizzle-orm";

export async function GET(req) {
  try {
    // Fetch all categories that have classifieds sub-categories
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
      })
      .from(POST_CATEGORY_TEMPLATES)
      .innerJoin(
        CLASSIFIED_SUB_CATEGORIES,
        eq(POST_CATEGORY_TEMPLATES.id, CLASSIFIED_SUB_CATEGORIES.main_category_id)
      )
      .groupBy(POST_CATEGORY_TEMPLATES.id, POST_CATEGORY_TEMPLATES.name);

    // Fetch all sub-categories
    const subCategories = await db
      .select({
        id: CLASSIFIED_SUB_CATEGORIES.id,
        name: CLASSIFIED_SUB_CATEGORIES.name,
        slug: CLASSIFIED_SUB_CATEGORIES.slug,
        main_category_id: CLASSIFIED_SUB_CATEGORIES.main_category_id,
      })
      .from(CLASSIFIED_SUB_CATEGORIES)
      .where(eq(CLASSIFIED_SUB_CATEGORIES.is_active, true));

    // Fetch vehicle brands
    const vehicleBrands = await db
      .select({
        id: VEHICLE_BRANDS.id,
        name: VEHICLE_BRANDS.name,
        vehicle_type: VEHICLE_BRANDS.vehicle_type,
      })
      .from(VEHICLE_BRANDS)
      .where(eq(VEHICLE_BRANDS.is_active, true))
      .orderBy(VEHICLE_BRANDS.name);

    // Fetch electronics brands
    const electronicsBrands = await db
      .select({
        id: ELECTRONICS_BRANDS.id,
        name: ELECTRONICS_BRANDS.name,
        category: ELECTRONICS_BRANDS.category,
      })
      .from(ELECTRONICS_BRANDS)
      .where(eq(ELECTRONICS_BRANDS.is_active, true))
      .orderBy(ELECTRONICS_BRANDS.name);

    return NextResponse.json({
      categories,
      subCategories,
      vehicleBrands,
      electronicsBrands,
    });

  } catch (error) {
    console.error("Error fetching classifieds filter options:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}