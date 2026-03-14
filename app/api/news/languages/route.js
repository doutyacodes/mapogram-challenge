import { db } from "@/utils";
import { LANGUAGES } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

export async function GET(req) {
  try {
    // Fetch all languages
    const languages = await db
      .select()
      .from(LANGUAGES)
      .orderBy(asc(LANGUAGES.name));

    // Send the languages as a JSON response
    return NextResponse.json(
      { languages },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      { message: "Error fetching languages", details: error.message },
      { status: 500 }
    );
  }
}