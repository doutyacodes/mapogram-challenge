// /api/page/posts/categories/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGES, PAGE_TYPE_CATEGORY_PERMISSIONS, POST_CATEGORY_TEMPLATES } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const postType = searchParams.get('postType');
    const pageId = searchParams.get('pageId');

    if (!postType || !pageId) {
      return NextResponse.json({ message: "Missing postType or pageId" }, { status: 400 });
    }

    // 1. Get page_type_id from the pageId
    const [page] = await db
      .select({ page_type_id: PAGES.page_type_id })
      .from(PAGES)
      .where(eq(PAGES.id, Number(pageId)));

    if (!page?.page_type_id) {
      return NextResponse.json({ message: "Page not found or has no page type" }, { status: 404 });
    }

    // 2. Get allowed categories for this page_type_id filtered by postType
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name,
        gradient_class_name: POST_CATEGORY_TEMPLATES.gradient_class_name,
        post_type: POST_CATEGORY_TEMPLATES.post_type,
        label: POST_CATEGORY_TEMPLATES.label,
        description: POST_CATEGORY_TEMPLATES.description,
      })
      .from(POST_CATEGORY_TEMPLATES)
      .innerJoin(
        PAGE_TYPE_CATEGORY_PERMISSIONS,
        eq(PAGE_TYPE_CATEGORY_PERMISSIONS.category_template_id, POST_CATEGORY_TEMPLATES.id)
      )
      .where(
        and(
          eq(PAGE_TYPE_CATEGORY_PERMISSIONS.page_type_id, page.page_type_id),
          eq(POST_CATEGORY_TEMPLATES.post_type, postType)
        )
      );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
  }
}
