// POST /api/challenges/people/:peopleId/like - like / unlike a People entry
import { NextResponse } from "next/server";
import { getUserId, toId, togglePeopleLike } from "@/utils/challengePages";

export async function POST(req, { params }) {
  const peopleId = toId((await params).peopleId);
  if (!peopleId) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ message: "Sign in to like" }, { status: 401 });

  try {
    const result = await togglePeopleLike(peopleId, userId);
    if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/challenges/people/:id/like failed:", error);
    return NextResponse.json({ message: "Failed to update like" }, { status: 500 });
  }
}
