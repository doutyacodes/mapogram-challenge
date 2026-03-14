import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_FOLLOWED_LAYERS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

// Follow a layer
export async function POST(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const { id: layerId } = params;

    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(USER_FOLLOWED_LAYERS)
      .where(and(
        eq(USER_FOLLOWED_LAYERS.user_id, userId),
        eq(USER_FOLLOWED_LAYERS.layer_id, parseInt(layerId))
      ));

    if (existingFollow) {
      return NextResponse.json({ message: "Already following this layer" }, { status: 400 });
    }

    // Add follow relationship
    await db.insert(USER_FOLLOWED_LAYERS).values({
      user_id: userId,
      layer_id: parseInt(layerId)
    });

    return NextResponse.json({ message: "Successfully followed layer" });
  } catch (error) {
    console.error("Error following layer:", error);
    return NextResponse.json({ message: "Failed to follow layer" }, { status: 500 });
  }
}

// Unfollow a layer
export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    const { id: layerId } = params;

    await db
      .delete(USER_FOLLOWED_LAYERS)
      .where(and(
        eq(USER_FOLLOWED_LAYERS.user_id, userId),
        eq(USER_FOLLOWED_LAYERS.layer_id, parseInt(layerId))
      ));

    return NextResponse.json({ message: "Successfully unfollowed layer" });
  } catch (error) {
    console.error("Error unfollowing layer:", error);
    return NextResponse.json({ message: "Failed to unfollow layer" }, { status: 500 });
  }
}