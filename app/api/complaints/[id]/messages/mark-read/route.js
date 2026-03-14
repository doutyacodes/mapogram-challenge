// /app/api/complaints/[id]/messages/mark-read/route.js
import { NextResponse } from "next/server";
import { db } from "@/utils";
import { POST_CHAT_MESSAGES, USER_POSTS } from "@/utils/schema/schema";
import { eq, and } from "drizzle-orm";

// PATCH - Mark messages as read
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    
    // Get user from token
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get userType from query params
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get('userType') || 'user';

    // Fetch post to verify access
    const [post] = await db
      .select()
      .from(USER_POSTS)
      .where(eq(USER_POSTS.id, parseInt(id)))
      .limit(1);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Mark messages as read based on user type
    if (userType === 'user') {
      // Mark messages from service center as read by user
      await db
        .update(POST_CHAT_MESSAGES)
        .set({ is_read_by_user: true })
        .where(
          and(
            eq(POST_CHAT_MESSAGES.post_id, parseInt(id)),
            eq(POST_CHAT_MESSAGES.sender_type, 'service_center')
          )
        );
    } else if (userType === 'page') {
      // Mark messages from user as read by admin
      await db
        .update(POST_CHAT_MESSAGES)
        .set({ is_read_by_admin: true })
        .where(
          and(
            eq(POST_CHAT_MESSAGES.post_id, parseInt(id)),
            eq(POST_CHAT_MESSAGES.sender_type, 'user')
          )
        );
    }

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}