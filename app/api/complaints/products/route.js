// /api/complaints/products/route.js (Updated)
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PRODUCTS } from '@/utils/schema/complaints_schema';
import { and, eq, inArray } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const category = searchParams.get('category'); // 'appliance' or 'vehicle'

    if (!brandId) {
      return NextResponse.json({ success: false, message: "Brand ID required" }, { status: 400 });
    }

    let productCategories = [];
    if (category === 'appliance') {
      productCategories = ['appliance'];
    } else if (category === 'vehicle') {
      productCategories = ['two_wheeler', 'four_wheeler'];
    }

    const products = await db
      .select({
        id: PRODUCTS.id,
        name: PRODUCTS.name,
        category: PRODUCTS.category,
        description: PRODUCTS.description
      })
      .from(PRODUCTS)
      .where(
        and(
          eq(PRODUCTS.brand_id, parseInt(brandId)),
          inArray(PRODUCTS.category, productCategories)
        )
      )
      .orderBy(PRODUCTS.name);

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 });
  }
}