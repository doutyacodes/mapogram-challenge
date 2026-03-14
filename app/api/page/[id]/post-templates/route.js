// /api/pages/[pageId]/post-templates/route.js
import { db } from '@/utils';
import { PAGES, POST_CATEGORY_TEMPLATES, PAGE_TYPE_CATEGORY_PERMISSIONS } from '@/utils/schema/schema';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id: pageId } = params;

    if (!pageId) {
      return NextResponse.json({ message: 'Page ID is required' }, { status: 400 });
    }

    // Optional: Verify authentication (uncomment if needed)
    /*
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    */

    // Get the page details to find page_type_id
    const page = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        page_type_id: PAGES.page_type_id,
      })
      .from(PAGES)
      .where(eq(PAGES.id, parseInt(pageId)))
      .limit(1);

    if (page.length === 0) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    }

    const pageData = page[0];

    if (!pageData.page_type_id) {
      return NextResponse.json({ 
        message: 'Page type not configured', 
        templates: [] 
      }, { status: 200 });
    }

    // Get allowed category templates for this page type
    const allowedTemplates = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name,
        gradient_class_name: POST_CATEGORY_TEMPLATES.gradient_class_name, // New gradient field
        post_type: POST_CATEGORY_TEMPLATES.post_type,
        label: POST_CATEGORY_TEMPLATES.label,
        description: POST_CATEGORY_TEMPLATES.description,
      })
      .from(POST_CATEGORY_TEMPLATES)
      .innerJoin(
        PAGE_TYPE_CATEGORY_PERMISSIONS,
        eq(POST_CATEGORY_TEMPLATES.id, PAGE_TYPE_CATEGORY_PERMISSIONS.category_template_id)
      )
      .where(eq(PAGE_TYPE_CATEGORY_PERMISSIONS.page_type_id, pageData.page_type_id));

    // Group by post_type to show only unique post types
    const uniqueTemplates = [];
    const seenPostTypes = new Set();

    for (const template of allowedTemplates) {
      if (!seenPostTypes.has(template.post_type)) {
        seenPostTypes.add(template.post_type);
        uniqueTemplates.push(template);
      }
    }

    return NextResponse.json({
      success: true,
      pageId: pageData.id,
      pageName: pageData.name,
      pageTypeId: pageData.page_type_id,
      templates: uniqueTemplates,
    });

  } catch (error) {
    console.error("Page Templates API Error:", error);
    return NextResponse.json({ 
      message: "Error fetching page templates",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}