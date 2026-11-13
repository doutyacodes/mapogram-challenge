// GET /api/challenge-pages/:id/progress - the signed-in user's accepted items,
// completed item ids and points on this page. Guests get an empty result.
import { NextResponse } from "next/server";
import { getUserId, getUserProgress, toId } from "@/utils/challengePages";

export async function GET(req, { params }) {
  const pageId = toId((await params).id);
  if (!pageId) return NextResponse.json({ message: "Invalid page id" }, { status: 400 });

  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ signedIn: false, accepted: [], completedIds: [], totalPoints: 0 });
  }

  try {
    const progress = await getUserProgress(userId, pageId);
    return NextResponse.json({ signedIn: true, ...progress });
  } catch (error) {
    console.error("GET /api/challenge-pages/:id/progress failed:", error);
    return NextResponse.json({ message: "Failed to load progress" }, { status: 500 });
  }
}
