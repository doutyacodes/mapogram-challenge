// /api/classifieds/subcategories/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { CLASSIFIED_SUB_CATEGORIES } from '@/utils/schema/classifieds_schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ success: false, message: "Category ID required" }, { status: 400 });
    }

    const subCategories = await db
      .select({
        id: CLASSIFIED_SUB_CATEGORIES.id,
        name: CLASSIFIED_SUB_CATEGORIES.name,
        main_category_id: CLASSIFIED_SUB_CATEGORIES.main_category_id
      })
      .from(CLASSIFIED_SUB_CATEGORIES)
      .where(eq(CLASSIFIED_SUB_CATEGORIES.main_category_id, parseInt(categoryId)));

    return NextResponse.json({ success: true, subCategories });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch subcategories" }, { status: 500 });
  }
}