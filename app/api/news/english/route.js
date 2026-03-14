// app/api/news/english/route.js
import { db } from "@/utils";
import { MAP_NEWS, MAP_NEWS_CATEGORIES, LANGUAGES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Find language ID for English
    const english = await db
      .select()
      .from(LANGUAGES)
      .where(eq(LANGUAGES.code, "en"))
      .limit(1);

    if (!english || english.length === 0) {
      return NextResponse.json({ news: [] });
    }

    const englishLanguageId = english[0].id;

    const englishNews = await db
      .select({
        id: MAP_NEWS.id,
        title: MAP_NEWS.title,
        image_url: MAP_NEWS.image_url,
        article_url: MAP_NEWS.article_url,
        summary: MAP_NEWS.summary,
        source_name: MAP_NEWS.source_name,
        latitude: MAP_NEWS.latitude,
        longitude: MAP_NEWS.longitude,
        category: MAP_NEWS_CATEGORIES.name,
        language: LANGUAGES.name,
        language_code: LANGUAGES.code,
        created_at: MAP_NEWS.created_at,
        is_high_priority: MAP_NEWS.is_high_priority,
        is_breaking: MAP_NEWS.is_breaking,
        breaking_expire_at: MAP_NEWS.breaking_expire_at,
      })
      .from(MAP_NEWS)
      .leftJoin(MAP_NEWS_CATEGORIES, eq(MAP_NEWS.category_id, MAP_NEWS_CATEGORIES.id))
      .leftJoin(LANGUAGES, eq(MAP_NEWS.language_id, LANGUAGES.id))
      .where(eq(MAP_NEWS.language_id, englishLanguageId))
      .orderBy(MAP_NEWS.created_at)

    return NextResponse.json({ news: englishNews }, { status: 200 });
  } catch (error) {
    console.error("English News API Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch English news", error: error.message },
      { status: 500 }
    );
  }
}
