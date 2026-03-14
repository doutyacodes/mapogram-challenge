// /api/classifieds/electronics-brands/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { ELECTRONICS_BRANDS } from '@/utils/schema/classifieds_schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json({ success: false, message: "Category required" }, { status: 400 });
    }

    const brands = await db
      .select({
        id: ELECTRONICS_BRANDS.id,
        name: ELECTRONICS_BRANDS.name,
        category: ELECTRONICS_BRANDS.category
      })
      .from(ELECTRONICS_BRANDS)
      .where(
        and(
          eq(ELECTRONICS_BRANDS.category, category),
          eq(ELECTRONICS_BRANDS.is_active, true)
        )
      );

    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error("Error fetching electronics brands:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch electronics brands" }, { status: 500 });
  }
}