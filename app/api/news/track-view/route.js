import { db } from "@/utils";
import { MAP_NEWS_VIEWS } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";

export async function POST(req) {
  try {
    const { newsId } = await req.json();
    
    if (!newsId) {
      return NextResponse.json(
        { message: "News ID is required" },
        { status: 400 }
      );
    }

    // Get client IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(", ")[0] : req.ip || "unknown";

    // Check if this IP has already viewed this news in the past hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const existingView = await db
      .select()
      .from(MAP_NEWS_VIEWS)
      .where(
        and(
          eq(MAP_NEWS_VIEWS.news_id, newsId),
          eq(MAP_NEWS_VIEWS.ip_address, ip),
          gte(MAP_NEWS_VIEWS.viewed_at, oneHourAgo)
        )
      )
      .limit(1);

    if (existingView.length > 0) {
      return NextResponse.json(
        { message: "View already recorded recently" },
        { status: 200 }
      );
    }

    // Insert new view record
    await db.insert(MAP_NEWS_VIEWS).values({
      news_id: newsId,
      ip_address: ip,
      viewed_at: new Date()
    });

    return NextResponse.json(
      { message: "View tracked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { message: "Error tracking view", details: error.message },
      { status: 500 }
    );
  }
}