// app/api/news/map/route.js
import { db } from "@/utils";
import { MAP_NEWS, MAP_NEWS_CATEGORIES, LANGUAGES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { and, eq, gte, lte, sql, or } from "drizzle-orm";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    
    // Extract bounding box parameters from query string (if present)
    const north = url.searchParams.get('north');
    const south = url.searchParams.get('south');
    const east = url.searchParams.get('east');
    const west = url.searchParams.get('west');
    
    // Build query based on whether map bounds are provided
    let query = db
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

    const whereConditions = [];

    // Apply geographic filtering if bounds are provided
    if (north && south && east && west) {
      whereConditions.push(
        gte(MAP_NEWS.latitude, parseFloat(south)),
        lte(MAP_NEWS.latitude, parseFloat(north))
      );
      
      // Handle cases where the map crosses the 180th meridian
      if (east < west) {
        whereConditions.push(
          or(
            gte(MAP_NEWS.longitude, parseFloat(west)),
            lte(MAP_NEWS.longitude, parseFloat(east))
          )
        );
      } else {
        whereConditions.push(
          gte(MAP_NEWS.longitude, parseFloat(west)),
          lte(MAP_NEWS.longitude, parseFloat(east))
        );
      }
    }

    // Apply language filtering - if no languages specified, use condition that returns no results
    const languages = url.searchParams.get('languages');
    console.log("languages", languages)
    
    if (languages) {
      const languageCodes = languages.split(',').map(code => code.trim());
      whereConditions.push(
        sql`${LANGUAGES.code} IN (${sql.join(languageCodes, sql`, `)})`
      );
    } else {
      // When no languages specified, add condition that returns no results
      whereConditions.push(sql`1 = 0`);
    }

    // Apply where conditions if any exist
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    // Execute the query
    // const news = await query.orderBy(sql`${MAP_NEWS.created_at} DESC`);
     const news = await query.orderBy(
      sql`${MAP_NEWS.is_high_priority} DESC, ${MAP_NEWS.created_at} DESC`
    );

    // Return the news data
    return NextResponse.json(news);
  } catch (error) {
    console.error("News Map API Error:", error);
    return NextResponse.json(
      { message: "Error fetching news data" },
      { status: 500 }
    );
  }
}