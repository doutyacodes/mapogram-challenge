import { db } from "@/utils";
import { USER_POST_VIEWS } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { postId } = await req.json();
    
    if (!postId) {
      return NextResponse.json(
        { message: "News ID is required" },
        { status: 400 }
      );
    }

  const token = req.cookies.get('user_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Check if this User has already viewed this post in the past hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const existingView = await db
    .select()
    .from(USER_POST_VIEWS)
    .where(
      and(
        eq(USER_POST_VIEWS.post_id, postId),
        eq(USER_POST_VIEWS.user_id, userId),
        gte(USER_POST_VIEWS.viewed_at, oneHourAgo)
      )
  )
  .limit(1);

  if (existingView.length > 0) {
    return NextResponse.json(
      { message: "View already recorded recently" },
      { status: 200 }
    );
  }

    // Insert new view record
    await db.insert(USER_POST_VIEWS).values({
      post_id: postId,
      user_id: userId,
      viewed_at: new Date()
    });

    return NextResponse.json(
      { message: "View tracked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { message: "Error tracking view", details: error.message },
      { status: 500 }
    );
  }
}