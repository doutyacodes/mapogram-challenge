import { db } from '@/utils';
import { MAP_POST_LIKES } from '@/utils/schema/schema';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { postId } = await req.json();

    const token = req.cookies.get('user_token')?.value;
    if (!token) {
        return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
        );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user already liked this post
    const existingLike = await db
      .select()
      .from(MAP_POST_LIKES)
      .where(and(
        eq(MAP_POST_LIKES.post_id, postId),
        eq(MAP_POST_LIKES.user_id, userId)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      // Unlike - remove the like
      await db
        .delete(MAP_POST_LIKES)
        .where(and(
          eq(MAP_POST_LIKES.post_id, postId),
          eq(MAP_POST_LIKES.user_id, userId)
        ));
      
      return NextResponse.json({ liked: false, message: "Post unliked" });
    } else {
      // Like - add the like
      await db
        .insert(MAP_POST_LIKES)
        .values({
          post_id: postId,
          user_id: userId,
        });
      
      return NextResponse.json({ liked: true, message: "Post liked" });
    }
  } catch (error) {
    console.error("Like API Error:", error);
    return NextResponse.json(
      { message: "Error processing like" },
      { status: 500 }
    );
  }
}