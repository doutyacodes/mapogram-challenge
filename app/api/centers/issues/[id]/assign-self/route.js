// /api/issues/[id]/assign-self/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_POST_ISSUE_DETAILS } from '@/utils/schema/centers_schema';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    const token = request.cookies.get("user_token")?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    if (!userId) {
        return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Self-assign issue
    await db
      .update(USER_POST_ISSUE_DETAILS)
      .set({ 
        assigned_to_user_id: userId,
        self_assigned: true,
        updated_at: new Date()
      })
      .where(eq(USER_POST_ISSUE_DETAILS.post_id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error self-assigning issue:', error);
    return NextResponse.json(
      { error: 'Failed to self-assign issue' },
      { status: 500 }
    );
  }
}