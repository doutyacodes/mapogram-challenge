// app\api\posts\categories
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGE_ROLE_CATEGORY_MAP, POST_CATEGORY_TEMPLATES } from '@/utils/schema/schema';
import { eq, distinct } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ success: false, message: "Page ID is required" }, { status: 400 });
    }

    console.log('Fetching categories from database for page:', pageId);
    
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        label: POST_CATEGORY_TEMPLATES.label,
        description: POST_CATEGORY_TEMPLATES.description,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        gradient_class_name: POST_CATEGORY_TEMPLATES.gradient_class_name,
        post_type: POST_CATEGORY_TEMPLATES.post_type,
        class_name: POST_CATEGORY_TEMPLATES.class_name,
        shape: POST_CATEGORY_TEMPLATES.shape,
      })
      .from(PAGE_ROLE_CATEGORY_MAP)
      .innerJoin(
        POST_CATEGORY_TEMPLATES,
        eq(PAGE_ROLE_CATEGORY_MAP.category_id, POST_CATEGORY_TEMPLATES.id)
      )
      .where(
        eq(PAGE_ROLE_CATEGORY_MAP.page_id, parseInt(pageId))
      )
      .groupBy(POST_CATEGORY_TEMPLATES.id) // This removes duplicates
      .orderBy(POST_CATEGORY_TEMPLATES.name);

    console.log(`Found ${categories.length} unique categories for page ${pageId}`);

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching post categories:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch categories" }, { status: 500 });
  }
}