// /api/complaints/brands/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { BRANDS, PRODUCTS } from '@/utils/schema/complaints_schema';
import { eq, inArray, distinct } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // 'appliance' or 'vehicle'

    let productCategories = [];
    if (category === 'appliance') {
      productCategories = ['appliance'];
    } else if (category === 'vehicle') {
      productCategories = ['two_wheeler', 'four_wheeler'];
    }

    // Get brands that have products in the specified categories
    const brandsWithProducts = await db
      .select({
        id: BRANDS.id,
        name: BRANDS.name,
        description: BRANDS.description
      })
      .from(BRANDS)
      .innerJoin(PRODUCTS, eq(BRANDS.id, PRODUCTS.brand_id))
      .where(inArray(PRODUCTS.category, productCategories))
      .groupBy(BRANDS.id)
      .orderBy(BRANDS.name);

    return NextResponse.json({ success: true, brands: brandsWithProducts });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch brands" }, { status: 500 });
  }
}