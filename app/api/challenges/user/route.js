import { db } from "@/utils";
import { USER_CHALLENGES, CHALLENGES } from "@/utils/schema/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    let userId = 1; // Default to Guest account Tony Stark if unauthorized

    if (session && session.user) {
      userId = session.user.id;
    }

    // Fetch all user mapped challenges
    const results = await db.select({
       user_challenge: USER_CHALLENGES,
       challenge: CHALLENGES
    })
    .from(USER_CHALLENGES)
    .innerJoin(CHALLENGES, eq(USER_CHALLENGES.challenge_id, CHALLENGES.id))
    .where(eq(USER_CHALLENGES.user_id, userId));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("GET user_challenges error:", error);
    return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    let userId = 1; // Default logic for testing (Tony Stark)

    if (session && session.user) {
      userId = session.user.id;
    }

    const body = await req.json();
    const { challenge_id, status } = body; // status can be "accepted" or "completed"

    if (!challenge_id || !status) {
      return NextResponse.json({ success: false, message: "Missing challenge_id or status" }, { status: 400 });
    }

    // Check if it already exists
    const existing = await db.select()
      .from(USER_CHALLENGES)
      .where(and(
        eq(USER_CHALLENGES.user_id, userId),
        eq(USER_CHALLENGES.challenge_id, challenge_id)
      ));

    if (existing.length > 0) {
      // Update
      await db.update(USER_CHALLENGES)
        .set({ status, end_date: status === 'completed' ? new Date() : null })
        .where(eq(USER_CHALLENGES.id, existing[0].id));
    } else {
      // Insert
      await db.insert(USER_CHALLENGES).values({
        user_id: userId,
        challenge_id,
        status,
        is_accepted: true
      });
    }

    return NextResponse.json({ success: true, message: `Challenge ${status} successfully.` });
  } catch (error) {
    console.error("POST user_challenges error:", error);
    return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}
