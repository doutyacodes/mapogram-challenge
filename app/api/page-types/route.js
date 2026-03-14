// app\api\page-types\route.js
import { NextResponse } from "next/server";
import { db } from "@/utils";
import { PAGE_TYPES } from "@/utils/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = db.select().from(PAGE_TYPES);
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.where(eq(PAGE_TYPES.category, category));
    }
    
    const pageTypes = await query.orderBy(PAGE_TYPES.name);

    return NextResponse.json(
      {
        message: "Page types fetched successfully",
        pageTypes: pageTypes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching page types:", error);
    return NextResponse.json(
      { message: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}