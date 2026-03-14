// /api/posts/categories/route.js - Get categories from USER_CATEGORY_PERMISSIONS
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USERS, POST_CATEGORY_TEMPLATES, USER_CATEGORY_PERMISSIONS } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    // Fetch categories that are allowed (common for all users)
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name,
        post_type: POST_CATEGORY_TEMPLATES.post_type,
      })
      .from(POST_CATEGORY_TEMPLATES)
      .innerJoin(
        USER_CATEGORY_PERMISSIONS,
        eq(USER_CATEGORY_PERMISSIONS.category_template_id, POST_CATEGORY_TEMPLATES.id)
      );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
  }
}
