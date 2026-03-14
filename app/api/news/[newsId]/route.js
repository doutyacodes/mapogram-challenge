import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { MAP_NEWS, MAP_NEWS_CATEGORIES, LANGUAGES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { newsId } = params;
    
    const news = await db
      .select({
        id: MAP_NEWS.id,
        title: MAP_NEWS.title,
        image_url: MAP_NEWS.image_url,
        summary: MAP_NEWS.summary,
        source_name: MAP_NEWS.source_name,
      })
      .from(MAP_NEWS)
      .where(eq(MAP_NEWS.id, parseInt(newsId)))
      .limit(1);

    if (!news || news.length === 0) {
      return NextResponse.json({ message: "News not found" }, { status: 404 });
    }

    return NextResponse.json(news[0]);
  } catch (error) {
    console.error("Individual News API Error:", error);
    return NextResponse.json({ message: "Error fetching news data" }, { status: 500 });
  }
}