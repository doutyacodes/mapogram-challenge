import { db } from "@/utils";
import { HYPERLOCAL_NEWS, HYPERLOCAL_CATEGORIES, USER_DETAILS } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: "Invalid article ID" },
        { status: 400 }
      );
    }

    // Join query to get article with category name and author name
    const articles = await db
      .select({
        id: HYPERLOCAL_NEWS.id,
        title: HYPERLOCAL_NEWS.title,
        content: HYPERLOCAL_NEWS.content,
        image_url: HYPERLOCAL_NEWS.image_url,
        created_at: HYPERLOCAL_NEWS.created_at,
        category_name: HYPERLOCAL_CATEGORIES.name,
        author_name: USER_DETAILS.name,
      })
      .from(HYPERLOCAL_NEWS)
      .leftJoin(
        HYPERLOCAL_CATEGORIES,
        eq(HYPERLOCAL_NEWS.category_id, HYPERLOCAL_CATEGORIES.id)
      )
      .leftJoin(
        USER_DETAILS,
        eq(HYPERLOCAL_NEWS.created_by, USER_DETAILS.id)
      )
      .where(eq(HYPERLOCAL_NEWS.id, parseInt(id)));

    if (!articles.length) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    // Since we're fetching by PK, there should be only one result
    const article = articles[0];

    return NextResponse.json(
      { article },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { message: "Error fetching article", details: error.message },
      { status: 500 }
    );
  }
}