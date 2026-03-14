// /app/api/complaints/[id]/messages/route.js
import { NextResponse } from "next/server";
import { db } from "@/utils";
import { POST_CHAT_MESSAGES, USER_POSTS } from "@/utils/schema/schema";
import { eq, and, desc } from "drizzle-orm";
import { jwtVerify } from "jose";

// GET - Fetch all messages for a complaint post
export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    // Get userType from query params
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get('userType') || 'user';

    // Get user from token
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const userId = decoded.payload.id;
    

    // Fetch post to verify access
    const [post] = await db
      .select()
      .from(USER_POSTS)
      .where(eq(USER_POSTS.id, parseInt(id)))
      .limit(1);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Verify user has access (either post owner or service center)
    const hasAccess = 
      (userType === 'user' && post.creator_id === userId) ||
      (userType === 'page'); // Service centers can access all complaints

    if (!hasAccess) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Fetch messages
    const messages = await db
      .select()
      .from(POST_CHAT_MESSAGES)
      .where(eq(POST_CHAT_MESSAGES.post_id, parseInt(id)))
      .orderBy(POST_CHAT_MESSAGES.created_at);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(req, { params }) {
  try {
    const { id } = params;
    
    // Get user from token
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const userId = decoded.payload.id;
    // const userType = decoded.payload.type || 'user';

    // Parse request body
    const body = await req.json();
    const { message_text, post_type, userType } = body;

    if (!message_text?.trim()) {
      return NextResponse.json(
        { message: "Message text is required" },
        { status: 400 }
      );
    }

    // Fetch post to verify access
    const [post] = await db
      .select()
      .from(USER_POSTS)
      .where(eq(USER_POSTS.id, parseInt(id)))
      .limit(1);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Verify user has access
    const hasAccess = 
      (userType === 'user' && post.creator_id === userId) ||
      (userType === 'page');

    if (!hasAccess) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Determine sender type and set read flags
    const senderType = userType === 'page' ? 'service_center' : 'user';
    const isReadByUser = senderType === 'user'; // If user sends, mark as read by user
    const isReadByAdmin = senderType === 'service_center'; // If service center sends, mark as read by admin

    // Insert message
    const [newMessage] = await db
      .insert(POST_CHAT_MESSAGES)
      .values({
        post_id: parseInt(id),
        post_type: post_type || 'complaints',
        sender_type: senderType,
        sender_id: userId,
        message_text: message_text.trim(),
        media_type: 'none',
        is_read_by_user: isReadByUser,
        is_read_by_admin: isReadByAdmin,
      })
      .$returningId();

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}