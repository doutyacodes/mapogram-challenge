import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { POST_CATEGORY_TEMPLATES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        label: POST_CATEGORY_TEMPLATES.label,
        description: POST_CATEGORY_TEMPLATES.description,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        gradient_class_name: POST_CATEGORY_TEMPLATES.gradient_class_name
      })
      .from(POST_CATEGORY_TEMPLATES)
      .where(eq(POST_CATEGORY_TEMPLATES.post_type, 'complaints'))
      .orderBy(POST_CATEGORY_TEMPLATES.name);

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching complaint categories:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch categories" }, { status: 500 });
  }
}