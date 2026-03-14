// File: app/api/posts/[postId]/apply/route.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_POST_REGISTRATIONS } from '@/utils/schema/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req, { params }) {
  try {
    const postId = parseInt(params.postId); // getting postId from URL param
    const { note, resumeUrl, latitude, longitude } = await req.json();

    if (!postId || !latitude || !longitude) {
      return NextResponse.json(
        { message: 'Post ID, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Get user from token
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check for duplicate registration
    const existing = await db
      .select()
      .from(USER_POST_REGISTRATIONS)
      .where(and(
        eq(USER_POST_REGISTRATIONS.post_id, postId),
        eq(USER_POST_REGISTRATIONS.user_id, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'You have already applied to this post' },
        { status: 409 }
      );
    }

    // Insert new registration
    await db.insert(USER_POST_REGISTRATIONS).values({
      post_id: postId,
      user_id: userId,
      user_latitude: latitude.toString(),
      user_longitude: longitude.toString(),
      note: note || null,
      resume_url: resumeUrl || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
    });

  } catch (error) {
    console.error("Apply API Error:", error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
