// /api/classifieds/categories/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { POST_CATEGORY_TEMPLATES, CATEGORY_LAYER_MAP } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch categories that are mapped to layer_id = 5 (classifieds layer)
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        gradient_class_name: POST_CATEGORY_TEMPLATES.gradient_class_name
      })
      .from(POST_CATEGORY_TEMPLATES)
      .innerJoin(CATEGORY_LAYER_MAP, eq(POST_CATEGORY_TEMPLATES.id, CATEGORY_LAYER_MAP.category_id))
      .where(eq(CATEGORY_LAYER_MAP.layer_id, 6));

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch categories" }, { status: 500 });
  }
}