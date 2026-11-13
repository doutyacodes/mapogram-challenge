// GET /api/challenges/:challengeId/activity - People tab (who completed it) and the
// page leaderboard for a challenge's detail panel
import { NextResponse } from "next/server";
import { getChallengeActivity, getUserId, toId } from "@/utils/challengePages";

export async function GET(req, { params }) {
  const challengeId = toId((await params).challengeId);
  if (!challengeId) return NextResponse.json({ message: "Invalid challenge id" }, { status: 400 });

  try {
    const activity = await getChallengeActivity(challengeId, getUserId(req));
    if (!activity) return NextResponse.json({ message: "Challenge not found" }, { status: 404 });
    return NextResponse.json(activity);
  } catch (error) {
    console.error("GET /api/challenges/:id/activity failed:", error);
    return NextResponse.json({ message: "Failed to load activity" }, { status: 500 });
  }
}
