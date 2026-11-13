// GET /api/challenge-pages/:id - header data and district outlines of a challenge page
import { NextResponse } from "next/server";
import { getChallengePage, toId } from "@/utils/challengePages";

export async function GET(req, { params }) {
  const pageId = toId((await params).id);
  if (!pageId) return NextResponse.json({ message: "Invalid page id" }, { status: 400 });

  try {
    const data = await getChallengePage(pageId);
    if (!data) return NextResponse.json({ message: "Challenge page not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/challenge-pages/:id failed:", error);
    return NextResponse.json({ message: "Failed to load challenge page" }, { status: 500 });
  }
}
