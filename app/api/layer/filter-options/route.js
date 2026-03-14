// Place this in: /api/filter-options/route.js

import { db } from "@/utils";
import { EDUCATION_QUALIFICATIONS, LANGUAGES, SKILLS } from "@/utils/schema/schema";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // 'job' or 'news'

    if (type === 'job') {
      // Fetch all skills
      const skills = await db
        .select({
          id: SKILLS.id,
          name: SKILLS.name,
        })
        .from(SKILLS)
        .orderBy(SKILLS.name);

      // Fetch all education qualifications
      const educations = await db
        .select({
          id: EDUCATION_QUALIFICATIONS.id,
          name: EDUCATION_QUALIFICATIONS.name,
        })
        .from(EDUCATION_QUALIFICATIONS)
        .orderBy(EDUCATION_QUALIFICATIONS.name);

      return NextResponse.json({
        skills,
        educations,
        jobTypes: ["Internship", "Jobs", "Gigs", "Others"],
        locationTypes: ["remote", "onsite", "hybrid"],
      });
    }

    if (type === 'news') {
      // Fetch all languages
      const languages = await db
        .select({
          id: LANGUAGES.id,
          name: LANGUAGES.name,
          code: LANGUAGES.code,
        })
        .from(LANGUAGES)
        .orderBy(LANGUAGES.name);

      return NextResponse.json({
        languages,
        newsTypes: [
          { id: 'all', name: 'All News' },
          { id: 'latest', name: 'Latest (10)' },
          { id: 'priority', name: 'High Priority' },
          { id: 'breaking', name: 'Breaking News' },
        ],
      });
    }

    return NextResponse.json({ message: "Invalid type parameter" }, { status: 400 });

  } catch (err) {
    console.error("Filter Options API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}