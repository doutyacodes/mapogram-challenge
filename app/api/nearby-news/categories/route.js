import { db } from "@/utils";
import { HYPERLOCAL_CATEGORIES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware";
import { asc } from "drizzle-orm";

export async function GET(req) {
  try {
    const categories = await db.select().from(HYPERLOCAL_CATEGORIES);
    
    return NextResponse.json({
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error("Error fetching hyperlocal categories:", error);
    return NextResponse.json(
      { message: "Error fetching categories", details: error.message },
      { status: 500 }
    );
  }
}