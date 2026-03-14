// app/api/news/trending/route.js
import { db } from "@/utils";
import { MAP_NEWS, MAP_NEWS_VIEWS, MAP_NEWS_CATEGORIES, LANGUAGES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { desc, count, gte, eq, sql } from "drizzle-orm";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;
    const hours = parseInt(searchParams.get("hours")) || 24;
    const type = searchParams.get("type") || "trending"; // "trending" or "latest"

    if (type === "latest") {
      const latestNews = await db
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
        .orderBy(desc(MAP_NEWS.created_at))
        .limit(limit);

      return NextResponse.json({ news: latestNews }, { status: 200 });
    }

    // Trending
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const trendingNews = await db
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
        view_count: count(MAP_NEWS_VIEWS.id).as("view_count"),
      })
      .from(MAP_NEWS)
      .leftJoin(MAP_NEWS_VIEWS, eq(MAP_NEWS.id, MAP_NEWS_VIEWS.news_id))
      .leftJoin(MAP_NEWS_CATEGORIES, eq(MAP_NEWS.category_id, MAP_NEWS_CATEGORIES.id))
      .leftJoin(LANGUAGES, eq(MAP_NEWS.language_id, LANGUAGES.id))
      .where(gte(MAP_NEWS_VIEWS.viewed_at, timeThreshold))
      .groupBy(MAP_NEWS.id)
      .orderBy(desc(sql`view_count`))
      .limit(limit);

    return NextResponse.json({ news: trendingNews }, { status: 200 });
  } catch (error) {
    console.error("Trending/Latest API Error:", error);
    return NextResponse.json(
      { message: "Error fetching news", details: error.message },
      { status: 500 }
    );
  }
}
