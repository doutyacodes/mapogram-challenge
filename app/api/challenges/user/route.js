// /api/challenges/user - the signed-in user's challenges
//   GET  -> [{ user_challenge, challenge }]
//   POST { challenge_id, status, media_url? } -> accept / complete a challenge
//
// The user comes from the user_token cookie. (This used to call getServerSession(),
// which never returned an id, so every request fell back to one hard-coded account.)
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/utils";
import { USER_CHALLENGES, CHALLENGES } from "@/utils/schema/schema";
import { PROGRESS_STATUSES, getUserId, recordProgress, toId } from "@/utils/challengePages";

export async function GET(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: true, data: [] });

  try {
    const results = await db
      .select({ user_challenge: USER_CHALLENGES, challenge: CHALLENGES })
      .from(USER_CHALLENGES)
      .innerJoin(CHALLENGES, eq(USER_CHALLENGES.challenge_id, CHALLENGES.id))
      .where(eq(USER_CHALLENGES.user_id, userId));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("GET user_challenges error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Sign in to save your progress" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const challengeId = toId(body?.challenge_id);
  const status = body?.status;
  if (!challengeId || !PROGRESS_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, message: `challenge_id and status (${PROGRESS_STATUSES.join(", ")}) are required` },
      { status: 400 }
    );
  }

  // Optional proof image shown on the People tab
  let mediaUrl = null;
  if (body.media_url) {
    try {
      const url = new URL(String(body.media_url));
      if (url.protocol === "https:" || url.protocol === "http:") mediaUrl = url.toString().slice(0, 255);
    } catch {
      /* ignore an invalid URL */
    }
  }

  try {
    const result = await recordProgress(userId, challengeId, status, status === "completed" ? mediaUrl : null);
    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: result.code });
    }
    return NextResponse.json({ success: true, message: `Challenge ${result.status} successfully.`, ...result });
  } catch (error) {
    console.error("POST user_challenges error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
